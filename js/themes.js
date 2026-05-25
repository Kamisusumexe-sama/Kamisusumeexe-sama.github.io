// =============================================
//  THEMES.JS
//  Section-aware theme switcher.
//  Gallery  → sunny pixel-art daytime sky
//  BookNook → warm candlelit amber evening
//  Default  → deep space night
//
//  Also injects themed critters per section
//  and draws pixel clouds in the gallery sky.
// =============================================
(function () {
  'use strict';

  // ── Pixel-art cloud generator ────────────────
  // Draws tiny 8-bit clouds on a canvas, positions them
  // absolutely in the gallery sky layer.

  const CLOUD_SHAPES = [
    // [row, colStart, colEnd] — 5 px per block
    // classic 3-bump cumulus
    [[2,3,7],[1,1,9],[0,0,11],[0,0,12],[1,1,10],[2,3,8]],
    // wide flat stratus
    [[1,4,12],[0,2,15],[0,1,16],[0,0,17],[1,3,14],[2,5,12]],
    // tall fluffy
    [[3,4,8],[2,2,10],[1,0,12],[0,0,13],[0,1,12],[1,2,10],[2,4,8]],
    // compact puff
    [[1,2,5],[0,1,6],[0,0,7],[0,1,6],[1,2,5]],
    // big anvil
    [[3,5,13],[2,3,16],[1,1,18],[0,0,19],[0,0,18],[1,2,16],[2,4,14],[3,6,12]],
  ];

  const CLOUD_PAL = [
    'rgba(255,255,255,0.92)',    // bright white
    'rgba(220,238,255,0.76)',    // cool blue-white edge
    'rgba(255,255,255,0.88)',    // top highlight
  ];

  function drawPixelCloud(canvas, shapeIdx) {
    const shape = CLOUD_SHAPES[shapeIdx % CLOUD_SHAPES.length];
    const PX = 5; // bigger blocks for a chunkier pixel-art feel
    const W = (Math.max(...shape.map(r => r[2])) + 1) * PX;
    const H = shape.length * PX;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    shape.forEach((row, ri) => {
      const [, c0, c1] = row;
      for (let c = c0; c < c1; c++) {
        // Top rows brightest white, middle solid, bottom has blue-shadow tint
        const pct = ri / (shape.length - 1);
        ctx.fillStyle = pct < 0.25
          ? CLOUD_PAL[2]   // bright highlight
          : pct > 0.72
            ? CLOUD_PAL[1] // cool blue-white underside
            : CLOUD_PAL[0];// solid white body
        ctx.fillRect(c * PX, ri * PX, PX, PX);
      }
      // Single-pixel blue-shadow strip on the bottom row
      if (ri === shape.length - 1) {
        for (let c = row[1]; c < row[2]; c++) {
          ctx.fillStyle = 'rgba(120,170,230,0.45)';
          ctx.fillRect(c * PX, ri * PX + PX - 1, PX, 1);
        }
      }
    });
  }

  function spawnClouds() {
    const gallery = document.getElementById('art-gallery');
    if (!gallery) return;
    // Remove old clouds
    gallery.querySelectorAll('.theme-cloud').forEach(c => c.remove());

    const W = window.innerWidth;
    // 9–14 clouds layered across the sky, with depth variation
    const count = 9 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const cv = document.createElement('canvas');
      cv.className = 'theme-cloud';
      drawPixelCloud(cv, i % CLOUD_SHAPES.length);

      // Bigger, more varied scales — larger clouds feel more real
      const scale = 2 + Math.random() * 4;
      const x = Math.random() * (W - 100) - 80;  // allow slight offscreen
      // Spread across a taller sky band for depth layering
      const y = 48 + Math.random() * 180;

      // Store base scale + per-cloud parallax speed/direction for scroll driver
      cv.dataset.scale  = scale.toFixed(2);
      cv.dataset.speed  = (0.4 + (i % 4) * 0.22).toFixed(3);
      cv.dataset.dir    = i % 2 === 0 ? '1' : '-1';
      cv.dataset.tx     = '0';

      cv.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        transform: scale(${scale.toFixed(2)}) translateX(0px);
        transform-origin: top left;
        opacity: ${0.55 + Math.random() * 0.38};
        filter: drop-shadow(0 4px 8px rgba(100,160,230,0.3));
        will-change: transform;
      `;
      gallery.appendChild(cv);
    }
  }

  // Cloud drift keyframes
  const cloudCSS = document.createElement('style');
  cloudCSS.textContent = `
    @keyframes cloudDrift {
      0%   { transform: scale(var(--cs, 1)) translateX(0); }
      50%  { transform: scale(var(--cs, 1)) translateX(28px); }
      100% { transform: scale(var(--cs, 1)) translateX(0); }
    }
    /* Pixel sun — upper-right of gallery sky */
    .theme-sun {
      position: absolute;
      pointer-events: none;
      z-index: 1;
      image-rendering: pixelated;
      top: 55px;
      right: 8%;
      left: auto;
      transform: scale(1.5);
      transform-origin: top right;
      animation: sunPulse 3s ease-in-out infinite;
    }
    @keyframes sunPulse {
      0%,100% { filter: drop-shadow(0 0 22px rgba(255,235,80,0.75)); }
      50%      { filter: drop-shadow(0 0 44px rgba(255,220,50,0.95)); }
    }
    /* Bird sprites — dark navy, visible on blue sky */
    .theme-bird {
      position: absolute;
      pointer-events: none;
      z-index: 1;
      font-family: monospace;
      font-size: 10px;
      white-space: pre;
      color: rgba(20,40,90,0.55);
      animation: birdFly linear infinite;
      image-rendering: pixelated;
    }
    @keyframes birdFly {
      from { transform: translateX(-80px); }
      to   { transform: translateX(calc(100vw + 80px)); }
    }
  `;
  document.head.appendChild(cloudCSS);

  // ── Pixel sun (8×8 blocks) ───────────────────
  function spawnSun() {
    const gallery = document.getElementById('art-gallery');
    if (!gallery) return;
    gallery.querySelectorAll('.theme-sun').forEach(s => s.remove());

    const cv = document.createElement('canvas');
    cv.className = 'theme-sun';
    const PX = 6;
    const grid = [
      [0,0,0,1,1,0,0,0],
      [0,1,1,1,1,1,1,0],
      [0,1,2,2,2,2,1,0],
      [1,1,2,2,2,2,1,1],
      [1,1,2,2,2,2,1,1],
      [0,1,2,2,2,2,1,0],
      [0,1,1,1,1,1,1,0],
      [0,0,0,1,1,0,0,0],
    ];
    const pal = ['transparent','#ffd700','#fff7a0'];
    cv.width = 8 * PX; cv.height = 8 * PX;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    grid.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return;
      ctx.fillStyle = pal[v];
      ctx.fillRect(c * PX, r * PX, PX, PX);
    }));
    gallery.appendChild(cv);
  }

  // ── Pixel birds ──────────────────────────────
  const BIRD_FRAMES = [' ^ ^ ', '\\^_^/'];
  function spawnBirds() {
    const gallery = document.getElementById('art-gallery');
    if (!gallery) return;
    gallery.querySelectorAll('.theme-bird').forEach(b => b.remove());
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const bird = document.createElement('div');
      bird.className = 'theme-bird';
      bird.textContent = BIRD_FRAMES[i % 2];
      bird.style.top    = (62 + Math.random() * 120) + 'px';
      bird.style.left   = '-80px';
      bird.style.animationDuration  = (12 + Math.random() * 16) + 's';
      bird.style.animationDelay     = (-Math.random() * 18) + 's';
      bird.style.opacity = 0.35 + Math.random() * 0.3;
      bird.style.fontSize = (8 + Math.random() * 4) + 'px';
      gallery.appendChild(bird);
    }
  }

  // ── Gallery critters (warm daytime sprites) ──
  // When entering gallery, replace roaming critters with
  // sunny-palette ones: bee, butterfly, bunny, frog, bird.
  // We store spawned critters so we can remove them on exit.

  const GALLERY_CRITTER_LINES = [
    'so pretty!', 'ooh shiny', 'pixel vibes', 'art go brrr',
    '☀ sunny!', 'love this', 'wow 🌸', 'colours!',
    'frame it!', 'chef kiss', '★ fave ★', 'masterpiece',
  ];

  // Canvas pixel sprites for gallery critters
  // Using same palette system as critters.js
  const GC_PAL = [
    'transparent',     // 0
    '#2d1a00',         // 1 K  outline dark brown
    '#ffdd44',         // 2 Y  yellow
    '#ffaa00',         // 3 O  orange
    '#ff6688',         // 4 P  pink
    '#88ddff',         // 5 B  sky blue
    '#44cc66',         // 6 G  green
    '#ffffff',         // 7 W  white
    '#ff4455',         // 8 R  red
    '#c8a060',         // 9 T  tan/fur
    '#ff88cc',         // 10 K2 light pink
    '#6644aa',         // 11 PU purple
    '#ffcc88',         // 12 SK skin
    '#333333',         // 13 DK dark grey
  ];
  const Y=2,O=3,P=4,B=5,G=6,W=7,R=8,T=9,K2=10,PU=11,SK=12,DK=13,_=0,K=1;

  const GC_SPRITES = {
    bee: {
      frames: [
        [
          [_,_,_,_,W,W,W,W,W,_,_,_,_,_,_,_],
          [_,_,_,W,W,W,W,W,W,W,_,_,_,_,_,_],
          [_,_,W,B,B,W,W,W,W,B,B,W,_,_,_,_],
          [_,W,B,B,W,W,W,W,W,W,B,B,W,_,_,_],
          [_,W,W,W,Y,Y,Y,Y,Y,Y,W,W,W,_,_,_],
          [_,_,_,K,Y,K,K,K,K,K,Y,K,_,_,_,_],
          [_,_,_,K,Y,Y,Y,Y,Y,Y,Y,K,_,_,_,_],
          [_,_,_,K,Y,K,K,K,K,K,Y,K,_,_,_,_],
          [_,_,_,K,Y,Y,Y,Y,Y,Y,Y,K,_,_,_,_],
          [_,_,_,_,K,Y,Y,Y,Y,Y,K,_,_,_,_,_],
          [_,_,_,_,_,K,Y,Y,Y,K,_,_,_,_,_,_],
          [_,_,_,_,_,_,K,K,K,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
        [
          [_,_,W,W,_,_,_,_,_,W,W,_,_,_,_,_],
          [_,W,B,B,W,_,_,_,W,B,B,W,_,_,_,_],
          [W,B,B,W,W,W,W,W,W,W,B,B,W,_,_,_],
          [W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_],
          [_,_,_,K,Y,Y,Y,Y,Y,Y,K,_,_,_,_,_],
          [_,_,_,K,Y,K,K,K,K,K,Y,K,_,_,_,_],
          [_,_,_,K,Y,Y,Y,Y,Y,Y,Y,K,_,_,_,_],
          [_,_,_,K,Y,K,K,K,K,K,Y,K,_,_,_,_],
          [_,_,_,K,Y,Y,Y,Y,Y,Y,Y,K,_,_,_,_],
          [_,_,_,_,K,Y,Y,Y,Y,Y,K,_,_,_,_,_],
          [_,_,_,_,_,K,Y,Y,Y,K,_,_,_,_,_,_],
          [_,_,_,_,_,_,K,K,K,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
      ],
      color: '#ffdd44',
    },
    bunny: {
      frames: [
        [
          [_,_,K,_,_,_,_,_,K,_,_,_,_,_,_,_],
          [_,K,W,K,_,_,_,K,W,K,_,_,_,_,_,_],
          [_,K,W,P,K,_,K,P,W,K,_,_,_,_,_,_],
          [_,K,W,W,W,K,W,W,W,K,_,_,_,_,_,_],
          [K,W,W,W,W,W,W,W,W,W,K,_,_,_,_,_],
          [K,W,K,W,W,W,W,W,K,W,K,_,_,_,_,_],
          [K,W,W,W,W,W,W,W,W,W,K,_,_,_,_,_],
          [_,K,W,W,P,W,W,P,W,K,_,_,_,_,_,_],
          [_,K,W,W,W,W,W,W,W,K,_,_,_,_,_,_],
          [_,_,K,W,W,W,W,W,K,_,_,_,_,_,_,_],
          [_,_,K,W,K,_,_,K,W,K,_,_,_,_,_,_],
          [_,_,K,K,_,_,_,_,K,K,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
        [
          [_,_,K,_,_,_,_,_,K,_,_,_,_,_,_,_],
          [_,K,W,K,_,_,_,K,W,K,_,_,_,_,_,_],
          [_,K,W,P,K,_,K,P,W,K,_,_,_,_,_,_],
          [_,K,W,W,W,K,W,W,W,K,_,_,_,_,_,_],
          [K,W,W,W,W,W,W,W,W,W,K,_,_,_,_,_],
          [K,W,K,W,W,W,W,W,K,W,K,_,_,_,_,_],
          [K,W,W,W,W,W,W,W,W,W,K,_,_,_,_,_],
          [_,K,W,W,P,W,W,P,W,K,_,_,_,_,_,_],
          [_,K,W,W,W,W,W,W,W,K,_,_,_,_,_,_],
          [_,_,K,W,W,W,W,W,K,_,_,_,_,_,_,_],
          [_,K,W,K,_,_,_,K,W,K,_,_,_,_,_,_],
          [K,W,W,K,_,_,_,_,K,W,K,_,_,_,_,_],
          [K,K,_,_,_,_,_,_,_,K,K,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
      ],
      color: '#f8f8f2',
    },
    frog: {
      frames: [
        [
          [_,_,_,G,G,_,_,G,G,_,_,_,_,_,_,_],
          [_,_,G,W,W,G,G,W,W,G,_,_,_,_,_,_],
          [_,G,W,K,W,G,G,W,K,W,G,_,_,_,_,_],
          [_,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_],
          [_,_,G,G,G,G,G,G,G,G,_,_,_,_,_,_],
          [_,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_],
          [_,G,G,Y,Y,G,G,G,Y,Y,G,_,_,_,_,_],
          [_,G,G,Y,Y,G,G,G,Y,Y,G,_,_,_,_,_],
          [_,_,G,G,G,G,G,G,G,G,_,_,_,_,_,_],
          [_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,_],
          [_,_,_,_,G,G,G,G,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
        [
          [_,_,_,G,G,_,_,G,G,_,_,_,_,_,_,_],
          [_,_,G,W,W,G,G,W,W,G,_,_,_,_,_,_],
          [_,G,W,K,W,G,G,W,K,W,G,_,_,_,_,_],
          [_,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_],
          [_,_,G,G,G,G,G,G,G,G,_,_,_,_,_,_],
          [_,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_],
          [G,G,G,Y,Y,G,G,G,Y,Y,G,G,_,_,_,_],
          [G,G,G,Y,Y,G,G,G,Y,Y,G,G,_,_,_,_],
          [G,G,G,G,G,G,G,G,G,G,G,G,_,_,_,_],
          [_,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_],
          [_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
      ],
      color: '#44cc66',
    },
    ladybug: {
      frames: [
        [
          [_,_,_,_,_,K,K,K,K,K,_,_,_,_,_,_],
          [_,_,_,_,K,R,R,R,R,R,K,_,_,_,_,_],
          [_,_,_,K,R,R,K,R,K,R,R,K,_,_,_,_],
          [_,_,K,R,R,R,R,K,R,R,R,R,K,_,_,_],
          [_,_,K,R,K,R,R,K,R,R,K,R,K,_,_,_],
          [_,K,R,R,R,R,R,K,R,R,R,R,R,K,_,_],
          [_,K,R,R,K,R,R,K,R,R,K,R,R,K,_,_],
          [_,K,R,R,R,R,R,K,R,R,R,R,R,K,_,_],
          [_,K,R,K,R,R,R,K,R,R,R,K,R,K,_,_],
          [_,_,K,R,R,R,R,K,R,R,R,R,K,_,_,_],
          [_,_,_,K,R,K,R,K,R,K,R,K,_,_,_,_],
          [_,_,_,_,K,R,R,R,R,R,K,_,_,_,_,_],
          [_,_,_,_,_,K,K,K,K,K,_,_,_,_,_,_],
          [_,_,_,K,_,_,_,_,_,_,_,K,_,_,_,_],
          [_,_,K,_,_,_,_,_,_,_,_,_,K,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
        [
          [_,_,_,_,_,K,K,K,K,K,_,_,_,_,_,_],
          [_,_,_,_,K,R,R,R,R,R,K,_,_,_,_,_],
          [_,_,_,K,R,R,K,R,K,R,R,K,_,_,_,_],
          [_,_,K,R,K,R,R,K,R,R,K,R,K,_,_,_],
          [_,_,K,R,R,R,R,K,R,R,R,R,K,_,_,_],
          [_,K,R,R,R,K,R,K,R,K,R,R,R,K,_,_],
          [_,K,R,K,R,R,R,K,R,R,R,K,R,K,_,_],
          [_,K,R,R,R,R,R,K,R,R,R,R,R,K,_,_],
          [_,K,R,R,K,R,R,K,R,R,K,R,R,K,_,_],
          [_,_,K,R,R,R,R,K,R,R,R,R,K,_,_,_],
          [_,_,_,K,R,K,R,K,R,K,R,K,_,_,_,_],
          [_,_,_,_,K,R,R,R,R,R,K,_,_,_,_,_],
          [_,_,K,_,_,K,K,K,K,_,_,K,_,_,_,_],
          [_,K,_,_,_,_,_,_,_,_,_,_,K,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
      ],
      color: '#ff4455',
    },
    butterfly: {
      frames: [
        [
          [_,_,P,P,P,_,_,K,K,_,_,B,B,B,_,_],
          [_,P,K,P,P,P,_,K,K,_,B,B,B,K,B,_],
          [P,P,P,P,P,P,K,Y,Y,K,B,B,B,B,B,B],
          [P,P,P,P,P,K,_,K,K,_,K,B,B,B,B,B],
          [_,P,P,P,K,_,_,K,K,_,_,K,B,B,B,_],
          [_,_,P,K,_,_,_,K,K,_,_,_,K,B,_,_],
          [_,_,_,_,_,_,_,K,K,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,K,K,_,_,_,_,_,_,_],
          [_,_,P,K,_,_,_,K,K,_,_,_,K,B,_,_],
          [_,P,P,P,K,_,_,K,K,_,_,K,B,B,B,_],
          [P,P,P,P,P,K,_,K,K,_,K,B,B,B,B,B],
          [P,P,P,P,P,P,K,Y,Y,K,B,B,B,B,B,B],
          [_,P,K,P,P,P,_,K,K,_,B,B,B,K,B,_],
          [_,_,P,P,P,_,_,K,K,_,_,B,B,B,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
        [
          [_,_,_,P,P,_,_,K,K,_,_,B,B,_,_,_],
          [_,_,P,P,P,P,_,K,K,_,B,B,B,B,_,_],
          [_,P,P,P,P,P,K,Y,Y,K,B,B,B,B,B,_],
          [P,P,P,P,P,K,_,K,K,_,K,B,B,B,B,B],
          [_,P,P,P,K,_,_,K,K,_,_,K,B,B,B,_],
          [_,_,P,K,_,_,_,K,K,_,_,_,K,B,_,_],
          [_,_,_,_,_,_,_,K,K,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,K,K,_,_,_,_,_,_,_],
          [_,_,P,K,_,_,_,K,K,_,_,_,K,B,_,_],
          [_,P,P,P,K,_,_,K,K,_,_,K,B,B,B,_],
          [P,P,P,P,P,K,_,K,K,_,K,B,B,B,B,B],
          [_,P,P,P,P,P,K,Y,Y,K,B,B,B,B,B,_],
          [_,_,P,P,P,P,_,K,K,_,B,B,B,B,_,_],
          [_,_,_,P,P,_,_,K,K,_,_,B,B,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
          [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ],
      ],
      color: '#ff88cc',
    },
  };

  const GC_SCALE = 3;
  const GC_SIZE  = 16 * GC_SCALE;

  function drawGCSprite(ctx, grid, pal) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const v = grid[r][c];
        if (!v) continue;
        ctx.fillStyle = pal[v];
        ctx.fillRect(c * GC_SCALE, r * GC_SCALE, GC_SCALE, GC_SCALE);
      }
    }
  }

  const galleryCritters = [];
  let sunnyCritterTimer = null;
  let sunnyFirstTimer   = null;

  function spawnGalleryCritter(name) {
    const def = GC_SPRITES[name];
    if (!def) return;

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: fixed; z-index: 9001; pointer-events: none;
      user-select: none; image-rendering: pixelated;
    `;

    const cv = document.createElement('canvas');
    cv.width = GC_SIZE; cv.height = GC_SIZE;
    cv.style.imageRendering = 'pixelated';

    const bubble = document.createElement('div');
    bubble.style.cssText = `
      position: absolute; bottom: calc(100% + 4px); left: 50%;
      transform: translateX(-50%);
      background: rgba(255,240,180,0.95); border: 1px solid ${def.color};
      border-radius: 6px; padding: 3px 7px;
      font-family: 'Press Start 2P', monospace; font-size: 5px;
      color: #3a2000; white-space: nowrap; pointer-events: none;
      opacity: 0; transition: opacity 0.25s;
      box-shadow: 0 0 8px rgba(255,200,60,0.4);
    `;
    bubble.innerHTML = `<span></span><div style="position:absolute;top:100%;left:50%;transform:translateX(-50%);border:4px solid transparent;border-top-color:${def.color};"></div>`;

    wrap.appendChild(cv);
    wrap.appendChild(bubble);
    document.body.appendChild(wrap);

    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let x = Math.random() * (window.innerWidth - GC_SIZE);
    let y = window.innerHeight * 0.5 + Math.random() * 280;
    let dx = (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.8);
    let frame = 0, ftick = 0, flip = false;

    function render() { drawGCSprite(ctx, def.frames[frame], GC_PAL); }
    render();

    const ticker = setInterval(() => {
      if (!document.body.contains(wrap)) { clearInterval(ticker); return; }
      x += dx;
      ftick++;
      if (ftick % 16 === 0) { frame = (frame + 1) % def.frames.length; render(); }
      if (x < 0 || x > window.innerWidth - GC_SIZE) {
        dx *= -1; flip = dx < 0;
      }
      wrap.style.left      = Math.round(x) + 'px';
      wrap.style.top       = Math.round(y) + 'px';
      wrap.style.transform = `scaleX(${flip ? -1 : 1})`;
    }, 30);

    const LINES = GALLERY_CRITTER_LINES;
    const bub = bubble.querySelector('span');
    function showBubble() {
      bub.textContent = LINES[Math.floor(Math.random() * LINES.length)];
      bubble.style.opacity = '1';
      setTimeout(() => { bubble.style.opacity = '0'; }, 2600);
    }
    setTimeout(showBubble, 1000 + Math.random() * 2000);
    const bubTimer = setInterval(showBubble, 5000 + Math.random() * 7000);

    const life = 16000 + Math.random() * 12000;
    const entry = { wrap, ticker, bubTimer };
    galleryCritters.push(entry);

    setTimeout(() => {
      clearInterval(ticker); clearInterval(bubTimer);
      wrap.style.transition = 'opacity 0.6s';
      wrap.style.opacity = '0';
      setTimeout(() => wrap.remove(), 700);
      // self-remove so the live-count stays accurate for the spawn guard
      const idx = galleryCritters.indexOf(entry);
      if (idx !== -1) galleryCritters.splice(idx, 1);
    }, life);
  }

  function spawnSunnySideCritters() {
    if (sunnyCritterTimer) return;
    const names = ['ladybug', 'butterfly', 'bee', 'bunny', 'frog'];
    const pick  = () => names[Math.floor(Math.random() * names.length)];

    // One surprise guest after a short delay — feels like they wandered in
    sunnyFirstTimer = setTimeout(() => {
      if (currentTheme === 'gallery' || currentTheme === 'booknook') spawnGalleryCritter(pick());
    }, 3000 + Math.random() * 3000);

    // Rare follow-ups — max 2 on screen, long quiet gaps so each appearance is funny
    sunnyCritterTimer = setInterval(() => {
      if (currentTheme !== 'gallery' && currentTheme !== 'booknook') return;
      if (galleryCritters.length < 2) spawnGalleryCritter(pick());
    }, 18000);
  }

  function clearGalleryCritters() {
    if (sunnyFirstTimer)   { clearTimeout(sunnyFirstTimer);   sunnyFirstTimer   = null; }
    if (sunnyCritterTimer) { clearInterval(sunnyCritterTimer); sunnyCritterTimer = null; }
    galleryCritters.forEach(({ wrap, ticker, bubTimer }) => {
      clearInterval(ticker); clearInterval(bubTimer);
      wrap.style.transition = 'opacity 0.4s';
      wrap.style.opacity = '0';
      setTimeout(() => wrap.remove(), 500);
    });
    galleryCritters.length = 0;
  }

  // ── Theme state machine ──────────────────────
  let currentTheme = 'default';

  function triggerSunrise() {
    const layer = document.getElementById('sunrise-transition');
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Clear any leftover cloud elements from a previous trigger
    layer.querySelectorAll('.sr-cloud').forEach(c => c.remove());

    // Inject three clouds drifting in from alternating sides
    [
      { top: '20%', left: '-22%', w: '28vmin', cls: 'sr-cloud-a' },
      { top: '40%', left: '106%', w: '18vmin', cls: 'sr-cloud-b' },
      { top: '10%', left: '-32%', w: '36vmin', cls: 'sr-cloud-c' },
    ].forEach(cfg => {
      const cloud = document.createElement('div');
      cloud.className = `sr-cloud ${cfg.cls}`;
      cloud.style.cssText =
        `position:absolute;top:${cfg.top};left:${cfg.left};` +
        `width:${cfg.w};height:calc(${cfg.w} * 0.42);`;
      layer.appendChild(cloud);
    });

    layer.classList.remove('sunrise-active');
    void layer.offsetWidth;
    layer.classList.add('sunrise-active');
    window.setTimeout(() => {
      layer.classList.remove('sunrise-active');
      layer.querySelectorAll('.sr-cloud').forEach(c => c.remove());
    }, 4000);
  }

  function applyTheme(theme) {
    if (theme === currentTheme) return;
    const body = document.body;
    const previousTheme = currentTheme;

    // Remove all theme classes
    body.classList.remove('theme-gallery', 'theme-booknook', 'theme-sunny-world');

    if (theme === 'gallery') {
      if (previousTheme === 'booknook' || previousTheme === 'default') triggerSunrise();
      // Give the sunrise animation space to breathe before the sky colour changes
      setTimeout(() => body.classList.add('theme-gallery'), 500);
      setTimeout(() => body.classList.add('theme-sunny-world'), 800);
      setTimeout(() => {
        spawnSun();
        spawnClouds();
        spawnBirds();
        spawnSunnySideCritters();
      }, 900);
    } else if (theme === 'default') {
      // Leaving sunny world — strip theme classes and clean up gallery decorations
      const gallery = document.getElementById('art-gallery');
      if (gallery) {
        gallery.querySelectorAll('.theme-cloud,.theme-sun,.theme-bird').forEach(e => e.remove());
      }
      clearGalleryCritters();
    }

    if (theme === 'booknook') {
      body.classList.add('theme-booknook', 'theme-sunny-world');
      spawnSunnySideCritters();
    }

    currentTheme = theme;
  }

  // ── IntersectionObserver — switch on scroll ──
  // Projects section triggers the sunny world theme so the sky
  // starts changing before the user even reaches the gallery.
  // Booknook is kept as a secondary key for its own warm theme.

  const SECTION_THEMES = {
    'projects':     'gallery',
    'reading-nook': 'booknook',
  };

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sectionTheme = SECTION_THEMES[entry.target.id];
      if (entry.isIntersecting && sectionTheme) {
        applyTheme(sectionTheme);
      } else if (!entry.isIntersecting && sectionTheme && currentTheme === sectionTheme) {
        // Only revert when scrolling back UP above the trigger section
        const rect = entry.target.getBoundingClientRect();
        if (sectionTheme === 'gallery' && rect.top > 0) {
          applyTheme('default');
        } else if (sectionTheme === 'booknook' && rect.top > 0) {
          applyTheme('gallery');
        }
      }
    });
  }, { threshold: 0.08 });

  Object.keys(SECTION_THEMES).forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });

  // Re-spawn clouds on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (currentTheme === 'gallery') {
        const gallery = document.getElementById('art-gallery');
        if (gallery) gallery.querySelectorAll('.theme-cloud').forEach(e => e.remove());
        spawnClouds();
      }
    }, 300);
  });

  // ── Scroll-driven cloud parallax ────────────
  // Each gallery cloud drifts sideways at its own speed as you scroll,
  // creating a layered depth effect with no auto-animation.
  function initCloudParallax() {
    const gallery = document.getElementById('art-gallery');
    if (!gallery) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function update() {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;

      const rect = gallery.getBoundingClientRect();
      // Only move clouds while the gallery is near the viewport
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) {
        ticking = false; return;
      }

      gallery.querySelectorAll('.theme-cloud').forEach(cv => {
        const s    = parseFloat(cv.dataset.scale  || '1');
        const spd  = parseFloat(cv.dataset.speed  || '0.4');
        const dir  = parseFloat(cv.dataset.dir    || '1');
        let   tx   = parseFloat(cv.dataset.tx     || '0');

        tx += dy * spd * dir;
        // Gentle wrap-around so clouds never disappear off edge
        tx = Math.max(-120, Math.min(120, tx));
        cv.dataset.tx = tx.toFixed(2);
        cv.style.transform = `scale(${s}) translateX(${tx}px)`;
      });
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }

  // ── Scroll-driven sun arc ────────────────────
  // Moves #scroll-sun along a bottom-left → upper-right arc
  // purely based on scroll position between the Projects section
  // and the midpoint of the Art Gallery section.
  function initScrollSun() {
    const sunEl      = document.getElementById('scroll-sun');
    const projectsEl = document.getElementById('projects');
    const galleryEl  = document.getElementById('art-gallery');
    if (!sunEl || !projectsEl || !galleryEl) return;

    let projTop, galMid;

    function recalc() {
      const scrollY = window.scrollY || window.pageYOffset;
      projTop = scrollY + projectsEl.getBoundingClientRect().top;
      galMid  = scrollY + galleryEl.getBoundingClientRect().top
                + galleryEl.offsetHeight * 0.35;
    }
    recalc();
    window.addEventListener('resize', recalc, { passive: true });

    // Smooth ease-in-out curve
    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    let ticking = false;

    function update() {
      // Use the vertical midpoint of the viewport as the scroll probe
      const scrollMid = (window.scrollY || window.pageYOffset) + window.innerHeight * 0.55;
      const raw = (scrollMid - projTop) / Math.max(1, galMid - projTop);
      const p   = Math.max(0, Math.min(1, raw));
      const ep  = easeInOut(p);

      // Arc: bottom-left (12 %, -18 vh) → upper-right (79 %, 68 vh)
      sunEl.style.left      = (12 + 67 * ep) + '%';
      sunEl.style.bottom    = (-18 + 86 * ep) + 'vh';
      // Scale up as it rises, keeping translateX(-50%) for centering
      sunEl.style.transform = `translateX(-50%) scale(${(0.45 + 0.55 * ep).toFixed(3)})`;
      // Fade in quickly at the start, fully opaque by ~12 % progress
      sunEl.style.opacity   = p > 0.01 ? String(Math.min(0.72, p * 8).toFixed(3)) : '0';

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    // Run once on load in case the user lands mid-page
    update();
  }

  initScrollSun();
  initCloudParallax();

})();
