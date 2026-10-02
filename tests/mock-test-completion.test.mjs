import assert from "node:assert/strict";
import test from "node:test";
import { validateMockTestCompletion } from "../src/lib/security/mock-test-completion.ts";
import { readJsonBody } from "../src/lib/security/read-json-body.ts";

const questionLookup = (id) =>
  id >= 1 && id <= 40 ? { answers: ["A", "B"], correctAnswer: "A" } : undefined;

function makePayload(formatId = "full", count = 40) {
  return {
    formatId,
    questionIds: Array.from({ length: count }, (_, index) => index + 1),
    responses: Array.from({ length: count }, () => "A"),
    timeExpired: false,
  };
}

function makeRequest(body, headers) {
  return new Request("https://example.test/api/mock-test/complete", {
    method: "POST",
    body,
    headers,
  });
}

test("reads valid JSON within the byte limit", async () => {
  const result = await readJsonBody(makeRequest('{"ok":true}'), 64);
  assert.deepEqual(result, { ok: true, value: { ok: true } });
});

test("rejects a body over the byte limit without Content-Length", async () => {
  const request = makeRequest("x".repeat(65));
  assert.equal(request.headers.has("content-length"), false);
  const result = await readJsonBody(request, 64);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
});

test("rejects an oversized declared length before reading the body", async () => {
  const result = await readJsonBody(makeRequest("{}", { "content-length": "65" }), 64);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
});

test("rejects understated Content-Length based on actual bytes", async () => {
  const result = await readJsonBody(makeRequest("x".repeat(65), { "content-length": "1" }), 64);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
});

test("rejects malformed JSON and malformed Content-Length", async () => {
  const malformedJson = await readJsonBody(makeRequest("{"), 64);
  const malformedLength = await readJsonBody(makeRequest("{}", { "content-length": "nope" }), 64);
  assert.equal(malformedJson.ok, false);
  assert.equal(malformedLength.ok, false);
  if (!malformedJson.ok) assert.equal(malformedJson.status, 400);
  if (!malformedLength.ok) assert.equal(malformedLength.status, 400);
});

test("validates and scores exactly 40 server-known questions", () => {
  const result = validateMockTestCompletion(makePayload(), questionLookup);
  assert.deepEqual(result, {
    formatId: "full",
    expectedCount: 40,
    timeExpired: false,
    correctCount: 40,
    answeredCount: 40,
    percentage: 100,
  });
});

test("preserves supported short mock formats", () => {
  assert.equal(validateMockTestCompletion(makePayload("blitz-20", 20), questionLookup)?.expectedCount, 20);
  assert.equal(validateMockTestCompletion(makePayload("blitz-10", 10), questionLookup)?.expectedCount, 10);
});

test("rejects short and oversized full mock arrays before question lookups", () => {
  let lookupCount = 0;
  const lookup = (id) => {
    lookupCount += 1;
    return questionLookup(id);
  };

  assert.equal(validateMockTestCompletion(makePayload("full", 39), lookup), null);
  assert.equal(validateMockTestCompletion(makePayload("full", 41), lookup), null);
  assert.equal(lookupCount, 0);
});

test("rejects duplicate IDs, unknown IDs, invalid answers, and extra fields", () => {
  const duplicate = makePayload();
  duplicate.questionIds[1] = duplicate.questionIds[0];
  const unknown = makePayload();
  unknown.questionIds[39] = 999;
  const invalidAnswer = makePayload();
  invalidAnswer.responses[0] = "not an answer";
  const extraField = { ...makePayload(), count: 40 };

  assert.equal(validateMockTestCompletion(duplicate, questionLookup), null);
  assert.equal(validateMockTestCompletion(unknown, questionLookup), null);
  assert.equal(validateMockTestCompletion(invalidAnswer, questionLookup), null);
  assert.equal(validateMockTestCompletion(extraField, questionLookup), null);
});