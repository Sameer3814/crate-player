const CACHE_NAME = "crate-shell-v5";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

let driveToken = null;

self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_TOKEN") driveToken = event.data.token;
});

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ---- Streaming proxy: /drive-stream/<fileId> ----
  // Audio elements can't send custom headers, so this quietly attaches
  // the OAuth token and forwards Range requests to Drive on their behalf,
  // letting <audio> stream (and seek) without a full download first.
  const streamMatch = url.pathname.match(/\/drive-stream\/([a-zA-Z0-9_-]+)$/);
  if (streamMatch) {
    const fileId = streamMatch[1];
    event.respondWith(
      (async () => {
        if (!driveToken) {
          return new Response("Not signed in yet", { status: 401 });
        }
        const upstreamHeaders = { Authorization: `Bearer ${driveToken}` };
        const range = event.request.headers.get("Range");
        if (range) upstreamHeaders["Range"] = range;
        const upstream = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: upstreamHeaders }
        );
        // Pass the response straight through — status (200/206), headers,
        // and body stream all carry over so the browser can seek normally.
        const headers = new Headers();
        ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"].forEach((h) => {
          const v = upstream.headers.get(h);
          if (v) headers.set(h, v);
        });
        if (!headers.has("Accept-Ranges")) headers.set("Accept-Ranges", "bytes");
        return new Response(upstream.body, { status: upstream.status, headers });
      })()
    );
    return;
  }

  // ---- App shell: cache-first ----
  const isShellFile = SHELL_FILES.some((f) => url.pathname.endsWith(f.replace("./", "")));
  if (!isShellFile) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
