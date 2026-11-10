let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function initAudio(): void {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function isSoundEnabled(): boolean {
    return soundEnabled;
}

export function toggleSound(): boolean {
    soundEnabled = !soundEnabled;
    return soundEnabled;
}

export function playSproutChime(): void {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const pitch = notes[Math.floor(Math.random() * notes.length)];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 0.9, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.2, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
}

export function playWaterSound(): void {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    for (let i = 0; i < 4; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const delay = i * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, now + delay);
        osc.frequency.exponentialRampToValueAtTime(400, now + delay + 0.08);

        gain.gain.setValueAtTime(0.05, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.09);
    }
}