// =============================================
//  MAIN.JS — renders content from data.js
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  applyData();
  renderProjects();
  renderGames();
  renderVideos();
  animateStats();
  animateSkills();
  initStarfield();
  initCursorTrail();
  document.getElementById("year").textContent = new Date().getFullYear();
});

// ---- Apply text data ----
function applyData() {
  const D = PORTFOLIO_DATA;
  setText("about-bio", D.aboutBio);
  setText("about-body", D.aboutBody);
  setText("contact-text", D.contactText);

  // Links
  setHref("link-email",   D.links.email);
  setHref("link-twitter", D.links.twitter);
  setHref("link-itchio",  D.links.itchio);
  setHref("link-github",  D.links.github);
  setHref("link-linkedin",D.links.linkedin);

  // Stats
  const stats = document.querySelectorAll(".stat-num");
  const vals = [D.stats.gamesShipped, D.stats.yearsXP, D.stats.gameJamsWon];
  stats.forEach((el, i) => el.setAttribute("data-target", vals[i]));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.textContent = val;
}
function setHref(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.href = val;
}

// ---- Render Projects ----
function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
  grid.innerHTML = "";
  PORTFOLIO_DATA.projects.forEach(p => {
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
        <div class="card-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="card-actions">
          ${p.playUrl ? `<a href="${p.playUrl}" class="btn btn-primary btn-sm" target="_blank">▶ Play</a>` : ""}
          ${p.videoUrl ? `<button class="btn btn-ghost btn-sm" onclick="openVideo('${p.videoUrl}', '${p.title}')">🎬 Watch</button>` : ""}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ---- Render Web Games ----
function renderGames() {
  const grid = document.getElementById("games-grid");
  if (!grid) return;
  grid.innerHTML = "";
  PORTFOLIO_DATA.webGames.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-thumb">
        ${g.image ? `<img src="${g.image}" alt="${g.title}"/>` : `<div class="game-thumb-placeholder"><span>▶</span></div>`}
      </div>
      <div class="game-info">
        <h3>${g.title}</h3>
        <p>${g.description}</p>
        <button class="btn btn-primary btn-sm" onclick="embedGame('${g.embedUrl}', '${g.title}')">Play Now ▶</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ---- Embed game inline ----
function embedGame(url, title) {
  const area = document.getElementById("game-embed-area");
  const frame = document.getElementById("game-frame");
  const label = document.getElementById("embed-title");
  frame.src = url;
  label.textContent = title;
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
}
function closeEmbed() {
  const area = document.getElementById("game-embed-area");
  document.getElementById("game-frame").src = "";
  area.style.display = "none";
}

// ---- Render Videos ----
function renderVideos() {
  const grid = document.getElementById("video-grid");
  if (!grid) return;
  grid.innerHTML = "";
  PORTFOLIO_DATA.videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "video-card";
    if (v.type === "local") {
      el.innerHTML = `
        <h3 class="video-title">${v.title}</h3>
        <video controls src="${v.src}" poster="${v.thumb}"></video>
      `;
    } else {
      el.innerHTML = `
        <h3 class="video-title">${v.title}</h3>
        <div class="iframe-wrap">
          <iframe src="${v.src}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
        </div>
      `;
    }
    grid.appendChild(el);
  });
}

// ---- Animate stats on scroll ----
function animateStats() {
  const nums = document.querySelectorAll(".stat-num");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute("data-target"));
        let count = 0;
        const step = Math.ceil(target / 30);
        const interval = setInterval(() => {
          count += step;
          if (count >= target) { count = target; clearInterval(interval); }
          el.textContent = count;
        }, 40);
        observer.unobserve(el);
      }
    });
  });
  nums.forEach(n => observer.observe(n));
}

// ---- Animate skill bars on scroll ----
function animateSkills() {
  const fills = document.querySelectorAll(".skill-fill");
  // Also render skills from data
  const list = document.querySelector(".skills-list");
  if (list) {
    list.innerHTML = "";
    PORTFOLIO_DATA.skills.forEach(s => {
      const row = document.createElement("div");
      row.className = "skill-row";
      row.innerHTML = `
        <span>${s.name}</span>
        <div class="skill-bar"><div class="skill-fill" data-width="${s.level}"></div></div>
      `;
      list.appendChild(row);
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        fill.style.width = fill.getAttribute("data-width") + "%";
        observer.unobserve(fill);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(".skill-fill").forEach(f => observer.observe(f));
}

// ---- Starfield canvas ----
function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, stars = [];
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    stars = Array.from({length:120}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.8+0.3,
      speed: Math.random()*0.4+0.1,
      alpha: Math.random()
    }));
  }
  resize();
  window.addEventListener("resize", resize);
  function draw() {
    ctx.clearRect(0,0,W,H);
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) { s.y = 0; s.x = Math.random()*W; }
      s.alpha += (Math.random()-0.5)*0.04;
      s.alpha = Math.max(0.1, Math.min(1, s.alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,220,255,${s.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ---- Cursor trail ----
function initCursorTrail() {
  const trail = [];
  document.addEventListener("mousemove", e => {
    const dot = document.createElement("div");
    dot.className = "trail-dot";
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
    document.body.appendChild(dot);
    trail.push(dot);
    setTimeout(() => { dot.remove(); trail.shift(); }, 500);
  });
}

// ---- Mobile nav ----
function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("open");
}

// ---- Open video modal (for project cards) ----
function openVideo(src, title) {
  // scroll to showreel and open
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `<div style="position:relative;width:90%;max-width:800px;">
    <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:-40px;right:0;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;">✕ Close</button>
    <div class="iframe-wrap"><iframe src="${src}" frameborder="0" allowfullscreen style="width:100%;height:450px;"></iframe></div>
  </div>`;
  document.body.appendChild(el);
}

// ---- Scroll-based reveal ----
const revealEls = document.querySelectorAll(".project-card, .game-card, .video-card, .about-grid, .contact-grid");
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("revealed"); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObs.observe(el));
