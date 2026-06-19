// Procedural Audio Synthesizer using Web Audio API
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.engineOsc = null;
        this.engineGain = null;
        this.isMuted = false;
    }

    // Initialize audio context on user interaction
    init() {
        if (this.ctx) return;
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            
            // Master gain node
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime); // Standard comfortable volume
            this.masterVolume.connect(this.ctx.destination);
            
            this.initEngineSound();
        } catch (e) {
            console.warn("Web Audio API not supported in this browser:", e);
        }
    }

    // Resume AudioContext if suspended (browser security)
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Continuous engine sound modulated by thrust
    initEngineSound() {
        if (!this.ctx) return;

        // Low frequency oscillator for rumble
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'triangle';
        this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime); // Very low frequency

        // Filter out extreme high frequencies for a muffled engine hum
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.masterVolume);
        
        this.engineOsc.start();
    }

    // Adjust engine sound based on thrust status
    setEngineThrust(isActive, speedRatio = 0.5) {
        if (!this.ctx || !this.engineGain || this.isMuted) return;
        
        const now = this.ctx.currentTime;
        if (isActive) {
            // Modulate frequency slightly with speed
            this.engineOsc.frequency.setTargetAtTime(45 + speedRatio * 35, now, 0.1);
            this.engineGain.gain.setTargetAtTime(0.12, now, 0.15); // Ramp up volume
        } else {
            this.engineGain.gain.setTargetAtTime(0.01, now, 0.3); // Fade down to quiet hum
        }
    }

    // Laser weapon sound
    laser(type = 'player') {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterVolume);

        if (type === 'player') {
            osc.type = 'sawtooth';
            // Sweep pitch from high to low
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
            
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'station') {
            // Heavy pulse laser
            osc.type = 'square';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } else {
            // Enemy plasma spit
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }

    // Warp Dash / Teleport sound
    warpDash() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.25); // Ascending whistle
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Shield impact chime
    shieldHit() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Procedural explosion noise
    explosion(size = 'small') {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        
        // Create noise buffer (white noise)
        const bufferSize = this.ctx.sampleRate * (size === 'large' ? 0.8 : size === 'medium' ? 0.4 : 0.2);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;

        // Filter noise to create rumble or puff
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        
        const gain = this.ctx.createGain();
        
        if (size === 'large') {
            filter.frequency.setValueAtTime(220, now);
            filter.frequency.exponentialRampToValueAtTime(30, now + 0.7);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        } else if (size === 'medium') {
            filter.frequency.setValueAtTime(400, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 0.35);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        } else {
            // Small pop
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        }

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        noiseSource.start(now);
        noiseSource.stop(now + (size === 'large' ? 0.8 : size === 'medium' ? 0.4 : 0.2));

        // For large explosions, add a low sub drop synth
        if (size === 'large' || size === 'medium') {
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(80, now);
            subOsc.frequency.linearRampToValueAtTime(20, now + 0.5);
            
            subGain.gain.setValueAtTime(0.3, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            subOsc.connect(subGain);
            subGain.connect(this.masterVolume);
            
            subOsc.start(now);
            subOsc.stop(now + 0.5);
        }
    }

    // Purchase / Upgrade UI chime
    upgrade() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (major chord)
        
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.06);
            
            gain.gain.setValueAtTime(0.08, now + index * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.25);
            
            osc.connect(gain);
            gain.connect(this.masterVolume);
            
            osc.start(now + index * 0.06);
            osc.stop(now + index * 0.06 + 0.25);
        });
    }

    // Station Docking hydraulic hiss
    dock() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        
        // Hiss sound (filtered white noise)
        const bufferSize = this.ctx.sampleRate * 0.6;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.6);
        filter.Q.setValueAtTime(2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        noiseSource.start(now);
        noiseSource.stop(now + 0.6);

        // Clank sound
        const osc = this.ctx.createOscillator();
        const clankGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.15);
        
        clankGain.gain.setValueAtTime(0.25, now);
        clankGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(clankGain);
        clankGain.connect(this.masterVolume);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

// Global instance
const sounds = new SoundSynth();
