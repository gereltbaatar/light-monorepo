"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ImageIcon, PenLine, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DrawerTitle } from "@workspace/ui/components/drawer";
import { useT } from "@/lib/i18n/client";
import { scanDict } from "@/lib/i18n/dictionaries/scan";

interface ScanStepProps {
    /** Called with the captured receipt once the user accepts the shot. */
    onCaptured: (file: File) => void;
    /** Skip scanning and go straight to typing it in. */
    onEnterManually: () => void;
    /** Rendered over the camera, e.g. while the receipt is being read. */
    overlay?: React.ReactNode;
}

type CameraState = "idle" | "starting" | "live" | "denied" | "unavailable";

export const ScanStep = ({
    onCaptured,
    onEnterManually,
    overlay,
}: ScanStepProps) => {
    const t = useT(scanDict);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [cameraState, setCameraState] = useState<CameraState>("idle");
    const [preview, setPreview] = useState<{ url: string; file: File } | null>(
        null
    );
    /** Brief white flash on capture, mimicking a native shutter. */
    const [flashing, setFlashing] = useState(false);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    const startCamera = useCallback(async () => {
        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices?.getUserMedia
        ) {
            setCameraState("unavailable");
            return;
        }

        setCameraState("starting");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                // Rear camera on phones; harmless on desktop webcams.
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {
                    /* autoplay rejection is not fatal — the frame still renders */
                });
            }
            setCameraState("live");
        } catch {
            // Covers both an explicit denial and a device with no usable camera.
            setCameraState("denied");
        }
    }, []);

    // Start on mount, and always release the camera when leaving the page so
    // the device indicator light does not stay on.
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    // Revoke the object URL when the preview changes or goes away.
    useEffect(() => {
        const url = preview?.url;
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [preview?.url]);

    const capture = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;

        setFlashing(true);
        window.setTimeout(() => setFlashing(false), 180);
        // A short vibration if the device supports it — matches the flash.
        navigator.vibrate?.(12);

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const file = new File([blob], `receipt-${Date.now()}.jpg`, {
                    type: "image/jpeg",
                });
                setPreview({ url: URL.createObjectURL(file), file });
                stopCamera();
            },
            "image/jpeg",
            0.9
        );
    };

    const handlePickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setPreview({ url: URL.createObjectURL(file), file });
        stopCamera();
        // Allow re-picking the same file later.
        event.target.value = "";
    };

    const retake = () => {
        setPreview(null);
        startCamera();
    };

    return (
        <div>
            <DrawerTitle className="sr-only">
                {preview ? t.happyWithShot : t.positionReceipt}
            </DrawerTitle>

            <div className="relative h-[66dvh] max-h-[640px] bg-neutral-900">
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- blob: URL, not an optimizable asset
                    <img
                        src={preview.url}
                        alt={t.capturedAlt}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}

                {/* Framing guide */}
                {!preview && cameraState === "live" && (
                    <div className="pointer-events-none absolute inset-x-6 bottom-28 top-12 rounded-[24px] border-2 border-dashed border-white/60" />
                )}

                {/* Camera unavailable / starting */}
                {!preview && cameraState !== "live" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-10 pb-20 text-center">
                        <Camera className="h-9 w-9 text-white/70" />
                        <p className="text-sm text-white/70">
                            {cameraState === "starting"
                                ? t.startingCamera
                                : cameraState === "denied"
                                  ? t.cameraDenied
                                  : cameraState === "unavailable"
                                    ? t.cameraUnavailable
                                    : ""}
                        </p>
                    </div>
                )}

                {/* Controls sit on the camera, as in a native capture sheet */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-5 pt-14">
                    <AnimatePresence mode="wait" initial={false}>
                        {preview ? (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="flex items-center gap-3"
                            >
                                <RoundControl
                                    onClick={retake}
                                    label={t.retake}
                                    icon={<RotateCcw className="h-5 w-5" />}
                                />

                                <motion.button
                                    type="button"
                                    onClick={() => onCaptured(preview.file)}
                                    whileTap={{ scale: 0.97 }}
                                    aria-label={t.useThisReceipt}
                                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-neutral-100 text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
                                >
                                    <Check className="h-[18px] w-[18px]" strokeWidth={2.2} />
                                    {t.useReceipt}
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="capture"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="flex items-center justify-between"
                            >
                                <RoundControl
                                    onClick={() => fileInputRef.current?.click()}
                                    label={t.gallery}
                                    icon={<ImageIcon className="h-5 w-5" />}
                                />

                                {/* Shutter */}
                                <motion.button
                                    type="button"
                                    onClick={capture}
                                    disabled={cameraState !== "live"}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                                    aria-label={t.captureReceipt}
                                    className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full disabled:opacity-35"
                                >
                                    <span className="absolute inset-0 rounded-full border-[3px] border-white/90" />
                                    <span className="h-14 w-14 rounded-full bg-white shadow-[inset_0_-2px_6px_rgba(0,0,0,0.12)]" />
                                    {cameraState === "live" && (
                                        <motion.span
                                            className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-white"
                                            animate={{ scale: [1, 1.16], opacity: [0.5, 0] }}
                                            transition={{
                                                duration: 1.9,
                                                repeat: Infinity,
                                                ease: "easeOut",
                                            }}
                                        />
                                    )}
                                </motion.button>

                                <RoundControl
                                    onClick={onEnterManually}
                                    label={t.manual}
                                    icon={<PenLine className="h-5 w-5" />}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Shutter flash */}
                <AnimatePresence>
                    {flashing && (
                        <motion.div
                            className="pointer-events-none absolute inset-0 bg-white"
                            initial={{ opacity: 0.85 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                        />
                    )}
                </AnimatePresence>

                {overlay}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePickFile}
                className="hidden"
            />
        </div>
    );
};

// Dark glass circle so the icon reads on any camera image.
const RoundControl = ({
    onClick,
    label,
    icon,
}: {
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}) => (
    <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        aria-label={label}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
    >
        {icon}
    </motion.button>
);
