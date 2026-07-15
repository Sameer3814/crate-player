@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --bg: #0B0A0F;
  --surface: #161420;
  --surface-2: #1E1B2A;
  --line: #2A2636;
  --accent: #8B5CF6;
  --accent-2: #C084FC;
  --text: #F5F3F9;
  --text-dim: #9C97AC;
  --radius-sm: 6px;
  --radius: 12px;
  --radius-lg: 20px;
  --font: 'Inter', -apple-system, sans-serif;
}

*{ box-sizing:border-box; -webkit-tap-highlight-color: transparent; }
html, body{ height:100%; }
body{
  margin:0; background: var(--bg); color: var(--text); font-family: var(--font);
  -webkit-font-smoothing: antialiased; overscroll-behavior: none;
}
button{ font-family: inherit; border:none; background:none; color:inherit; cursor:pointer; }
input{ font-family: inherit; }
.hidden{ display:none !important; }
img{ -webkit-user-drag: none; }

/* ---------- Brand ---------- */
.brand{ display:flex; align-items:center; gap:9px; }
.brand-mark{
  width:22px; height:22px; border-radius:6px; flex-shrink:0;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}
.brand h1{ font-size:19px; font-weight:800; margin:0; letter-spacing:-0.02em; }

/* ---------- Setup ---------- */
.setup{
  min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:24px;
  background: radial-gradient(circle at 30% 20%, rgba(139,92,246,0.18), transparent 55%), var(--bg);
}
.setup-card{ max-width:340px; text-align:center; }
.setup-card .brand{ justify-content:center; margin-bottom:20px; }
.setup-card .brand-mark{ width:32px; height:32px; border-radius:9px; }
.setup-card h1{ font-size:26px; }
.setup-copy{ color: var(--text-dim); line-height:1.5; margin-bottom:30px; font-size:14px; }
.setup-note{ color: var(--text-dim); font-size:12px; margin-top:14px; }

.btn-primary{
  background: var(--accent); color:#fff; font-weight:700; padding:14px 30px;
  border-radius:999px; font-size:15px; transition: transform .15s ease, opacity .15s ease;
}
.btn-primary:active{ transform: scale(0.96); opacity:0.85; }
.btn-pill{
  background: var(--surface-2); color: var(--text); font-weight:600; font-size:13px;
  padding:8px 16px; border-radius:999px; border:1px solid var(--line);
}
.link-btn{ color: var(--text-dim); font-size:13px; }

/* ---------- App shell ---------- */
.app{ min-height:100dvh; display:flex; flex-direction:column; padding-bottom: 132px; }
.topbar{ display:flex; align-items:center; justify-content:space-between; padding: 16px 18px 6px; }
.search-row{ display:flex; gap:8px; padding: 10px 18px 4px; }
#search{
  flex:1; background: var(--surface); border:1px solid var(--line); color: var(--text);
  padding:11px 15px; border-radius:999px; font-size:14px;
}
#search::placeholder{ color: var(--text-dim); }
.icon-btn{
  width:36px; height:36px; border-radius:50%; background: var(--surface);
  border:1px solid var(--line); font-size:15px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.icon-btn:active{ background: var(--surface-2); }

.main{ flex:1; padding: 14px 18px 8px; }
.view-head{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px; }
.view-head h2{ font-size:22px; font-weight:800; margin:0; letter-spacing:-0.02em; }
.view-count{ color: var(--text-dim); font-size:12px; }
.storage-line{ color: var(--text-dim); font-size:12px; margin-bottom:12px; }

/* ---------- Track rows (Spotify-style: art + title/artist + action) ---------- */
.track-list{ list-style:none; margin:0; padding:0; }
.track-row{
  display:flex; align-items:center; gap:12px; padding: 8px 4px; border-radius: var(--radius-sm);
}
.track-row:active{ background: var(--surface); }
.track-art{
  width:48px; height:48px; border-radius: var(--radius-sm); flex-shrink:0; object-fit:cover;
  background: linear-gradient(135deg, var(--surface-2), var(--surface));
}
.track-art.placeholder{ display:flex; align-items:center; justify-content:center; color: var(--text-dim); font-size:18px; }
.track-main{ flex:1; min-width:0; display:flex; flex-direction:column; }
.track-title{ font-size:14.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.track-row.is-playing .track-title{ color: var(--accent-2); }
.track-sub{ font-size:12.5px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.track-status{ font-size:10.5px; color: var(--text-dim); flex-shrink:0; width:32px; text-align:right; }
.track-action{ font-size:16px; color: var(--text-dim); padding:6px; flex-shrink:0; }
.track-action.cached{ color: var(--accent-2); }

.empty-state{ color: var(--text-dim); font-size:14px; padding:40px 10px; text-align:center; line-height:1.5; }

/* ---------- Playlists ---------- */
.playlist-grid{ display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; }
.playlist-card{
  background: var(--surface); border:1px solid var(--line); border-radius: var(--radius);
  padding:14px; text-align:left; aspect-ratio: 1/1; display:flex; flex-direction:column; justify-content:space-between;
}
.playlist-card-art{
  width:100%; aspect-ratio:1/1; border-radius: var(--radius-sm); margin-bottom:8px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2)); display:flex; align-items:center; justify-content:center; font-size:22px;
}
.playlist-card-name{ font-size:14px; font-weight:700; }
.playlist-card-count{ font-size:11px; color: var(--text-dim); }
.playlist-detail{ margin-top:6px; }
.playlist-detail h3{ font-size:20px; font-weight:800; }

/* ---------- Mini player ---------- */
.mini-player{
  position: fixed; left:10px; right:10px; bottom: 74px; z-index:20;
  background: var(--surface-2); border:1px solid var(--line); border-radius: var(--radius);
  display:flex; align-items:center; gap:11px; padding:8px 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}
.mini-art{ width:38px; height:38px; border-radius:7px; object-fit:cover; flex-shrink:0; background: var(--surface); }
.mini-meta{ flex:1; min-width:0; text-align:left; }
.mini-title{ font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mini-artist{ font-size:11.5px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mini-playpause{ font-size:16px; padding:6px 10px; flex-shrink:0; }

/* ---------- Bottom tab bar ---------- */
.tabbar{
  position: fixed; left:0; right:0; bottom:0; z-index:19; display:flex;
  background: var(--surface); border-top:1px solid var(--line);
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
}
.tab-item{
  flex:1; display:flex; flex-direction:column; align-items:center; gap:3px;
  color: var(--text-dim); font-size:10.5px; padding:4px;
}
.tab-icon{ font-size:18px; }
.tab-item.is-active{ color: var(--text); }
.tab-item.is-active .tab-icon{ color: var(--accent-2); }

/* ---------- Now Playing (full screen) ---------- */
.now-playing{ position: fixed; inset:0; z-index:60; }
.np-backdrop{
  position:absolute; inset:0;
  background: radial-gradient(circle at 50% 0%, rgba(139,92,246,0.25), transparent 60%), var(--bg);
}
.np-content{
  position:relative; height:100%; display:flex; flex-direction:column;
  padding: max(16px, env(safe-area-inset-top)) 22px calc(24px + env(safe-area-inset-bottom));
}
.np-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px; }
.np-head-label{ font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color: var(--text-dim); }
.np-art-wrap{ flex:1; display:flex; align-items:center; justify-content:center; min-height:0; padding: 16px 0; }
.np-art{
  width:min(78vw, 340px); height:min(78vw, 340px); border-radius: var(--radius-lg); object-fit:cover;
  background: linear-gradient(135deg, var(--surface-2), var(--surface));
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
.np-info{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; }
.np-title{ font-size:20px; font-weight:800; letter-spacing:-0.01em; }
.np-artist{ font-size:14px; color: var(--text-dim); margin-top:3px; }
.np-progress{ margin-bottom: 6px; }
#np-seek{ width:100%; accent-color: var(--accent-2); }
.np-times{ display:flex; justify-content:space-between; font-size:11px; color: var(--text-dim); margin-top:2px; }
.np-controls{ display:flex; align-items:center; justify-content:space-between; padding: 10px 4px 0; }
.np-ctrl{ font-size:20px; color: var(--text); width:44px; height:44px; display:flex; align-items:center; justify-content:center; }
.np-ctrl-main{
  width:64px; height:64px; border-radius:50%; background: var(--accent); font-size:22px;
  box-shadow: 0 8px 24px rgba(139,92,246,0.4);
}
.np-ctrl-main:active{ transform: scale(0.94); }
.np-ctrl.is-on{ color: var(--accent-2); }

/* ---------- Toast ---------- */
.toast{
  position: fixed; left:16px; right:16px; bottom: 148px; z-index:80;
  background: #3A1220; border:1px solid #7A1F3B; color:#FCE3EC;
  padding:12px 16px; border-radius: var(--radius); font-size:13px; line-height:1.4;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.toast.is-info{ background: var(--surface-2); border-color: var(--line); color: var(--text); }

/* ---------- Wider screens: simple max-width centering ---------- */
@media (min-width: 720px){
  .app{ max-width: 480px; margin: 0 auto; }
  .now-playing{ max-width:480px; margin:0 auto; }
}
