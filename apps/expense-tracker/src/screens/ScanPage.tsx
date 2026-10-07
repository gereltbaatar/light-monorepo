"use client";

import { useRouter } from "next/navigation";
import { ScanSheet } from "@/components/scan/ScanSheet";

// Direct visits to /scan open the same sheet the bottom nav does.
const ScanPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background">
            <ScanSheet
                open
                onOpenChange={(open) => {
                    if (!open) router.push("/");
                }}
            />
        </div>
    );
};

export default ScanPage;
