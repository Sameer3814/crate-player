/* ===================================================================
   Crate — a personal offline music player backed by your Google Drive
   =================================================================== */

// ---- 1. CONFIGURE THIS -------------------------------------------------
// Paste the OAuth Client ID you create in Google Cloud Console (see README).
const GOOGLE_CLIENT_ID = "592935651583-jet4jrpfpmka05ujpdk0qe0ugg038ves.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
// -------------------------------------------------------------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let accessToken = null;
let tokenClient = null;
let folderId = localStorage.getItem("crate_folder_id") || null;
let tracks = [];              // [{id, name, mimeType, size, cached}]
let queue = [];                // array of track ids, current playback order
let queueIndex = -1;
let shuffleOn = false;
let repeatMode = "off";        // off | all | one
let playlists = JSON.parse(localStorage.getItem("crate_playlists") || "{}");

const audio = $("#audio");

// ---------------------------------------------------------------------
// Visible on-screen banner — so playback/auth errors show up on the
// phone itself, not just in a console you can't easily see on iOS.
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
  3: "This file couldn't be decoded — it may not be a supported audio format.",
  4: "This audio source isn't supported (often means the file didn't actually load — check the track downloaded correctly).",
};
audio.addEventListener("error", () => {
  const code = audio.error?.code;
  showToast("Playback error: " + (AUDIO_ERROR_MESSAGES[code] || "unknown issue (code " + code + ")"));
});

// ---------------------------------------------------------------------
// IndexedDB — stores audio blobs + metadata for offline playback
// ---------------------------------------------------------------------
const DB_NAME = "crate-db";
const STORE = "tracks";
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => {
    req.result.createObjectStore(STORE, { keyPath: "id" });
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

async function idbPut(record) {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(id) {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => res(req.result || null);
    req.onerror = () => rej(req.error);
  });
}
async function idbDelete(id) {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbAll() {
  const db = await dbPromise;
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

// ---------------------------------------------------------------------
// Google sign-in (Identity Services token client)
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
      enterApp();
    },
  });

  const savedToken = sessionStorage.getItem("crate_token");
  if (savedToken) {
    accessToken = savedToken;
    enterApp();
  }
});

$("#signin-btn").addEventListener("click", () => {
  tokenClient.requestAccessToken({ prompt: "" });
});

$("#signout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("crate_token");
  accessToken = null;
  $("#app").classList.add("hidden");
  $("#setup").classList.remove("hidden");
});

async function enterApp() {
  $("#setup").classList.add("hidden");
  $("#app").classList.remove("hidden");
  await hydrateCachedTracks();
  if (folderId) {
    loadFromDrive();
  } else {
    promptForFolder();
  }
  refreshStorageLine();
}

// ---------------------------------------------------------------------
// Folder selection — user pastes a Drive folder ID (see README for how
// to grab it from a folder's share link)
// ---------------------------------------------------------------------
function promptForFolder() {
  const id = window.prompt(
    "Paste your Google Drive folder ID (the long string in the folder's share link, after /folders/):"
  );
  if (id) {
    folderId = id.trim();
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
      if (!res.ok) throw new Error(`Drive API error ${res.status}`);
      const data = await res.json();
      files = files.concat(data.files || []);
      pageToken = data.nextPageToken;
    } while (pageToken);

    const cached = await idbAll();
    const cachedIds = new Set(cached.map((c) => c.id));

    tracks = files.map((f) => ({
      id: f.id,
      name: f.name.replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, ""),
      mimeType: f.mimeType,
      size: Number(f.size || 0),
      cached: cachedIds.has(f.id),
    }));

    queue = tracks.map((t) => t.id);
    renderLibrary();
  } catch (err) {
    console.error(err);
    $("#track-count").textContent = "";
    showToast("Couldn't reach Google Drive: " + err.message);
  }
}

async function hydrateCachedTracks() {
  const cached = await idbAll();
  tracks = cached.map((c) => ({
    id: c.id, name: c.name, mimeType: c.mimeType, size: c.blob.size, cached: true,
  }));
  queue = tracks.map((t) => t.id);
  renderLibrary();
}

// ---------------------------------------------------------------------
// Download / cache a track for offline playback
// ---------------------------------------------------------------------
function statusElFor(id) {
  const btn = document.querySelector(`.track-action[data-id="${id}"]`);
  return btn?.closest(".track-row")?.querySelector(".track-status") || null;
}

async function downloadTrack(track) {
  const statusEl = statusElFor(track.id);
  if (statusEl) statusEl.textContent = "0%";
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${track.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Drive returned ${res.status} while downloading "${track.name}"${bodyText ? " — " + bodyText.slice(0, 120) : ""}`);
  }
  const total = Number(res.headers.get("Content-Length") || track.size || 0);
  const reader = res.body.getReader();
  let received = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (statusEl && total) statusEl.textContent = Math.round((received / total) * 100) + "%";
  }
  const blob = new Blob(chunks, { type: track.mimeType || "audio/mpeg" });
  await idbPut({ id: track.id, name: track.name, mimeType: track.mimeType, blob });
  track.cached = true;
  if (statusEl) statusEl.textContent = "";
  renderLibrary();
  refreshStorageLine();
  return blob;
}

async function removeDownload(track) {
  await idbDelete(track.id);
  track.cached = false;
  renderLibrary();
  refreshStorageLine();
}

async function refreshStorageLine() {
  const cached = await idbAll();
  const bytes = cached.reduce((sum, c) => sum + (c.blob?.size || 0), 0);
  $("#storage-used").textContent = (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ---------------------------------------------------------------------
// Playback engine
// ---------------------------------------------------------------------
// Bumped on every new tap so a slow/late download for a track the user
// has since navigated away from doesn't start playing itself.
let playRequestToken = 0;

async function playTrackById(id) {
  const track = tracks.find((t) => t.id === id);
  if (!track) return;
  const myRequest = ++playRequestToken;
  queueIndex = queue.indexOf(id);

  // Show something immediately so the tap always has visible feedback,
  // even before the (possibly slow) fetch finishes.
  $("#np-title").textContent = track.name;
  $("#np-artist").textContent = "loading…";
  $("#player-bar").classList.remove("hidden");
  renderLibrary();

  try {
    let blob;
    const cached = await idbGet(id);
    if (cached) {
      blob = cached.blob;
    } else {
      const statusEl = statusElFor(id);
      if (statusEl) statusEl.textContent = "0%";
      blob = await downloadTrack(track); // fully authenticated fetch, same path used for offline caching
    }
    if (myRequest !== playRequestToken) return; // user tapped something else meanwhile

    audio.src = URL.createObjectURL(blob);
    await audio.play();
    $("#np-artist").textContent = guessArtist(track.name);
    updateMediaSession(track);
    renderLibrary();
  } catch (err) {
    console.error(err);
    if (err.name === "NotAllowedError") {
      showToast("iOS blocked autoplay — tap the ▶ button in the player bar once to start it.");
    } else {
      showToast(err.message || "Couldn't play that track.");
    }
  }
}

function guessArtist(name) {
  const parts = name.split(" - ");
  return parts.length > 1 ? parts[0] : "";
}

function togglePlay() {
  if (audio.paused) {
    audio.play().catch((e) => showToast(e.message || "Couldn't resume playback."));
  } else {
    audio.pause();
  }
}
function playNext() {
  if (!queue.length) return;
  let nextIndex;
  if (shuffleOn) {
    nextIndex = Math.floor(Math.random() * queue.length);
  } else {
    nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === "all") nextIndex = 0; else return;
    }
  }
  playTrackById(queue[nextIndex]);
}
function playPrev() {
  if (!queue.length) return;
  const prevIndex = Math.max(0, queueIndex - 1);
  playTrackById(queue[prevIndex]);
}

audio.addEventListener("play", () => { $("#btn-play").textContent = "⏸"; $("#player-bar").classList.add("is-playing"); });
audio.addEventListener("pause", () => { $("#btn-play").textContent = "▶"; $("#player-bar").classList.remove("is-playing"); });
audio.addEventListener("ended", () => {
  if (repeatMode === "one") { audio.currentTime = 0; audio.play(); return; }
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
$("#btn-shuffle").addEventListener("click", (e) => {
  shuffleOn = !shuffleOn;
  e.target.style.color = shuffleOn ? "var(--accent)" : "";
});
$("#btn-repeat").addEventListener("click", (e) => {
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  e.target.textContent = repeatMode === "one" ? "↻¹" : "↻";
  e.target.style.color = repeatMode === "off" ? "" : "var(--accent)";
});

function updateMediaSession(track) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.name,
    artist: guessArtist(track.name) || "Crate",
    album: "My Library",
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", playPrev);
  navigator.mediaSession.setActionHandler("nexttrack", playNext);
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null) audio.currentTime = details.seekTime;
  });
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function renderLibrary() {
  const list = $("#track-list");
  const q = $("#search").value.trim().toLowerCase();
  const filtered = tracks.filter((t) => t.name.toLowerCase().includes(q));
  $("#track-count").textContent = filtered.length ? `${filtered.length} tracks` : "";
  $("#empty-state").classList.toggle("hidden", filtered.length > 0);
  list.innerHTML = "";
  filtered.forEach((track, i) => {
    const row = document.createElement("li");
    row.className = "track-row" + (queue[queueIndex] === track.id ? " is-playing" : "");
    row.innerHTML = `
      <span class="track-num">${i + 1}</span>
      <span class="track-disc">◎</span>
      <div class="track-main">
        <div class="track-title">${escapeHtml(track.name)}</div>
        <div class="track-sub">${guessArtist(track.name) || (track.cached ? "downloaded" : "streams from Drive")}</div>
      </div>
      <span class="track-status"></span>
      <button class="track-action ${track.cached ? "cached" : ""}" data-id="${track.id}" title="${track.cached ? "Remove download" : "Download"}">
        ${track.cached ? "⬇︎" : "⬇"}
      </button>
    `;
    row.querySelector(".track-main").addEventListener("click", () => playTrackById(track.id));
    row.querySelector(".track-num").addEventListener("click", () => playTrackById(track.id));
    row.querySelector(".track-disc").addEventListener("click", () => playTrackById(track.id));
    row.querySelector(".track-action").addEventListener("click", (e) => {
      e.stopPropagation();
      if (track.cached) removeDownload(track); else downloadTrack(track).catch((e) => showToast(e.message));
    });
    list.appendChild(row);
  });
  renderDownloadsView();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function renderDownloadsView() {
  const cached = await idbAll();
  const list = $("#download-list");
  $("#download-count").textContent = cached.length ? `${cached.length} tracks` : "";
  $("#download-empty").classList.toggle("hidden", cached.length > 0);
  list.innerHTML = "";
  cached.forEach((c, i) => {
    const row = document.createElement("li");
    row.className = "track-row";
    row.innerHTML = `
      <span class="track-num">${i + 1}</span>
      <span class="track-disc">◎</span>
      <div class="track-main">
        <div class="track-title">${escapeHtml(c.name)}</div>
        <div class="track-sub">${(c.blob.size / (1024 * 1024)).toFixed(1)} MB</div>
      </div>
      <span class="track-status"></span>
      <button class="track-action cached" data-id="${c.id}" title="Remove download">⬇︎</button>
    `;
    row.querySelector(".track-main").addEventListener("click", () => playTrackById(c.id));
    row.querySelector(".track-action").addEventListener("click", (e) => {
      e.stopPropagation();
      const t = tracks.find((tt) => tt.id === c.id) || { id: c.id };
      removeDownload(t);
    });
    list.appendChild(row);
  });
}

$("#search").addEventListener("input", renderLibrary);

// ---------------------------------------------------------------------
// Navigation between views
// ---------------------------------------------------------------------
$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".nav-item").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const view = btn.dataset.view;
    $$(".view").forEach((v) => v.classList.add("hidden"));
    $(`#view-${view}`).classList.remove("hidden");
  });
});

// ---------------------------------------------------------------------
// Playlists (stored locally on-device, independent of Drive)
// ---------------------------------------------------------------------
function savePlaylists() {
  localStorage.setItem("crate_playlists", JSON.stringify(playlists));
}
function renderPlaylistGrid() {
  const grid = $("#playlist-grid");
  grid.innerHTML = "";
  Object.entries(playlists).forEach(([name, ids]) => {
    const card = document.createElement("button");
    card.className = "playlist-card";
    card.innerHTML = `
      <span class="playlist-card-mark">◎</span>
      <div>
        <div class="playlist-card-name">${escapeHtml(name)}</div>
        <div class="playlist-card-count">${ids.length} tracks</div>
      </div>
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
  ids.forEach((id, i) => {
    const track = tracks.find((t) => t.id === id);
    if (!track) return;
    const row = document.createElement("li");
    row.className = "track-row";
    row.innerHTML = `
      <span class="track-num">${i + 1}</span>
      <span class="track-disc">◎</span>
      <div class="track-main">
        <div class="track-title">${escapeHtml(track.name)}</div>
        <div class="track-sub">${guessArtist(track.name)}</div>
      </div>
      <span class="track-status"></span>
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
$("#playlist-back").addEventListener("click", () => {
  $("#playlist-grid").classList.remove("hidden");
  $("#playlist-detail").classList.add("hidden");
});
$("#new-playlist-btn").addEventListener("click", () => {
  const name = window.prompt("Playlist name:");
  if (!name || playlists[name]) return;
  playlists[name] = [];
  savePlaylists();
  renderPlaylistGrid();
});
document.querySelector('[data-view="playlists"]').addEventListener("click", renderPlaylistGrid);

// Long-press-free simple "add to playlist": click track action with shift key
document.addEventListener("keydown", () => {}); // placeholder for future gesture support

// ---------------------------------------------------------------------
// Service worker registration (app-shell offline support)
// ---------------------------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW failed", e));
  });
}
