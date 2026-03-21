// =============================================
//  EASTER.JS — Hidden mini game
//  Trigger: Konami Code (↑↑↓↓←→←→BA)
//  Or: click the hint text in hero
// =============================================

const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let konamiIndex = 0;

document.addEventListener("keydown", e => {
  if (e.key === KONAMI[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === KONAMI.length) {
      openEaster();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

// Also triggered by hint text
document.querySelector(".easter-hint")?.addEventListener("click", openEaster);

function openEaster() {
  document.getElementById("easterOverlay").style.display = "flex";
}
function closeEaster() {
  document.getElementById("easterOverlay").style.display = "none";
  cancelAnimationFrame(easterRAF);
  easterRunning = false;
}

// ---- Mini game ----
let easterRAF, easterRunning = false;
let player, stars_e, score, lives;

function startEasterGame() {
  const canvas = document.getElementById("easterCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  player = { x: W/2 - 20, y: H - 40, w: 40, h: 10, speed: 5, color: "#ff79c6" };
  stars_e = [];
  score = 0; lives = 3;
  easterRunning = true;

  const keys = {};
  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  // Touch controls
  let touchX = null;
  canvas.addEventListener("touchmove", e => {
    touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    e.preventDefault();
  }, { passive: false });

  let frame = 0;

  function loop() {
    if (!easterRunning) return;
    ctx.clearRect(0, 0, W, H);

    // BG
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, W, H);

    // Move player
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < W - player.w) player.x += player.speed;
    if (touchX !== null) player.x = Math.min(W - player.w, Math.max(0, touchX - player.w/2));

    // Spawn stars
    frame++;
    if (frame % 40 === 0) {
      stars_e.push({
        x: Math.random() * (W - 12), y: -12, r: 8,
        speed: 1.5 + score * 0.03,
        color: ["#ff79c6","#bd93f9","#8be9fd","#f1fa8c","#50fa7b"][Math.floor(Math.random()*5)]
      });
    }

    // Update & draw stars
    for (let i = stars_e.length - 1; i >= 0; i--) {
      const s = stars_e[i];
      s.y += s.speed;

      // Draw star shape
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      drawStar(ctx, s.x, s.y, 5, s.r, s.r/2);
      ctx.shadowBlur = 0;

      // Catch
      if (s.y + s.r > player.y && s.x > player.x - s.r && s.x < player.x + player.w + s.r) {
        stars_e.splice(i, 1);
        score++;
        document.getElementById("easterScore").textContent = `Score: ${score}`;
        continue;
      }
      // Missed
      if (s.y > H) {
        stars_e.splice(i, 1);
        lives--;
        if (lives <= 0) { gameOver(ctx, W, H); return; }
      }
    }

    // Draw player (little spaceship)
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w/2, player.y - 6);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "10px 'Press Start 2P'";
    ctx.fillText(`♥ ${lives}`, 8, 18);

    easterRAF = requestAnimationFrame(loop);
  }
  cancelAnimationFrame(easterRAF);
  loop();
}

function gameOver(ctx, W, H) {
  easterRunning = false;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ff79c6";
  ctx.font = "14px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", W/2, H/2 - 20);
  ctx.fillStyle = "#f1fa8c";
  ctx.font = "10px 'Press Start 2P'";
  ctx.fillText(`Score: ${score}`, W/2, H/2 + 10);
  ctx.fillText("Press START to retry", W/2, H/2 + 40);
  ctx.textAlign = "left";
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI/2) * 3, step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
}
