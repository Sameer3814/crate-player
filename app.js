/* ===================================================================
   Crate — personal music player backed by your Google Drive
   =================================================================== */

const GOOGLE_CLIENT_ID = "592935651583-jet4jrpfpmka05ujpdk0qe0ugg038ves.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let accessToken = null;
let tokenClient = null;
let folderId = localStorage.getItem("crate_folder_id") || null;
let tracks = [];        // [{id, name, mimeType, size, cached}]
let queue = [];
let queueIndex = -1;
let shuffleOn = false;
let repeatMode = "off"; // off | all | one
let playlists = JSON.parse(localStorage.getItem("crate_playlists") || "{}");
let metaCache = new Map(); // id -> {title, artist, album, art}

const audio = $("#audio");
const PLACEHOLDER_ART = null; // rendered as a gradient block when null

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
  toastTimer = setTimeout(() => el.classList.add("hidden"), 6000);
}

const AUDIO_ERROR_MESSAGES = {
  1: "Playback was aborted.",
  2: "Network error while loading the track.",
  3: "This file couldn't be decoded.",
  4: "This audio source isn't supported.",
};
audio.addEventListener("error", () => {
  const code = audio.error?.code;
  if (!code) return;
  showToast("Playback error: " + (AUDIO_ERROR_MESSAGES[code] || "unknown issue (code " + code + ")"));
});

// ---------------------------------------------------------------------
// IndexedDB — 'tracks' store for offline audio blobs, 'meta' store for
// extracted ID3 tags + album art
// ---------------------------------------------------------------------
const DB_NAME = "crate-db";
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 2);
  req.onupgradeneeded = (e) => {
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
      if (resp.error) {
        $("#setup-note").textContent = "Sign-in failed: " + resp.error;
        return;
      }
      accessToken = resp.access_token;
      sessionStorage.setItem("crate_token", accessToken);
      sendTokenToServiceWorker();
      enterApp();
    },
  });

  const savedToken = sessionStorage.getItem("crate_token");
  if (savedToken) {
    accessToken = savedToken;
    sendTokenToServiceWorker();
    enterApp();
  }
});

$("#signin-btn").addEventListener("click", () => tokenClient.requestAccessToken({ prompt: "" }));
$("#np-signout").addEventListener("click", () => {
  sessionStorage.removeItem("crate_token");
  accessToken = null;
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
// Folder selection
// ---------------------------------------------------------------------
function extractFolderId(input) {
  const trimmed = input.trim();
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed.split("?")[0].replace(/\/+$/, "");
}
function promptForFolder() {
  const input = window.prompt("Paste your Google Drive folder link or ID:", folderId || "");
  if (input) {
    const cleanId = extractFolderId(input);
    if (!cleanId) { showToast("That didn't look like a valid folder link or ID."); return; }
    folderId = cleanId;
    localStorage.setItem("crate_folder_id", folderId);
    loadFromDrive();
  }
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
  const metas = await idbAll("meta");
  metas.forEach((m) => metaCache.set(m.id, m));
  renderLibrary();
}

// ---------------------------------------------------------------------
// ID3 metadata + album art extraction (reads only the first chunk of
// each file over an authenticated Range request — not a full download)
// ---------------------------------------------------------------------
const METADATA_RANGE_BYTES = 1.5 * 1024 * 1024; // enough for most embedded art
let metaQueueRunning = 0;
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
    while (i < pending.length) {
      const track = pending[i++];
      await getMetadata(track).catch(() => {});
    }
  }
  const workers = Array.from({ length: METADATA_CONCURRENCY }, worker);
  await Promise.all(workers);
}

async function getMetadata(track) {
  if (metaCache.has(track.id)) return metaCache.get(track.id);
  if (typeof jsmediatags === "undefined" || !accessToken) {
    return { title: guessTitleFromName(track.name), artist: guessArtistFromName(track.name), album: "", art: null };
  }
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${track.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}`, Range: `bytes=0-${METADATA_RANGE_BYTES - 1}` },
    });
    const buf = await res.arrayBuffer();
    const tag = await new Promise((resolve, reject) => {
      jsmediatags.read(buf, { onSuccess: resolve, onError: reject });
    });
    let art = null;
    const pic = tag.tags?.picture;
    if (pic) {
      let binary = "";
      for (let b of pic.data) binary += String.fromCharCode(b);
      art = `data:${pic.format};base64,${btoa(binary)}`;
    }
    const meta = {
      id: track.id,
      title: tag.tags?.title || guessTitleFromName(track.name),
      artist: tag.tags?.artist || guessArtistFromName(track.name),
      album: tag.tags?.album || "",
      art,
    };
    metaCache.set(track.id, meta);
    idbPut("meta", meta).catch(() => {});
    renderLibrary();
    if (currentTrackId === track.id) applyNowPlayingMeta(meta);
    return meta;
  } catch {
    const fallback = { id: track.id, title: guessTitleFromName(track.name), artist: guessArtistFromName(track.name), album: "", art: null };
    metaCache.set(track.id, fallback);
    return fallback;
  }
}

// ---------------------------------------------------------------------
// Streaming via service-worker proxy (adds auth header + forwards
// Range requests so <audio> can stream directly from Drive)
// ---------------------------------------------------------------------
function sendTokenToServiceWorker() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "SET_TOKEN", token: accessToken });
  });
}
navigator.serviceWorker?.addEventListener("controllerchange", sendTokenToServiceWorker);

// ---------------------------------------------------------------------
// Download / cache a track for explicit offline use
// ---------------------------------------------------------------------
function statusElFor(id) {
  const btn = document.querySelector(`.track-action[data-id="${id}"]`);
  return btn?.closest(".track-row")?.querySelector(".track-status") || null;
}

async function downloadTrack(track, onProgress) {
  const statusEl = statusElFor(track.id);
  const setProgress = (text) => {
    if (statusEl) statusEl.textContent = text;
    if (onProgress) onProgress(text);
  };
  setProgress("…");

  const controller = new AbortController();
  let stallTimer = setTimeout(() => controller.abort(), 15000);
  const resetStallTimer = () => { clearTimeout(stallTimer); stallTimer = setTimeout(() => controller.abort(), 15000); };

  let res;
  try {
    res = await fetch(`https://www.googleapis.com/drive/v3/files/${track.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(stallTimer);
    if (err.name === "AbortError") throw new Error(`Timed out connecting to Drive for "${track.name}".`);
    throw err;
  }
  if (!res.ok) {
    clearTimeout(stallTimer);
    throw new Error(`Drive returned ${res.status} while downloading "${track.name}".`);
  }

  const total = Number(res.headers.get("Content-Length") || track.size || 0);
  const reader = res.body.getReader();
  let received = 0;
  const chunks = [];
  try {
    while (true) {
      resetStallTimer();
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      setProgress(total ? Math.round((received / total) * 100) + "%" : `${(received / 1024 / 1024).toFixed(1)}MB`);
    }
  } catch (err) {
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
  const bytes = cached.reduce((sum, c) => sum + (c.blob?.size || 0), 0);
  $("#storage-used").textContent = (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ---------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------
let playRequestToken = 0;
let currentTrackId = null;

async function playTrackById(id) {
  const track = tracks.find((t) => t.id === id);
  if (!track) return;

  if (id === currentTrackId) { togglePlay(); openNowPlaying(); return; }

  const myRequest = ++playRequestToken;
  currentTrackId = id;
  queueIndex = queue.indexOf(id);

  const meta = metaCache.get(id) || { title: guessTitleFromName(track.name), artist: guessArtistFromName(track.name), art: null };
  applyNowPlayingMeta(meta);
  openNowPlaying();
  renderLibrary();

  try {
    const cached = await idbGet("tracks", id);
    if (cached) {
      audio.src = URL.createObjectURL(cached.blob);
    } else {
      // Stream directly from Drive through the service-worker proxy —
      // no full download required before playback can start.
      await navigator.serviceWorker?.ready;
      audio.src = `drive-stream/${id}`;
    }
    if (myRequest !== playRequestToken) return;
    await audio.play();
    updateMediaSession(track, meta);
    renderLibrary();
    getMetadata(track); // fills in real tags/art if not already cached
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error(err);
    if (err.name === "NotAllowedError") {
      showToast("iOS blocked autoplay — tap ▶ once to start it.");
    } else {
      showToast(err.message || "Couldn't play that track.");
    }
  }
}

function applyNowPlayingMeta(meta) {
  $("#np-title").textContent = meta.title;
  $("#np-artist").textContent = meta.artist || "Unknown artist";
  $("#mini-title").textContent = meta.title;
  $("#mini-artist").textContent = meta.artist || "Unknown artist";
  setArt($("#np-art"), meta.art);
  setArt($("#mini-art"), meta.art);
}
function setArt(imgEl, art) {
  if (art) { imgEl.src = art; imgEl.style.background = "none"; }
  else { imgEl.removeAttribute("src"); imgEl.style.background = "linear-gradient(135deg, var(--surface-2), var(--surface))"; }
}

function togglePlay() {
  if (!audio.src) return;
  if (audio.paused) audio.play().catch((e) => showToast(e.message || "Couldn't resume playback."));
  else audio.pause();
}
function playNext() {
  if (!queue.length) return;
  let nextIndex;
  if (shuffleOn) nextIndex = Math.floor(Math.random() * queue.length);
  else {
    nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) { if (repeatMode === "all") nextIndex = 0; else return; }
  }
  playTrackById(queue[nextIndex]);
}
function playPrev() {
  if (!queue.length) return;
  playTrackById(queue[Math.max(0, queueIndex - 1)]);
}

audio.addEventListener("play", () => {
  $("#btn-play").textContent = "⏸"; $("#mini-playpause").textContent = "⏸";
  $("#mini-player").classList.add("is-playing");
});
audio.addEventListener("pause", () => {
  $("#btn-play").textContent = "▶"; $("#mini-playpause").textContent = "▶";
});
audio.addEventListener("ended", () => {
  if (repeatMode === "one") { audio.currentTime = 0; audio.play(); return; }
  currentTrackId = null;
  playNext();
});
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  $("#np-seek").value = Math.floor((audio.currentTime / audio.duration) * 1000);
  $("#np-time-cur").textContent = fmtTime(audio.currentTime);
  $("#np-time-dur").textContent = fmtTime(audio.duration);
});
$("#np-seek").addEventListener("input", (e) => {
  if (audio.duration) audio.currentTime = (e.target.value / 1000) * audio.duration;
});
function fmtTime(s) {
  s = Math.floor(s || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

$("#btn-play").addEventListener("click", togglePlay);
$("#btn-next").addEventListener("click", playNext);
$("#btn-prev").addEventListener("click", playPrev);
$("#btn-shuffle").addEventListener("click", (e) => { shuffleOn = !shuffleOn; e.currentTarget.classList.toggle("is-on", shuffleOn); });
$("#btn-repeat").addEventListener("click", (e) => {
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  e.currentTarget.textContent = repeatMode === "one" ? "↻¹" : "↻";
  e.currentTarget.classList.toggle("is-on", repeatMode !== "off");
});
$("#np-download").addEventListener("click", () => {
  const track = tracks.find((t) => t.id === currentTrackId);
  if (!track) return;
  if (track.cached) removeDownload(track);
  else downloadTrack(track).catch((e) => showToast(e.message));
});

function updateMediaSession(track, meta) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: meta.title, artist: meta.artist || "Crate", album: meta.album || "My Library",
    artwork: meta.art ? [{ src: meta.art, sizes: "512x512", type: "image/jpeg" }] : [],
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", playPrev);
  navigator.mediaSession.setActionHandler("nexttrack", playNext);
  navigator.mediaSession.setActionHandler("seekto", (d) => { if (d.seekTime != null) audio.currentTime = d.seekTime; });
}

// ---------------------------------------------------------------------
// Now Playing full-screen sheet
// ---------------------------------------------------------------------
function openNowPlaying() { $("#now-playing").classList.remove("hidden"); }
function closeNowPlaying() { $("#now-playing").classList.add("hidden"); }
$("#np-collapse").addEventListener("click", closeNowPlaying);
$("#mini-player").addEventListener("click", openNowPlaying);

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function trackArtHtml(track) {
  const meta = metaCache.get(track.id);
  if (meta?.art) return `<img class="track-art" src="${meta.art}" alt="" />`;
  return `<div class="track-art placeholder">♪</div>`;
}
function trackSubtitle(track) {
  const meta = metaCache.get(track.id);
  const artist = meta?.artist;
  if (artist) return artist;
  return track.cached ? "Downloaded" : "";
}
function trackDisplayTitle(track) {
  return metaCache.get(track.id)?.title || track.name;
}

function renderLibrary() {
  const list = $("#track-list");
  const q = $("#search").value.trim().toLowerCase();
  const filtered = tracks.filter((t) => {
    const meta = metaCache.get(t.id);
    const hay = (t.name + " " + (meta?.title || "") + " " + (meta?.artist || "")).toLowerCase();
    return hay.includes(q);
  });
  $("#track-count").textContent = filtered.length ? `${filtered.length} songs` : "";
  $("#empty-state").classList.toggle("hidden", filtered.length > 0);
  list.innerHTML = "";
  filtered.forEach((track) => {
    const row = document.createElement("li");
    row.className = "track-row" + (currentTrackId === track.id ? " is-playing" : "");
    row.innerHTML = `
      ${trackArtHtml(track)}
      <div class="track-main">
        <div class="track-title">${escapeHtml(trackDisplayTitle(track))}</div>
        <div class="track-sub">${escapeHtml(trackSubtitle(track))}</div>
      </div>
      <span class="track-status"></span>
      <button class="track-action ${track.cached ? "cached" : ""}" data-id="${track.id}" title="${track.cached ? "Remove download" : "Download"}">
        ${track.cached ? "⬇︎" : "⬇"}
      </button>
    `;
    row.querySelector(".track-main").addEventListener("click", () => playTrackById(track.id));
    row.querySelector(".track-art, .track-art.placeholder")?.addEventListener("click", () => playTrackById(track.id));
    row.querySelector(".track-action").addEventListener("click", (e) => {
      e.stopPropagation();
      if (track.cached) removeDownload(track); else downloadTrack(track).catch((err) => showToast(err.message));
    });
    list.appendChild(row);
  });
  renderDownloadsView();
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function renderDownloadsView() {
  const cached = await idbAll("tracks");
  const list = $("#download-list");
  $("#download-count").textContent = cached.length ? `${cached.length} songs` : "";
  $("#download-empty").classList.toggle("hidden", cached.length > 0);
  list.innerHTML = "";
  cached.forEach((c) => {
    const track = tracks.find((t) => t.id === c.id) || { id: c.id, name: c.name, cached: true };
    const row = document.createElement("li");
    row.className = "track-row" + (currentTrackId === c.id ? " is-playing" : "");
    row.innerHTML = `
      ${trackArtHtml(track)}
      <div class="track-main">
        <div class="track-title">${escapeHtml(trackDisplayTitle(track))}</div>
        <div class="track-sub">${(c.blob.size / (1024 * 1024)).toFixed(1)} MB</div>
      </div>
      <span class="track-status"></span>
      <button class="track-action cached" data-id="${c.id}" title="Remove download">⬇︎</button>
    `;
    row.querySelector(".track-main").addEventListener("click", () => playTrackById(c.id));
    row.querySelector(".track-action").addEventListener("click", (e) => { e.stopPropagation(); removeDownload(track); });
    list.appendChild(row);
  });
}

$("#search").addEventListener("input", renderLibrary);

// ---------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------
$$(".tab-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab-item").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const view = btn.dataset.view;
    $$(".view").forEach((v) => v.classList.add("hidden"));
    $(`#view-${view}`).classList.remove("hidden");
    if (view === "playlists") renderPlaylistGrid();
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
  Object.entries(playlists).forEach(([name, ids]) => {
    const card = document.createElement("button");
    card.className = "playlist-card";
    card.innerHTML = `
      <div>
        <div class="playlist-card-art">♪</div>
        <div class="playlist-card-name">${escapeHtml(name)}</div>
      </div>
      <div class="playlist-card-count">${ids.length} songs</div>
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
  queue = ids;
  const list = $("#playlist-detail-tracks");
  list.innerHTML = "";
  ids.forEach((id) => {
    const track = tracks.find((t) => t.id === id);
    if (!track) return;
    const row = document.createElement("li");
    row.className = "track-row" + (currentTrackId === id ? " is-playing" : "");
    row.innerHTML = `
      ${trackArtHtml(track)}
      <div class="track-main">
        <div class="track-title">${escapeHtml(trackDisplayTitle(track))}</div>
        <div class="track-sub">${escapeHtml(trackSubtitle(track))}</div>
      </div>
      <button class="track-action" title="Remove from playlist">✕</button>
    `;
    row.querySelector(".track-main").addEventListener("click", () => playTrackById(id));
    row.querySelector(".track-action").addEventListener("click", (e) => {
      e.stopPropagation();
      playlists[name] = playlists[name].filter((x) => x !== id);
      savePlaylists();
      openPlaylist(name);
    });
    list.appendChild(row);
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
// Service worker registration
// ---------------------------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(() => sendTokenToServiceWorker()).catch((e) => console.warn("SW failed", e));
  });
}
