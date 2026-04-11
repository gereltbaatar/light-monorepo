import { SearchBar } from "./SearchBar";
import { AccountSettings } from "./AccountSettings";

interface SettingsContentProps {
  activeSection: string;
}

export function SettingsContent({ activeSection }: SettingsContentProps) {
  return (
    <main className="flex-1 p-8">
      <div className="max-w-4xl">
        <SearchBar />

        {activeSection === "account" && <AccountSettings />}

        {activeSection === "preferences" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Preferences</h2>
            <p className="text-zinc-400">Preferences settings...</p>
          </div>
        )}

        {activeSection === "refer" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Refer & Earn</h2>
            <p className="text-zinc-400">Referral program details...</p>
          </div>
        )}

        {activeSection === "company" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Company Settings</h2>
            <p className="text-zinc-400">Company settings...</p>
          </div>
        )}

        {activeSection === "banking" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Banking</h2>
            <p className="text-zinc-400">Banking information...</p>
          </div>
        )}

        {activeSection === "connect" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              Connect New Account
            </h2>
            <p className="text-zinc-400">Connect account flow...</p>
          </div>
        )}
      </div>
    </main>
  );
}
