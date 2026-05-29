/* sounds.js — Retro sound engine (Web Audio API, zero audio files for SFX)
   Aesthetic: NES square-wave blips, Zelda-style arpeggios, space sine sweeps */

window.SFX = (function () {
  'use strict';

  // ── Persistent state ─────────────────────────────────────────────────
  let ctx    = null;
  let master = null;
  let ready  = false;
  let sfxMuted = localStorage.getItem('sfx_muted') === '1';
  let bgMuted  = localStorage.getItem('bg_muted')  === '1';
  let bgEl     = null;
  let bgVol    = 0.28;

  // ── Audio context (created & resumed after first user gesture) ───────
  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = sfxMuted ? 0 : 0.52;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Primitive: single tone with envelope ─────────────────────────────
  function tone(freq, dur, type, vol, delay) {
    const c   = ac();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env);
    env.connect(master);
    osc.type = type || 'square';
    osc.frequency.value = freq;
    const t = c.currentTime + (delay || 0);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol || 0.3, t + 0.007);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // ── Primitive: arpeggio (array of frequencies) ───────────────────────
  function arp(notes, step, type, vol) {
    let t = 0;
    notes.forEach(f => { tone(f, step, type, vol, t); t += step * 0.82; });
  }

  // ── Primitive: pitch glide ───────────────────────────────────────────
  function glide(f1, f2, dur, type, vol) {
    const c   = ac();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env);
    env.connect(master);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f1, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, c.currentTime + dur);
    env.gain.setValueAtTime(vol || 0.2, c.currentTime);
    env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur + 0.02);
  }

  // ── Sound library ────────────────────────────────────────────────────
  const S = {

    // NES menu cursor — short square burst (C5)
    click() {
      tone(523, 0.055, 'square', 0.26);
    },

    // Almost-inaudible tick on hover
    hover() {
      tone(330, 0.018, 'sine', 0.05);
    },

    // Zelda chest-open: ascending C5 → E5 → G5 → C6
    projectEnter() {
      arp([523, 659, 784, 1047], 0.068, 'square', 0.22);
    },

    // Leaving dungeon: descending G5 → E5 → C5
    projectBack() {
      arp([784, 659, 523], 0.064, 'square', 0.19);
    },

    // Sunrise / gallery theme: ascending Zelda fanfare C4→E4→G4→C5 + high G5 sting
    themeGallery() {
      arp([262, 330, 392, 523], 0.082, 'square', 0.17);
      setTimeout(() => tone(784, 0.22, 'square', 0.12), 280);
    },

    // Return to space: descending sine sweep
    themeDefault() {
      glide(660, 160, 0.45, 'sine', 0.18);
    },
  };

  // ── Unlock audio on first user gesture (browser autoplay policy) ─────
  function unlock() {
    if (ready) return;
    ac();
    ready = true;
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown',     unlock, true);
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown',     unlock, true);

  // ── Update nav toggle button icons ───────────────────────────────────
  function updateToggles() {
    const sfxBtn = document.getElementById('sfx-toggle');
    const bgBtn  = document.getElementById('bg-toggle');
    if (sfxBtn) {
      sfxBtn.textContent = sfxMuted ? '🔇' : '🔊';
      sfxBtn.title       = sfxMuted ? 'Unmute sound effects' : 'Mute sound effects';
      sfxBtn.setAttribute('aria-pressed', String(sfxMuted));
    }
    if (bgBtn) {
      bgBtn.textContent = bgMuted ? '🎵' : '🎶';
      bgBtn.title       = bgMuted ? 'Play background music' : 'Pause background music';
      bgBtn.setAttribute('aria-pressed', String(bgMuted));
    }
  }

  // ── Public API ───────────────────────────────────────────────────────
  const api = {

    // Play a named sound effect
    play(name) {
      if (sfxMuted || !ready) return;
      try { S[name]?.(); } catch (_) {}
    },

    // SFX mute control
    setSfxMuted(v) {
      sfxMuted = !!v;
      localStorage.setItem('sfx_muted', sfxMuted ? '1' : '0');
      if (master) master.gain.value = sfxMuted ? 0 : 0.52;
      updateToggles();
    },
    isSfxMuted: () => sfxMuted,
    toggleSfx() {
      this.setSfxMuted(!sfxMuted);
      if (!sfxMuted) this.play('click'); // confirm the un-mute with a click
    },

    // Background music (call with a URL once content.json is loaded)
    initBg(url, vol) {
      if (!url || bgEl) return;
      bgVol = vol || 0.28;
      bgEl = new Audio(url);
      bgEl.loop   = true;
      bgEl.volume = bgMuted ? 0 : bgVol;
      document.body.appendChild(bgEl);
      // Play on first pointer interaction (autoplay policy)
      const go = () => {
        bgEl.play().catch(() => {});
        document.removeEventListener('pointerdown', go, true);
      };
      document.addEventListener('pointerdown', go, true);
    },
    setBgMuted(v) {
      bgMuted = !!v;
      localStorage.setItem('bg_muted', bgMuted ? '1' : '0');
      if (bgEl) {
        bgEl.volume = bgMuted ? 0 : bgVol;
        if (!bgMuted && bgEl.paused) bgEl.play().catch(() => {});
      }
      updateToggles();
    },
    isBgMuted: () => bgMuted,
    toggleBg() { this.setBgMuted(!bgMuted); },

    updateToggles,
  };

  // Sync toggle icons after DOM is painted
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateToggles);
  } else {
    updateToggles();
  }

  return api;
})();
