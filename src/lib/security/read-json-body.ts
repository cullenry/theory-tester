export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

const MAX_BODY_CHUNKS = 1024;

export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("maxBytes must be a positive safe integer.");
  }

  const contentLengthHeader = request.headers.get("content-length");
  let declaredLength: number | null = null;

  if (contentLengthHeader !== null) {
    if (!/^\d+$/.test(contentLengthHeader)) {
      return { ok: false, status: 400, error: "Invalid request body." };
    }

    declaredLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(declaredLength) || declaredLength > maxBytes) {
      return { ok: false, status: 413, error: "Request body is too large." };
    }
  }

  if (!request.body) {
    return { ok: false, status: 400, error: "Invalid request body." };
  }

  const reader = request.body.getReader();
  const bytes = new Uint8Array(maxBytes);
  let totalBytes = 0;
  let chunksRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunksRead += 1;
      if (chunksRead > MAX_BODY_CHUNKS || totalBytes + value.byteLength > maxBytes) {
        void reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, error: "Request body is too large." };
      }

      bytes.set(value, totalBytes);
      totalBytes += value.byteLength;
    }

    if (declaredLength !== null && totalBytes !== declaredLength) {
      return { ok: false, status: 400, error: "Invalid request body." };
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, totalBytes));
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Invalid request body." };
  } finally {
    reader.releaseLock();
  }
}