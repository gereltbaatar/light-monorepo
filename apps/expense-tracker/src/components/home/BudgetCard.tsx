"use client";

import { Ellipsis } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export const BudgetCard = () => {
    const percentage = 20;

    return (
        <div className="h-[220px] w-[155px] bg-[#F8F9FA] shrink-0 rounded-2xl">
            <div className="w-full h-full px-3 py-3 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-lg font-bold text-[#343A40] tracking-tight">
                        Budget
                    </p>
                    <Ellipsis color="#343A40" size={24} strokeWidth={2} />
                </div>

                {/* Circular Progress */}
                <div className="w-20 h-20 mx-auto mb-3">
                    <CircularProgressbar
                        value={percentage}
                        text={`${percentage}%`}
                        styles={buildStyles({
                            textSize: "28px",
                            pathColor: "#343A40",
                            textColor: "#343A40",
                            trailColor: "rgba(52, 58, 64, 0.1)",
                            strokeLinecap: "round",
                        })}
                        strokeWidth={8}
                    />
                </div>

                {/* Goal Info */}
                <div className="text-center mt-auto">
                    <p className="text-sm font-semibold text-[#343A40] mb-0.5">
                        New Bicycle
                    </p>
                    <p className="text-xs text-[#8E8E93]">1 Dec 2023</p>
                </div>
            </div>
        </div>
    );
};