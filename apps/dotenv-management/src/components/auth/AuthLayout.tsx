import { CardContent } from "@workspace/ui";
import EvilEye from "@/components/EvilEye";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left side - Animated Evil Eye Background */}
      <div className="hidden lg:flex lg:w-2/3 relative">
        <div className="absolute inset-1" >
          <EvilEye
            eyeColor="#FF6F37"
            intensity={1.2}
            pupilSize={0.6}
            irisWidth={0.25}
            glowIntensity={0.4}
            scale={0.6}
            noiseScale={1}
            pupilFollow={1}
            flameSpeed={0.8}
            backgroundColor="#000000"
          />
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <CardContent>{children}</CardContent>
        </div>
      </div>
    </div>
  );
}