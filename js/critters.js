// =============================================
//  CRITTERS.JS — Pixel art characters that
//  roam, run, and do weird stuff around the UI
// =============================================

(function() {
  'use strict';

  // ── CSS injected once ──────────────────────
  const CSS = `
    .critter {
      position: fixed;
      z-index: 998;
      pointer-events: none;
      user-select: none;
      image-rendering: pixelated;
      font-family: monospace;
      white-space: pre;
      line-height: 1;
      font-size: 10px;
    }
    .critter-label {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Press Start 2P', monospace;
      font-size: 5px;
      color: rgba(255,255,255,0.6);
      white-space: nowrap;
      pointer-events: none;
      margin-bottom: 2px;
      text-shadow: 0 0 6px currentColor;
    }
    .critter-bubble {
      position: absolute;
      bottom: 130%;
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a32;
      border: 1px solid var(--accent2, #bd93f9);
      border-radius: 6px;
      padding: 4px 7px;
      font-family: 'Press Start 2P', monospace;
      font-size: 5px;
      color: var(--accent2, #bd93f9);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      text-shadow: 0 0 8px var(--accent2, #bd93f9);
      box-shadow: 0 0 10px rgba(189,147,249,0.3);
    }
    .critter-bubble::after {
      content: '';
      position: absolute;
      top: 100%; left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: var(--accent2, #bd93f9);
    }
    .critter-bubble.show { opacity: 1; }

    @keyframes crit-walk-l {
      0%,100% { transform: scaleX(-1) translateY(0px); }
      50%      { transform: scaleX(-1) translateY(-3px); }
    }
    @keyframes crit-walk-r {
      0%,100% { transform: scaleX(1) translateY(0px); }
      50%      { transform: scaleX(1) translateY(-3px); }
    }
    @keyframes crit-float {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      33%      { transform: translateY(-8px) rotate(5deg); }
      66%      { transform: translateY(-4px) rotate(-4deg); }
    }
    @keyframes crit-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes crit-bounce {
      0%,100% { transform: translateY(0) scaleY(1); }
      40%      { transform: translateY(-20px) scaleY(1.1); }
      60%      { transform: translateY(-20px) scaleY(1.1); }
      80%      { transform: translateY(0) scaleY(0.85); }
    }
    @keyframes crit-shake {
      0%,100% { transform: translateX(0); }
      25%      { transform: translateX(-4px) rotate(-3deg); }
      75%      { transform: translateX(4px) rotate(3deg); }
    }
    @keyframes crit-glitch {
      0%,100% { filter: none; clip-path: none; }
      10%      { filter: hue-rotate(90deg) brightness(2); clip-path: inset(20% 0 50% 0); transform: translateX(-4px); }
      20%      { filter: hue-rotate(180deg); clip-path: inset(60% 0 10% 0); transform: translateX(4px); }
      30%      { filter: none; clip-path: none; transform: none; }
    }
    @keyframes crit-peek {
      0%,40%,100% { transform: translateY(100%) scaleX(1); }
      50%,90%     { transform: translateY(0%) scaleX(1); }
    }
    @keyframes crit-swing {
      0%,100% { transform-origin: top center; transform: rotate(-20deg); }
      50%      { transform-origin: top center; transform: rotate(20deg); }
    }
    @keyframes crit-type {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
    @keyframes crit-patrol {
      0%,100% { transform: scaleX(1); }
    }
    @keyframes sparkle-burst {
      0%   { transform: translate(0,0) scale(1.3) rotate(0deg); opacity: 1; }
      60%  { opacity: 0.7; }
      100% { transform: translate(var(--dx),var(--dy)) scale(0) rotate(var(--rot)); opacity: 0; }
    }
    @keyframes fairy-float {
      0%   { transform: translateY(0) scale(1);    opacity: 1; }
      70%  { opacity: 0.9; }
      100% { transform: translateY(-75px) scale(0.25); opacity: 0; }
    }
  `;

  // ── Pixel art sprites (text art, 10px font) ─
  const SPRITES = {
    cat: {
      frames: [
        // frame A
        ` /\\_/\\ \n( ^w^ )\n > ♡ <\n  |  | `,
        // frame B (walking)
        ` /\\_/\\ \n( -w- )\n > ♡ <\n /   \\ `,
      ],
      color: '#ff79c6',
      w: 70, h: 44,
    },
    ghost: {
      frames: [
        `  .-.  \n ( o.o )\n  |>|  \n /   \\ `,
        `  .-.  \n ( -.- )\n  |<|  \n  \\_/  `,
      ],
      color: '#8be9fd',
      w: 70, h: 44,
    },
    robot: {
      frames: [
        ` [o_o] \n |[_]| \n / | \\ \n [   ] `,
        ` [o_o] \n |[_]| \n \\  | / \n [   ] `,
      ],
      color: '#bd93f9',
      w: 70, h: 44,
    },
    wizard: {
      frames: [
        `  /\\   \n /★ \\ \n|o  o|\n \\~~/ `,
        `  /\\   \n /✦ \\ \n|^  ^|\n \\~~/ `,
      ],
      color: '#f1fa8c',
      w: 70, h: 44,
    },
    slime: {
      frames: [
        ` (●●●)\n(●   ●)\n (●●●)\n  \\_/  `,
        ` (●●●)\n(●   ●)\n  \\_/  \n  / \\  `,
      ],
      color: '#50fa7b',
      w: 70, h: 44,
    },
    ufo: {
      frames: [
        ` _____\n( o o )\n \\___/\n  |||  `,
        ` _____\n( - - )\n \\___/\n   |   `,
      ],
      color: '#8be9fd',
      w: 70, h: 44,
    },
    sword: {
      frames: [
        `  /|   \n / |   \n/  |   \n---+   `,
        `   |\\  \n   | \\ \n   |  \\\n   +---`,
      ],
      color: '#ffb86c',
      w: 70, h: 44,
    },
    mushroom: {
      frames: [
        ` (███) \n(●   ●)\n  | |  \n  |_|  `,
        ` (███) \n( ° ° )\n  | |  \n  |_|  `,
      ],
      color: '#ff5555',
      w: 70, h: 44,
    },
    alien: {
      frames: [
        ` /°°°\\ \n| ^  ^ |\n \\_ww_/ \n  | |   `,
        ` /°°°\\ \n| -  - |\n \\_ww_/ \n / \\ /  `,
      ],
      color: '#50fa7b',
      w: 70, h: 44,
    },
    dragon: {
      frames: [
        `>==|:> \n  /|\\  \n / | \\ \n    ♦  `,
        `>==|:> \n \\|/   \n  | \\  \n  ♦    `,
      ],
      color: '#ffb86c',
      w: 70, h: 44,
    },
    pixel_knight: {
      frames: [
        ` [■■■] \n |o  o|\n  |◈|  \n [■■■] `,
        ` [■■■] \n |o  o|\n  |◈|  \n / ■ \\ `,
      ],
      color: '#bd93f9',
      w: 70, h: 44,
    },

    // ── Legend of Zelda critters ────────────────
    link: {
      frames: [
        `  /\\   \n [^_^] \n  |⚔|  \n  | |  `,
        `  /\\   \n [^_^] \n  |⚔|  \n /   \\ `,
      ],
      color: '#50fa7b',
      w: 70, h: 44,
    },
    triforce: {
      frames: [
        `   △   \n  △△   \n ▲▲▲  \n  ✦✦✦  `,
        `   △   \n  △△   \n ▲▲▲  \n  ···  `,
      ],
      color: '#f1fa8c',
      w: 70, h: 44,
    },
    navi: {
      frames: [
        `  ✦✦✦ \n ✦   ✦\n  ✦✦✦ \n   ·   `,
        `  ···  \n · ✦ · \n  ···  \n   ·   `,
      ],
      color: '#8be9fd',
      w: 70, h: 44,
    },
    cucco: {
      frames: [
        ` (●●●)\n (>●<)\n  | |  \n  |_|  `,
        ` (●●●)\n (>-<)\n  |/|  \n  |_|  `,
      ],
      color: '#f8f8f2',
      w: 70, h: 44,
    },
    octorok: {
      frames: [
        ` (ooo)\n( · · )\n |~~~| \n  \\_/  `,
        ` (ooo)\n( - - )\n |~~~| \n  ~~~  `,
      ],
      color: '#ff5555',
      w: 70, h: 44,
    },
    sheik: {
      frames: [
        `  ***  \n |o  o|\n  |x|  \n  | |  `,
        `  ***  \n |^  ^|\n  |x|  \n /   \\ `,
      ],
      color: '#bd93f9',
      w: 70, h: 44,
    },
    heart_container: {
      frames: [
        ` ♥♥♥♥ \n♥      ♥\n ♥    ♥ \n  ♥♥♥   `,
        ` ♡♡♡♡ \n♡      ♡\n ♡    ♡ \n  ♡♡♡   `,
      ],
      color: '#ff5555',
      w: 70, h: 44,
    },
    keese: {
      frames: [
        ` /\\ /\\ \n( o  o )\n  \\__/  \n   vv   `,
        ` /v v\\ \n( -  - )\n  \\__/  \n        `,
      ],
      color: '#6272a4',
      w: 70, h: 44,
    },
  };

  // ── Speech bubble lines — split by zone ─────
  // Space/dark zone: techy, glitchy, ominous
  const SPACE_LINES = [
    'hire me pls', 'looking for bugs...', 'git commit -m "fix"',
    '10 PRINT "hello"', "it's a feature!", 'null ptr exc.', '99 bugs...',
    'coffee++', 'while(true){}', "owo what's this", 'ERROR 404', 'LGTM 👍',
    'push to prod', 'works on my machine', 'segfault :(', '...loading...',
    'stack overflow', 'sudo make me', 'ctrl+z ctrl+z', 'rm -rf /',
    'pls no review', 'pew pew ✦', 'beep boop',
    // LoZ — mysterious & dark
    'HEY! LISTEN!', "it's dangerous alone", 'take this ⚔', 'TRIFORCE GET',
    'secret to everybody', 'dodongo dislikes smoke', "you've met a terrible fate",
    'can I interest u in a mask?', 'power of gold...', 'ocarina loaded',
  ];

  // Sunny/daytime zone: cheerful, colourful, adventurous
  const SUNNY_LINES = [
    'shipped it!', ':root { --fun: yes }', 'speedrun any%', 'skill issue',
    'touch grass', '♡ u', '★ fave ★', 'golden hour ☀', 'grass touched ✓',
    // LoZ — daylight quests & silly
    'your princess is here', 'do you have a fairy?', 'item get! 🎵',
    'new dungeon unlocked', 'low hearts... boop boop', 'found a secret!',
    'CUCCO REVENGE GANG', 'tingle tingle!',
  ];

  // ── Behavior definitions ────────────────────
  // Each critter has a `behavior` fn that sets up its movement
  const BEHAVIORS = {

    // Walks left→right or right→left along bottom of screen
    walker: (c) => {
      const goRight = Math.random() > 0.5;
      const speed = 0.6 + Math.random() * 1.2; // px per frame
      let x = goRight ? -80 : window.innerWidth + 80;
      const y = window.innerHeight - 80 - Math.random() * 60;
      c.el.style.bottom = 'auto';
      c.el.style.top = y + 'px';
      c.el.style.left = x + 'px';
      c.el.style.animation = goRight
        ? 'crit-walk-r 0.4s steps(2) infinite'
        : 'crit-walk-l 0.4s steps(2) infinite';

      let frame = 0;
      const interval = setInterval(() => {
        if (!document.body.contains(c.el)) { clearInterval(interval); return; }
        x += goRight ? speed : -speed;
        c.el.style.left = x + 'px';
        // alternate sprite frames for walking
        frame = (frame + 1) % 2;
        c.sprite.el.textContent = c.sprite.frames[frame];
        // destroy when offscreen
        if (x > window.innerWidth + 120 || x < -120) {
          c.destroy();
          clearInterval(interval);
        }
      }, 16);
      c.cleanup = () => clearInterval(interval);
    },

    // Floats in a sine wave diagonally across screen
    floater: (c) => {
      let x = -80;
      const baseY = 80 + Math.random() * (window.innerHeight * 0.5);
      const speed = 0.5 + Math.random() * 0.8;
      const amp = 20 + Math.random() * 40;
      const freq = 0.02 + Math.random() * 0.03;
      let t = 0;
      c.el.style.left = x + 'px';
      c.el.style.top = baseY + 'px';
      c.el.style.animation = 'crit-float 2s ease-in-out infinite';

      const iv = setInterval(() => {
        if (!document.body.contains(c.el)) { clearInterval(iv); return; }
        x += speed;
        t += 1;
        c.el.style.left = x + 'px';
        c.el.style.top = (baseY + Math.sin(t * freq) * amp) + 'px';
        if (x > window.innerWidth + 120) { c.destroy(); clearInterval(iv); }
      }, 16);
      c.cleanup = () => clearInterval(iv);
    },

    // Bounces up and down on a spot, then teleports
    bouncer: (c) => {
      const x = Math.random() * (window.innerWidth - 100) + 50;
      c.el.style.left = x + 'px';
      c.el.style.bottom = '60px';
      c.el.style.top = 'auto';
      c.el.style.animation = 'crit-bounce 0.9s ease-in-out infinite';
      const t = setTimeout(() => c.destroy(), 5000 + Math.random() * 5000);
      c.cleanup = () => clearTimeout(t);
    },

    // Crawls along the top of the page, upside-down
    ceiling_crawler: (c) => {
      const goRight = Math.random() > 0.5;
      const speed = 0.5 + Math.random() * 0.8;
      let x = goRight ? -80 : window.innerWidth + 80;
      c.el.style.top = '60px';
      c.el.style.left = x + 'px';
      c.el.style.transform = 'scaleY(-1)';
      c.el.style.animation = 'none';
      c.el.style.filter = 'hue-rotate(120deg)';

      let frame = 0;
      const iv = setInterval(() => {
        if (!document.body.contains(c.el)) { clearInterval(iv); return; }
        x += goRight ? speed : -speed;
        c.el.style.left = x + 'px';
        frame = (frame + 1) % 2;
        c.sprite.el.textContent = c.sprite.frames[frame];
        if (x > window.innerWidth + 120 || x < -120) { c.destroy(); clearInterval(iv); }
      }, 16);
      c.cleanup = () => clearInterval(iv);
    },

    // Runs fast across and panics (shakes)
    sprinter: (c) => {
      const speed = 3 + Math.random() * 3;
      let x = -80;
      const y = window.innerHeight - 90 - Math.random() * 80;
      c.el.style.top = y + 'px';
      c.el.style.left = x + 'px';
      c.el.style.animation = 'crit-shake 0.15s linear infinite';
      c.el.style.filter = 'brightness(1.6)';

      const iv = setInterval(() => {
        if (!document.body.contains(c.el)) { clearInterval(iv); return; }
        x += speed;
        c.el.style.left = x + 'px';
        if (x > window.innerWidth + 120) { c.destroy(); clearInterval(iv); }
      }, 16);
      c.cleanup = () => clearInterval(iv);
    },

    // Glitches in place, then vanishes
    glitcher: (c) => {
      const x = Math.random() * (window.innerWidth - 120) + 60;
      const y = Math.random() * (window.innerHeight - 120) + 60;
      c.el.style.left = x + 'px';
      c.el.style.top  = y + 'px';
      c.el.style.animation = 'crit-glitch 0.4s steps(1) infinite';
      c.el.style.filter = 'brightness(2)';
      const t = setTimeout(() => c.destroy(), 2500 + Math.random() * 2000);
      c.cleanup = () => clearTimeout(t);
    },

    // Peeks up from the bottom edge
    peeker: (c) => {
      const x = Math.random() * (window.innerWidth - 100) + 50;
      c.el.style.left = x + 'px';
      c.el.style.bottom = '-44px';
      c.el.style.top = 'auto';
      c.el.style.animation = 'crit-peek 4s ease-in-out forwards';
      const t = setTimeout(() => c.destroy(), 5000);
      c.cleanup = () => clearTimeout(t);
    },

    // Swings from an "anchor" near the top (nav area)
    swinger: (c) => {
      const x = Math.random() * (window.innerWidth - 100) + 50;
      c.el.style.left = x + 'px';
      c.el.style.top = '52px';
      c.el.style.transformOrigin = 'top center';
      c.el.style.animation = 'crit-swing 1.2s ease-in-out infinite';
      const t = setTimeout(() => c.destroy(), 6000 + Math.random() * 4000);
      c.cleanup = () => clearTimeout(t);
    },

    // Spins wildly across the screen
    spinner: (c) => {
      let x = Math.random() * window.innerWidth;
      let y = Math.random() * window.innerHeight * 0.6 + 80;
      const vx = (Math.random() - 0.5) * 3;
      const vy = (Math.random() - 0.5) * 2;
      c.el.style.left = x + 'px';
      c.el.style.top  = y + 'px';
      c.el.style.animation = 'crit-spin 0.5s linear infinite';

      const iv = setInterval(() => {
        if (!document.body.contains(c.el)) { clearInterval(iv); return; }
        x += vx; y += vy;
        c.el.style.left = x + 'px';
        c.el.style.top  = y + 'px';
        if (x < -120 || x > window.innerWidth + 120 || y < -80 || y > window.innerHeight + 80) {
          c.destroy(); clearInterval(iv);
        }
      }, 16);
      c.cleanup = () => clearInterval(iv);
    },

    // Types at a "desk" in the corner with a keyboard sound visual
    typer: (c) => {
      const side = Math.random() > 0.5;
      c.el.style.left = side ? '20px' : (window.innerWidth - 120) + 'px';
      c.el.style.bottom = '80px';
      c.el.style.top = 'auto';
      // Show bubble with typing
      const chars = '01ab#@!?';
      let t = 0;
      const iv = setInterval(() => {
        if (!document.body.contains(c.el)) { clearInterval(iv); return; }
        t++;
        if (t % 8 === 0) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          showBubble(c, char, 600);
        }
        c.sprite.el.textContent = c.sprite.frames[t % 2];
        if (t > 200) { c.destroy(); clearInterval(iv); }
      }, 80);
      c.cleanup = () => clearInterval(iv);
    },

    // Chase behavior: slowly drifts toward a random target
    chaser: (c) => {
      let x = Math.random() * window.innerWidth;
      let y = Math.random() * (window.innerHeight - 100) + 50;
      let tx = Math.random() * window.innerWidth;
      let ty = Math.random() * (window.innerHeight - 100) + 50;
      c.el.style.left = x + 'px';
      c.el.style.top  = y + 'px';

      let f = 0;
      const iv = setInterval(() => {
        if (!document.body.contains(c.el)) { clearInterval(iv); return; }
        const dx = tx - x, dy = ty - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) {
          tx = Math.random() * window.innerWidth;
          ty = Math.random() * (window.innerHeight - 100) + 50;
        }
        const spd = 0.8;
        x += (dx / dist) * spd;
        y += (dy / dist) * spd;
        c.el.style.left = x + 'px';
        c.el.style.top  = y + 'px';
        c.el.style.transform = dx > 0 ? 'scaleX(1)' : 'scaleX(-1)';
        f++;
        c.sprite.el.textContent = c.sprite.frames[f % 2];
        if (f > 500) { c.destroy(); clearInterval(iv); }
      }, 16);
      c.cleanup = () => clearInterval(iv);
    },
  };

  const BEHAVIOR_NAMES = Object.keys(BEHAVIORS);
  const SPRITE_NAMES   = Object.keys(SPRITES);

  // ── Zone-aware pools ──────────────────────────
  // Space (dark sky) — eerie, mechanical, dungeon-dwelling
  const SPACE_SPRITES = [
    'ghost', 'robot', 'ufo', 'alien', 'pixel_knight', 'slime',
    'keese', 'navi', 'sheik', 'triforce', 'wizard', 'dragon',
  ];
  const SPACE_BEHAVIORS = ['floater', 'glitcher', 'spinner', 'ceiling_crawler', 'swinger', 'chaser'];

  // Sunny (day sky) — cheerful, outdoor, Hyrule-field vibes
  const SUNNY_SPRITES = [
    'cat', 'mushroom', 'sword', 'link', 'cucco', 'heart_container', 'octorok',
  ];
  const SUNNY_BEHAVIORS = ['walker', 'bouncer', 'peeker', 'sprinter', 'typer', 'chaser'];

  // Reads current theme from body classes set by themes.js
  function getCurrentZone() {
    const b = document.body;
    return (b.classList.contains('theme-gallery') || b.classList.contains('theme-sunny-world'))
      ? 'sunny' : 'space';
  }

  // ── Utility helpers ─────────────────────────
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function showBubble(c, text, duration) {
    if (!c.bubble) return;
    c.bubble.textContent = text;
    c.bubble.classList.add('show');
    setTimeout(() => { if (c.bubble) c.bubble.classList.remove('show'); }, duration || 2000);
  }

  // ── Critter factory ─────────────────────────
  function createCritter(opts = {}) {
    const zone        = opts.zone || getCurrentZone();
    const spritePool  = zone === 'sunny' ? SUNNY_SPRITES   : SPACE_SPRITES;
    const behaviorPool= zone === 'sunny' ? SUNNY_BEHAVIORS : SPACE_BEHAVIORS;
    const linePool    = zone === 'sunny' ? SUNNY_LINES     : SPACE_LINES;
    const spriteKey   = opts.sprite   || rand(spritePool);
    const behaviorKey = opts.behavior || rand(behaviorPool);
    const sprite = SPRITES[spriteKey];

    const el = document.createElement('div');
    el.className = 'critter';
    el.setAttribute('aria-hidden', 'true');

    // inner text span for the pixel art
    const artEl = document.createElement('span');
    artEl.style.color = sprite.color;
    artEl.style.textShadow = `0 0 8px ${sprite.color}`;
    artEl.textContent = sprite.frames[0];
    el.appendChild(artEl);

    // speech bubble
    const bubble = document.createElement('div');
    bubble.className = 'critter-bubble';
    bubble.textContent = '';
    el.appendChild(bubble);

    document.body.appendChild(el);

    const c = {
      el,
      bubble,
      sprite: { el: artEl, frames: sprite.frames },
      cleanup: null,
      destroy() {
        if (this.cleanup) this.cleanup();
        if (document.body.contains(this.el)) {
          this.el.style.transition = 'opacity 0.5s';
          this.el.style.opacity = '0';
          setTimeout(() => { if (document.body.contains(this.el)) this.el.remove(); }, 500);
        }
      },
    };

    // Spawn sound — unique per sprite
    setTimeout(() => {
      if (window.SFX && document.body.contains(c.el)) SFX.critter(spriteKey);
    }, 150);

    // Occasional random speech bubble — zone-appropriate text + a soft chirp
    if (Math.random() < 0.55) {
      const delay = 1000 + Math.random() * 3000;
      setTimeout(() => {
        if (document.body.contains(c.el)) {
          showBubble(c, rand(linePool), 2500);
          // Brief soft blip when they "speak"
          if (window.SFX) SFX.play('hover');
        }
      }, delay);
    }

    BEHAVIORS[behaviorKey](c);
    return c;
  }

  // ── Spawning logic ───────────────────────────
  let active = 0;
  const MAX_CRITTERS = 2;
  const activePool = []; // tracks all live randomly-spawned critters

  function clearActivePool() {
    activePool.slice().forEach(c => { if (document.body.contains(c.el)) c.destroy(); });
    activePool.length = 0;
    active = 0;
  }

  function spawnRandom() {
    if (active >= MAX_CRITTERS) return;
    active++;
    const c = createCritter();
    activePool.push(c);
    const origDestroy = c.destroy.bind(c);
    c.destroy = function() {
      active = Math.max(0, active - 1);
      const idx = activePool.indexOf(this);
      if (idx !== -1) activePool.splice(idx, 1);
      origDestroy();
    };
    setTimeout(() => { if (document.body.contains(c.el)) c.destroy(); }, 20000);
  }

  // Flush all active critters the moment the zone flips so stale-zone
  // sprites don't linger over the wrong background.
  let _lastZone = getCurrentZone();
  new MutationObserver(() => {
    const z = getCurrentZone();
    if (z !== _lastZone) { _lastZone = z; clearActivePool(); }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ── Click sparkle burst ──────────────────────────
  const SPACE_SPARKS = {
    syms:   ['✦','✧','★','·','◆','✦','✦','*'],
    colors: ['#bd93f9','#8be9fd','#f0eeff','#ff79c6','#ffffff'],
  };
  const SUNNY_SPARKS = {
    syms:   ['★','✦','♡','✿','☆','✨','♪','✦'],
    colors: ['#f1fa8c','#ff79c6','#50fa7b','#ffb86c','#ffffff'],
  };

  function spawnSparkles(x, y) {
    const zone  = getCurrentZone();
    const pool  = zone === 'sunny' ? SUNNY_SPARKS : SPACE_SPARKS;
    const count = 8 + Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      const el     = document.createElement('span');
      const angle  = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const dist   = 28 + Math.random() * 52;
      const size   = 9 + Math.random() * 10;
      const color  = pool.colors[Math.floor(Math.random() * pool.colors.length)];
      const sym    = pool.syms[Math.floor(Math.random() * pool.syms.length)];
      const rot    = (Math.random() * 360 - 180).toFixed(0) + 'deg';
      const dur    = (0.55 + Math.random() * 0.4).toFixed(2);
      const delay  = (i * 0.018).toFixed(3);

      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = `
        position:fixed; pointer-events:none; z-index:9997;
        left:${x}px; top:${y}px;
        font-size:${size}px; font-family:monospace; user-select:none;
        color:${color}; text-shadow:0 0 10px ${color};
        --dx:${(Math.cos(angle)*dist).toFixed(1)}px;
        --dy:${(Math.sin(angle)*dist).toFixed(1)}px;
        --rot:${rot};
        animation: sparkle-burst ${dur}s ${delay}s ease-out forwards;
        will-change:transform,opacity;
      `;
      el.textContent = sym;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (parseFloat(dur) + parseFloat(delay)) * 1000 + 50);
    }

    // 1-in-5 chance: a tiny fairy floats up from the click point
    if (Math.random() < 0.2) spawnFairy(x, y, zone);
  }

  function spawnFairy(x, y, zone) {
    const el    = document.createElement('div');
    const color = zone === 'sunny' ? '#f1fa8c' : '#8be9fd';
    const frames = [' ✦✦✦\n✦   ✦\n ✦✦✦', '  ···\n· ✦ ·\n  ···'];
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = `
      position:fixed; pointer-events:none; z-index:9997;
      left:${x - 18}px; top:${y - 20}px;
      font-size:9px; font-family:monospace; white-space:pre;
      color:${color}; text-shadow:0 0 12px ${color};
      animation: fairy-float 1.1s ease-out forwards;
      will-change:transform,opacity;
    `;
    el.textContent = frames[0];
    document.body.appendChild(el);
    let f = 0;
    const iv = setInterval(() => { f ^= 1; el.textContent = frames[f]; }, 180);
    setTimeout(() => { clearInterval(iv); el.remove(); }, 1150);
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, select, textarea')) return;
    spawnSparkles(e.clientX, e.clientY);
  });

  // ── Konami-code easter egg: flood of critters ─
  let konamiSeq = [];
  const KONAMI = [38,38,40,40,37,39,37,39,66,65];
  document.addEventListener('keydown', (e) => {
    konamiSeq.push(e.keyCode);
    konamiSeq = konamiSeq.slice(-10);
    if (konamiSeq.join(',') === KONAMI.join(',')) {
      // CHAOS MODE
      for (let i = 0; i < 8; i++) {
        setTimeout(() => createCritter({ behavior: rand(['spinner','glitcher','bouncer','sprinter']) }), i * 200);
      }
    }
  });

  // ── Start spawning ───────────────────────────
  // One critter on load, then rare periodic visits
  setTimeout(() => spawnRandom(), 2500);
  setInterval(() => spawnRandom(), 16000 + Math.random() * 10000);

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── Scroll-triggered critter: pops up when you hit certain sections ─
  // zone field forces the right pool even before theme classes apply.
  const sectionTriggers = {
    // ── Space zone (dark sky) ──────────────────
    'home':         { sprite: 'ufo',             behavior: 'floater',          zone: 'space' },
    'about':        { sprite: 'triforce',         behavior: 'glitcher',         zone: 'space' },
    'showreel':     { sprite: 'navi',             behavior: 'spinner',          zone: 'space' },
    // ── Sunny zone (day sky) ──────────────────
    'projects':     { sprite: 'link',             behavior: 'bouncer',          zone: 'sunny' },
    'games':        { sprite: 'cucco',            behavior: 'sprinter',         zone: 'sunny' },
    'art-gallery':  { sprite: 'heart_container',  behavior: 'bouncer',          zone: 'sunny' },
    'reading-nook': { sprite: 'cat',              behavior: 'typer',            zone: 'sunny' },
    'downloads':    { sprite: 'sword',            behavior: 'peeker',           zone: 'sunny' },
    'contact':      { sprite: 'mushroom',         behavior: 'walker',           zone: 'sunny' },
  };

  const triggered = new Set();
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !triggered.has(entry.target.id)) {
        triggered.add(entry.target.id);
        const opts = sectionTriggers[entry.target.id];
        if (opts) setTimeout(() => createCritter(opts), 500);
      }
    });
  }, { threshold: 0.25 });

  Object.keys(sectionTriggers).forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObs.observe(el);
  });

  // ── LoZ Easter egg: type "ZELDA" to summon a critter swarm ─────
  let zeldaSeq = '';
  const ZELDA_CODE = 'ZELDA';
  document.addEventListener('keydown', (e) => {
    zeldaSeq = (zeldaSeq + e.key.toUpperCase()).slice(-5);
    if (zeldaSeq === ZELDA_CODE) {
      // ZELDA flood uses all LoZ sprites regardless of zone
      const lozSprites  = ['triforce','navi','heart_container','link','sheik','keese','cucco','octorok','sword'];
      const lozBehavior = ['floater','spinner','bouncer','glitcher'];
      const lozLines    = ['HEY! LISTEN!','TRIFORCE GET',"it's dangerous alone",'item get! \uD83C\uDFB5','power of gold...','CUCCO REVENGE GANG','found a secret!'];
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const c = createCritter({
            sprite:   lozSprites[i % lozSprites.length],
            behavior: lozBehavior[i % lozBehavior.length],
          });
          setTimeout(() => {
            if (document.body.contains(c.el)) showBubble(c, lozLines[i % lozLines.length], 3000);
          }, 600);
        }, i * 280);
      }
    }
  });

})();
