@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --bg: #0B0A0F;
  --surface: #15131E;
  --surface-2: #1D1A2A;
  --surface-3: #272238;
  --line: #2C2740;
  --accent: #8B5CF6;
  --accent-2: #C084FC;
  --text: #F5F3F9;
  --text-dim: #9C97AC;
  --radius-sm: 8px;
  --radius: 14px;
  --radius-lg: 22px;
  --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

*{ box-sizing:border-box; -webkit-tap-highlight-color: transparent; }
html, body{ height:100%; }
body{
  margin:0; background: var(--bg); color: var(--text); font-family: var(--font);
  -webkit-font-smoothing: antialiased; overscroll-behavior: none;
}
button{ font-family: inherit; border:none; background:none; color:inherit; cursor:pointer; padding:0; }
input{ font-family: inherit; }
.hidden{ display:none !important; }
img{ -webkit-user-drag:none; }

/* ---------- Icons ---------- */
.icn{ display:inline-flex; align-items:center; justify-content:center; width:1em; height:1em; flex-shrink:0; }
.icn svg{ width:100%; height:100%; display:block; }

/* ---------- Brand ---------- */
.brand{ display:flex; align-items:center; gap:9px; }
.brand-mark{
  width:24px; height:24px; border-radius:7px; flex-shrink:0;
  background: linear-gradient(140deg, var(--accent-2), var(--accent));
  box-shadow: 0 3px 12px rgba(139,92,246,0.4);
}
.brand h1{ font-size:19px; font-weight:800; margin:0; letter-spacing:-0.03em; }
.brand-lg .brand-mark{ width:34px; height:34px; border-radius:10px; }
.brand-lg h1{ font-size:27px; }

/* ---------- Sign-in ---------- */
.setup{
  min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:24px;
  background: radial-gradient(circle at 30% 18%, rgba(139,92,246,0.2), transparent 55%), var(--bg);
}
.setup-card{ max-width:330px; text-align:center; }
.setup-card .brand{ justify-content:center; margin-bottom:18px; }
.setup-copy{ color: var(--text-dim); line-height:1.55; margin-bottom:32px; font-size:14.5px; }
.setup-note{ color: var(--text-dim); font-size:12px; margin-top:16px; line-height:1.5; }

.btn-primary{
  background: linear-gradient(140deg, var(--accent-2), var(--accent));
  color:#fff; font-weight:700; padding:15px 32px; border-radius:999px; font-size:15px;
  box-shadow: 0 8px 24px rgba(139,92,246,0.35);
  transition: transform .14s ease, opacity .14s ease;
}
.btn-primary:active{ transform: scale(0.96); opacity:0.9; }

.btn-pill{
  display:inline-flex; align-items:center; gap:6px;
  background: var(--surface-2); border:1px solid var(--line); color: var(--text);
  font-weight:600; font-size:13px; padding:8px 15px; border-radius:999px;
}
.btn-pill .icn{ font-size:14px; }
.btn-pill:active{ background: var(--surface-3); }

.btn-back{
  display:inline-flex; align-items:center; gap:5px; color: var(--text-dim);
  font-size:13px; font-weight:500; padding:6px 0; margin-bottom:4px;
}
.btn-back .icn{ font-size:15px; }

/* ---------- Shell ---------- */
.app{ min-height:100dvh; display:flex; flex-direction:column; padding-bottom:150px; }
.topbar{ display:flex; align-items:center; justify-content:space-between; padding:14px 18px 4px; }
.topbar-actions{ display:flex; gap:8px; }

.icon-btn{
  width:38px; height:38px; border-radius:50%; background: var(--surface-2);
  border:1px solid var(--line); display:flex; align-items:center; justify-content:center;
  font-size:17px; color: var(--text); flex-shrink:0;
  transition: background .14s ease, transform .14s ease;
}
.icon-btn:active{ background: var(--surface-3); transform: scale(0.94); }

.search-row{ padding:12px 18px 2px; }
.search-wrap{ position:relative; display:block; }
.search-icn{
  position:absolute; left:14px; top:50%; transform:translateY(-50%);
  font-size:16px; color: var(--text-dim); pointer-events:none;
}
#search{
  width:100%; background: var(--surface); border:1px solid var(--line); color: var(--text);
  padding:12px 16px 12px 40px; border-radius:999px; font-size:14.5px; outline:none;
  transition: border-color .14s ease;
}
#search:focus{ border-color: var(--accent); }
#search::placeholder{ color: var(--text-dim); }
#search::-webkit-search-cancel-button{ -webkit-appearance:none; }

.main{ flex:1; padding:16px 18px 8px; }
.view-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.view-head h2{ font-size:23px; font-weight:800; margin:0; letter-spacing:-0.03em; }
.view-count{ color: var(--text-dim); font-size:12.5px; font-weight:500; }
.storage-line{ color: var(--text-dim); font-size:12.5px; margin-bottom:14px; }

/* ---------- Track rows ---------- */
.track-list{ list-style:none; margin:0; padding:0; }
.track-row{
  display:flex; align-items:center; gap:12px; padding:8px 6px; border-radius:10px;
  transition: background .14s ease;
}
.track-row:active{ background: var(--surface); }
.track-tap{ display:flex; align-items:center; gap:12px; flex:1; min-width:0; text-align:left; }
.track-art{
  width:50px; height:50px; border-radius:9px; flex-shrink:0; object-fit:cover;
  background: linear-gradient(140deg, var(--surface-3), var(--surface));
  display:flex; align-items:center; justify-content:center; color: var(--text-dim); font-size:19px;
  overflow:hidden;
}
.track-art img{ width:100%; height:100%; object-fit:cover; border-radius:9px; }
.track-main{ flex:1; min-width:0; }
.track-title{ font-size:14.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.01em; }
.track-row.is-playing .track-title{ color: var(--accent-2); }
.track-sub{ font-size:12.5px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
.track-status{ font-size:10.5px; color: var(--text-dim); flex-shrink:0; min-width:30px; text-align:right; font-variant-numeric: tabular-nums; }
.track-action{
  width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:16px; color: var(--text-dim); flex-shrink:0;
}
.track-action:active{ background: var(--surface-2); }
.track-action.cached{ color: var(--accent-2); }

.empty-state{ color: var(--text-dim); font-size:14px; padding:44px 14px; text-align:center; line-height:1.6; }

/* ---------- Playlists ---------- */
.playlist-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:13px; }
.playlist-card{
  background: var(--surface); border:1px solid var(--line); border-radius: var(--radius);
  padding:12px; text-align:left;
}
.playlist-card:active{ background: var(--surface-2); }
.playlist-card-art{
  width:100%; aspect-ratio:1/1; border-radius:10px; margin-bottom:10px;
  background: linear-gradient(140deg, var(--accent-2), var(--accent));
  display:flex; align-items:center; justify-content:center; font-size:26px; color:#fff;
}
.playlist-card-name{ font-size:14px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.playlist-card-count{ font-size:11.5px; color: var(--text-dim); margin-top:2px; }
.playlist-detail h3{ font-size:21px; font-weight:800; margin:6px 0 12px; letter-spacing:-0.03em; }

/* ---------- Mini player ---------- */
.mini-player{
  position:fixed; left:10px; right:10px; bottom:76px; z-index:20;
  background: rgba(29,26,42,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border:1px solid var(--line); border-radius: var(--radius);
  display:flex; align-items:center; gap:8px; padding:8px 10px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.5); overflow:hidden;
}
.mini-open{ flex:1; min-width:0; display:flex; align-items:center; gap:11px; text-align:left; }
.mini-art{
  width:40px; height:40px; border-radius:8px; flex-shrink:0; overflow:hidden;
  background: linear-gradient(140deg, var(--surface-3), var(--surface));
  display:flex; align-items:center; justify-content:center; color: var(--text-dim); font-size:16px;
}
.mini-art img{ width:100%; height:100%; object-fit:cover; }
.mini-meta{ flex:1; min-width:0; display:flex; flex-direction:column; }
.mini-title{ font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mini-artist{ font-size:11.5px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.mini-btn{
  width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:17px; color: var(--text); flex-shrink:0;
}
.mini-btn:active{ background: var(--surface-3); }
.mini-progress{ position:absolute; left:0; right:0; bottom:0; height:2px; background: rgba(255,255,255,0.07); }
#mini-progress-fill{ display:block; height:100%; width:0%; background: var(--accent-2); transition: width .25s linear; }

/* ---------- Tab bar ---------- */
.tabbar{
  position:fixed; left:0; right:0; bottom:0; z-index:19; display:flex;
  background: rgba(21,19,30,0.94); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top:1px solid var(--line);
  padding:9px 6px calc(9px + env(safe-area-inset-bottom));
}
.tab-item{
  flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;
  color: var(--text-dim); font-size:10.5px; font-weight:500; padding:3px;
}
.tab-item .icn{ font-size:21px; }
.tab-item.is-active{ color: var(--text); }
.tab-item.is-active .icn{ color: var(--accent-2); }

/* ---------- Now Playing ---------- */
.now-playing{ position:fixed; inset:0; z-index:60; }
.np-backdrop{
  position:absolute; inset:0;
  background: radial-gradient(circle at 50% -5%, rgba(139,92,246,0.3), transparent 62%), var(--bg);
}
.np-content{
  position:relative; height:100%; display:flex; flex-direction:column;
  padding: max(14px, env(safe-area-inset-top)) 24px calc(26px + env(safe-area-inset-bottom));
}
.np-head{ display:flex; align-items:center; justify-content:space-between; }
.np-head-label{ font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color: var(--text-dim); }
.np-art-wrap{ flex:1; display:flex; align-items:center; justify-content:center; min-height:0; padding:20px 0; }
.np-art{
  width:min(76vw, 330px); height:min(76vw, 330px); border-radius: var(--radius-lg); overflow:hidden;
  background: linear-gradient(140deg, var(--surface-3), var(--surface));
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
}
.np-art img{ width:100%; height:100%; object-fit:cover; }
.np-art-ph{ font-size:52px; color: var(--text-dim); }
.np-info{ display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:20px; }
.np-info-text{ min-width:0; }
.np-title{ font-size:21px; font-weight:800; letter-spacing:-0.03em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.np-artist{ font-size:14px; color: var(--text-dim); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.np-progress{ margin-bottom:4px; }
#np-seek{
  -webkit-appearance:none; width:100%; height:4px; border-radius:2px; outline:none;
  background: rgba(255,255,255,0.14);
}
#np-seek::-webkit-slider-thumb{
  -webkit-appearance:none; width:14px; height:14px; border-radius:50%;
  background:#fff; box-shadow: 0 2px 8px rgba(0,0,0,0.5); cursor:pointer;
}
.np-times{ display:flex; justify-content:space-between; font-size:11px; color: var(--text-dim); margin-top:7px; font-variant-numeric: tabular-nums; }

.np-controls{ display:flex; align-items:center; justify-content:space-between; padding:14px 2px 0; }
.np-ctrl{
  width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:22px; color: var(--text);
  transition: transform .14s ease, color .14s ease;
}
.np-ctrl:active{ transform: scale(0.9); }
.np-ctrl-main{
  width:66px; height:66px; font-size:26px; color:#fff;
  background: linear-gradient(140deg, var(--accent-2), var(--accent));
  box-shadow: 0 10px 28px rgba(139,92,246,0.45);
}
.np-ctrl.is-on{ color: var(--accent-2); }
.np-ctrl .badge{ position:absolute; }

/* ---------- Toast ---------- */
.toast{
  position:fixed; left:16px; right:16px; bottom:152px; z-index:80;
  background: rgba(58,18,32,0.96); border:1px solid #7A1F3B; color:#FCE3EC;
  padding:12px 16px; border-radius: var(--radius); font-size:13px; line-height:1.45;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.toast.is-info{ background: rgba(29,26,42,0.96); border-color: var(--line); color: var(--text); }

@media (min-width:720px){
  .app, .now-playing{ max-width:480px; margin:0 auto; }
}
