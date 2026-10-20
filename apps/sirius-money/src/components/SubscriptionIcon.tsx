import { SUBSCRIPTION_ICONS, type SubscriptionIconId } from "@/lib/subscription-icons";

interface SubscriptionIconProps {
    id: SubscriptionIconId;
    className?: string;
}

// Monochrome on purpose: several brand colors are black and vanish in dark mode.
export const SubscriptionIcon = ({ id, className }: SubscriptionIconProps) => {
    const icon = SUBSCRIPTION_ICONS[id];
    return (
        <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <title>{icon.title}</title>
            <path d={icon.path} />
        </svg>
    );
};
