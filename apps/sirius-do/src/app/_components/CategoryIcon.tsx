import { useId } from "react";
import { Tag, type LucideProps } from "lucide-react";
import { CATEGORY_ICONS } from "@/lib/categories";

interface CategoryIconProps extends LucideProps {
  icon: string;
  shaded?: boolean;
}

// Shaded mimics Money's grey 3D category art with a metallic stroke.
export function CategoryIcon({ icon, shaded, className, style, ...props }: CategoryIconProps) {
  const id = useId();
  const Icon = CATEGORY_ICONS[icon] ?? Tag;
  if (!shaded) return <Icon className={className} style={style} {...props} />;

  return (
    <Icon
      className={className}
      stroke={`url(#${id})`}
      strokeWidth={2.25}
      style={{ filter: "drop-shadow(0 2px 1.5px rgb(0 0 0 / 0.35))", ...style }}
      {...props}
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0%" stopColor="#d4d4d8" />
          <stop offset="55%" stopColor="#8e8e93" />
          <stop offset="100%" stopColor="#48484a" />
        </linearGradient>
      </defs>
    </Icon>
  );
}
