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

  // Vibrato tone — LFO modulates frequency
  function vibTone(freq, mod, lfoHz, dur, type, vol) {
    const c   = ac();
    const osc = c.createOscillator();
    const lfo = c.createOscillator();
    const lg  = c.createGain();
    const env = c.createGain();
    lfo.frequency.value = lfoHz; lg.gain.value = mod;
    lfo.connect(lg); lg.connect(osc.frequency);
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    osc.connect(env); env.connect(master);
    const t = c.currentTime;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol || 0.3, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lfo.start(t); osc.start(t);
    lfo.stop(t + dur + 0.02); osc.stop(t + dur + 0.02);
  }

  // White noise burst
  function noise(dur, vol, delay) {
    const c      = ac();
    const bufLen = Math.ceil(c.sampleRate * Math.max(dur, 0.01));
    const buf    = c.createBuffer(1, bufLen, c.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const env = c.createGain();
    src.connect(env); env.connect(master);
    const t = c.currentTime + (delay || 0);
    env.gain.setValueAtTime(vol || 0.3, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t); src.stop(t + dur + 0.02);
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
  // Each function uses only tone() / glide() / arp() / vibTone() / noise()
  // Volumes set high (0.45-0.6) so they cut through clearly.
  const C = {

    // ── SPACE ──────────────────────────────────────────
    ghost() {
      // Eerie wavering wail — sine with slow vibrato
      vibTone(260, 80, 4, 0.8, 'sine', 0.45);
    },
    robot() {
      // Classic beep-boop
      tone(523, 0.1, 'square', 0.5);
      tone(330, 0.1, 'square', 0.45, 0.14);
    },
    ufo() {
      // Sci-fi descending whirr
      glide(600, 120, 0.55, 'sine', 0.45);
      vibTone(400, 60, 10, 0.55, 'sine', 0.2);
    },
    alien() {
      // Alien warble — rapid vibrato chirp
      vibTone(880, 300, 18, 0.32, 'sine', 0.45);
    },
    pixel_knight() {
      // HYAAA! sword slash — descending square + thud
      glide(500, 100, 0.13, 'square', 0.55);
      tone(200, 0.09, 'sine', 0.45, 0.1);
    },
    slime() {
      // Wet bloop — triangle glide down
      glide(400, 65, 0.25, 'triangle', 0.5);
    },
    keese() {
      // Bat sonar — two high pings
      tone(1800, 0.05, 'sine', 0.45);
      tone(1500, 0.05, 'sine', 0.38, 0.07);
    },
    navi() {
      // HEY! — bright fairy chime arpeggio
      arp([1047, 1319, 1568], 0.065, 'sine', 0.42);
    },
    sheik() {
      // Ninja whoosh + shuriken ping
      glide(900, 180, 0.14, 'sine', 0.38);
      tone(1600, 0.05, 'sine', 0.3, 0.08);
    },
    triforce() {
      // Mystical three-note chime
      arp([659, 784, 1047], 0.11, 'triangle', 0.45);
    },
    wizard() {
      // Magic sparkle — ascending sweep
      glide(160, 1400, 0.4, 'sine', 0.4);
    },
    dragon() {
      // HYAAA! big roar — low sawtooth growl
      glide(300, 60, 0.3, 'sawtooth', 0.55);
      tone(140, 0.1, 'square', 0.5, 0.05);
    },

    // ── SUNNY ──────────────────────────────────────────
    cat() {
      // Meow — sine slide up then down
      glide(300, 540, 0.13, 'sine', 0.48);
      glide(540, 270, 0.2,  'sine', 0.42, 0.13);
    },
    mushroom() {
      // Boing — quick spring up
      glide(95, 540, 0.22, 'sine', 0.5);
    },
    sword() {
      // Sword slash — descending square burst
      glide(480, 120, 0.13, 'square', 0.52);
    },
    link() {
      // HYAAA! Link's attack cry + slash
      tone(400, 0.03, 'square', 0.55);
      glide(520, 150, 0.15, 'square', 0.5, 0.02);
      tone(230, 0.08, 'sine',   0.38, 0.12);
    },
    cucco() {
      // Cucco cluck cluck!
      arp([700, 840, 660, 780], 0.05, 'sine', 0.42);
    },
    heart_container() {
      // Health pickup — warm ascending pentatonic
      arp([523, 659, 784, 1047, 1319], 0.058, 'sine', 0.42);
    },
    octorok() {
      // Pop / spit
      glide(300, 80, 0.1, 'square', 0.5);
    },
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
