"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useT } from "@/lib/i18n/client";
import { voiceDict } from "@/lib/i18n/dictionaries/voice";

export type RecorderState = "idle" | "recording" | "error";

const SILENCE_LEVEL = 0.02;
const SILENCE_AFTER_SPEECH_MS = 1600;
const NO_SPEECH_TIMEOUT_MS = 6000;
const MAX_RECORDING_MS = 20_000;

// Records until the speaker goes quiet, so a sentence needs no second tap.
export function useVoiceRecorder(onComplete: (audio: Blob) => void) {
    const [state, setState] = useState<RecorderState>("idle");
    // -1 tells the orb to fall back to its built-in animation.
    const levelRef = useRef(-1);
    const [error, setError] = useState<string | null>(null);
    const t = useT(voiceDict);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const contextRef = useRef<AudioContext | null>(null);
    const frameRef = useRef<number | null>(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const cleanup = useCallback(() => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        void contextRef.current?.close();
        contextRef.current = null;
        levelRef.current = -1;
    }, []);

    const stop = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") recorder.stop();
    }, []);

    const cancel = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder) recorder.onstop = null;
        if (recorder && recorder.state !== "inactive") recorder.stop();
        recorderRef.current = null;
        cleanup();
        setState("idle");
    }, [cleanup]);

    const start = useCallback(async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
            recorder.onstop = () => {
                cleanup();
                setState("idle");
                recorderRef.current = null;
                if (chunks.length) onCompleteRef.current(new Blob(chunks, { type: recorder.mimeType }));
            };
            recorderRef.current = recorder;

            const context = new AudioContext();
            contextRef.current = context;
            const analyser = context.createAnalyser();
            analyser.fftSize = 1024;
            context.createMediaStreamSource(stream).connect(analyser);
            const samples = new Float32Array(analyser.fftSize);

            const startedAt = performance.now();
            let heardSpeech = false;
            let quietSince = performance.now();

            const tick = () => {
                analyser.getFloatTimeDomainData(samples);
                let sum = 0;
                for (const s of samples) sum += s * s;
                const rms = Math.sqrt(sum / samples.length);
                levelRef.current = Math.min(1, rms * 8);

                const now = performance.now();
                if (rms > SILENCE_LEVEL) {
                    heardSpeech = true;
                    quietSince = now;
                }
                const quietFor = now - quietSince;
                const elapsed = now - startedAt;
                if (
                    (heardSpeech && quietFor > SILENCE_AFTER_SPEECH_MS) ||
                    (!heardSpeech && elapsed > NO_SPEECH_TIMEOUT_MS) ||
                    elapsed > MAX_RECORDING_MS
                ) {
                    stop();
                    return;
                }
                frameRef.current = requestAnimationFrame(tick);
            };

            recorder.start();
            setState("recording");
            frameRef.current = requestAnimationFrame(tick);
        } catch (err) {
            cleanup();
            setState("error");
            setError(
                err instanceof DOMException && err.name === "NotAllowedError"
                    ? t.micDenied
                    : t.micFailed
            );
        }
    }, [cleanup, stop, t]);

    useEffect(() => cancel, [cancel]);

    return { state, levelRef: levelRef as RefObject<number>, error, start, stop, cancel };
}
