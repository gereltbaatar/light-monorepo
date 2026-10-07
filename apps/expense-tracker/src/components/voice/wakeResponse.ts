const CHIME_MS = 450;

// Resolves once the chime has finished so recording never captures it.
export function respondToWake(): Promise<void> {
    try {
        const context = new AudioContext();
        const now = context.currentTime;
        [880, 1320].forEach((frequency, i) => {
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = "sine";
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
            osc.connect(gain).connect(context.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.32);
        });
        setTimeout(() => void context.close(), 700);
    } catch {
        // No audio output available; recording still starts.
    }
    return new Promise((resolve) => setTimeout(resolve, CHIME_MS));
}
