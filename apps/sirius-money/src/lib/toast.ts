"use client";

import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
}

export interface IslandToast extends ToastOptions {
    id: number;
    type: ToastType;
    title: string;
    duration: number;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
    success: 4000,
    info: 4000,
    warning: 5000,
    error: 5000,
};

const EMPTY: IslandToast[] = [];
let queue: IslandToast[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const push =
    (type: ToastType) =>
    (title: string, options: ToastOptions = {}) => {
        const id = nextId++;
        queue = [...queue, { ...options, id, type, title, duration: options.duration ?? DEFAULT_DURATION[type] }];
        emit();
        return id;
    };

export function dismissToast(id: number) {
    queue = queue.filter((item) => item.id !== id);
    emit();
}

// Same call shape as sonner, so call sites only change their import.
export const toast = {
    success: push("success"),
    error: push("error"),
    warning: push("warning"),
    info: push("info"),
    dismiss: dismissToast,
};

export function useToastQueue() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => queue,
        () => EMPTY
    );
}
