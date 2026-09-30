const CACHE_NAME = "theoryprep-mobile-v2";
const APP_SHELL = ["/", "/practice", "/practice/learn", "/practice/flashcards", "/questions", "/mock-test", "/offline-practice"];
const APP_ASSETS = ["/icons/theoryprep-bookOld.png"];

async function cacheDocumentAndAssets(url, cache) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not cache " + url);
  const body = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  await cache.put(url, new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));

  const assets = [...body.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter(Boolean);

  await Promise.allSettled(assets.map(async (asset) => {
    const request = new Request(new URL(asset, self.location.origin).href);
    const assetResponse = await fetch(request);
    if (assetResponse.ok) await cache.put(request, assetResponse);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.allSettled(APP_SHELL.map((url) => cacheDocumentAndAssets(url, cache)));
        await Promise.allSettled(APP_ASSETS.map((url) => cache.add(url)));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("theoryprep-mobile-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.url.indexOf("/api/") === -1) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const fallback = await caches.match("/offline-practice");
      if (fallback) return fallback;
    }

    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/x-component") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "PRECACHE_APP") {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(async (cache) => {
          await Promise.allSettled(APP_SHELL.map((url) => cacheDocumentAndAssets(url, cache)));
          await Promise.allSettled(APP_ASSETS.map((url) => cache.add(url)));
        }),
    );
  }

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "TheoryPrep";
  const options = {
    body: data.body || "A little theory practice is waiting for you.",
    icon: data.icon || "/icons/theoryprep-bookOld.png",
    badge: data.badge || "/icons/theoryprep-bookOld.png",
    tag: data.tag || "theoryprep-reminder",
    renotify: Boolean(data.renotify),
    data: { url: data.url || "/practice/learn" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/practice/learn";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.focus();
        existing.navigate(target);
        return;
      }
      self.clients.openWindow(target);
    }),
  );
});
