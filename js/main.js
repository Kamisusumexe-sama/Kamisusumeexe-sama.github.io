// =============================================
//  MAIN.JS — loads from Netlify API first
//  falls back to static _data files
// =============================================

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchJSONFolder(folderPath) {
  try {
    const manifest = await fetchJSON(folderPath + "manifest.json");
    if (!manifest) return [];
    const items = await Promise.all(manifest.map(f => fetchJSON(folderPath + f)));
    return items.filter(Boolean).sort((a,b) => (a.order||99) - (b.order||99));
  } catch { return []; }
}

document.addEventListener("DOMContentLoaded", async () => {
  const apiData = await fetchJSON("/.netlify/functions/portfolio-data");
  let profile = null;
  let links = null;
  let projects = [];
  let games = [];
  let videos = [];

  if (apiData) {
    profile = apiData;
    links = apiData.links || null;
    projects = apiData.projects || [];
    games = apiData.webGames || [];
    videos = apiData.videos || [];
  } else {
    [profile, links, projects, games, videos] = await Promise.all([
      fetchJSON("/_data/profile.json"),
      fetchJSON("/_data/links.json"),
      fetchJSONFolder("/_data/projects/"),
      fetchJSONFolder("/_data/games/"),
      fetchJSONFolder("/_data/videos/"),
    ]);
  }

  if (!profile) {
    console.warn("Could not load portfolio data.");
    return;
  }

  applyProfile(profile, links);
  renderProjects(projects);
  renderGames(games);
  renderVideos(videos);
  animateStats(profile.stats || {});
  animateSkills(profile.skills || []);
  initStarfield();
  initCursorTrail();
  document.getElementById("year").textContent = new Date().getFullYear();
});

function applyProfile(profile, links) {
  setText("about-bio", profile.aboutBio);
  setText("about-body", profile.aboutBody);
  setText("contact-text", profile.contactText);
  if (links) {
    setHref("link-email",    links.email);
    setHref("link-twitter",  links.twitter);
    setHref("link-itchio",   links.itchio);
    setHref("link-github",   links.github);
    setHref("link-linkedin", links.linkedin);
  }
}

function setText(id, val) { const el = document.getElementById(id); if (el && val) el.textContent = val; }
function setHref(id, val) { const el = document.getElementById(id); if (el && val) el.href = val; }

function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
  grid.innerHTML = !projects.length ? '<p style="color:var(--muted)">No projects yet!</p>' : "";
  projects.forEach(p => {
    const tags = typeof p.tags === "string" ? p.tags.split(",").map(t=>t.trim()) : (p.tags||[]);
    const card = document.createElement("div");
    card.className = "project-card" + (p.featured ? " featured" : "");
    card.innerHTML = `
      <div class="card-img">
        ${p.image ? `<img src="${p.image}" alt="${p.title}"/>` : `<div class="card-img-placeholder"><span>${p.title}</span></div>`}
        ${p.featured ? '<span class="featured-badge">★ Featured</span>' : ""}
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="card-tags">${tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        <div class="card-actions">
          ${p.playUrl ? `<a href="${p.playUrl}" class="btn btn-primary btn-sm" target="_blank">▶ Play</a>` : ""}
          ${p.videoUrl ? `<button class="btn btn-ghost btn-sm" onclick="openVideo('${p.videoUrl}','${p.title}')">🎬 Watch</button>` : ""}
        </div>
      </div>`;
    grid.appendChild(card);
  });
  observeReveal(".project-card");
}

function renderGames(games) {
  const grid = document.getElementById("games-grid");
  if (!grid) return;
  grid.innerHTML = !games.length ? '<p style="color:var(--muted)">No games yet!</p>' : "";
  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-thumb">
        ${g.image ? `<img src="${g.image}" alt="${g.title}"/>` : `<div class="game-thumb-placeholder"><span>▶</span></div>`}
      </div>
      <div class="game-info">
        <h3>${g.title}</h3><p>${g.description}</p>
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

function renderVideos(videos) {
  const grid = document.getElementById("video-grid");
  if (!grid) return;
  grid.innerHTML = !videos.length ? '<p style="color:var(--muted)">No videos yet!</p>' : "";
  videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "video-card";
    el.innerHTML = v.type === "local"
      ? `<h3 class="video-title">${v.title}</h3><video controls src="${v.src}"></video>`
      : `<h3 class="video-title">${v.title}</h3><div class="iframe-wrap"><iframe src="${v.src}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    grid.appendChild(el);
  });
  observeReveal(".video-card");
}

function animateStats(stats) {
  if (!stats) return;
  const nums = document.querySelectorAll(".stat-num");
  const vals = [stats.gamesShipped, stats.yearsXP, stats.gameJamsWon];
  nums.forEach((el, i) => el.setAttribute("data-target", vals[i]||0));
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseInt(el.getAttribute("data-target"));
      let count = 0; const step = Math.ceil(target/30);
      const iv = setInterval(() => { count+=step; if(count>=target){count=target;clearInterval(iv);} el.textContent=count; }, 40);
      obs.unobserve(el);
    });
  });
  nums.forEach(n => obs.observe(n));
}

function animateSkills(skills) {
  const list = document.querySelector(".skills-list");
  if (!list || !skills) return;
  list.innerHTML = "";
  skills.forEach(s => {
    const row = document.createElement("div");
    row.className = "skill-row";
    row.innerHTML = `<span>${s.name}</span><div class="skill-bar"><div class="skill-fill" data-width="${s.level}"></div></div>`;
    list.appendChild(row);
  });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.style.width=e.target.getAttribute("data-width")+"%"; obs.unobserve(e.target); } });
  }, { threshold: 0.2 });
  document.querySelectorAll(".skill-fill").forEach(f => obs.observe(f));
}

function observeReveal(selector) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){e.target.classList.add("revealed");obs.unobserve(e.target);} });
  }, { threshold: 0.1 });
  document.querySelectorAll(selector).forEach(el => obs.observe(el));
}

function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, stars=[];
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    stars = Array.from({length:120}, ()=>({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.8+0.3, speed:Math.random()*0.4+0.1, alpha:Math.random() }));
  }
  resize(); window.addEventListener("resize", resize);
  (function draw() {
    ctx.clearRect(0,0,W,H);
    stars.forEach(s => {
      s.y+=s.speed; if(s.y>H){s.y=0;s.x=Math.random()*W;}
      s.alpha+=(Math.random()-0.5)*0.04; s.alpha=Math.max(0.1,Math.min(1,s.alpha));
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,220,255,${s.alpha})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
}

function initCursorTrail() {
  document.addEventListener("mousemove", e => {
    const dot = document.createElement("div");
    dot.className = "trail-dot";
    dot.style.left = e.clientX+"px"; dot.style.top = e.clientY+"px";
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 500);
  });
}

function toggleMenu() { document.querySelector(".nav-links").classList.toggle("open"); }

function openVideo(src, title) {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `<div style="position:relative;width:90%;max-width:800px;">
    <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:-40px;right:0;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;">✕ Close</button>
    <div class="iframe-wrap"><iframe src="${src}" frameborder="0" allowfullscreen style="width:100%;height:450px;"></iframe></div>
  </div>`;
  document.body.appendChild(el);
}
