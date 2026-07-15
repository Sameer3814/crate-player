const CACHE_NAME = "crate-shell-v6"; // bump this on every update, or old files keep being served
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
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL_FILES)));
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

  // ---- Streaming proxy: drive-stream/<fileId> ----
  // <audio> can't send an Authorization header, so this attaches the
  // token and forwards Range requests to Drive, letting playback start
  // immediately and seeking work without a full download.
  const match = url.pathname.match(/\/drive-stream\/([a-zA-Z0-9_-]+)$/);
  if (match) {
    const fileId = match[1];
    event.respondWith((async () => {
      if (!driveToken) return new Response("Not signed in", { status: 401 });
      const headers = { Authorization: `Bearer ${driveToken}` };
      const range = event.request.headers.get("Range");
      if (range) headers["Range"] = range;
      try {
        const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers });
        const outHeaders = new Headers();
        ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"].forEach((h) => {
          const v = upstream.headers.get(h);
          if (v) outHeaders.set(h, v);
        });
        if (!outHeaders.has("Accept-Ranges")) outHeaders.set("Accept-Ranges", "bytes");
        if (!outHeaders.has("Content-Type")) outHeaders.set("Content-Type", "audio/mpeg");
        return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
      } catch (err) {
        return new Response("Upstream fetch failed: " + err.message, { status: 502 });
      }
    })());
    return;
  }

  // ---- App shell: cache-first ----
  const isShell = SHELL_FILES.some((f) => url.pathname.endsWith(f.replace("./", "")));
  if (!isShell) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
