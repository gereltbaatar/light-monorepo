import { Button } from "@workspace/ui";
import { GoogleIcon } from "./ui/Google";

interface GoogleButtonProps {
  onClick?: () => void;
}

export function GoogleButton({ onClick }: GoogleButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full flex items-center justify-center gap-2 h-13 bg-white hover:bg-gray-50 border-2 border-zinc-300 hover:border-zinc-400 text-zinc-900 rounded-2xl transition-all font-medium"
      type="button"
    >
      <GoogleIcon size={24} />
      <span className="text-base font-semibold">Continue with Google</span>
    </Button>
  );
}
