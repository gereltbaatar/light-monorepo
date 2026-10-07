"use client";

import { X } from "lucide-react";
import { DrawerClose } from "@workspace/ui/components/drawer";

const NOTCH = "M0,0 C20,0 22,26 56,26 C90,26 92,0 112,0";

// 43px radius = 55px iPhone display corner minus this 12px gap.
export const SHEET_GAP_CLASS = "inset-x-4 bottom-4";

const NOTCH_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='112' height='44'><path d='${NOTCH} L112,44 L0,44 Z'/></svg>`,
)}")`;

// Cuts the notch out of full-bleed content: two top shoulders, the dip, then the body.
const BLEED_MASK: React.CSSProperties = {
  maskImage: `linear-gradient(#000,#000), linear-gradient(#000,#000), ${NOTCH_MASK}, linear-gradient(#000,#000)`,
  maskSize:
    "calc(50% - 55px) 44px, calc(50% - 55px) 44px, 112px 44px, 100% calc(100% - 43px)",
  maskPosition: "left top, right top, center top, left bottom",
  maskRepeat: "no-repeat",
  WebkitMaskImage: `linear-gradient(#000,#000), linear-gradient(#000,#000), ${NOTCH_MASK}, linear-gradient(#000,#000)`,
  WebkitMaskSize:
    "calc(50% - 55px) 44px, calc(50% - 55px) 44px, 112px 44px, 100% calc(100% - 43px)",
  WebkitMaskPosition: "left top, right top, center top, left bottom",
  WebkitMaskRepeat: "no-repeat",
};

const CloseButton = ({ label }: { label: string }) => (
  <DrawerClose asChild>
    <button
      type="button"
      aria-label={label}
      className="absolute -top-6 left-1/2 z-10 flex size-11 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-transform active:scale-90"
    >
      <X className="size-5" strokeWidth={2.5} />
    </button>
  </DrawerClose>
);

// Sheet body whose top edge dips around a floating close button.
export const NotchedCard = ({
  closeLabel,
  bleed = false,
  children,
}: {
  closeLabel: string;
  /** Content fills the whole card, notch included (e.g. a camera feed). */
  bleed?: boolean;
  children: React.ReactNode;
}) =>
  bleed ? (
    <div className="relative">
      <CloseButton label={closeLabel} />
      <div
        className="overflow-hidden rounded-[43px] bg-background"
        style={BLEED_MASK}
      >
        {children}
      </div>
    </div>
  ) : (
    <div className="relative">
      <CloseButton label={closeLabel} />

      <div className="flex h-11" aria-hidden>
        <div className="flex-1 rounded-tl-[43px] border-l border-t border-border bg-background" />
        <svg
          width={112}
          height={44}
          viewBox="0 0 112 44"
          className="-mx-px block shrink-0"
        >
          <path d={`${NOTCH} L112,44 L0,44 Z`} fill="var(--background)" />
          <path
            d={NOTCH}
            transform="translate(0 0.5)"
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
        </svg>
        <div className="flex-1 rounded-tr-[43px] border-r border-t border-border bg-background" />
      </div>

      <div className="max-h-[calc(100dvh-120px)] overflow-y-auto rounded-b-[43px] border-x border-b border-border bg-background">
        {children}
      </div>
    </div>
  );
