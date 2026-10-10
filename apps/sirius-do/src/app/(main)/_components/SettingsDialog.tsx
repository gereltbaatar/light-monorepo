"use client";

import { useActionState, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { AudioLines, Check, Globe, Monitor, Moon, Search, SlidersHorizontal, Sparkles, Sun, UserRound, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { useAiFeatures } from "@workspace/sirius-core/components/AiSettingsProvider";
import { OrbSettings } from "@workspace/sirius-core/components/OrbSettings";
import { AI_FEATURES, type AiFeature } from "@workspace/sirius-core/lib/ai-features";
import { getAiUsage, setAiFeature, setVoiceOrbSettings, type AiUsage } from "@/app/_actions/ai";
import { setLocale, updateAvatarUrl, updateDisplayName, type SettingsActionResult } from "@/app/_actions/settings";
import { isUploadConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { useI18n } from "@/lib/i18n/client";
import { LOCALES, LOCALE_ENGLISH_NAMES, LOCALE_NAMES } from "@/lib/i18n/config";
import { DEFAULT_THEME, THEME_STORAGE_KEY, applyTheme, isTheme, type Theme } from "@/lib/theme";
import { UserAvatar, type SidebarUser } from "./UserAvatar";

type Tab = "account" | "general" | "language" | "ai" | "orb";

const TABS: { id: Tab; icon: LucideIcon }[] = [
  { id: "account", icon: UserRound },
  { id: "general", icon: SlidersHorizontal },
  { id: "language", icon: Globe },
  { id: "ai", icon: Sparkles },
  { id: "orb", icon: AudioLines },
];

const THEME_ICONS: Record<Theme, LucideIcon> = { system: Monitor, light: Sun, dark: Moon };

const themeListeners = new Set<() => void>();

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  applyTheme(theme);
  themeListeners.forEach((l) => l());
}

const SELECT_OPTION =
  "flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60 aria-pressed:bg-app/15";

function AccountTab({ user }: { user: SidebarUser }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<SettingsActionResult, FormData>(updateDisplayName, undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await updateAvatarUrl(await uploadToCloudinary(file));
      if (result && "error" in result) setUploadError(result.error);
    } catch {
      setUploadError(t.errors.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} className="size-16 text-xl" />
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t.settings.photo}</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || !isUploadConfigured()}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? t.settings.uploading : t.settings.changePhoto}
          </Button>
          {!isUploadConfigured() && <p className="text-xs text-muted-foreground">{t.errors.uploadNotConfigured}</p>}
          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        </div>
      </div>

      <form action={action} className="space-y-4">
        <label className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">{t.settings.name}</span>
          <div className="flex gap-2">
            <Input name="display_name" defaultValue={user.name} maxLength={60} required />
            <Button type="submit" disabled={pending}>
              {pending ? t.settings.saving : t.settings.save}
            </Button>
          </div>
        </label>
        {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}
        {state && "ok" in state && <p className="text-xs text-muted-foreground">{t.settings.saved}</p>}

        <label className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">{t.settings.email}</span>
          <Input value={user.email} readOnly disabled />
        </label>
      </form>
    </div>
  );
}

function LanguageTab() {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = LOCALES.filter((l) => !q || `${LOCALE_NAMES[l]} ${LOCALE_ENGLISH_NAMES[l]}`.toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      <label className="flex h-11 items-center gap-2.5 rounded-xl border bg-background px-3.5 transition-colors focus-within:border-app focus-within:ring-2 focus-within:ring-app/25">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.settings.searchLanguages}
          aria-label={t.settings.searchLanguages}
          className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      {matches.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t.settings.noLanguages}</p>
      ) : (
        <div className="grid gap-1 sm:grid-cols-2">
          {matches.map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={l === locale}
              disabled={pending}
              onClick={() => startTransition(async () => void (await setLocale(l)))}
              className={SELECT_OPTION}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{LOCALE_NAMES[l]}</span>
                <span className="block truncate text-sm text-muted-foreground">{LOCALE_ENGLISH_NAMES[l]}</span>
              </span>
              {l === locale && <Check className="mt-1 size-4 shrink-0 text-app" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneralTab() {
  const { t } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME);

  return (
    <div className="divide-y">
      <div className="flex items-center justify-between gap-4 py-2">
        <span className="text-sm">{t.settings.theme}</span>
        <div role="radiogroup" aria-label={t.settings.theme} className="flex gap-1 rounded-lg bg-muted p-1">
          {(Object.keys(THEME_ICONS) as Theme[]).map((value) => {
            const Icon = THEME_ICONS[value];
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={value === theme}
                aria-label={t.settings.themes[value]}
                title={t.settings.themes[value]}
                onClick={() => saveTheme(value)}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-sm aria-checked:ring-1 aria-checked:ring-border"
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeatureSwitch({ feature, initial }: { feature: AiFeature; initial: boolean }) {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    setEnabled(next);
    startTransition(async () => {
      const result = await setAiFeature(feature, next);
      if ("error" in result) {
        setEnabled(!next);
        toast.error(t.ai.failed);
      }
    });
  };

  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{t.ai.featureNames[feature]}</span>
        <span className="block text-xs text-muted-foreground">{t.ai.featureHints[feature]}</span>
      </span>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={pending} />
    </label>
  );
}

const tokens = (n: number) => n.toLocaleString("en-US");
const mnt = (n: number) => `${n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString("en-US")}₮`;

function AiUsageStats({ usage }: { usage: AiUsage }) {
  const { t } = useI18n();
  if (!usage.available) return <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">{t.ai.notSetUp}</p>;

  const average = usage.scans ? usage.costMnt / usage.scans : 0;
  const stats = [
    { label: t.ai.thisMonth, value: mnt(usage.monthCostMnt), hint: t.ai.requests(usage.monthScans) },
    { label: t.ai.allTime, value: mnt(usage.costMnt), hint: t.ai.requests(usage.scans) },
    { label: t.ai.perRequest, value: mnt(average), hint: t.ai.average },
    { label: t.ai.tokens, value: tokens(usage.inputTokens + usage.outputTokens + usage.thinkingTokens), hint: t.ai.tokensHint },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>
      {usage.recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.ai.empty}</p>
      ) : (
        <div className="divide-y rounded-xl border">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.ai.recent}</p>
          {usage.recent.map((row) => (
            <div key={row.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="truncate text-muted-foreground">{row.model}</span>
              <span className="font-medium">{mnt(row.costMnt)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t.ai.costNote(usage.usdToMnt.toLocaleString("en-US"))}</p>
    </>
  );
}

function AiTab({ usage }: { usage: AiUsage | null }) {
  const { t } = useI18n();
  const features = useAiFeatures();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t.ai.shared}</p>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.ai.features}</p>
        <div className="divide-y">
          {AI_FEATURES.map((feature) => (
            <FeatureSwitch key={feature} feature={feature} initial={features[feature]} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.ai.usage}</p>
        {usage ? <AiUsageStats usage={usage} /> : <p className="text-sm text-muted-foreground">{t.ai.loading}</p>}
      </div>
    </div>
  );
}

interface SettingsDialogProps {
  user: SidebarUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ user, open, onOpenChange }: SettingsDialogProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("account");
  const [usage, setUsage] = useState<AiUsage | null>(null);

  const selectTab = (id: Tab) => {
    setTab(id);
    if (id === "ai") void getAiUsage().then(setUsage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden bg-card p-0 sm:rounded-xl">
        <div className="flex min-h-[440px] flex-col sm:flex-row">
          <nav className="flex shrink-0 gap-1 border-b bg-muted/40 p-2 sm:w-48 sm:flex-col sm:border-b-0 sm:border-r">
            <DialogTitle className="hidden px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground sm:block">{t.settings.title}</DialogTitle>
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
              >
                <Icon className="size-4" />
                {t.settings[id]}
              </button>
            ))}
          </nav>
          <section className="max-h-[80vh] flex-1 overflow-y-auto p-6">
            <h2 className="mb-5 border-b pb-3 text-lg font-semibold tracking-tight">{t.settings[tab]}</h2>
            {tab === "account" && <AccountTab user={user} />}
            {tab === "general" && <GeneralTab />}
            {tab === "language" && <LanguageTab />}
            {tab === "ai" && <AiTab usage={usage} />}
            {tab === "orb" && <OrbSettings labels={t.orb} onSave={setVoiceOrbSettings} onError={toast.error} />}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
