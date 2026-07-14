# Crate — setup guide

Crate is a small web app that turns a Google Drive folder of your songs into
an offline-capable player on your iPhone. It needs two one-time setup steps
before it'll work: (1) a Google OAuth Client ID, and (2) somewhere to host
the files with HTTPS. Both are free and take about 10 minutes total.

---

## 1. Get your songs into a Google Drive folder

Create a folder in Google Drive (e.g. "Crate Music") and upload your MP3s /
M4As into it. Note the folder's ID — open the folder in a browser, look at
the URL:

```
https://drive.google.com/drive/folders/1AbCдефXXXXXXXXXXXXXXXXXXXXXXXXX
                                          ^ this part is the folder ID
```

You'll paste this into the app the first time you sign in (it asks with a
prompt, and remembers it after that).

---

## 2. Create a Google OAuth Client ID

This lets *your* copy of the app ask *your* permission to read *your* Drive.
Nobody else can use this key to access your files.

1. Go to <https://console.cloud.google.com/> and create a new project (any name).
2. Go to **APIs & Services → Library**, search for **Google Drive API**, click **Enable**.
3. Go to **APIs & Services → OAuth consent screen**.
   - User type: **External**.
   - Fill in app name ("Crate"), your email for support/contact.
   - Add scope: `.../auth/drive.readonly`.
   - Under **Test users**, add your own Google account email.
   - Save.
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Under **Authorized JavaScript origins**, add the URL you'll host the app
     at (see step 3 below) — for GitHub Pages it looks like:
     `https://YOUR-USERNAME.github.io`
   - Click **Create**. Copy the **Client ID** (ends in `.apps.googleusercontent.com`).
5. Open `app.js` in this folder, find this line near the top:
   ```js
   const GOOGLE_CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
   ```
   and paste your real Client ID in there.

> Note: while your OAuth consent screen is in "Testing" mode, only the test
> users you added can sign in — which is exactly what you want, since this
> is just for you. No need to submit it for Google verification.

---

## 3. Host the files (GitHub Pages, free)

1. Create a new **public** GitHub repo, e.g. `crate-player`.
2. Upload every file in this folder (`index.html`, `styles.css`, `app.js`,
   `manifest.json`, `sw.js`, and the `icons/` folder) to the repo root.
3. In the repo, go to **Settings → Pages**. Under "Build and deployment",
   set **Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
   Save.
4. After a minute, your app will be live at:
   ```
   https://YOUR-USERNAME.github.io/crate-player/
   ```
5. Go back and confirm that exact origin (`https://YOUR-USERNAME.github.io`)
   is listed under **Authorized JavaScript origins** in your OAuth client
   (step 2.4 above) — if you set this up before knowing your final URL,
   update it now and save.

(Netlify or Vercel work the same way if you'd rather use those — drag-and-drop
the folder in, and use the URL they give you as the authorized origin instead.)

---

## 4. Install it on your iPhone

1. Open the GitHub Pages URL in **Safari** on your iPhone (must be Safari,
   not Chrome, for "Add to Home Screen" to create a real installed app).
2. Tap the **Share** button → **Add to Home Screen**.
3. Open Crate from the new icon on your home screen. It'll launch full-screen,
   no browser bar, like any other app.
4. Tap **Connect Google Drive**, sign in, and paste your folder ID when asked.
5. Tap the tracks you want to keep offline — tap the download arrow next to
   a track to cache it in the phone's storage so it plays without needing a
   connection later. Anything you just tap-to-play but haven't downloaded
   will stream and cache itself automatically in the background.

---

## What to expect

- **Playlists** are stored locally on your phone (not synced to Drive) —
  fine for personal use, just remember they're per-device.
- **Lock screen controls** (play/pause/skip on the lock screen, control
  center) work via the Media Session API. It's good, but iOS Safari PWAs
  are slightly less reliable here than a true native app — occasionally
  you may need to reopen the app after a long backgrounded period.
- **Storage**: cached songs live in the browser's IndexedDB storage, which
  iOS can in rare cases clear if the phone is critically low on space and
  the app hasn't been opened in a long time. Nothing lost — just re-download
  from Drive next time you open Crate.
- If you ever want a *fully* native version (smoother background audio,
  no iOS storage caveats, App Store-style install), the natural next step
  is rebuilding this as a React Native/Expo app — happy to help with that
  when you're ready; it just requires running the build through Expo's
  free cloud build service since it needs Apple's toolchain.

Enjoy your crate. 🎧
