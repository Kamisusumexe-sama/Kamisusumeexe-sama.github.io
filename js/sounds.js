/* sounds.js — Retro Web Audio sound engine */

window.SFX = (function () {
  'use strict';

  let ctx    = null;
  let master = null;
  let sfxMuted = localStorage.getItem('sfx_muted') === '1';
  let bgMuted  = localStorage.getItem('bg_muted')  === '1';
  let bgEl  = null;
  let bgVol = 0.28;

  // ── AudioContext ─────────────────────────────────────────────────────
  // Only creates the context; call ensureRunning() before scheduling sound.
  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = sfxMuted ? 0 : 0.75;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  // Resume and return a Promise that resolves when the context is running.
  function ensureRunning() {
    const c = ac();
    return c.state === 'running' ? Promise.resolve(c) : c.resume().then(() => c);
  }

  // ── Primitives ───────────────────────────────────────────────────────
  function tone(freq, dur, type, vol, delay) {
    const c   = ac();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env); env.connect(master);
    osc.type = type || 'square';
    osc.frequency.value = freq;
    const t = c.currentTime + (delay || 0);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol || 0.4, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function glide(f1, f2, dur, type, vol, delay) {
    const c   = ac();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env); env.connect(master);
    osc.type = type || 'sine';
    const t = c.currentTime + (delay || 0);
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
    env.gain.setValueAtTime(vol || 0.3, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function arp(notes, step, type, vol) {
    let t = 0;
    notes.forEach(f => { tone(f, step, type, vol, t); t += step * 0.82; });
  }

  // ── UI sounds ────────────────────────────────────────────────────────
  const S = {
    click()        { tone(523, 0.065, 'square', 0.35); },
    hover()        { tone(440, 0.022, 'sine',   0.08); },
    projectEnter() { arp([523, 659, 784, 1047], 0.068, 'square', 0.28); },
    projectBack()  { arp([784, 659, 523],        0.065, 'square', 0.25); },
    themeGallery() {
      arp([262, 330, 392, 523], 0.082, 'square', 0.22);
      setTimeout(() => tone(784, 0.22, 'square', 0.18), 280);
    },
    themeDefault() { glide(660, 160, 0.45, 'sine', 0.25); },
  };

  // ── Critter sounds ───────────────────────────────────────────────────
  // Deliberately kept to 1-2 oscillators each — no noise buffers,
  // no LFO routing — so sound creation never blocks the main thread.
  const C = {
    ghost()           { glide(260, 180, 0.65, 'sine',     0.45); },
    robot()           { tone(523, 0.09, 'square', 0.48); tone(330, 0.09, 'square', 0.42, 0.13); },
    ufo()             { glide(580, 110, 0.55, 'sine',     0.44); },
    alien()           { glide(880, 1300, 0.14, 'sine', 0.42); glide(1300, 700, 0.18, 'sine', 0.38, 0.14); },
    pixel_knight()    { glide(500, 90,  0.13, 'square',   0.52); },
    slime()           { glide(390, 60,  0.24, 'triangle', 0.48); },
    keese()           { tone(1850, 0.05, 'sine', 0.42); },
    navi()            { arp([1047, 1319, 1568], 0.065, 'sine', 0.40); },
    sheik()           { glide(880, 170, 0.13, 'sine',     0.38); },
    triforce()        { arp([659, 784, 1047], 0.11, 'triangle', 0.42); },
    wizard()          { glide(150, 1400, 0.4, 'sine',    0.40); },
    dragon()          { glide(280, 50,  0.30, 'sawtooth', 0.50); },
    cat()             { glide(300, 540, 0.13, 'sine', 0.46); glide(540, 260, 0.2, 'sine', 0.40, 0.13); },
    mushroom()        { glide(90,  540, 0.22, 'sine',     0.48); },
    sword()           { glide(480, 115, 0.13, 'square',   0.50); },
    link()            { tone(400, 0.03, 'square', 0.52); glide(520, 145, 0.15, 'square', 0.48, 0.03); },
    cucco()           { arp([700, 840, 660], 0.05, 'sine', 0.40); },
    heart_container() { arp([523, 659, 784, 1047], 0.058, 'sine', 0.40); },
    octorok()         { glide(300, 75, 0.10, 'square',    0.48); },
  };

  // ── Toggle button UI ─────────────────────────────────────────────────
  function updateToggles() {
    const sfxBtn = document.getElementById('sfx-toggle');
    const bgBtn  = document.getElementById('bg-toggle');
    if (sfxBtn) {
      sfxBtn.textContent = sfxMuted ? '🔇' : '🔊';
      sfxBtn.title = sfxMuted ? 'Unmute SFX' : 'Mute SFX';
    }
    if (bgBtn) {
      bgBtn.textContent = bgMuted ? '🎵' : '🎶';
      bgBtn.title = bgMuted ? 'Play music' : 'Pause music';
    }
  }

  // ── Public API ───────────────────────────────────────────────────────
  const api = {

    play(name) {
      if (sfxMuted) return;
      try { S[name]?.(); } catch (e) { console.warn('[SFX] play error:', name, e); }
    },

    // Critter sounds — only plays when AudioContext is already running
    // (i.e. after the user has clicked at least once). Queues if suspended.
    critter(spriteName) {
      if (sfxMuted) return;
      const attempt = () => {
        try {
          const fn = C[spriteName];
          if (fn) fn();
          else console.warn('[SFX] no critter sound for:', spriteName);
        } catch (e) { console.warn('[SFX] critter error:', spriteName, e); }
      };

      if (!ctx) {
        // AudioContext not created yet — queue for next user click
        const once = () => { ensureRunning().then(attempt); document.removeEventListener('click', once, true); };
        document.addEventListener('click', once, true);
        return;
      }
      // Context exists — resume if needed then play
      ensureRunning().then(attempt);
    },

    setSfxMuted(v) {
      sfxMuted = !!v;
      localStorage.setItem('sfx_muted', sfxMuted ? '1' : '0');
      if (master) master.gain.value = sfxMuted ? 0 : 0.75;
      updateToggles();
    },
    isSfxMuted: () => sfxMuted,
    toggleSfx() { this.setSfxMuted(!sfxMuted); if (!sfxMuted) this.play('click'); },

    initBg(url, vol) {
      if (!url || bgEl) return;
      bgVol = vol || 0.28;
      bgEl = new Audio(url);
      bgEl.loop = true;
      bgEl.volume = bgMuted ? 0 : bgVol;
      document.body.appendChild(bgEl);
      const go = () => { bgEl.play().catch(() => {}); document.removeEventListener('pointerdown', go, true); };
      document.addEventListener('pointerdown', go, true);
    },
    setBgMuted(v) {
      bgMuted = !!v;
      localStorage.setItem('bg_muted', bgMuted ? '1' : '0');
      if (bgEl) { bgEl.volume = bgMuted ? 0 : bgVol; if (!bgMuted && bgEl.paused) bgEl.play().catch(() => {}); }
      updateToggles();
    },
    isBgMuted: () => bgMuted,
    toggleBg() { this.setBgMuted(!bgMuted); },

    updateToggles,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateToggles);
  else updateToggles();

  return api;
})();
