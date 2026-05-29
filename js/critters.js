// =============================================
//  CRITTERS.JS — Pixel art characters that
//  roam, run, and do weird stuff around the UI
//  v2 — rAF-based movement, compositor-only transforms
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
      will-change: transform;
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
    .click-sparkle {
      position: fixed; pointer-events: none; z-index: 9997;
      font-family: monospace; user-select: none;
      animation: sparkle-burst 0.7s ease-out forwards;
    }
    @keyframes sparkle-burst {
      0%   { transform: translate(0,0) scale(1.2) rotate(0deg); opacity: 1; }
      100% { transform: translate(var(--dx),var(--dy)) scale(0) rotate(var(--rot)); opacity: 0; }
    }
    @keyframes fairy-float {
      0%   { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-70px) scale(0.2); opacity: 0; }
    }
    .navi-cursor {
      position: fixed; pointer-events: none; z-index: 9998;
      font-family: monospace; font-size: 13px; user-select: none;
      color: #8be9fd;
      text-shadow: 0 0 8px #8be9fd, 0 0 18px rgba(139,233,253,0.55);
      will-change: transform;
      transition: opacity 0.4s, color 0.3s, text-shadow 0.3s;
    }
    .navi-cursor.navi-flash {
      color: #fff;
      text-shadow: 0 0 22px #8be9fd, 0 0 44px #8be9fd;
    }
  `;

  // ── Pixel art sprites (text art, 10px font) ─
  const SPRITES = {
    cat: {
      frames: [
        ` /\\_/\\ \n( ^w^ )\n > ♡ <\n  |  | `,
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
    bee: {
      frames: [
        ` /\\ /\\ \n(■-■-■)\n  \\•/  \n   ♦   `,
        ` \\/ \\/ \n(■-■-■)\n  /•\\  \n   ♦   `,
      ],
      color: '#f1fa8c',
      w: 70, h: 44,
    },
    frog: {
      frames: [
        ` /°°\\ \n( O  O)\n \\__/ \n  ||  `,
        ` /°°\\ \n( O  O)\n  \\/ \n /  \\ `,
      ],
      color: '#50fa7b',
      w: 70, h: 44,
    },
    plane: {
      frames: [
        `   *   \n--[·]--\n =====>\n       `,
        `  ---  \n--[·]--\n =====>\n       `,
      ],
      color: '#8be9fd',
      w: 70, h: 44,
    },
  };

  // ── Speech bubble lines — split by zone ─────
  const SPACE_LINES = [
    'hire me pls', 'looking for bugs...', 'git commit -m "fix"',
    '10 PRINT "hello"', "it's a feature!", 'null ptr exc.', '99 bugs...',
    'coffee++', 'while(true){}', "owo what's this", 'ERROR 404', 'LGTM 👍',
    'push to prod', 'works on my machine', 'segfault :(', '...loading...',
    'stack overflow', 'sudo make me', 'ctrl+z ctrl+z', 'rm -rf /',
    'pls no review', 'pew pew ✦', 'beep boop',
    'HEY! LISTEN!', "it's dangerous alone", 'take this ⚔', 'TRIFORCE GET',
    'secret to everybody', 'dodongo dislikes smoke', "you've met a terrible fate",
    'can I interest u in a mask?', 'power of gold...', 'ocarina loaded',
  ];

  const SUNNY_LINES = [
    'shipped it!', ':root { --fun: yes }', 'speedrun any%', 'skill issue',
    'touch grass', '♡ u', '★ fave ★', 'golden hour ☀', 'grass touched ✓',
    'your princess is here', 'do you have a fairy?', 'item get! 🎵',
    'new dungeon unlocked', 'low hearts... boop boop', 'found a secret!',
    'CUCCO REVENGE GANG', 'tingle tingle!',
  ];

  // ── Behavior definitions ────────────────────
  // All movement uses requestAnimationFrame + CSS transform
  // Only pure-CSS behaviors (bounce, peek, swing, glitch) keep their CSS animations
  const BEHAVIORS = {

    // Walks left→right or right→left along bottom of screen
    walker: (c) => {
      const goRight = Math.random() > 0.5;
      const speed = 0.6 + Math.random() * 1.2;
      let x = goRight ? -80 : window.innerWidth + 80;
      const y = window.innerHeight - 80 - Math.random() * 60;

      // position element at origin; move entirely via transform
      c.el.style.left = '0px';
      c.el.style.top  = '0px';
      c.el.style.animation = goRight
        ? 'crit-walk-r 0.4s steps(2) infinite'
        : 'crit-walk-l 0.4s steps(2) infinite';

      let frame = 0;
      let lastFrameFlip = 0;
      let rafId;

      function tick(ts) {
        if (!document.body.contains(c.el)) return;
        x += goRight ? speed : -speed;
        c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;

        // flip sprite frame every ~200ms without a separate interval
        if (ts - lastFrameFlip > 200) {
          frame = (frame + 1) % 2;
          c.sprite.el.textContent = c.sprite.frames[frame];
          lastFrameFlip = ts;
        }

        if (x > window.innerWidth + 120 || x < -120) {
          c.destroy();
          return;
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
      c.cleanup = () => cancelAnimationFrame(rafId);
    },

    // Floats in a sine wave diagonally across screen
    floater: (c) => {
      let x = -80;
      const baseY = 80 + Math.random() * (window.innerHeight * 0.5);
      const speed = 0.5 + Math.random() * 0.8;
      const amp   = 20 + Math.random() * 40;
      const freq  = 0.02 + Math.random() * 0.03;
      let t = 0;
      let rafId;

      c.el.style.left = '0px';
      c.el.style.top  = '0px';
      c.el.style.animation = 'crit-float 2s ease-in-out infinite';

      function tick() {
        if (!document.body.contains(c.el)) return;
        x += speed;
        t += 1;
        const y = baseY + Math.sin(t * freq) * amp;
        c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        if (x > window.innerWidth + 120) { c.destroy(); return; }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
      c.cleanup = () => cancelAnimationFrame(rafId);
    },

    // Bounces up and down on a spot — pure CSS, no rAF needed
    bouncer: (c) => {
      const x = Math.random() * (window.innerWidth - 100) + 50;
      const y = window.innerHeight - 104; // bottom anchor
      c.el.style.left = '0px';
      c.el.style.top  = '0px';
      c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      c.el.style.animation = 'crit-bounce 0.9s ease-in-out infinite';
      const t = setTimeout(() => c.destroy(), 5000 + Math.random() * 5000);
      c.cleanup = () => clearTimeout(t);
    },

    // Crawls along the top of the page, upside-down
    ceiling_crawler: (c) => {
      const goRight = Math.random() > 0.5;
      const speed = 0.5 + Math.random() * 0.8;
      let x = goRight ? -80 : window.innerWidth + 80;
      const y = 60;

      c.el.style.left   = '0px';
      c.el.style.top    = '0px';
      c.el.style.filter = 'hue-rotate(120deg)';

      let frame = 0;
      let lastFrameFlip = 0;
      let rafId;

      function tick(ts) {
        if (!document.body.contains(c.el)) return;
        x += goRight ? speed : -speed;
        // scaleY(-1) flips it upside-down; translateY baked in
        c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scaleY(-1)`;

        if (ts - lastFrameFlip > 200) {
          frame = (frame + 1) % 2;
          c.sprite.el.textContent = c.sprite.frames[frame];
          lastFrameFlip = ts;
        }

        if (x > window.innerWidth + 120 || x < -120) { c.destroy(); return; }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
      c.cleanup = () => cancelAnimationFrame(rafId);
    },

    // Runs fast across and shakes (CSS handles shake, rAF moves it)
    sprinter: (c) => {
      const speed = 3 + Math.random() * 3;
      let x = -80;
      const y = window.innerHeight - 90 - Math.random() * 80;

      c.el.style.left   = '0px';
      c.el.style.top    = '0px';
      c.el.style.filter = 'brightness(1.6)';
      // shake is a tiny CSS animation that only translates X by ±4px —
      // it composites fine on top of our rAF transform because we keep
      // the shake on a child wrapper instead of the root element.
      // Since we can't easily nest, we accept the minor shake override
      // and drive horizontal movement by updating transform each frame.
      c.el.style.animation = 'crit-shake 0.15s linear infinite';

      let rafId;
      function tick() {
        if (!document.body.contains(c.el)) return;
        x += speed;
        // Note: crit-shake overrides transform via CSS animation.
        // We set left directly here so it still moves across the screen.
        // This is the one case where left is acceptable because the shake
        // animation already owns the transform property.
        c.el.style.left = x + 'px';
        c.el.style.top  = y + 'px';
        if (x > window.innerWidth + 120) { c.destroy(); return; }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
      c.cleanup = () => cancelAnimationFrame(rafId);
    },

    // Glitches in place, then vanishes — pure CSS animation, no movement
    glitcher: (c) => {
      const x = Math.random() * (window.innerWidth - 120) + 60;
      const y = Math.random() * (window.innerHeight - 120) + 60;
      c.el.style.left   = '0px';
      c.el.style.top    = '0px';
      c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      c.el.style.animation = 'crit-glitch 0.4s steps(1) infinite';
      c.el.style.filter   = 'brightness(2)';
      const t = setTimeout(() => c.destroy(), 2500 + Math.random() * 2000);
      c.cleanup = () => clearTimeout(t);
    },

    // Peeks up from the bottom edge — pure CSS animation
    peeker: (c) => {
      const x = Math.random() * (window.innerWidth - 100) + 50;
      c.el.style.left   = x + 'px';
      c.el.style.bottom = '-44px';
      c.el.style.top    = 'auto';
      c.el.style.animation = 'crit-peek 4s ease-in-out forwards';
      const t = setTimeout(() => c.destroy(), 5000);
      c.cleanup = () => clearTimeout(t);
    },

    // Swings from an anchor near the top — pure CSS animation
    swinger: (c) => {
      const x = Math.random() * (window.innerWidth - 100) + 50;
      c.el.style.left            = '0px';
      c.el.style.top             = '0px';
      c.el.style.transform       = `translate(${x.toFixed(1)}px, 52px)`;
      c.el.style.transformOrigin = 'top center';
      c.el.style.animation       = 'crit-swing 1.2s ease-in-out infinite';
      const t = setTimeout(() => c.destroy(), 6000 + Math.random() * 4000);
      c.cleanup = () => clearTimeout(t);
    },

    // Spins wildly across the screen
    spinner: (c) => {
      let x  = Math.random() * window.innerWidth;
      let y  = Math.random() * window.innerHeight * 0.6 + 80;
      const vx = (Math.random() - 0.5) * 3;
      const vy = (Math.random() - 0.5) * 2;

      c.el.style.left      = '0px';
      c.el.style.top       = '0px';
      c.el.style.animation = 'crit-spin 0.5s linear infinite';

      let rafId;
      // crit-spin owns the transform too, so like sprinter we fall back
      // to left/top for positional movement while spin handles rotation.
      function tick() {
        if (!document.body.contains(c.el)) return;
        x += vx; y += vy;
        c.el.style.left = x + 'px';
        c.el.style.top  = y + 'px';
        if (x < -120 || x > window.innerWidth + 120 || y < -80 || y > window.innerHeight + 80) {
          c.destroy(); return;
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
      c.cleanup = () => cancelAnimationFrame(rafId);
    },

    // Types at a desk — low-frequency interval (80ms) is fine, kept as-is
    typer: (c) => {
      const side = Math.random() > 0.5;
      const x = side ? 20 : window.innerWidth - 120;
      const y = window.innerHeight - 124;
      c.el.style.left = '0px';
      c.el.style.top  = '0px';
      c.el.style.transform = `translate(${x}px, ${y}px)`;

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

    // Drifts toward a random wandering target
    chaser: (c) => {
      let x  = Math.random() * window.innerWidth;
      let y  = Math.random() * (window.innerHeight - 100) + 50;
      let tx = Math.random() * window.innerWidth;
      let ty = Math.random() * (window.innerHeight - 100) + 50;

      c.el.style.left = '0px';
      c.el.style.top  = '0px';

      let f = 0;
      let lastFrameFlip = 0;
      let rafId;

      function tick(ts) {
        if (!document.body.contains(c.el)) return;
        const dx   = tx - x;
        const dy   = ty - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          tx = Math.random() * window.innerWidth;
          ty = Math.random() * (window.innerHeight - 100) + 50;
        }

        const spd = 0.8;
        x += (dx / dist) * spd;
        y += (dy / dist) * spd;

        const flip = dx > 0 ? 1 : -1;
        c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scaleX(${flip})`;

        if (ts - lastFrameFlip > 200) {
          f++;
          c.sprite.el.textContent = c.sprite.frames[f % 2];
          lastFrameFlip = ts;
        }

        if (f > 500) { c.destroy(); return; }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
      c.cleanup = () => cancelAnimationFrame(rafId);
    },

    // Hops along the ground — sunny side only
    hopper: (c) => {
      let x      = Math.random() * (window.innerWidth - 120) + 60;
      const ground = window.innerHeight - 82;
      let posY   = ground;
      let vy     = 0;
      let hopping = false;

      c.el.style.left = '0px';
      c.el.style.top  = '0px';

      let rafId;
      function tick() {
        if (!document.body.contains(c.el)) return;

        if (!hopping && Math.random() < 0.025) {
          hopping = true;
          vy = -9;
          x += (Math.random() * 40 - 10);
          c.sprite.el.textContent = c.sprite.frames[1];
        }

        if (hopping) {
          vy   += 0.7;
          posY += vy;
          if (posY >= ground) {
            posY    = ground;
            vy      = 0;
            hopping = false;
            c.sprite.el.textContent = c.sprite.frames[0];
          }
        }

        c.el.style.transform = `translate(${x.toFixed(1)}px, ${posY.toFixed(1)}px)`;
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);

      const t = setTimeout(() => c.destroy(), 9000 + Math.random() * 6000);
      c.cleanup = () => { cancelAnimationFrame(rafId); clearTimeout(t); };
    },
  };

  const BEHAVIOR_NAMES = Object.keys(BEHAVIORS);
  const SPRITE_NAMES   = Object.keys(SPRITES);

  // ── Zone-aware pools ──────────────────────────
  const SPACE_SPRITES = [
    'ghost', 'robot', 'ufo', 'alien', 'pixel_knight', 'slime',
    'keese', 'navi', 'sheik', 'triforce', 'wizard', 'dragon',
  ];
  const SPACE_BEHAVIORS = ['floater', 'glitcher', 'spinner', 'ceiling_crawler', 'swinger', 'chaser'];

  const SUNNY_SPRITES = [
    'cat', 'mushroom', 'sword', 'link', 'cucco', 'heart_container', 'octorok', 'bee', 'frog', 'plane',
  ];
  const SUNNY_BEHAVIORS = ['walker', 'bouncer', 'peeker', 'sprinter', 'typer', 'chaser'];

  const FORCED_BEHAVIOR = { frog: 'hopper', plane: 'floater' };

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
    const zone         = opts.zone || getCurrentZone();
    const spritePool   = zone === 'sunny' ? SUNNY_SPRITES   : SPACE_SPRITES;
    const behaviorPool = zone === 'sunny' ? SUNNY_BEHAVIORS : SPACE_BEHAVIORS;
    const linePool     = zone === 'sunny' ? SUNNY_LINES     : SPACE_LINES;
    const spriteKey    = opts.sprite   || rand(spritePool);
    const behaviorKey  = opts.behavior || FORCED_BEHAVIOR[spriteKey] || rand(behaviorPool);
    const sprite       = SPRITES[spriteKey];

    const el = document.createElement('div');
    el.className = 'critter';
    el.setAttribute('aria-hidden', 'true');

    const artEl = document.createElement('span');
    artEl.style.color      = sprite.color;
    artEl.style.textShadow = `0 0 8px ${sprite.color}`;
    artEl.textContent      = sprite.frames[0];
    el.appendChild(artEl);

    const bubble = document.createElement('div');
    bubble.className  = 'critter-bubble';
    bubble.textContent = '';
    el.appendChild(bubble);

    document.body.appendChild(el);

    let _soundTimer = null;

    const c = {
      el,
      bubble,
      sprite: { el: artEl, frames: sprite.frames },
      cleanup: null,
      destroy() {
        if (_soundTimer) { clearTimeout(_soundTimer); _soundTimer = null; }
        if (this.cleanup) this.cleanup();
        if (document.body.contains(this.el)) {
          this.el.style.transition = 'opacity 0.5s';
          this.el.style.opacity    = '0';
          setTimeout(() => { if (document.body.contains(this.el)) this.el.remove(); }, 500);
        }
      },
    };

    function scheduleSound(initialDelay) {
      _soundTimer = setTimeout(() => {
        if (!document.body.contains(c.el)) return;
        if (window.SFX) SFX.critter(spriteKey);
        scheduleSound(3000 + Math.random() * 5000);
      }, initialDelay);
    }
    scheduleSound(600 + Math.random() * 1500);

    if (Math.random() < 0.55) {
      const delay = 1000 + Math.random() * 3000;
      setTimeout(() => {
        if (document.body.contains(c.el)) {
          showBubble(c, rand(linePool), 2500);
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
  const activePool   = [];

  function clearActivePool() {
    activePool.slice().forEach(c => { if (document.body.contains(c.el)) c.destroy(); });
    activePool.length = 0;
    active = 0;
  }

  function spawnRandom() {
    if (active >= MAX_CRITTERS || _zoneLocked) return;
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

  let _lastZone   = getCurrentZone();
  let _zoneLocked = false;
  new MutationObserver(() => {
    const z = getCurrentZone();
    if (z !== _lastZone) {
      _lastZone = z;
      clearActivePool();
      _zoneLocked = true;
      setTimeout(() => { _zoneLocked = false; }, 1200);
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ── Click sparkle burst ──────────────────────────
  const SPACE_SPARKS = { syms: ['✦','✧','★','·','◆','*'],  colors: ['#bd93f9','#8be9fd','#ff79c6'] };
  const SUNNY_SPARKS = { syms: ['★','✦','♡','✿','☆','♪'], colors: ['#f1fa8c','#ff79c6','#50fa7b'] };

  function spawnSparkles(x, y) {
    const zone = getCurrentZone();
    const pool = zone === 'sunny' ? SUNNY_SPARKS : SPACE_SPARKS;
    const frag  = document.createDocumentFragment();
    const nodes = [];

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5);
      const dist  = 25 + Math.random() * 40;
      const color = pool.colors[i % pool.colors.length];
      const sym   = pool.syms[Math.floor(Math.random() * pool.syms.length)];
      const el    = document.createElement('span');
      el.setAttribute('aria-hidden', 'true');
      el.className    = 'click-sparkle';
      el.style.cssText =
        `left:${x}px;top:${y}px;color:${color};font-size:${10 + i * 2}px;` +
        `--dx:${(Math.cos(angle) * dist).toFixed(0)}px;` +
        `--dy:${(Math.sin(angle) * dist).toFixed(0)}px;` +
        `--rot:${Math.round(Math.random() * 240 - 120)}deg;` +
        `animation-duration:${(0.55 + i * 0.06).toFixed(2)}s`;
      el.textContent = sym;
      frag.appendChild(el);
      nodes.push(el);
    }

    document.body.appendChild(frag);
    setTimeout(() => nodes.forEach(n => n.remove()), 900);

    if (Math.random() < 0.2) spawnFairy(x, y, zone);
  }

  function spawnFairy(x, y, zone) {
    const el     = document.createElement('div');
    const color  = zone === 'sunny' ? '#f1fa8c' : '#8be9fd';
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
    let f  = 0;
    const iv = setInterval(() => { f ^= 1; el.textContent = frames[f]; }, 180);
    setTimeout(() => { clearInterval(iv); el.remove(); }, 1150);
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, select, textarea')) return;
    spawnSparkles(e.clientX, e.clientY);
  });

  // ── Konami-code easter egg ─────────────────────
  let konamiSeq = [];
  const KONAMI  = [38,38,40,40,37,39,37,39,66,65];
  document.addEventListener('keydown', (e) => {
    konamiSeq.push(e.keyCode);
    konamiSeq = konamiSeq.slice(-10);
    if (konamiSeq.join(',') === KONAMI.join(',')) {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => createCritter({ behavior: rand(['spinner','glitcher','bouncer','sprinter']) }), i * 200);
      }
    }
  });

  // ── Navi cursor companion ─────────────────────
  function initNaviCursor() {
    const el = document.createElement('div');
    el.className = 'navi-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.textContent  = '✦';
    el.style.cssText = 'opacity:0; left:0; top:0;';
    document.body.appendChild(el);

    const FRAMES = ['✦', '·'];
    let frame = 0, tick = 0;
    let tx = -300, ty = -300;
    let cx = tx,   cy = ty;

    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      el.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('mouseleave', () => { el.style.opacity = '0'; }, { passive: true });

    (function loop() {
      cx += (tx - cx) * 0.13;
      cy += (ty - cy) * 0.13;
      el.style.transform = `translate(${(cx + 14).toFixed(1)}px,${(cy + Math.sin(tick * 0.07) * 4 - 18).toFixed(1)}px)`;
      if (++tick % 28 === 0) { frame ^= 1; el.textContent = FRAMES[frame]; }
      requestAnimationFrame(loop);
    })();

    function flair() {
      el.classList.add('navi-flash');
      if (window.SFX) SFX.critter('navi');
      setTimeout(() => el.classList.remove('navi-flash'), 500);
      setTimeout(flair, 9000 + Math.random() * 12000);
    }
    setTimeout(flair, 12000 + Math.random() * 10000);
  }

  setTimeout(initNaviCursor, 1000);

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── Scroll-triggered critters ────────────────
  const sectionTriggers = {
    'home':         { sprite: 'ufo',            behavior: 'floater',  zone: 'space' },
    'about':        { sprite: 'triforce',        behavior: 'glitcher', zone: 'space' },
    'showreel':     { sprite: 'navi',            behavior: 'spinner',  zone: 'space' },
    'projects':     { sprite: 'link',            behavior: 'bouncer',  zone: 'sunny' },
    'games':        { sprite: 'cucco',           behavior: 'sprinter', zone: 'sunny' },
    'art-gallery':  { sprite: 'heart_container', behavior: 'bouncer',  zone: 'sunny' },
    'reading-nook': { sprite: 'cat',             behavior: 'typer',    zone: 'sunny' },
    'downloads':    { sprite: 'sword',           behavior: 'peeker',   zone: 'sunny' },
    'contact':      { sprite: 'mushroom',        behavior: 'walker',   zone: 'sunny' },
  };

  const triggered  = new Set();
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

  // ── LoZ Easter egg: type "ZELDA" ─────────────
  let zeldaSeq = '';
  const ZELDA_CODE = 'ZELDA';
  document.addEventListener('keydown', (e) => {
    zeldaSeq = (zeldaSeq + e.key.toUpperCase()).slice(-5);
    if (zeldaSeq === ZELDA_CODE) {
      const lozSprites  = ['triforce','navi','heart_container','link','sheik','keese','cucco','octorok','sword'];
      const lozBehavior = ['floater','spinner','bouncer','glitcher'];
      const lozLines    = ['HEY! LISTEN!','TRIFORCE GET',"it's dangerous alone",'item get! 🎵','power of gold...','CUCCO REVENGE GANG','found a secret!'];
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