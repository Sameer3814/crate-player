/* ===================================================================
   Crate — personal music player backed by your Google Drive
   =================================================================== */

const GOOGLE_CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ---------------------------------------------------------------------
// Icon set — inline SVG so the controls look the same everywhere
// instead of falling back to iOS's own emoji glyphs.
// ---------------------------------------------------------------------
const ICONS = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 5.6v12.8a1 1 0 0 0 1.53.85l10.1-6.4a1 1 0 0 0 0-1.7L9.03 4.75A1 1 0 0 0 7.5 5.6z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.8" height="14" rx="1.4"/><rect x="13.7" y="5" width="3.8" height="14" rx="1.4"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5.5" width="2.6" height="13" rx="1.2"/><path d="M19 6.6v10.8a1 1 0 0 1-1.54.84l-8.2-5.4a1 1 0 0 1 0-1.68l8.2-5.4A1 1 0 0 1 19 6.6z"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="16.4" y="5.5" width="2.6" height="13" rx="1.2"/><path d="M5 6.6v10.8a1 1 0 0 0 1.54.84l8.2-5.4a1 1 0 0 0 0-1.68l-8.2-5.4A1 1 0 0 0 5 6.6z"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  repeatOne: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="15.5" font-size="8" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle" font-family="Inter, sans-serif">1</text></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`,
  downloaded: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2" fill="currentColor" stroke="none" opacity="0.16"/><circle cx="12" cy="12" r="9.2"/><path d="M8 12.2l2.7 2.7L16 9.6"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>`,
  library: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h11"/><path d="M4 12h11"/><path d="M4 18h7"/><path d="M19 8v9"/><circle cx="17" cy="17" r="2"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`,
  power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><path d="M12 2v10"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>`,
};

function paintIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.dataset.icon;
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}
function setIcon(el, name) {
  if (el && ICONS[name]) { el.innerHTML = ICONS[name]; el.dataset.icon = name; }
}
paintIcons();

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
let accessToken = null;
let tokenClient = null;
let folderId = localStorage.getItem("crate_folder_id") || null;
let tracks = [];
let queue = [];
let queueIndex = -1;
let shuffleOn = false;
let repeatMode = "off";
let playlists = JSON.parse(localStorage.getItem("crate_playlists") || "{}");
let metaCache = new Map();

const audio = $("#audio");

// ---------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------
let toastTimer = null;
function showToast(msg, kind = "error") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast" + (kind === "info" ? " is-info" : "");
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 5500);
}

// ---------------------------------------------------------------------
// iOS audio unlock — Safari only allows audio that starts inside a real
// user tap. Because loading a track involves awaits (IndexedDB, network),
// the later play() call no longer counts as "inside a tap". So on the
// very first tap anywhere, we play a moment of silence to unlock the
// element for the rest of the session.
// ---------------------------------------------------------------------
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  audio.src = SILENT_WAV;
  audio.play().then(() => audio.pause()).catch(() => {});
}
document.addEventListener("touchend", unlockAudio, { once: true });
document.addEventListener("click", unlockAudio, { once: true });

// ---------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------
const DB_NAME = "crate-db";
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 2);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains("tracks")) db.createObjectStore("tracks", { keyPath: "id" });
    if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "id" });
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
async function idbPut(store, record) {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(record);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(store, id) {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => res(req.result || null);
    req.onerror = () => rej(req.error);
  });
}
async function idbDelete(store, id) {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbAll(store) {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

// ---------------------------------------------------------------------
// Google sign-in
// ---------------------------------------------------------------------
window.addEventListener("load", () => {
  if (typeof google === "undefined") {
    $("#setup-note").textContent = "Couldn't load Google's sign-in script — check your connection.";
    return;
  }
  if (GOOGLE_CLIENT_ID.startsWith("PASTE_")) {
    $("#setup-note").textContent = "Set GOOGLE_CLIENT_ID in app.js first — see README.";
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (resp) => {
      if (resp.error) { $("#setup-note").textContent = "Sign-in failed: " + resp.error; return; }
      accessToken = resp.access_token;
      sessionStorage.setItem("crate_token", accessToken);
      sendTokenToServiceWorker();
      enterApp();
    },
  });
  const saved = sessionStorage.getItem("crate_token");
  if (saved) { accessToken = saved; sendTokenToServiceWorker(); enterApp(); }
});

$("#signin-btn").addEventListener("click", () => tokenClient.requestAccessToken({ prompt: "" }));
$("#np-signout").addEventListener("click", () => {
  sessionStorage.removeItem("crate_token");
  accessToken = null;
  audio.pause();
  closeNowPlaying();
  $("#app").classList.add("hidden");
  $("#setup").classList.remove("hidden");
});

async function enterApp() {
  $("#setup").classList.add("hidden");
  $("#app").classList.remove("hidden");
  await hydrateCachedTracks();
  if (folderId) loadFromDrive(); else promptForFolder();
  refreshStorageLine();
}

// ---------------------------------------------------------------------
// Folder
// ---------------------------------------------------------------------
function extractFolderId(input) {
  const trimmed = input.trim();
  const m = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return trimmed.split("?")[0].replace(/\/+$/, "");
}
function promptForFolder() {
  const input = window.prompt("Paste your Google Drive folder link or ID:", folderId || "");
  if (!input) return;
  const clean = extractFolderId(input);
  if (!clean) { showToast("That didn't look like a valid folder link or ID."); return; }
  folderId = clean;
  localStorage.setItem("crate_folder_id", folderId);
  loadFromDrive();
}
$("#folder-btn").addEventListener("click", promptForFolder);
$("#refresh-btn").addEventListener("click", () => loadFromDrive());

async function loadFromDrive() {
  if (!folderId || !accessToken) return;
  $("#track-count").textContent = "syncing…";
  try {
    let files = [];
    let pageToken = null;
    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and (mimeType contains 'audio/' or mimeType='application/octet-stream') and trashed=false`,
        fields: "nextPageToken, files(id,name,mimeType,size)",
        pageSize: "200",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Drive API error ${res.status} (folder ID used: "${folderId}")`);
      const data = await res.json();
      files = files.concat(data.files || []);
      pageToken = data.nextPageToken;
    } while (pageToken);

    const cachedTracks = await idbAll("tracks");
    const cachedIds = new Set(cachedTracks.map((c) => c.id));
    tracks = files.map((f) => ({
      id: f.id,
      name: f.name.replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, ""),
      mimeType: f.mimeType,
      size: Number(f.size || 0),
      cached: cachedIds.has(f.id),
    }));
    queue = tracks.map((t) => t.id);
    renderLibrary();
    warmMetadata();
  } catch (err) {
    console.error(err);
    $("#track-count").textContent = "";
    showToast("Couldn't reach Google Drive: " + err.message);
  }
}

async function hydrateCachedTracks() {
  const cached = await idbAll("tracks");
  tracks = cached.map((c) => ({ id: c.id, name: c.name, mimeType: c.mimeType, size: c.blob.size, cached: true }));
  queue = tracks.map((t) => t.id);
  (await idbAll("meta")).forEach((m) => metaCache.set(m.id, m));
  renderLibrary();
}

// ---------------------------------------------------------------------
// ID3 tags + album art
// ---------------------------------------------------------------------
const METADATA_RANGE_BYTES = 1.5 * 1024 * 1024;
const METADATA_CONCURRENCY = 2;

function guessArtistFromName(name) {
  const parts = name.split(" - ");
  return parts.length > 1 ? parts[0].trim() : "";
}
function guessTitleFromName(name) {
  const parts = name.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ").trim() : name;
}

async function warmMetadata() {
  const pending = tracks.filter((t) => !metaCache.has(t.id));
  let i = 0;
  async function worker() {
    while (i < pending.length) await getMetadata(pending[i++]).catch(() => {});
  }
  await Promise.all(Array.from({ length: METADATA_CONCURRENCY }, worker));
}

async function getMetadata(track) {
  if (metaCache.has(track.id)) return metaCache.get(track.id);
  const fallback = {
    id: track.id,
    title: guessTitleFromName(track.name),
    artist: guessArtistFromName(track.name),
    album: "",
    art: null,
  };
  if (typeof jsmediatags === "undefined" || !accessToken) return fallback;
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${track.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}`, Range: `bytes=0-${METADATA_RANGE_BYTES - 1}` },
    });
    const buf = await res.arrayBuffer();
    const tag = await new Promise((resolve, reject) => {
      jsmediatags.read(new Blob([buf]), { onSuccess: resolve, onError: reject });
    });
    let art = null;
    const pic = tag.tags?.picture;
    if (pic) {
      let binary = "";
      const data = pic.data;
      const chunk = 8192;
      for (let i = 0; i < data.length; i += chunk) {
        binary += String.fromCharCode.apply(null, data.slice(i, i + chunk));
      }
      art = `data:${pic.format};base64,${btoa(binary)}`;
    }
    const meta = {
      id: track.id,
      title: tag.tags?.title?.trim() || fallback.title,
      artist: tag.tags?.artist?.trim() || fallback.artist,
      album: tag.tags?.album?.trim() || "",
      art,
    };
    metaCache.set(track.id, meta);
    idbPut("meta", meta).catch(() => {});
    renderLibrary();
    if (currentTrackId === track.id) applyNowPlayingMeta(meta);
    return meta;
  } catch {
    metaCache.set(track.id, fallback);
    return fallback;
  }
}

// ---------------------------------------------------------------------
// Service worker streaming proxy
// ---------------------------------------------------------------------
function sendTokenToServiceWorker() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.ready.then((reg) => {
    (reg.active || navigator.serviceWorker.controller)?.postMessage({ type: "SET_TOKEN", token: accessToken });
  }).catch(() => {});
}
navigator.serviceWorker?.addEventListener("controllerchange", sendTokenToServiceWorker);

// Streaming only works if a service worker is actually controlling this
// page — otherwise the stream URL would just 404 against GitHub Pages.
function canStream() {
  return !!navigator.serviceWorker?.controller && !!accessToken;
}
function streamUrlFor(id) {
  return new URL(`drive-stream/${id}`, location.href).href;
}

// ---------------------------------------------------------------------
// Download for offline
// ---------------------------------------------------------------------
function statusElFor(id) {
  const btn = document.querySelector(`.track-action[data-id="${id}"]`);
  return btn?.closest(".track-row")?.querySelector(".track-status") || null;
}

async function downloadTrack(track, onProgress) {
  const setProgress = (text) => {
    const el = statusElFor(track.id);
    if (el) el.textContent = text;
    if (onProgress) onProgress(text);
  };
  setProgress("…");

  const controller = new AbortController();
  let stallTimer = setTimeout(() => controller.abort(), 20000);
  const resetStall = () => { clearTimeout(stallTimer); stallTimer = setTimeout(() => controller.abort(), 20000); };

  let res;
  try {
    res = await fetch(`https://www.googleapis.com/drive/v3/files/${track.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(stallTimer);
    setProgress("");
    if (err.name === "AbortError") throw new Error(`Timed out connecting to Drive for "${track.name}".`);
    throw err;
  }
  if (!res.ok) {
    clearTimeout(stallTimer);
    setProgress("");
    throw new Error(`Drive returned ${res.status} for "${track.name}".`);
  }

  const total = Number(res.headers.get("Content-Length") || track.size || 0);
  const reader = res.body.getReader();
  let received = 0;
  const chunks = [];
  try {
    while (true) {
      resetStall();
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      setProgress(total ? Math.round((received / total) * 100) + "%" : `${(received / 1048576).toFixed(1)}MB`);
    }
  } catch (err) {
    setProgress("");
    if (err.name === "AbortError") throw new Error(`Download stalled for "${track.name}".`);
    throw err;
  } finally {
    clearTimeout(stallTimer);
  }

  const blob = new Blob(chunks, { type: track.mimeType || "audio/mpeg" });
  await idbPut("tracks", { id: track.id, name: track.name, mimeType: track.mimeType, blob });
  track.cached = true;
  setProgress("");
  renderLibrary();
  refreshStorageLine();
  return blob;
}

async function removeDownload(track) {
  await idbDelete("tracks", track.id);
  track.cached = false;
  renderLibrary();
  refreshStorageLine();
}

async function refreshStorageLine() {
  const cached = await idbAll("tracks");
  const bytes = cached.reduce((s, c) => s + (c.blob?.size || 0), 0);
  $("#storage-used").textContent = (bytes / 1048576).toFixed(1) + " MB";
}

// ---------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------
let playRequestToken = 0;
let currentTrackId = null;
let streamingAttemptId = null; // set while playing via the SW stream, for fallback

async function playTrackById(id) {
  const track = tracks.find((t) => t.id === id);
  if (!track) return;
  if (id === currentTrackId) { togglePlay(); openNowPlaying(); return; }

  const myRequest = ++playRequestToken;
  currentTrackId = id;
  queueIndex = queue.indexOf(id);

  const meta = metaCache.get(id) || {
    title: guessTitleFromName(track.name), artist: guessArtistFromName(track.name), art: null,
  };
  applyNowPlayingMeta(meta);
  $("#mini-player").classList.remove("hidden");
  openNowPlaying();
  renderLibrary();

  // Fast path: stream straight from Drive through the service worker.
  if (canStream() && !track.cached) {
    streamingAttemptId = id;
    audio.src = streamUrlFor(id);
    audio.play().then(() => {
      updateMediaSession(track, meta);
      getMetadata(track);
    }).catch((err) => {
      if (myRequest !== playRequestToken) return;
      console.warn("stream play failed, falling back to download", err);
      playViaDownload(track, meta, myRequest);
    });
    return;
  }

  playViaDownload(track, meta, myRequest);
}

// Fallback path: fetch the whole file (with auth), then play from a blob.
// Slower to start, but works even when the service worker isn't available.
async function playViaDownload(track, meta, myRequest) {
  streamingAttemptId = null;
  try {
    let blob;
    const cached = await idbGet("tracks", track.id);
    if (cached) {
      blob = cached.blob;
    } else {
      $("#np-artist").textContent = "loading…";
      blob = await downloadTrack(track, (text) => {
        if (currentTrackId === track.id && text) $("#np-artist").textContent = text;
      });
    }
    if (myRequest !== playRequestToken) return;
    audio.src = URL.createObjectURL(blob);
    await audio.play();
    $("#np-artist").textContent = meta.artist || "Unknown artist";
    updateMediaSession(track, meta);
    renderLibrary();
    getMetadata(track);
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error(err);
    $("#np-artist").textContent = meta.artist || "Unknown artist";
    if (err.name === "NotAllowedError") showToast("Tap play once to start — iOS needs a direct tap first.");
    else showToast(err.message || "Couldn't play that track.");
  }
}

// If the streamed source errors out mid-load, quietly retry via download.
audio.addEventListener("error", () => {
  const failedId = streamingAttemptId;
  if (failedId) {
    streamingAttemptId = null;
    const track = tracks.find((t) => t.id === failedId);
    if (track && currentTrackId === failedId) {
      const meta = metaCache.get(failedId) || { title: track.name, artist: "", art: null };
      playViaDownload(track, meta, playRequestToken);
      return;
    }
  }
  const code = audio.error?.code;
  if (!code || audio.src === SILENT_WAV) return;
  const messages = {
    1: "Playback was aborted.",
    2: "Network error while loading the track.",
    3: "This file couldn't be decoded.",
    4: "Couldn't load that audio source.",
  };
  showToast("Playback error: " + (messages[code] || "unknown issue"));
});

function togglePlay() {
  if (!audio.src) return;
  if (audio.paused) audio.play().catch((e) => showToast(e.message || "Couldn't resume playback."));
  else audio.pause();
}
function playNext() {
  if (!queue.length) return;
  let next;
  if (shuffleOn) next = Math.floor(Math.random() * queue.length);
  else {
    next = queueIndex + 1;
    if (next >= queue.length) { if (repeatMode === "all") next = 0; else return; }
  }
  playTrackById(queue[next]);
}
function playPrev() {
  if (!queue.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  playTrackById(queue[Math.max(0, queueIndex - 1)]);
}

function applyNowPlayingMeta(meta) {
  $("#np-title").textContent = meta.title;
  $("#np-artist").textContent = meta.artist || "Unknown artist";
  $("#mini-title").textContent = meta.title;
  $("#mini-artist").textContent = meta.artist || "Unknown artist";
  setArt($("#np-art"), meta.art, "np-art-ph");
  setArt($("#mini-art"), meta.art);
}
function setArt(el, art, phClass = "") {
  if (art) el.innerHTML = `<img src="${art}" alt="" />`;
  else el.innerHTML = `<i class="icn ${phClass}">${ICONS.note}</i>`;
}

audio.addEventListener("play", () => {
  setIcon($("#btn-play").querySelector(".icn"), "pause");
  setIcon($("#mini-playpause").querySelector(".icn"), "pause");
});
audio.addEventListener("pause", () => {
  setIcon($("#btn-play").querySelector(".icn"), "play");
  setIcon($("#mini-playpause").querySelector(".icn"), "play");
});
audio.addEventListener("playing", () => { streamingAttemptId = null; });
audio.addEventListener("ended", () => {
  if (repeatMode === "one") { audio.currentTime = 0; audio.play(); return; }
  currentTrackId = null;
  playNext();
});
audio.addEventListener("timeupdate", () => {
  if (!audio.duration || !isFinite(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  $("#np-seek").value = Math.floor(pct * 10);
  $("#mini-progress-fill").style.width = pct + "%";
  $("#np-time-cur").textContent = fmtTime(audio.currentTime);
  $("#np-time-dur").textContent = fmtTime(audio.duration);
});
$("#np-seek").addEventListener("input", (e) => {
  if (audio.duration && isFinite(audio.duration)) audio.currentTime = (e.target.value / 1000) * audio.duration;
});
function fmtTime(s) {
  s = Math.floor(s || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

$("#btn-play").addEventListener("click", togglePlay);
$("#mini-playpause").addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
$("#btn-next").addEventListener("click", playNext);
$("#btn-prev").addEventListener("click", playPrev);
$("#btn-shuffle").addEventListener("click", (e) => {
  shuffleOn = !shuffleOn;
  e.currentTarget.classList.toggle("is-on", shuffleOn);
});
$("#btn-repeat").addEventListener("click", (e) => {
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  setIcon(e.currentTarget.querySelector(".icn"), repeatMode === "one" ? "repeatOne" : "repeat");
  e.currentTarget.classList.toggle("is-on", repeatMode !== "off");
});
$("#np-download").addEventListener("click", () => {
  const track = tracks.find((t) => t.id === currentTrackId);
  if (!track) return;
  if (track.cached) { removeDownload(track); showToast("Removed from downloads.", "info"); }
  else downloadTrack(track).then(() => showToast("Saved for offline.", "info")).catch((e) => showToast(e.message));
});

function updateMediaSession(track, meta) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: meta.title,
    artist: meta.artist || "Crate",
    album: meta.album || "My Library",
    artwork: meta.art ? [{ src: meta.art, sizes: "512x512", type: "image/jpeg" }] : [],
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", playPrev);
  navigator.mediaSession.setActionHandler("nexttrack", playNext);
}

// ---------------------------------------------------------------------
// Now Playing sheet
// ---------------------------------------------------------------------
function openNowPlaying() { $("#now-playing").classList.remove("hidden"); }
function closeNowPlaying() { $("#now-playing").classList.add("hidden"); }
$("#np-collapse").addEventListener("click", closeNowPlaying);
$("#mini-open").addEventListener("click", openNowPlaying);

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function artHtml(track) {
  const meta = metaCache.get(track.id);
  if (meta?.art) return `<span class="track-art"><img src="${meta.art}" alt="" /></span>`;
  return `<span class="track-art">${ICONS.note}</span>`;
}
function displayTitle(track) { return metaCache.get(track.id)?.title || track.name; }
function displaySub(track) {
  const meta = metaCache.get(track.id);
  if (meta?.artist) return meta.artist;
  return track.cached ? "Downloaded" : "Unknown artist";
}

function buildRow(track, opts = {}) {
  const row = document.createElement("li");
  row.className = "track-row" + (currentTrackId === track.id ? " is-playing" : "");
  const actionIcon = opts.removeFromPlaylist ? ICONS.close : (track.cached ? ICONS.downloaded : ICONS.download);
  row.innerHTML = `
    <button class="track-tap">
      ${artHtml(track)}
      <span class="track-main">
        <span class="track-title">${escapeHtml(displayTitle(track))}</span>
        <span class="track-sub">${escapeHtml(opts.subtitle || displaySub(track))}</span>
      </span>
    </button>
    <span class="track-status"></span>
    <button class="track-action ${track.cached && !opts.removeFromPlaylist ? "cached" : ""}" data-id="${track.id}">${actionIcon}</button>
  `;
  row.querySelector(".track-tap").addEventListener("click", () => playTrackById(track.id));
  row.querySelector(".track-action").addEventListener("click", (e) => {
    e.stopPropagation();
    if (opts.onAction) return opts.onAction();
    if (track.cached) removeDownload(track);
    else downloadTrack(track).catch((err) => showToast(err.message));
  });
  return row;
}

function renderLibrary() {
  const q = $("#search").value.trim().toLowerCase();
  const filtered = tracks.filter((t) => {
    const m = metaCache.get(t.id);
    return (t.name + " " + (m?.title || "") + " " + (m?.artist || "")).toLowerCase().includes(q);
  });
  $("#track-count").textContent = filtered.length ? `${filtered.length} songs` : "";
  $("#empty-state").classList.toggle("hidden", filtered.length > 0);
  const list = $("#track-list");
  list.innerHTML = "";
  filtered.forEach((t) => list.appendChild(buildRow(t)));
  renderDownloadsView();
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function renderDownloadsView() {
  const cached = await idbAll("tracks");
  $("#download-count").textContent = cached.length ? `${cached.length} songs` : "";
  $("#download-empty").classList.toggle("hidden", cached.length > 0);
  const list = $("#download-list");
  list.innerHTML = "";
  cached.forEach((c) => {
    const track = tracks.find((t) => t.id === c.id) || { id: c.id, name: c.name, cached: true };
    list.appendChild(buildRow(track, { subtitle: `${(c.blob.size / 1048576).toFixed(1)} MB` }));
  });
}

$("#search").addEventListener("input", renderLibrary);

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------
$$(".tab-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab-item").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    $$(".view").forEach((v) => v.classList.add("hidden"));
    $(`#view-${btn.dataset.view}`).classList.remove("hidden");
    if (btn.dataset.view === "playlists") renderPlaylistGrid();
  });
});

// ---------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------
function savePlaylists() { localStorage.setItem("crate_playlists", JSON.stringify(playlists)); }
function renderPlaylistGrid() {
  $("#playlist-grid").classList.remove("hidden");
  $("#playlist-detail").classList.add("hidden");
  const grid = $("#playlist-grid");
  grid.innerHTML = "";
  const names = Object.keys(playlists);
  if (!names.length) {
    grid.innerHTML = `<p class="empty-state" style="grid-column:1/-1">No playlists yet — tap New to make one.</p>`;
    return;
  }
  names.forEach((name) => {
    const card = document.createElement("button");
    card.className = "playlist-card";
    card.innerHTML = `
      <span class="playlist-card-art">${ICONS.note}</span>
      <span class="playlist-card-name">${escapeHtml(name)}</span>
      <span class="playlist-card-count">${playlists[name].length} songs</span>
    `;
    card.addEventListener("click", () => openPlaylist(name));
    grid.appendChild(card);
  });
}
function openPlaylist(name) {
  $("#playlist-grid").classList.add("hidden");
  $("#playlist-detail").classList.remove("hidden");
  $("#playlist-detail-title").textContent = name;
  const ids = playlists[name] || [];
  queue = ids.slice();
  const list = $("#playlist-detail-tracks");
  list.innerHTML = "";
  ids.forEach((id) => {
    const track = tracks.find((t) => t.id === id);
    if (!track) return;
    list.appendChild(buildRow(track, {
      removeFromPlaylist: true,
      onAction: () => {
        playlists[name] = playlists[name].filter((x) => x !== id);
        savePlaylists();
        openPlaylist(name);
      },
    }));
  });
}
$("#playlist-back").addEventListener("click", renderPlaylistGrid);
$("#new-playlist-btn").addEventListener("click", () => {
  const name = window.prompt("Playlist name:");
  if (!name || playlists[name]) return;
  playlists[name] = [];
  savePlaylists();
  renderPlaylistGrid();
});

// ---------------------------------------------------------------------
// Service worker
// ---------------------------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(() => sendTokenToServiceWorker())
      .catch((e) => console.warn("SW registration failed", e));
  });
}
