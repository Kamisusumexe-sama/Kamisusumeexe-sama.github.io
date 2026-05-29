/* sounds.js — Retro Web Audio sound engine (zero audio files for SFX)
   Aesthetic: NES square-wave blips, Zelda arpeggios, space sine sweeps */

window.SFX = (function () {
  'use strict';

  // ── Persistent state ─────────────────────────────────────────────────
  let ctx    = null;
  let master = null;
  let sfxMuted = localStorage.getItem('sfx_muted') === '1';
  let bgMuted  = localStorage.getItem('bg_muted')  === '1';
  let bgEl     = null;
  let bgVol    = 0.28;

  // ── Audio context ────────────────────────────────────────────────────
  // Created on first call to ac(). A click event counts as a user gesture,
  // so the context starts in 'running' state automatically.
  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = sfxMuted ? 0 : 0.6;
      master.connect(ctx.destination);
    }
    // Resume if suspended (tab was backgrounded, etc.)
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Primitives ───────────────────────────────────────────────────────
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
    env.gain.linearRampToValueAtTime(vol || 0.35, t + 0.007);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function arp(notes, step, type, vol) {
    let t = 0;
    notes.forEach(f => { tone(f, step, type, vol, t); t += step * 0.82; });
  }

  function glide(f1, f2, dur, type, vol) {
    const c   = ac();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env);
    env.connect(master);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f1, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, c.currentTime + dur);
    env.gain.setValueAtTime(vol || 0.25, c.currentTime);
    env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur + 0.02);
  }

  // ── Sound library ────────────────────────────────────────────────────
  const S = {
    click()        { tone(523, 0.065, 'square', 0.32); },
    hover()        { tone(440, 0.022, 'sine',   0.08); },
    projectEnter() { arp([523, 659, 784, 1047], 0.068, 'square', 0.24); },
    projectBack()  { arp([784, 659, 523],        0.065, 'square', 0.22); },
    themeGallery() {
      arp([262, 330, 392, 523], 0.082, 'square', 0.18);
      setTimeout(() => tone(784, 0.22, 'square', 0.14), 280);
    },
    themeDefault() { glide(660, 160, 0.45, 'sine', 0.20); },
  };

  // ── Toggle button DOM update ─────────────────────────────────────────
  function updateToggles() {
    const sfxBtn = document.getElementById('sfx-toggle');
    const bgBtn  = document.getElementById('bg-toggle');
    if (sfxBtn) {
      sfxBtn.textContent = sfxMuted ? '🔇' : '🔊';
      sfxBtn.title = sfxMuted ? 'Unmute sound effects' : 'Mute sound effects';
    }
    if (bgBtn) {
      bgBtn.textContent = bgMuted ? '🎵' : '🎶';
      bgBtn.title = bgMuted ? 'Play background music' : 'Pause background music';
    }
  }

  // ── Public API ───────────────────────────────────────────────────────
  const api = {

    play(name) {
      if (sfxMuted) return;
      try { S[name]?.(); } catch (_) {}
    },

    setSfxMuted(v) {
      sfxMuted = !!v;
      localStorage.setItem('sfx_muted', sfxMuted ? '1' : '0');
      if (master) master.gain.value = sfxMuted ? 0 : 0.6;
      updateToggles();
    },
    isSfxMuted: () => sfxMuted,
    toggleSfx() {
      this.setSfxMuted(!sfxMuted);
      if (!sfxMuted) this.play('click');
    },

    initBg(url, vol) {
      if (!url || bgEl) return;
      bgVol = vol || 0.28;
      bgEl = new Audio(url);
      bgEl.loop   = true;
      bgEl.volume = bgMuted ? 0 : bgVol;
      document.body.appendChild(bgEl);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateToggles);
  } else {
    updateToggles();
  }

  return api;
})();
