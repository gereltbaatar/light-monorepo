import { SIRIUS_APPS } from "@workspace/sirius-core/lib/apps";

// The other Sirius apps share this session, so plain links suffice.
export const SiriusApps = () => {
    return (
        <nav className="w-full px-4 pt-4 flex gap-4 text-sm font-semibold text-muted-foreground">
            {SIRIUS_APPS.filter((app) => app.id !== "money" && app.url).map((app) => (
                <a key={app.id} href={app.url} className="hover:text-foreground transition-colors">
                    {app.name}
                </a>
            ))}
        </nav>
    );
};
