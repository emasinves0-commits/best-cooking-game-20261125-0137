// All sound is synthesized with WebAudio at play time: no audio files. Noise bursts for chopping,
// filtered noise for sizzle, sine bells for the serve ding, a low saw for mistakes.

export function createAudio() {
  let context = null;
  let master = null;
  let noise = null;
  let sizzleGain = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return false;
      context = new Ctor();
      master = context.createGain();
      master.gain.value = 0.55;
      master.connect(context.destination);
      noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = noise.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    }
    if (context.state === 'suspended') context.resume();
    return true;
  }

  function envelope(gain, at, attack, peak, release) {
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
  }

  function burst(delay, length, type, frequency, peak, q = 1) {
    const at = context.currentTime + delay;
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = context.createGain();
    envelope(gain, at, 0.004, peak, length);
    source.connect(filter).connect(gain).connect(master);
    source.start(at, Math.random() * 0.5, length + 0.05);
  }

  function tone(delay, shape, from, to, length, peak) {
    const at = context.currentTime + delay;
    const oscillator = context.createOscillator();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(from, at);
    if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, at + length);
    const gain = context.createGain();
    envelope(gain, at, 0.006, peak, length);
    oscillator.connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + length + 0.05);
  }

  function bell(delay, frequency, peak) {
    tone(delay, 'sine', frequency, frequency, 1.1, peak);
    tone(delay, 'sine', frequency * 2.01, frequency * 2.01, 0.6, peak * 0.4);
    tone(delay, 'sine', frequency * 3.97, frequency * 3.97, 0.25, peak * 0.15);
  }

  const sounds = {
    chop(step = 0) {
      burst(0, 0.07, 'highpass', 1800 + step * 500, 0.9);
      tone(0, 'sine', 210 + step * 25, 90, 0.09, 0.5);
    },
    pick() {
      tone(0, 'triangle', 520, 780, 0.07, 0.25);
    },
    put() {
      tone(0, 'triangle', 330, 200, 0.08, 0.3);
      burst(0, 0.04, 'lowpass', 900, 0.25);
    },
    plate(count = 1) {
      tone(0, 'sine', 560 + count * 160, 700 + count * 200, 0.12, 0.4);
      burst(0, 0.05, 'highpass', 4000, 0.2);
    },
    ready() {
      bell(0, 988, 0.3);
      bell(0.09, 1318, 0.26);
    },
    cooked() {
      tone(0, 'sine', 880, 1175, 0.1, 0.3);
      tone(0.11, 'sine', 1175, 1175, 0.14, 0.26);
    },
    serve() {
      bell(0, 1318, 0.5);
      bell(0.12, 1760, 0.35);
      burst(0.02, 0.1, 'highpass', 5000, 0.25);
    },
    combo(level = 1) {
      tone(0, 'square', 520 + level * 70, 880 + level * 70, 0.15, 0.12);
    },
    buzz() {
      tone(0, 'sawtooth', 110, 70, 0.28, 0.35);
      tone(0.03, 'square', 82, 62, 0.24, 0.18);
    },
    burn() {
      burst(0, 0.4, 'bandpass', 600, 0.5);
      tone(0, 'sawtooth', 140, 55, 0.4, 0.3);
    },
    expire() {
      tone(0, 'sawtooth', 240, 100, 0.35, 0.3);
      tone(0.18, 'sawtooth', 200, 80, 0.4, 0.3);
    },
    tick() {
      tone(0, 'square', 1500, 1500, 0.03, 0.12);
    },
    rush() {
      for (let index = 0; index < 4; index += 1) tone(index * 0.14, 'square', 440 + index * 110, 440 + index * 110, 0.12, 0.2);
      bell(0.6, 1568, 0.3);
    },
    start() {
      bell(0, 784, 0.3);
      bell(0.12, 1047, 0.3);
      bell(0.24, 1568, 0.3);
    },
    over() {
      bell(0, 1047, 0.35);
      bell(0.25, 784, 0.3);
      bell(0.5, 523, 0.4);
    },
  };

  return {
    /** Starts the audio engine; browsers allow it only after a key press or click. */
    unlock() {
      ensure();
    },
    play(name, argument) {
      if (muted || !ensure()) return;
      const sound = sounds[name];
      if (sound) sound(argument);
    },
    /** Keeps the pan sizzle running at `level` (0 silent .. 1 loud). */
    setSizzle(level) {
      if (context === null) return;
      if (sizzleGain === null) {
        const source = context.createBufferSource();
        source.buffer = noise;
        source.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 4200;
        filter.Q.value = 0.7;
        sizzleGain = context.createGain();
        sizzleGain.gain.value = 0;
        source.connect(filter).connect(sizzleGain).connect(master);
        source.start();
      }
      sizzleGain.gain.setTargetAtTime(muted ? 0 : level * 0.2, context.currentTime, 0.08);
    },
    toggleMute() {
      muted = !muted;
      if (sizzleGain !== null && muted) sizzleGain.gain.value = 0;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
