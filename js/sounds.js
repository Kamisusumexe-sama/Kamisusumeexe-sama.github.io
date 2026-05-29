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
  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = sfxMuted ? 0 : 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Primitives ───────────────────────────────────────────────────────

  // Single tone with a quick attack + exponential decay
  function tone(freq, dur, type, vol, delay) {
    const c   = ac();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env); env.connect(master);
    osc.type = type || 'square';
    osc.frequency.value = freq;
    const t = c.currentTime + (delay || 0);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol || 0.3, t + 0.007);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // Pitch glide from f1 → f2
  function glide(f1, f2, dur, type, vol, delay) {
    const c   = ac();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env); env.connect(master);
    osc.type = type || 'sine';
    const t = c.currentTime + (delay || 0);
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
    env.gain.setValueAtTime(vol || 0.2, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // White noise burst (for hits, pops, swooshes)
  function noise(dur, vol, delay) {
    const c       = ac();
    const bufLen  = Math.ceil(c.sampleRate * dur);
    const buf     = c.createBuffer(1, bufLen, c.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const env = c.createGain();
    src.connect(env); env.connect(master);
    const t = c.currentTime + (delay || 0);
    env.gain.setValueAtTime(vol || 0.2, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t); src.stop(t + dur + 0.02);
  }

  // Tone with vibrato (LFO modulating frequency)
  function vibTone(freq, mod, lfoHz, dur, type, vol) {
    const c   = ac();
    const osc = c.createOscillator();
    const lfo = c.createOscillator();
    const lg  = c.createGain();
    const env = c.createGain();
    lfo.frequency.value = lfoHz;
    lg.gain.value = mod;
    lfo.connect(lg); lg.connect(osc.frequency);
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    osc.connect(env); env.connect(master);
    const t = c.currentTime;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol || 0.2, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lfo.start(t); osc.start(t);
    lfo.stop(t + dur + 0.02); osc.stop(t + dur + 0.02);
  }

  // Arpeggio
  function arp(notes, step, type, vol) {
    let t = 0;
    notes.forEach(f => { tone(f, step, type, vol, t); t += step * 0.82; });
  }

  // ── UI sound library ─────────────────────────────────────────────────
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

  // ── Critter sound library ────────────────────────────────────────────
  // One unique synthesised sound per sprite.
  const C = {

    // ── SPACE CRITTERS ──────────────────────────────────────────────
    ghost() {
      // Eerie wavering moan
      vibTone(240, 70, 4.5, 0.7, 'sine', 0.18);
    },
    robot() {
      // Beep-boop (two-tone square)
      tone(523, 0.09, 'square', 0.22);
      tone(330, 0.09, 'square', 0.2, 0.12);
    },
    ufo() {
      // Sci-fi descending whirr with vibrato
      vibTone(500, 80, 12, 0.5, 'sine', 0.18);
      glide(500, 100, 0.5, 'sine', 0.1);
    },
    alien() {
      // Warbling extra-terrestrial chirp
      vibTone(900, 250, 20, 0.28, 'sine', 0.17);
    },
    pixel_knight() {
      // HYAAA! — sword slash impact
      noise(0.04, 0.28);
      glide(500, 120, 0.14, 'square', 0.28, 0.02);
      tone(200, 0.06, 'sine', 0.18, 0.1);
    },
    slime() {
      // Wet gloopy bloop
      glide(380, 70, 0.22, 'triangle', 0.24);
    },
    keese() {
      // Bat sonar chirp
      tone(2100, 0.035, 'sine', 0.14);
      tone(1750, 0.035, 'sine', 0.10, 0.05);
    },
    navi() {
      // "HEY!" — bright fairy chime
      arp([1047, 1319, 1568], 0.06, 'sine', 0.2);
    },
    sheik() {
      // Ninja dash whoosh + shuriken ping
      glide(900, 200, 0.12, 'sine', 0.14);
      noise(0.07, 0.1, 0.02);
      tone(1800, 0.04, 'sine', 0.1, 0.06);
    },
    triforce() {
      // Mystical three-point chime
      arp([659, 784, 1047], 0.1, 'triangle', 0.2);
    },
    wizard() {
      // Magic sparkle — ascending sweep + harmonic shimmer
      glide(180, 1400, 0.38, 'sine', 0.18);
      glide(360, 2800, 0.38, 'sine', 0.07, 0.0);
    },
    dragon() {
      // Low growling HYAAA! — big and punchy
      tone(120, 0.08, 'sawtooth', 0.3);
      glide(280, 60, 0.28, 'sawtooth', 0.22, 0.04);
      noise(0.12, 0.18, 0.04);
    },

    // ── SUNNY CRITTERS ──────────────────────────────────────────────
    cat() {
      // Meow — rising then falling sine slide
      glide(280, 520, 0.12, 'sine', 0.22);
      glide(520, 260, 0.18, 'sine', 0.18, 0.12);
    },
    mushroom() {
      // Funny spring boing
      glide(90, 520, 0.22, 'sine', 0.26);
    },
    sword() {
      // Sword HYAAA! slash
      noise(0.05, 0.25);
      glide(480, 130, 0.13, 'square', 0.26, 0.01);
    },
    link() {
      // Link's battle cry HYAAA! (short vocal + slash)
      tone(380, 0.025, 'square', 0.35);
      glide(520, 160, 0.14, 'square', 0.28, 0.02);
      tone(220, 0.07, 'sine', 0.16, 0.11);
    },
    cucco() {
      // Cucco cluck cluck! (Zelda chicken)
      arp([700, 820, 660, 760], 0.048, 'sine', 0.16);
    },
    heart_container() {
      // Health pickup — warm pentatonic chime ascending
      arp([523, 659, 784, 1047, 1319], 0.055, 'sine', 0.2);
    },
    octorok() {
      // Spitting pop
      noise(0.055, 0.28);
      tone(180, 0.07, 'square', 0.2, 0.02);
    },
    // LoZ extras that might appear
    triforce_sunny() { C.triforce(); },
    navi_sunny()     { C.navi(); },
    sheik_sunny()    { C.sheik(); },
    octorok_dark()   { C.octorok(); },
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

    // Play a critter's unique spawn sound
    critter(spriteName) {
      if (sfxMuted) return;
      try {
        // Exact match first, then check common aliases
        const fn = C[spriteName] || C[spriteName + '_sunny'] || C[spriteName + '_dark'];
        fn?.();
      } catch (_) {}
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
