import { ShootingStars } from "@workspace/ui/components/shooting-stars";
import { StarsBackground } from "@workspace/ui/components/stars-background";

export function StarsArt() {
  return (
    <div className="absolute inset-0 bg-black">
      <ShootingStars minDelay={400} maxDelay={1500} starColor="#E0F2FF" trailColor="#3B82F6" starWidth={14} starHeight={1.5} />
      <StarsBackground starRgb="200, 225, 255" starRadius={0.9} starDensity={0.0002} />
    </div>
  );
}
