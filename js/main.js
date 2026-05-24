// =============================================
//  MAIN.JS — loads everything from content.json
//  Every piece of text comes from content.json
//  Nothing is hardcoded in index.html
// =============================================

document.addEventListener("DOMContentLoaded", async () => {
  let data;
  try {
    const res = await fetch("/content.json");
    if (!res.ok) throw new Error("not found");
    data = await res.json();
  } catch (e) {
    console.error("Could not load content.json:", e);
    return;
  }

  const p = data.profile || {};
  const l = data.links   || {};

  // ---- PAGE TITLE ----
  document.title = `${p.name || "Portfolio"} — Game Developer`;

  // ---- NAV ----
  setText("nav-name", p.name);

  // ---- HERO ----
  setText("hero-name",    p.name);
  setText("hero-tagline", p.tagline);

  // Hero tags — built from skills names
  const heroTags = document.getElementById("hero-tags");
  if (heroTags && p.skills) {
    heroTags.innerHTML = p.skills
      .map(s => `<span class="tag">${s.name}</span>`)
      .join("");
  }

  // ---- PROFILE PHOTO ----
  if (p.photo) {
    const placeholder = document.querySelector(".photo-placeholder");
    const frame = document.querySelector(".photo-frame");
    if (placeholder && frame) {
      const img = document.createElement("img");
      img.src = p.photo;
      img.alt = p.name;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      placeholder.replaceWith(img);
    }
  }

  // ---- ABOUT ----
  setText("about-bio",    p.aboutBio);
  setText("about-body",   p.aboutBody);
  setText("contact-text", p.contactText);

  // ---- STATS ----
  animateStat("stat-games", p.stats?.gamesShipped || 0);
  animateStat("stat-years", p.stats?.yearsXP      || 0);
  animateStat("stat-jams",  p.stats?.gameJamsWon   || 0);

  // ---- SKILLS ----
  window._profileSkills = p.skills || [];
  renderSkills(p.skills || []);

  // ---- FOOTER ----
  setText("footer-name", p.name);
  setText("year", new Date().getFullYear());

  // ---- LINKS ----
  setHref("link-email",    l.email);
  setHref("link-twitter",  l.twitter);
  setHref("link-itchio",   l.itchio);
  setHref("link-github",   l.github);
  setHref("link-linkedin", l.linkedin);

  // ---- SECTIONS ----
  initRetroEffects(p.name || "");
  renderProjects(data.projects   || []);
  renderGames(data.webGames    || []);
  renderVideos(data.videos || [], data.showreelSub || '');
  renderDownloads(data.downloads || [], data.downloadsDesc || "");
  renderReadingNook(data.writingSnippets || [], data.writingDesc || "", data.writingPlatforms || []);
  renderArtGallery(data.artGallery || [], data.artDesc || "");

  // ---- EXTRAS ----
  initStarfield();
  initShips();
  initCursorTrail();
});

// ---- Helpers ----
function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.textContent = val;
}
function setHref(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.href = val;
}

// ---- Animate a single stat counter ----
function animateStat(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = 0;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      let count = 0;
      const step = Math.ceil(target / 30);
      const iv = setInterval(() => {
        count += step;
        if (count >= target) { count = target; clearInterval(iv); }
        el.textContent = count;
      }, 40);
      obs.unobserve(el);
    });
  });
  obs.observe(el);
}

// ---- Skills bars ----
function renderSkills(skills) {
  const list = document.getElementById("skills-list");
  if (!list) return;
  list.innerHTML = "";
  skills.forEach(s => {
    const row = document.createElement("div");
    row.className = "skill-row";
    row.innerHTML = `
      <span>${s.name}</span>
      <div class="skill-bar"><div class="skill-fill" data-width="${s.level}"></div></div>`;
    list.appendChild(row);
  });
  // Animate bars on scroll
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.getAttribute("data-width") + "%";
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(".skill-fill").forEach(f => obs.observe(f));
}

// ---- Projects ----
function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
  if (!projects.length) {
    grid.innerHTML = '<p style="color:var(--muted)">No projects yet — add them in the admin panel!</p>';
    return;
  }
  grid.innerHTML = "";
  projects.forEach(p => {
    const tags = Array.isArray(p.tags) ? p.tags : (p.tags||"").split(",").map(t=>t.trim());
    const card = document.createElement("div");
    card.className = "project-card" + (p.featured ? " featured" : "");
    card.innerHTML = `
      <div class="card-img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.title}"/>`
          : `<div class="card-img-placeholder"><span>${p.title}</span></div>`}
        ${p.featured ? '<span class="featured-badge">★ Featured</span>' : ""}
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="card-tags">${tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        <div class="card-actions">
          ${p.playUrl  ? `<a href="${p.playUrl}" class="btn btn-primary btn-sm" target="_blank">▶ Play</a>` : ""}
          ${p.videoUrl ? `<button class="btn btn-ghost btn-sm" onclick="openVideo('${p.videoUrl}','${p.title}')">🎬 Watch</button>` : ""}
        </div>
      </div>`;
    grid.appendChild(card);
  });
  observeReveal(".project-card");
}

// ---- Web Games ----
function renderGames(games) {
  const grid = document.getElementById("games-grid");
  if (!grid) return;
  if (!games.length) {
    grid.innerHTML = '<p style="color:var(--muted)">No games yet!</p>';
    return;
  }
  grid.innerHTML = "";
  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-thumb">
        ${g.image
          ? `<img src="${g.image}" alt="${g.title}"/>`
          : `<div class="game-thumb-placeholder"><span>▶</span></div>`}
      </div>
      <div class="game-info">
        <h3>${g.title}</h3>
        <p>${g.description}</p>
        <button class="btn btn-primary btn-sm" onclick="embedGame('${g.embedUrl}','${g.title}')">Play Now ▶</button>
      </div>`;
    grid.appendChild(card);
  });
  observeReveal(".game-card");
}

function embedGame(url, title) {
  const area = document.getElementById("game-embed-area");
  document.getElementById("game-frame").src = url;
  document.getElementById("embed-title").textContent = title;
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
}
function closeEmbed() {
  document.getElementById("game-frame").src = "";
  document.getElementById("game-embed-area").style.display = "none";
}

// ---- Showreel (video background hero) ----
let _srPlaying = true;

function renderVideos(videos, showreelSub) {
  const main = videos.find(v => v.isShowreel) || videos[0];
  const placeholder = document.getElementById("showreel-placeholder");
  const wrap = document.getElementById("showreel-iframe-wrap");
  const screen = document.getElementById("sr-screen");

  if (!main || !main.src) {
    if (placeholder) placeholder.classList.add("visible");
    return;
  }
  if (placeholder) placeholder.classList.remove("visible");

  // Detect aspect ratio from URL hint (default 16:9, support 4:3 and 9:16 vertical)
  const isVertical = main.src.includes("shorts") || (main.aspectRatio === "9:16");
  const isClassic  = main.aspectRatio === "4:3";
  if (screen) {
    screen.style.aspectRatio = isVertical ? "9 / 16" : isClassic ? "4 / 3" : "16 / 9";
    // Constrain vertical video width so it doesn't stretch the whole monitor
    if (isVertical) {
      const monitor = document.getElementById("sr-monitor");
      if (monitor) monitor.style.maxWidth = "380px";
    }
  }

  const src = buildShowreelSrc(main.src);
  if (wrap && src) {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.setAttribute("tabindex", "-1");
    wrap.appendChild(iframe);
    setTimeout(() => iframe.classList.add("sr-loaded"), 800);
  }

  spawnShowreelParticles();
}

function buildShowreelSrc(raw) {
  if (!raw) return "";
  // Already a full embed URL
  if (raw.includes("embed")) return raw + (raw.includes("?") ? "&" : "?") + "autoplay=1&mute=1&loop=1&controls=0&playlist=" + extractYTId(raw);
  // YouTube ID only
  const ytId = extractYTId(raw);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&controls=0&playlist=${ytId}`;
  // Vimeo
  if (raw.includes("vimeo")) {
    const vid = raw.match(/\d{6,}/)?.[0];
    if (vid) return `https://player.vimeo.com/video/${vid}?autoplay=1&muted=1&loop=1&background=1`;
  }
  return raw;
}
function extractYTId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : (url.length === 11 ? url : null);
}

function srTogglePlay() {
  _srPlaying = !_srPlaying;
  const screen = document.getElementById("sr-screen");
  const led    = document.getElementById("sr-power-led");
  if (screen) screen.classList.toggle("sr-paused", !_srPlaying);
  if (led)    led.classList.toggle("off", !_srPlaying);
}

function spawnShowreelParticles() {
  const container = document.getElementById("sr-particles");
  if (!container) return;
  const colors = ["#ff79c6","#bd93f9","#8be9fd","#50fa7b","#f1fa8c"];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("div");
    p.className = "sr-particle";
    const size = 2 + Math.random() * 4;
    p.style.cssText = [
      `width:${size}px`,`height:${size}px`,
      `left:${Math.random()*100}%`,
      `bottom:${-10 + Math.random()*20}%`,
      `background:${colors[Math.floor(Math.random()*colors.length)]}`,
      `animation-duration:${6 + Math.random()*10}s`,
      `animation-delay:${Math.random()*8}s`
    ].join(";");
    container.appendChild(p);
  }
}

// ---- Downloads ----
function renderDownloads(downloads, desc) {
  const grid = document.getElementById("downloads-grid");
  const descEl = document.getElementById("downloads-desc");
  if (descEl && desc) descEl.textContent = desc;
  if (!grid) return;

  if (!downloads.length) {
    grid.innerHTML = '<p style="color:var(--muted)">No files yet — add them in the admin panel!</p>';
    return;
  }

  grid.innerHTML = "";
  downloads.forEach(dl => {
    const card = document.createElement("div");
    card.className = "download-card";

    // Work out if it's a base64 data URL or a real URL
    const hasFile = dl.fileUrl && dl.fileUrl.length > 0;
    const isBase64 = hasFile && dl.fileUrl.startsWith("data:");

    const btnHtml = hasFile
      ? `<a class="download-btn" href="${dl.fileUrl}" download="${dl.fileName || dl.title}"
           ${isBase64 ? '' : 'target="_blank"'}>
           <span class="btn-icon">⬇</span> Download
         </a>`
      : `<span class="download-btn" style="opacity:0.4;cursor:not-allowed;pointer-events:none;">
           <span class="btn-icon">⏳</span> Coming soon
         </span>`;

    card.innerHTML = `
      <div class="download-icon">${dl.icon || "📄"}</div>
      <div class="download-type">${dl.type || "File"}</div>
      <div class="download-title">${dl.title}</div>
      <div class="download-desc">${dl.description || ""}</div>
      ${dl.updated ? `<div class="download-meta">Updated ${dl.updated}</div>` : ""}
      ${btnHtml}
    `;
    grid.appendChild(card);
  });
  observeReveal(".download-card");
}


// ---- Scroll reveal ----
function observeReveal(selector) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(selector).forEach(el => obs.observe(el));
}



// =============================================
//  STARFIELD — canvas stars + nebulas
// =============================================
function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, layers = [], nebulas = [];

  function makeStars(count, minR, maxR, minS, maxS) {
    return Array.from({ length: count }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: minR + Math.random()*(maxR-minR),
      speed: minS + Math.random()*(maxS-minS),
      alpha: 0.2 + Math.random()*0.8,
      ts: 0.005 + Math.random()*0.02,
      td: Math.random()>0.5?1:-1,
      hue: Math.random()>0.85?(Math.random()>0.5?"200,230,255":"255,200,220"):"255,235,255",
    }));
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    layers = [makeStars(90,0.2,0.8,0.08,0.15), makeStars(60,0.6,1.4,0.15,0.3), makeStars(30,1.0,2.0,0.3,0.6)];
    nebulas = Array.from({length:5}, ()=>({
      x:Math.random()*W, y:Math.random()*H*0.8,
      rx:80+Math.random()*160, ry:50+Math.random()*100,
      hue:Math.random()>0.5?[189,147,249]:[255,121,198],
      alpha:0.02+Math.random()*0.04,
    }));
  }
  resize();
  window.addEventListener("resize", resize);

  (function draw() {
    ctx.clearRect(0,0,W,H);
    // Nebulas
    nebulas.forEach(n=>{
      const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.rx);
      g.addColorStop(0,`rgba(${n.hue.join(",")},${n.alpha*2})`);
      g.addColorStop(0.5,`rgba(${n.hue.join(",")},${n.alpha})`);
      g.addColorStop(1,`rgba(${n.hue.join(",")},0)`);
      ctx.save(); ctx.scale(1,n.ry/n.rx);
      ctx.beginPath(); ctx.arc(n.x,n.y*(n.rx/n.ry),n.rx,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill(); ctx.restore();
    });
    // Stars
    layers.forEach((stars,li)=>{
      stars.forEach(s=>{
        s.alpha+=s.ts*s.td; if(s.alpha>0.95||s.alpha<0.1)s.td*=-1;
        s.y+=s.speed; if(s.y>H){s.y=-s.r;s.x=Math.random()*W;}
        if(li===2&&s.r>1.2){
          const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*3);
          g.addColorStop(0,`rgba(${s.hue},${s.alpha})`); g.addColorStop(1,`rgba(${s.hue},0)`);
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r*3,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${s.hue},${s.alpha})`; ctx.fill();
      });
    });
    requestAnimationFrame(draw);
  })();
}

// =============================================
//  GRABBABLE SPACESHIPS — DOM elements
// =============================================
function initShips() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  // ---- Ship messages (random, sometimes blank) ----
  const MESSAGES = [
    "grab me!", "beep boop", "zoom zoom", "vroom!",
    "catch me!", "nyoooom", "👾", "to infinity!",
    "weee!", "brrrr!", "", "", "", // blanks = silent ship
  ];

  // ---- Jokes shown after grab ----
  const JOKES = [
    ["Why did the spaceship go to school?", "To improve its launch-guage! 🚀"],
    ["What do you call a sleeping dinosaur?", "A dino-snore! 🦕"],
    ["Why don't scientists trust atoms?", "Because they make up everything! ⚛️"],
    ["What did the ocean say to the beach?", "Nothing, it just waved! 🌊"],
    ["Why did the scarecrow win an award?", "Because he was outstanding in his field! 🌾"],
    ["I told my computer I needed a break…", "Now it won't stop sending me Kit-Kat ads 🍫"],
    ["Why do programmers prefer dark mode?", "Because light attracts bugs! 🐛"],
    ["What's a spaceship's favourite chocolate?", "A Milky Way! 🍫"],
  ];
  let jokeIndex = 0;

  // ---- Container ----
  const container = document.createElement("div");
  container.id = "ship-container";
  container.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:50;";
  hero.appendChild(container);

  // ---- Exhaust canvas ----
  const exCanvas = document.createElement("canvas");
  exCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:49;";
  hero.appendChild(exCanvas);
  const exCtx = exCanvas.getContext("2d");
  function resizeEx() {
    exCanvas.width  = exCanvas.offsetWidth;
    exCanvas.height = exCanvas.offsetHeight;
  }
  resizeEx();
  window.addEventListener("resize", resizeEx);

  // ---- Styles ----
  if (!document.getElementById("ship-styles")) {
    const st = document.createElement("style");
    st.id = "ship-styles";
    st.textContent = `
      @keyframes shipBob    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      @keyframes shipPulse  { 0%,100%{filter:drop-shadow(0 0 6px #8be9fd)} 50%{filter:drop-shadow(0 0 16px #8be9fd) brightness(1.3)} }
      @keyframes jokeSlide  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      .ship-joke {
        position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
        background:rgba(13,13,28,0.95); border:1px solid #bd93f9;
        border-radius:12px; padding:1rem 1.5rem; z-index:9999;
        max-width:380px; text-align:center;
        box-shadow:0 0 30px rgba(189,147,249,0.3);
        animation:jokeSlide 0.3s ease;
        font-family:'DM Sans',sans-serif;
      }
      .ship-joke .setup   { color:#f8f8f2; font-size:0.88rem; margin-bottom:0.5rem; }
      .ship-joke .punchline{ color:#f1fa8c; font-size:0.95rem; font-weight:600; }
      .ship-joke .dismiss { display:block; margin-top:0.75rem; color:#6272a4; font-size:0.75rem; cursor:pointer; }
      .ship-joke .dismiss:hover { color:#bd93f9; }
    `;
    document.head.appendChild(st);
  }

  // ---- Show joke ----
  let jokeShown = false;
  function showJoke() {
    if (document.querySelector(".ship-joke")) return;
    const [setup, punchline] = JOKES[jokeIndex % JOKES.length];
    jokeIndex++;
    const el = document.createElement("div");
    el.className = "ship-joke";
    el.innerHTML = `
      <div class="setup">${setup}</div>
      <div class="punchline">${punchline}</div>
      <span class="dismiss" onclick="this.parentElement.remove()">tap to dismiss ✕</span>
    `;
    document.body.appendChild(el);
    setTimeout(() => el?.remove(), 6000);
  }

  // =============================================
  //  PIXEL ART SHIP DESIGNS
  //  True 1-bit NES/Galaga style sprites
  //  Each ship is a grid of on/off pixels
  //  rendered as tiny SVG rects at 3px each
  // =============================================

  // Pixel grids — 1=lit, 0=off, 2=cockpit accent, 3=dark detail
  // Ships face RIGHT. They get flipped via CSS scaleX.
  // Grid is [row][col], read top to bottom.
  const SHIP_TYPES = [
    {
      // Type A — classic arrowhead fighter (Galaga vibe)
      w: 11, h: 9, px: 3,
      grid: [
        [0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,1,1,0,0,0,0,0,0],
        [0,0,1,1,2,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,0,3,0,0],
        [1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0,3,0,0],
        [0,0,1,1,2,0,0,0,0,0,0],
        [0,0,0,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,0,0,0,0,0,0],
      ],
    },
    {
      // Type B — chunky saucer / UFO style
      w: 13, h: 7, px: 3,
      grid: [
        [0,0,0,1,1,1,1,1,0,0,0,0,0],
        [0,0,1,1,2,2,1,1,1,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,0,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,3,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0,0,0],
      ],
    },
    {
      // Type C — sleek dart / stealth
      w: 14, h: 7, px: 3,
      grid: [
        [0,0,0,0,0,0,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,1,0,0,1,1,2,0,0,0,0,3,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,0,0,1,1,2,0,0,0,0,3,0,0],
        [0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      ],
    },
    {
      // Type D — chunky retro rocket
      w: 10, h: 11, px: 3,
      grid: [
        [0,0,0,1,1,1,0,0,0,0],
        [0,0,1,1,2,1,1,0,0,0],
        [0,1,1,1,2,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,0,0],
        [1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,0,0],
        [0,0,3,1,1,1,3,0,0,0],
        [0,0,3,0,0,0,3,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
      ],
    },
    {
      // Type E — twin-boom fighter
      w: 13, h: 9, px: 3,
      grid: [
        [0,1,0,0,0,0,0,0,0,1,0,0,0],
        [0,1,0,0,1,1,1,0,0,1,0,0,0],
        [0,1,0,1,1,2,1,1,0,1,0,3,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,0,1,1,2,1,1,0,1,0,3,0],
        [0,1,0,0,1,1,1,0,0,1,0,0,0],
        [0,1,0,0,0,0,0,0,0,1,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
      ],
    },
  ];

  // Render a pixel grid to SVG
  function shipSVG(typeIdx, color, grabbed) {
    const type = SHIP_TYPES[typeIdx];
    const { w, h, px, grid } = type;
    const svgW = w * px;
    const svgH = h * px;

    // Colour variants per pixel type
    const dark   = dimColor(color, 0.45);
    const bright = "#ffffff";
    const eng    = grabbed ? "#8be9fd" : color;
    const glowC  = grabbed ? "rgba(139,233,253,0.7)" : `${color}88`;

    let rects = "";
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const v = grid[row][col];
        if (v === 0) continue;
        const fill = v === 2 ? bright : v === 3 ? dark : color;
        const ox   = v === 2 ? 0.8 : 1; // cockpit slightly brighter
        rects += `<rect x="${col*px}" y="${row*px}" width="${px}" height="${px}" fill="${fill}" opacity="${ox}"/>`;
      }
    }

    // Engine glow ellipse — at the right edge, centred vertically
    const glowX = svgW + 4;
    const glowY = Math.floor(svgH/2);
    const glowRX = 10 + px*2;
    const glowRY = Math.floor(svgH/2) + 2;

    // Grabbed orbit ring
    const ring = grabbed
      ? `<circle cx="${svgW/2}" cy="${svgH/2}" r="${Math.max(svgW,svgH)*0.65}"
           fill="none" stroke="#8be9fd" stroke-width="0.8"
           stroke-dasharray="3,2" opacity="0.6"/>`
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${svgW+glowRX} ${svgH}"
        width="${svgW+glowRX}" height="${svgH}"
        style="image-rendering:pixelated;overflow:visible;display:block;">
      <defs>
        <radialGradient id="glow_${typeIdx}_${grabbed?1:0}" cx="80%" cy="50%" r="60%">
          <stop offset="0%" stop-color="${eng}" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="${eng}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- engine glow -->
      <ellipse cx="${glowX}" cy="${glowY}" rx="${glowRX}" ry="${glowRY}"
        fill="url(#glow_${typeIdx}_${grabbed?1:0})"/>
      <!-- pixels -->
      ${rects}
      <!-- CRT scanline shimmer -->
      <rect x="0" y="0" width="${svgW}" height="${svgH}"
        fill="url(#scan_${typeIdx})" opacity="0.08"/>
      <defs>
        <pattern id="scan_${typeIdx}" x="0" y="0" width="1" height="${px*2}" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1" height="${px}" fill="white"/>
        </pattern>
      </defs>
      ${ring}
    </svg>`;
  }

  function dimColor(hex, factor) {
    try {
      let r = Math.round(parseInt(hex.slice(1,3),16)*factor);
      let g = Math.round(parseInt(hex.slice(3,5),16)*factor);
      let b = Math.round(parseInt(hex.slice(5,7),16)*factor);
      return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    } catch { return hex; }
  }

  const SHIP_COLORS = ["#ff79c6","#bd93f9","#8be9fd","#50fa7b","#f1fa8c","#ffb86c"];

  // ---- Create ship ----
  let ships = [];
  let particles = [];

  function createShip() {
    const rect    = hero.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const fromLeft  = Math.random() > 0.4;
    const typeIdx   = Math.floor(Math.random() * SHIP_TYPES.length);
    const scale     = 0.9 + Math.random() * 0.7;   // small & crisp
    const speed     = 1.2 + Math.random() * 1.8;
    const color     = SHIP_COLORS[Math.floor(Math.random()*SHIP_COLORS.length)];
    const msg       = MESSAGES[Math.floor(Math.random()*MESSAGES.length)];
    const doSpiral  = Math.random() < 0.25;

    const ship = {
      x:      fromLeft ? -100 : W + 100,
      y:      H*0.08 + Math.random()*H*0.75,
      vx:     fromLeft ? speed : -speed,
      vy:     (Math.random()-0.5)*0.6,
      scale, color, msg, typeIdx,
      flip:   !fromLeft,
      grabbed: false,
      spiral: doSpiral,
      spiralAngle: 0,
      spiralDone: false,
      spiralCX: 0, spiralCY: 0,
      el: null, hint: null,
    };

    // Wrapper div
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position:absolute;
      pointer-events:all;
      cursor:grab;
      user-select:none;
      will-change:transform;
    `;

    // SVG inside
    const svgWrap = document.createElement("div");
    svgWrap.innerHTML = shipSVG(typeIdx, color, false);
    wrap.appendChild(svgWrap);
    ship.svgWrap = svgWrap;

    // Message label
    if (msg) {
      const label = document.createElement("div");
      label.style.cssText = `
        position:absolute; top:-18px; left:50%; transform:translateX(-50%);
        color:${color}; font-family:'Press Start 2P',monospace;
        font-size:7px; white-space:nowrap; pointer-events:none;
        text-shadow:0 0 8px ${color};
        animation:shipBob 1.2s ease-in-out infinite;
      `;
      label.textContent = msg;
      wrap.appendChild(label);
      ship.hint = label;
    }

    container.appendChild(wrap);
    ship.el = wrap;
    positionShip(ship);

    // ---- Drag ----
    let dragging = false;
    let startMX=0, startMY=0, lastMX=0, lastMY=0;
    let dvx=0, dvy=0;

    function startDrag(cx, cy) {
      dragging = true;
      ship.grabbed = true;
      ship.spiral  = false; // cancel spiral if grabbed
      startMX = cx - ship.x;
      startMY = cy - ship.y;
      lastMX=cx; lastMY=cy; dvx=0; dvy=0;
      wrap.style.cursor = "grabbing";
      wrap.style.zIndex = "60";
      svgWrap.innerHTML = shipSVG(typeIdx, color, true);
      if (ship.hint) ship.hint.style.display = "none";
    }

    function moveDrag(cx, cy) {
      if (!dragging) return;
      dvx = dvx*0.4 + (cx-lastMX)*0.6;
      dvy = dvy*0.4 + (cy-lastMY)*0.6;
      lastMX=cx; lastMY=cy;
      ship.x = cx - startMX;
      ship.y = cy - startMY;
      positionShip(ship);
    }

    function endDrag() {
      if (!dragging) return;
      dragging=false; ship.grabbed=false;
      wrap.style.cursor="grab"; wrap.style.zIndex="";
      svgWrap.innerHTML = shipSVG(typeIdx, color, false);
      if (ship.hint) ship.hint.style.display="";

      const spd = Math.sqrt(dvx*dvx+dvy*dvy);
      if (spd > 0.3) {
        const s = Math.max(1.5, Math.min(7, spd));
        ship.vx=(dvx/spd)*s; ship.vy=(dvy/spd)*s;
      } else {
        const a=Math.random()*Math.PI*2;
        ship.vx=Math.cos(a)*2.5; ship.vy=Math.sin(a)*1.2;
      }
      ship.flip = ship.vx > 0;

      // Burst
      for (let i=0;i<16;i++) {
        const a=(Math.PI*2/16)*i+Math.random()*0.3;
        const s=1.5+Math.random()*3;
        particles.push({
          x:ship.x, y:ship.y,
          vx:Math.cos(a)*s, vy:Math.sin(a)*s,
          life:1.0, size:(2+Math.random()*3)*ship.scale*0.5,
          col:Math.random()>0.5?[255,121,198]:[139,233,253],
        });
      }

      // Tell a joke!
      setTimeout(showJoke, 300);
    }

    wrap.addEventListener("mousedown", e=>{ e.preventDefault(); startDrag(e.clientX,e.clientY); });
    window.addEventListener("mousemove", e=>moveDrag(e.clientX,e.clientY));
    window.addEventListener("mouseup", ()=>endDrag());
    wrap.addEventListener("touchstart", e=>{ e.preventDefault(); const t=e.touches[0]; startDrag(t.clientX,t.clientY); },{passive:false});
    window.addEventListener("touchmove", e=>{ if(!dragging)return; e.preventDefault(); const t=e.touches[0]; moveDrag(t.clientX,t.clientY); },{passive:false});
    window.addEventListener("touchend", ()=>endDrag());

    return ship;
  }

  // ---- Position ship ----
  function positionShip(ship) {
    const type = SHIP_TYPES[ship.typeIdx];
    // Natural pixel dimensions — scale applied via CSS transform only
    const baseW = (type.w + 4) * type.px; // +4 for engine glow
    const baseH = type.h * type.px;
    const w = baseW * ship.scale;
    const h = baseH * ship.scale;
    ship.el.style.left      = (ship.x - w/2) + "px";
    ship.el.style.top       = (ship.y - h/2) + "px";
    // Scale via CSS so pixels stay crisp
    ship.svgWrap.style.transformOrigin = "top left";
    ship.svgWrap.style.transform = `scale(${ship.scale})${ship.flip ? " scaleX(-1)" : ""}`;
    ship.svgWrap.style.width  = baseW + "px";
    ship.svgWrap.style.height = baseH + "px";
    ship.el.style.width  = w + "px";
    ship.el.style.height = h + "px";
    // Hit area matches visual
    ship._hitW = w;
    ship._hitH = h;
  }

  // ---- Trail ----
  function spawnTrail(ship) {
    if (ship.grabbed) return;
    const type = SHIP_TYPES[ship.typeIdx];
    const shipW = (type.w + 4) * type.px * ship.scale;
    const shipH = type.h * type.px * ship.scale;
    // Engine is at the right edge of the sprite (flipped = left edge)
    const ex = ship.flip
      ? ship.x + shipW * 0.5 + 4
      : ship.x - shipW * 0.5 - 4;
    particles.push({
      x:ex, y:ship.y + (Math.random()-0.5)*shipH*0.5,
      vx:-ship.vx*0.2+(Math.random()-0.5)*0.4,
      vy:(Math.random()-0.5)*0.5,
      life:1.0,
      size: Math.max(1.5, (1+Math.random()*2)*ship.scale*0.5),
      col:Math.random()>0.5?[255,121,198]:[189,147,249],
    });
  }

  // ---- Spawn ----
  setTimeout(()=>ships.push(createShip()), 1500);
  setInterval(()=>{ if(ships.length<3) ships.push(createShip()); }, 9000+Math.random()*8000);

  // ---- Update loop ----
  function update() {
    const rect = hero.getBoundingClientRect();
    const W=rect.width, H=rect.height;

    ships = ships.filter(ship=>{
      if(ship.grabbed) return true;
      if(ship.x<-250||ship.x>W+250||ship.y<-250||ship.y>H+250){
        ship.el.remove(); return false;
      }
      return true;
    });

    ships.forEach(ship=>{
      if(ship.grabbed) return;

      // Spiral behaviour
      if(ship.spiral && !ship.spiralDone) {
        if(ship.spiralAngle === 0) {
          // Lock spiral centre at current position
          ship.spiralCX = ship.x;
          ship.spiralCY = ship.y;
        }
        ship.spiralAngle += 0.08;
        const r = 40 + ship.spiralAngle*8;
        ship.x = ship.spiralCX + Math.cos(ship.spiralAngle)*r;
        ship.y = ship.spiralCY + Math.sin(ship.spiralAngle)*r;
        // After one full rotation, exit spiral
        if(ship.spiralAngle > Math.PI*2) {
          ship.spiralDone = true;
          ship.spiral = false;
          ship.vx = (Math.random()>0.5?1:-1)*(1.5+Math.random());
          ship.vy = (Math.random()-0.5)*2;
          ship.flip = ship.vx > 0;
        }
      } else {
        ship.x += ship.vx;
        ship.y += ship.vy;
      }

      if(Math.random()>0.3) spawnTrail(ship);
      positionShip(ship);
    });

    // Exhaust particles
    const exW = exCanvas.offsetWidth;
    const exH = exCanvas.offsetHeight;
    if(exCanvas.width!==exW||exCanvas.height!==exH){ exCanvas.width=exW; exCanvas.height=exH; }
    exCtx.clearRect(0,0,exW,exH);
    particles=particles.filter(p=>p.life>0);
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.life-=0.033;
      exCtx.globalAlpha=p.life*0.8;
      exCtx.fillStyle=`rgba(${p.col.join(",")},1)`;
      exCtx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
    });
    exCtx.globalAlpha=1;

    requestAnimationFrame(update);
  }
  update();
}

// =============================================
//  RETRO TEXT EFFECTS
// =============================================
function initRetroEffects(realName) {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!?";
  const nameEl = document.getElementById("hero-name");
  if (!nameEl || !realName) return;

  // --- Name scramble reveal ---
  function scrambleReveal(el, finalText, delay = 1200) {
    let iteration = 0;
    const totalFrames = finalText.length * 6;
    setTimeout(() => {
      const iv = setInterval(() => {
        el.textContent = finalText
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (i < Math.floor(iteration / 6)) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");
        iteration++;
        if (iteration >= totalFrames) {
          clearInterval(iv);
          el.textContent = finalText;
          // Start periodic glitch after reveal
          startPeriodicGlitch(el, finalText);
        }
      }, 45);
    }, delay);
  }

  scrambleReveal(nameEl, realName.toUpperCase());

  // --- Periodic glitch on name ---
  function startPeriodicGlitch(el, text) {
    function doGlitch() {
      let ticks = 0;
      const iv = setInterval(() => {
        el.textContent = text
          .split("")
          .map(ch => {
            if (ch === " ") return " ";
            return Math.random() > 0.7
              ? CHARS[Math.floor(Math.random() * CHARS.length)]
              : ch;
          })
          .join("");
        ticks++;
        if (ticks > 8) { clearInterval(iv); el.textContent = text; }
      }, 50);
    }
    // Glitch every 4-9 seconds
    function schedule() {
      setTimeout(() => { doGlitch(); schedule(); }, 4000 + Math.random() * 5000);
    }
    schedule();
  }

  // --- Periodic random scanline tear across hero ---
  function heroTear() {
    const hero = document.querySelector(".hero-content");
    if (!hero) return;
    hero.style.clipPath = `inset(${20+Math.random()*40}% 0 ${Math.random()*30}% 0)`;
    hero.style.transform = `translateX(${(Math.random()-0.5)*6}px)`;
    setTimeout(() => {
      hero.style.clipPath = "";
      hero.style.transform = "";
      setTimeout(() => {
        hero.style.clipPath = `inset(${Math.random()*20}% 0 ${50+Math.random()*30}% 0)`;
        hero.style.transform = `translateX(${(Math.random()-0.5)*4}px)`;
        setTimeout(() => {
          hero.style.clipPath = "";
          hero.style.transform = "";
        }, 60);
      }, 40);
    }, 80);
    // Schedule next tear
    setTimeout(heroTear, 6000 + Math.random() * 8000);
  }
  setTimeout(heroTear, 5000 + Math.random() * 4000);

  // --- Boot sequence for eyebrow text ---
  const eyebrow = document.querySelector(".hero-eyebrow .type-in");
  if (eyebrow) {
    // After typewriter completes, occasionally re-scramble it
    setTimeout(() => {
      function glitchEyebrow() {
        const msgs = [
          "// level 01 — loading player data",
          "// WARNING: talent level over 9000",
          "// initializing awesome.exe...",
          "// ERROR 404: limits not found",
          "// SYSTEM: game dev detected ★",
        ];
        let i = 0;
        const origText = msgs[0];
        const pick = msgs[Math.floor(Math.random() * msgs.length)];
        eyebrow.style.borderRight = "2px solid var(--cyan)";
        const iv = setInterval(() => {
          eyebrow.textContent = pick
            .split("")
            .map((ch, idx) => idx < i ? ch : CHARS[Math.floor(Math.random()*CHARS.length)])
            .join("");
          i++;
          if (i > pick.length) {
            clearInterval(iv);
            eyebrow.textContent = pick;
            eyebrow.style.borderRight = "none";
            // Restore original after 2.5s
            setTimeout(() => { eyebrow.textContent = origText; }, 2500);
          }
        }, 35);
        setTimeout(glitchEyebrow, 9000 + Math.random()*7000);
      }
      setTimeout(glitchEyebrow, 9000);
    }, 2500);
  }
}


// ---- Cursor trail ----
const _trailColors = ['#ff79c6','#bd93f9','#8be9fd','#50fa7b','#f1fa8c','#ffb86c'];
let _trailI = 0;
function initCursorTrail() {
  document.addEventListener("mousemove", e => {
    const dot = document.createElement("div");
    dot.className = "trail-dot";
    dot.style.left = e.clientX + "px";
    dot.style.top  = e.clientY + "px";
    const col = _trailColors[_trailI % _trailColors.length];
    dot.style.background = col;
    dot.style.boxShadow = `0 0 8px ${col}, 0 0 14px ${col}`;
    _trailI++;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
  });
}

// ---- Mobile nav ----
function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("open");
}

// ---- Video modal ----
function openVideo(src, title) {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `
    <div style="position:relative;width:90%;max-width:800px;">
      <button onclick="this.parentElement.parentElement.remove()"
        style="position:absolute;top:-40px;right:0;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;">✕ Close</button>
      <div class="iframe-wrap">
        <iframe src="${src}" frameborder="0" allowfullscreen style="width:100%;height:450px;"></iframe>
      </div>
    </div>`;
  document.body.appendChild(el);
}

// =============================================
//  READING NOOK
// =============================================
// ---- Book Nook state ----
let _nookSnippets = [];
let _nookIdx = 0;
let _readSet = new Set(); // track which indices have been read

function renderReadingNook(snippets, desc, platforms) {
  _nookSnippets = snippets;

  const descEl = document.getElementById("reading-desc");
  if (descEl && desc) descEl.textContent = desc;

  // Build both shelves
  _buildShelves();

  // External platform links
  const linksGrid = document.getElementById("nook-links-grid");
  if (linksGrid) {
    if (platforms.length) {
      linksGrid.innerHTML = "";
      platforms.forEach((p, i) => {
        const a = document.createElement("a");
        a.href = p.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.className = "nook-link-card";
        a.dataset.delay = i;
        a.innerHTML = `
          <span class="nook-link-icon">${p.icon || "📖"}</span>
          <div>
            <div class="nook-link-name">${p.name}</div>
            <div class="nook-link-desc">${p.desc || "Read more of my writing here."}</div>
          </div>`;
        linksGrid.appendChild(a);
      });
      observeReveal(".nook-link-card");
    } else {
      linksGrid.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">Add your writing platform links via the admin panel.</p>';
    }
  }

  spawnNookLetters();

  if (snippets.length) bookLoadSnippet(0, "open");
}

function _buildShelves() {
  const unreadEl = document.getElementById("shelf-unread");
  const readEl   = document.getElementById("shelf-read");
  if (!unreadEl || !readEl) return;

  unreadEl.innerHTML = "";
  readEl.innerHTML   = "";

  if (!_nookSnippets.length) {
    unreadEl.innerHTML = '<p style="font-size:0.72rem;color:var(--muted);padding:0.5rem;">No snippets yet.</p>';
    return;
  }

  _nookSnippets.forEach((s, i) => {
    const isRead = _readSet.has(i);
    const isActive = i === _nookIdx;
    const item = document.createElement("div");
    item.className = "shelf-item" + (isActive ? " active" : "");
    item.innerHTML = `
      <div class="shelf-item-genre">${s.genre || "FICTION"}</div>
      <div class="shelf-item-title">${s.title}</div>
      <span class="shelf-item-badge ${isRead ? "badge-read" : "badge-unread"}">${isRead ? "read" : "unread"}</span>`;
    item.addEventListener("click", () => bookLoadSnippet(i));
    if (isRead) {
      readEl.appendChild(item);
    } else {
      unreadEl.appendChild(item);
    }
  });

  if (!readEl.children.length) {
    readEl.innerHTML = '<p style="font-size:0.7rem;color:var(--muted);padding:0.5rem;font-style:italic;">Nothing read yet…</p>';
  }
}

function bookLoadSnippet(idx, direction) {
  const prev = _nookIdx;
  _nookIdx = idx;
  _readSet.add(idx);

  const s = _nookSnippets[idx];
  if (!s) return;

  const rightPage = document.getElementById("book-page-right");
  const leftPage  = document.getElementById("book-page-left");

  const dir = direction || (idx > prev ? "next" : idx < prev ? "prev" : "open");

  function clearAnims(...els) {
    els.forEach(el => {
      if (!el) return;
      el.classList.remove(
        "rp-out-next","rp-in-next","rp-out-prev","rp-in-prev",
        "lp-out-prev","lp-in-prev","lp-react-next","rp-react-prev"
      );
      void el.offsetWidth; // force reflow
    });
  }

  if (dir === "open") {
    _fillBookPage(s, idx);
  } else if (dir === "next") {
    // Right page curls away (hinge = spine/left), left page subtly reacts
    clearAnims(rightPage, leftPage);
    rightPage.classList.add("rp-out-next");
    leftPage.classList.add("lp-react-next");
    setTimeout(() => {
      _fillBookPage(s, idx);
      clearAnims(rightPage, leftPage);
      rightPage.classList.add("rp-in-next");
      setTimeout(() => clearAnims(rightPage, leftPage), 440);
    }, 420);
  } else {
    // Left page curls away (hinge = spine/right), right page subtly reacts
    clearAnims(rightPage, leftPage);
    leftPage.classList.add("lp-out-prev");
    rightPage.classList.add("rp-react-prev");
    setTimeout(() => {
      _fillBookPage(s, idx);
      clearAnims(rightPage, leftPage);
      leftPage.classList.add("lp-in-prev");
      setTimeout(() => clearAnims(rightPage, leftPage), 440);
    }, 420);
  }

  _buildShelves();

  const prog = document.getElementById("book-progress");
  if (prog) prog.textContent = `${idx + 1} / ${_nookSnippets.length}`;

  const prevBtn = document.getElementById("book-prev");
  const nextBtn = document.getElementById("book-next");
  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.disabled = idx === _nookSnippets.length - 1;
}

function _fillBookPage(s, idx) {
  // Meta
  const genreEl = document.getElementById("book-genre");
  const yearEl  = document.getElementById("book-year");
  const titleEl = document.getElementById("book-story-title");
  const spineEl = document.getElementById("spine-title");
  if (genreEl) genreEl.textContent = s.genre || "FICTION";
  if (yearEl)  yearEl.textContent  = s.year  || "";
  if (titleEl) titleEl.textContent = s.title;
  if (spineEl) spineEl.textContent = s.title;

  // Page numbers
  const numL = document.getElementById("page-num-left");
  const numR = document.getElementById("page-num-right");
  if (numL) numL.textContent = `— ${idx * 2 + 1} —`;
  if (numR) numR.textContent = `— ${idx * 2 + 2} —`;

  // Split text into two halves
  const paras = (s.text || "").split(/\n\n+/).filter(Boolean);
  const half = Math.ceil(paras.length / 2);
  const leftParas  = paras.slice(0, half);
  const rightParas = paras.slice(half);

  const leftBody  = document.getElementById("book-body-left");
  const rightBody = document.getElementById("book-body-right");

  function fillBody(el, paragraphs) {
    if (!el) return;
    el.innerHTML = "";
    if (!paragraphs.length) { el.innerHTML = '<p style="color:#9b7a4a;font-style:italic;text-align:center;padding-top:2rem;">✦</p>'; return; }
    paragraphs.forEach((para) => {
      const p = document.createElement("p");
      p.textContent = para.trim();
      el.appendChild(p);
    });
    el.scrollTop = 0;
  }

  fillBody(leftBody, leftParas);
  fillBody(rightBody, rightParas);
}

function bookNav(dir) {
  const next = Math.max(0, Math.min(_nookSnippets.length - 1, _nookIdx + dir));
  if (next === _nookIdx) return;
  bookLoadSnippet(next, dir === 1 ? "next" : "prev");
}

// Legacy aliases (admin panel may call these)
function nookNav(dir) { bookNav(dir); }
function nookLoadSnippet(idx) { bookLoadSnippet(idx); }

function spawnNookLetters() {
  const bg = document.getElementById("nook-letters-bg");
  if (!bg) return;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/\\".split("");
  for (let i = 0; i < 35; i++) {
    const el = document.createElement("span");
    el.className = "nook-letter";
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.cssText = [
      `left:${Math.random()*100}%`,
      `bottom:${Math.random()*100}%`,
      `animation-duration:${10 + Math.random()*20}s`,
      `animation-delay:${Math.random()*15}s`,
      `font-size:${0.7 + Math.random()*1.5}rem`
    ].join(";");
    bg.appendChild(el);
  }
}

// Legacy CRT functions kept as stubs (no longer rendered but called safely)
function readerNav() {}
function toggleCRT() {}

// =============================================
//  ART GALLERY
// =============================================
function renderArtGallery(items, desc) {
  const descEl = document.getElementById('art-desc');
  if (descEl && desc) descEl.textContent = desc;

  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No art yet — upload pieces via the admin panel!</p>';
    return;
  }

  grid.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'gallery-item reveal';
    el.innerHTML = `
      ${item.image
        ? `<img src="${item.image}" alt="${item.title}" loading="lazy"/>`
        : `<div class="gallery-item-placeholder"><span>🎨</span><span>${item.title}</span></div>`}
      <div class="gallery-overlay">
        <div class="gallery-overlay-title">${item.title}</div>
        <div class="gallery-overlay-tag">${item.medium || 'DIGITAL ART'}</div>
      </div>`;
    if (item.image) {
      el.addEventListener('click', () => openLightbox(item.image, item.title));
    }
    grid.appendChild(el);
  });
  observeReveal('.gallery-item');
}

function openLightbox(src, title) {
  const lb = document.createElement('div');
  lb.className = 'gallery-lightbox';
  lb.innerHTML = `
    <button class="gallery-lightbox-close" onclick="this.parentElement.remove()">✕</button>
    <img src="${src}" alt="${title}"/>`;
  lb.addEventListener('click', e => { if (e.target === lb) lb.remove(); });
  document.body.appendChild(lb);
}
