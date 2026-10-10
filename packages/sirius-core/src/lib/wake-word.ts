"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

interface RecognitionResultEvent {
    resultIndex: number;
    results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface Recognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: RecognitionResultEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

type RecognitionConstructor = new () => Recognition;

// English recognition often hears "Sirius" as "serious", so the word must stand alone to count.
const WAKE_PATTERN = /^(?:(?:hi|hey|ok|okay)[\s,]+)?(?:sirius|serious|syrius|sirus|sirious|cyrus)[.!?]?$/i;
const STORAGE_KEY = "voice-wake-enabled";
const listeners = new Set<() => void>();

function getRecognition(): RecognitionConstructor | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
        SpeechRecognition?: RecognitionConstructor;
        webkitSpeechRecognition?: RecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const readEnabled = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        return false;
    }
};

export function setWakeWordEnabled(enabled: boolean) {
    try {
        localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
        // Private mode: the toggle just won't persist.
    }
    listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function useWakeWordSetting() {
    const enabled = useSyncExternalStore(subscribe, readEnabled, () => false);
    const supported = useSyncExternalStore(subscribe, () => getRecognition() !== null, () => false);
    return { enabled, supported };
}

// Listens for "Sirius" while the page is visible; Chrome-only, iOS has no engine for it.
export function useWakeWord(onWake: () => void, paused: boolean) {
    const { enabled, supported } = useWakeWordSetting();
    const onWakeRef = useRef(onWake);

    useEffect(() => {
        onWakeRef.current = onWake;
    }, [onWake]);

    useEffect(() => {
        const Ctor = getRecognition();
        if (!enabled || !supported || paused || !Ctor) return;

        let active = true;
        let recognition: Recognition | null = null;
        let restartTimer: ReturnType<typeof setTimeout> | null = null;

        const launch = () => {
            if (!active || document.visibilityState !== "visible") return;
            recognition = new Ctor();
            recognition.lang = "en-US";
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    // Final results only, so "serious" can't fire midway through a longer sentence.
                    if (result.isFinal && WAKE_PATTERN.test(result[0].transcript.trim())) {
                        active = false;
                        recognition?.abort();
                        onWakeRef.current();
                        return;
                    }
                }
            };
            // Chrome ends sessions after a pause; keep listening until disabled.
            recognition.onend = () => {
                if (active) restartTimer = setTimeout(launch, 400);
            };
            recognition.onerror = (event) => {
                if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                    active = false;
                    setWakeWordEnabled(false);
                }
            };
            try {
                recognition.start();
            } catch {
                restartTimer = setTimeout(launch, 1000);
            }
        };

        const onVisibility = () => {
            if (document.visibilityState === "visible") launch();
            else recognition?.abort();
        };

        launch();
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            active = false;
            if (restartTimer) clearTimeout(restartTimer);
            document.removeEventListener("visibilitychange", onVisibility);
            recognition?.abort();
        };
    }, [enabled, supported, paused]);
}
