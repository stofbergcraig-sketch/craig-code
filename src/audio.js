// Original procedural sound effects. No external recordings, files or accounts.
export class GameAudio {
  constructor() {
    this.context = null; this.volume = .65; this.last = new Map(); this.stepTime = 0;
  }
  unlock() {
    try {
      if (!this.context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return;
        this.context = new Audio();
        this.master = this.context.createGain(); this.master.gain.value = this.volume * .65;
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = -14; compressor.knee.value = 14; compressor.ratio.value = 8;
        compressor.attack.value = .002; compressor.release.value = .12;
        this.master.connect(compressor); compressor.connect(this.context.destination);
        const frames = this.context.sampleRate * 2;
        this.noiseBuffer = this.context.createBuffer(1, frames, this.context.sampleRate);
        const channel = this.noiseBuffer.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < frames; i++) { previous = .25 * previous + .75 * (Math.random() * 2 - 1); channel[i] = previous; }
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    } catch { /* Browsers without Web Audio still get the complete game. */ }
  }
  setVolume(value) {
    this.volume = Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : .65;
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume * .65, this.context.currentTime, .025);
  }
  tone(freq, end, length, volume, type = 'sine', delay = 0) {
    const ctx = this.context, t = ctx.currentTime + delay;
    const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = type;
    osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + length);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), t + .003);
    gain.gain.exponentialRampToValueAtTime(.0001, t + length);
    osc.connect(gain); gain.connect(this.master); osc.start(t); osc.stop(t + length + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  noise(length, volume, cutoff = 1600, type = 'lowpass', delay = 0, endCutoff) {
    const ctx = this.context, t = ctx.currentTime + delay;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = this.noiseBuffer; source.playbackRate.value = .8 + Math.random() * .4;
    filter.type = type; filter.frequency.setValueAtTime(cutoff, t); filter.Q.value = .65;
    if (endCutoff) filter.frequency.exponentialRampToValueAtTime(endCutoff, t + length);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), t + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, t + length);
    source.connect(filter); filter.connect(gain); gain.connect(this.master);
    source.start(t, Math.random() * .6); source.stop(t + length + .02);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  play(name, intensity = 1) {
    if (!this.context || this.context.state !== 'running' || this.volume <= 0) return;
    const t = this.context.currentTime;
    const throttle = { kill: .065, hit: .035, hurt: .18, step: .12, coin: .1, explosion: .06, slam: .1 }[name] ?? .025;
    if (t - (this.last.get(name) ?? -1) < throttle) return;
    this.last.set(name, t);
    const v = Math.max(.05, Math.min(1.5, intensity)), p = .92 + Math.random() * .16;
    switch (name) {
      case 'magic':
        this.tone(520,155,.22,.25*v,'triangle');this.tone(970,390,.16,.1*v);this.noise(.15,.14*v,2300,'bandpass');break;
      case 'bolt':
        this.noise(.12,.3*v,2300,'bandpass');this.tone(145,50,.1,.22*v,'triangle');break;
      case 'hook':
        this.noise(.35,.3*v,1700,'highpass');[640,820,540].forEach((f,i)=>this.tone(f,170,.08,.1*v,'triangle',i*.07));break;
      case 'lightning':
        this.noise(.26,.4*v,4200,'bandpass');this.tone(75,38,.22,.3*v,'sawtooth');break;
      case 'charge':
        this.tone(160,760,.7,.26*v,'triangle');this.noise(.65,.12*v,800,'bandpass',0,2400);break;
      case 'legendary':
        [220,330,440,660,880].forEach((f,i)=>this.tone(f,f*1.01,.7,.18*v,'triangle',i*.09));this.noise(.7,.3*v,1700);break;
      case 'wind':this.noise(.9,.035*v,450,'bandpass');break;
      case 'swing':
        this.noise(.16, .45 * v, 1000, 'bandpass', 0, 3200); this.tone(130, 65, .13, .12 * v); break;
      case 'punch':
        this.noise(.11, .48 * v, 900, 'lowpass'); this.tone(140 * p, 43, .11, .56 * v); break;
      case 'hit':
        this.noise(.09, .65 * v, 2200); this.tone(165 * p, 47, .14, .48 * v);
        this.tone(570 * p, 180, .07, .08 * v, 'triangle'); break;
      case 'kill':
        this.noise(.11, .22 * v, 1400, 'bandpass');
        this.tone(320 * p, 110, .15, .11 * v, 'sawtooth'); this.tone(980 * p, 720, .045, .035 * v); break;
      case 'shotgun':
        this.noise(.26, .95 * v, 6000, 'lowpass', 0, 300);
        this.tone(160, 35, .30, .9 * v); this.noise(.06, .65 * v, 4200, 'highpass');
        this.noise(.12, .23 * v, 1400, 'bandpass', .12); this.tone(1400, 680, .055, .10 * v, 'square', .23); break;
      case 'repeater':
        this.noise(.105, .65 * v, 5000, 'lowpass', 0, 600); this.tone(150, 52, .11, .57 * v);
        this.tone(1200, 600, .025, .07 * v, 'square', .035); break;
      case 'reload':
        this.noise(.09, .33 * v, 3100, 'bandpass'); this.tone(1200, 650, .07, .12 * v, 'triangle');
        for (let i = 0; i < 3; i++) { this.tone(1700 - i * 180, 620, .055, .10 * v, 'triangle', .25 + i * .28); this.noise(.04, .17 * v, 2400, 'highpass', .27 + i * .28); }
        this.noise(.09, .32 * v, 1700, 'bandpass', 1.1); break;
      case 'empty':
        this.tone(1300, 600, .025, .14 * v, 'square'); this.noise(.028, .17 * v, 2500); break;
      case 'jump':
        this.noise(.12, .21 * v, 700, 'bandpass', 0, 1700); this.tone(95, 190, .12, .13 * v); break;
      case 'land':
        this.noise(.15, .3 * v, 750); this.tone(80, 32, .17, .3 * v); break;
      case 'dash':
        this.noise(.28, .43 * v, 600, 'bandpass', 0, 3800); this.tone(90, 240, .15, .15 * v, 'triangle'); break;
      case 'slam': case 'explosion':
        this.noise(.55, .85 * v, 2200, 'lowpass', 0, 130); this.tone(150, 28, .50, .85 * v);
        this.noise(.14, .40 * v, 4500, 'highpass', .03); break;
      case 'trap':
        this.tone(110, 55, .20, .35 * v, 'triangle'); this.noise(.18, .35 * v, 1500, 'bandpass');
        this.tone(650, 1200, .18, .12 * v, 'sine', .08); break;
      case 'coin': case 'secret':
        this.tone(1100, 1200, .16, .13 * v); this.tone(1700, 1900, .17, .09 * v, 'sine', .05); break;
      case 'buy': case 'unlock':
        [330, 440, 660, 880].forEach((f, i) => this.tone(f, f * 1.01, .23, .16 * v, 'triangle', i * .065)); break;
      case 'hurt':
        this.noise(.18, .36 * v, 1300); this.tone(130, 52, .17, .32 * v, 'triangle'); break;
      case 'death':
        [220, 165, 110].forEach((f, i) => this.tone(f, f * .75, .5, .18 * v, 'triangle', i * .2)); break;
      case 'victory':
        [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.tone(f, f, .6, .17 * v, 'triangle', i * .12);
          this.tone(f / 2, f / 2, .65, .10 * v, 'sine', i * .12);
        }); break;
      case 'step':
        this.noise(.075, .13 * v, 600); this.tone(75 * p, 35, .06, .09 * v); break;
    }
  }
  update(dt, speed = 0, grounded = true) {
    this.stepTime -= dt;
    if (grounded && speed > 2 && this.stepTime <= 0) {
      this.stepTime = Math.max(.19, .43 - speed * .011);
      this.play('step', Math.min(1, speed / 12));
    }
  }
}
