import { GoogleButton } from "./GoogleButton";
import { AuthDivider } from "./AuthDivider";

export function SocialButtons() {
  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth
    console.log("Google sign in clicked");
  };

  return (
    <div className="space-y-6">
      <GoogleButton onClick={handleGoogleSignIn} />
      <AuthDivider />
    </div>
  );
}
