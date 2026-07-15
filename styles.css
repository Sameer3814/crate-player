# Crate — setup guide

Crate turns a Google Drive folder of your songs into a Spotify-style player
on your iPhone — streams directly (no waiting for full downloads), pulls
album art and artist name from each file's embedded tags, and lets you
explicitly download anything for offline listening.

If you already went through setup before, **skip to "Updating an existing
install"** at the bottom — you don't need to redo the Google Cloud steps.

---

## 1. Songs in a Drive folder

Upload your MP3s (ID3 tags with embedded album art work best — most music
you've ripped or bought already has these) into a Drive folder. Grab the
folder ID from its URL: `drive.google.com/drive/folders/`**`THIS_PART`**.

## 2. Google OAuth Client ID

1. [console.cloud.google.com](https://console.cloud.google.com/) → new project.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → External → fill in app name/emails → **Test users**: add your own email → save.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Web application → under **Authorized JavaScript origins** add your hosting URL's origin (e.g. `https://yourusername.github.io`, no path, no trailing slash) → Create → copy the Client ID.
5. Paste it into `app.js`:
   ```js
   const GOOGLE_CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
   ```

## 3. Host it (GitHub Pages)

1. New **public** GitHub repo.
2. Upload every file here (`index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, `icons/`) to the repo root.
3. **Settings → Pages** → Source: Deploy from a branch → `main` / `/ (root)` → Save.
4. Your app is live at `https://yourusername.github.io/reponame/`.

## 4. Install on iPhone

Open the URL in **Safari** → Share → **Add to Home Screen**. Open from the
icon, sign in, paste your folder link when asked.

---

## How playback actually works now

- **Streaming**: since `<audio>` tags can't send an auth header, the service
  worker quietly intercepts requests to `drive-stream/<fileId>`, attaches
  your Google token, and forwards them (including Range requests, so
  scrubbing the timeline works) to Drive. Playback starts immediately —
  no full download first.
- **Downloads**: tapping the ⬇ on a track (or in the Now Playing screen)
  does a full authenticated fetch and stores it in the browser's
  IndexedDB, so it plays with zero network afterward.
- **Album art & artist**: on first load of your library, Crate quietly
  reads the first ~1.5MB of each file (an authenticated Range request,
  not a full download) looking for embedded ID3 tags via the
  [jsmediatags](https://github.com/aadsm/jsmediatags) library (loaded from
  a CDN). Results are cached in IndexedDB, so it only happens once per
  song. Files without embedded art fall back to a plain gradient tile;
  files without a "Artist - Title" filename pattern or ID3 tags just show
  the filename.

## Known limitations (honest ones)

- **Token expiry**: your Google sign-in token lasts about an hour. On a
  very long session, streaming may eventually fail — just reopen the app
  to silently refresh it via `sessionStorage`, or sign in again if that
  doesn't kick in.
- **No re-auth-on-expiry mid-song yet** — if you hit this, it's a small
  known gap, not a bug to chase forever.
- Playlists are local to this device only (not synced to Drive).

## Updating an existing install

Whenever new `app.js`/`sw.js`/`styles.css`/`index.html` are provided:

1. On GitHub, open each changed file → pencil icon → select all → paste new content → Commit.
2. **Keep your real `GOOGLE_CLIENT_ID`** — new copies of `app.js` ship with the placeholder text, so re-paste your real ID in before committing.
3. **Important**: `sw.js` has a `CACHE_NAME` line (e.g. `"crate-shell-v5"`) — if a future update doesn't bump this number itself, your phone may keep serving old cached files. If something seems stuck on old behavior after an update, that's the first thing to check.
4. On your phone: fully close the app (swipe away in the app switcher, don't just background it) and reopen from the home screen icon — do this twice if the first reopen doesn't show the change.

Enjoy your crate. 🎧
