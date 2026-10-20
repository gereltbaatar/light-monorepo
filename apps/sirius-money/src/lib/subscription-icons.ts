import {
    siAppletv,
    siApplemusic,
    siClaude,
    siCursor,
    siDiscord,
    siDropbox,
    siDuolingo,
    siFigma,
    siGithubcopilot,
    siGoogledrive,
    siGooglegemini,
    siIcloud,
    siMax,
    siNetflix,
    siNotion,
    siPerplexity,
    siPlaystation,
    siSpotify,
    siSteam,
    siTelegram,
    siX,
    siYoutube,
    siYoutubemusic,
    type SimpleIcon,
} from "simple-icons";

// Named imports keep unused brand paths out of the bundle.
export const SUBSCRIPTION_ICONS = {
    claude: siClaude,
    gemini: siGooglegemini,
    perplexity: siPerplexity,
    copilot: siGithubcopilot,
    cursor: siCursor,
    netflix: siNetflix,
    youtube: siYoutube,
    spotify: siSpotify,
    youtubeMusic: siYoutubemusic,
    appleMusic: siApplemusic,
    appleTv: siAppletv,
    max: siMax,
    icloud: siIcloud,
    googleDrive: siGoogledrive,
    dropbox: siDropbox,
    notion: siNotion,
    figma: siFigma,
    discord: siDiscord,
    telegram: siTelegram,
    x: siX,
    duolingo: siDuolingo,
    playstation: siPlaystation,
    steam: siSteam,
} satisfies Record<string, SimpleIcon>;

export type SubscriptionIconId = keyof typeof SUBSCRIPTION_ICONS;

export const SUBSCRIPTION_ICON_IDS = Object.keys(SUBSCRIPTION_ICONS) as SubscriptionIconId[];

// Black or white logo, whichever reads on the brand color.
export const logoColorOn = (hex: string) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return (0.299 * r! + 0.587 * g! + 0.114 * b!) / 255 > 0.6 ? "#000000" : "#ffffff";
};
