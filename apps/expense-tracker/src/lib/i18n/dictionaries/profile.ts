import { defineDictionary } from "../config";

type ProfileDict = {
    settings: {
        pauseNotifications: string;
        general: string;
        categories: string;
        aiUsage: string;
        language: string;
        appearance: string;
        voiceOrb: string;
        aiGroup: string;
    };
    goBack: string;
    theme: { system: string; light: string; dark: string };
    activity: {
        title: string;
        weekLabels: string[];
        monthLabels: string[];
        less: string;
        more: string;
        avatarAlt: string;
    };
    userInfo: {
        allTransactions: string;
        allTime: string;
        monthTransactions: string;
        spent: (amount: string) => string;
        lastLogin: string;
        activeGoals: string;
        completed: (n: number) => string;
        total: (n: number) => string;
        justNow: string;
        minutesAgo: (n: number) => string;
        hoursAgo: (n: number) => string;
        daysAgo: (n: number) => string;
    };
    general: {
        profileUpdated: string;
        pickImage: string;
        imageTooLarge: string;
        avatarUpdated: string;
        uploadFailed: string;
        changePhoto: string;
        uploading: string;
        tapToChange: string;
        profileAlt: string;
        name: string;
        namePlaceholder: string;
        saveName: string;
        save: string;
        email: string;
        emailLocked: string;
    };
    categoriesPage: { expense: string; income: string };
    aiUsage: {
        notSetUp: string;
        thisMonth: string;
        allTime: string;
        perRequest: string;
        tokens: string;
        requests: (n: number) => string;
        average: string;
        tokensHint: string;
        breakdown: string;
        input: string;
        output: string;
        thinking: string;
        recent: string;
        empty: string;
        tokenCount: (n: string) => string;
        costNote: (rate: string) => string;
        freeTier: string;
    };
    errors: {
        nameEmpty: string;
        nameTooLong: string;
        notSignedIn: string;
        invalidAvatar: string;
    };
};

export const profileDict = defineDictionary<ProfileDict>({
    en: {
        settings: {
            pauseNotifications: "Pause notifications",
            general: "General settings",
            categories: "Categories",
            aiUsage: "AI usage",
            language: "Language",
            appearance: "Appearance",
            voiceOrb: "Voice orb",
            aiGroup: "AI",
        },
        goBack: "Go back",
        theme: { system: "System", light: "Light", dark: "Dark" },
        activity: {
            title: "Activity Heatmap",
            weekLabels: ["S", "M", "T", "W", "T", "F", "S"],
            monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            less: "Less",
            more: "More",
            avatarAlt: "Profile",
        },
        userInfo: {
            allTransactions: "All Transactions",
            allTime: "all time",
            monthTransactions: "This Month",
            spent: (amount) => `${amount} spent`,
            lastLogin: "Last Login",
            activeGoals: "Active Goals",
            completed: (n) => `${n} completed`,
            total: (n) => `${n} total`,
            justNow: "Just now",
            minutesAgo: (n) => `${n} min${n > 1 ? "s" : ""} ago`,
            hoursAgo: (n) => `${n} hour${n > 1 ? "s" : ""} ago`,
            daysAgo: (n) => `${n} day${n > 1 ? "s" : ""} ago`,
        },
        general: {
            profileUpdated: "Profile updated",
            pickImage: "Please pick an image file",
            imageTooLarge: "Image must be 2 MB or smaller",
            avatarUpdated: "Profile picture updated",
            uploadFailed: "Upload failed",
            changePhoto: "Change profile picture",
            uploading: "Uploading…",
            tapToChange: "Tap photo to change",
            profileAlt: "Profile",
            name: "Name",
            namePlaceholder: "Your name",
            saveName: "Save name",
            save: "Save",
            email: "Email",
            emailLocked: "Email cannot be changed.",
        },
        categoriesPage: { expense: "Expense", income: "Income" },
        aiUsage: {
            notSetUp: "Run supabase-ai-usage.sql in Supabase to start tracking AI usage.",
            thisMonth: "This month",
            allTime: "All time",
            perRequest: "Per request",
            tokens: "Tokens",
            requests: (n) => `${n} requests`,
            average: "average",
            tokensHint: "all time",
            breakdown: "Token breakdown",
            input: "Input (image + prompt)",
            output: "Output (answer)",
            thinking: "Thinking",
            recent: "Recent requests",
            empty: "No AI requests recorded yet.",
            tokenCount: (n) => `${n} tokens`,
            costNote: (rate) => `Costs are paid-tier estimates at 1 USD ≈ ${rate}₮.`,
            freeTier: "On the free tier nothing is billed.",
        },
        errors: {
            nameEmpty: "Name cannot be empty",
            nameTooLong: "Name must be 60 characters or fewer",
            notSignedIn: "Not signed in",
            invalidAvatar: "Invalid avatar URL",
        },
    },
    mn: {
        settings: {
            pauseNotifications: "Мэдэгдэл түр зогсоох",
            general: "Ерөнхий тохиргоо",
            categories: "Ангилал",
            aiUsage: "AI хэрэглээ",
            language: "Хэл",
            appearance: "Харагдах байдал",
            voiceOrb: "Дуут орб",
            aiGroup: "AI",
        },
        goBack: "Буцах",
        theme: { system: "Систем", light: "Цайвар", dark: "Бараан" },
        activity: {
            title: "Идэвхийн зураглал",
            weekLabels: ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"],
            monthLabels: ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"],
            less: "Бага",
            more: "Их",
            avatarAlt: "Профайл",
        },
        userInfo: {
            allTransactions: "Бүх гүйлгээ",
            allTime: "анхнаасаа",
            monthTransactions: "Энэ сарын гүйлгээ",
            spent: (amount) => `${amount} зарлага`,
            lastLogin: "Сүүлд нэвтэрсэн",
            activeGoals: "Идэвхтэй зорилго",
            completed: (n) => `${n} биелсэн`,
            total: (n) => `нийт ${n}`,
            justNow: "Дөнгөж сая",
            minutesAgo: (n) => `${n} мин өмнө`,
            hoursAgo: (n) => `${n} цагийн өмнө`,
            daysAgo: (n) => `${n} өдрийн өмнө`,
        },
        general: {
            profileUpdated: "Профайл шинэчлэгдлээ",
            pickImage: "Зургийн файл сонгоно уу",
            imageTooLarge: "Зураг 2 MB-аас ихгүй байх ёстой",
            avatarUpdated: "Профайл зураг шинэчлэгдлээ",
            uploadFailed: "Хуулж чадсангүй",
            changePhoto: "Профайл зураг солих",
            uploading: "Хуулж байна…",
            tapToChange: "Солихын тулд зураг дээр дарна уу",
            profileAlt: "Профайл",
            name: "Нэр",
            namePlaceholder: "Таны нэр",
            saveName: "Нэр хадгалах",
            save: "Хадгалах",
            email: "Имэйл",
            emailLocked: "Имэйлийг өөрчлөх боломжгүй.",
        },
        categoriesPage: { expense: "Зарлага", income: "Орлого" },
        aiUsage: {
            notSetUp: "AI хэрэглээг бүртгэж эхлэхийн тулд Supabase дээр supabase-ai-usage.sql-ийг ажиллуулна уу.",
            thisMonth: "Энэ сар",
            allTime: "Нийт",
            perRequest: "Хүсэлт тутам",
            tokens: "Токен",
            requests: (n) => `${n} хүсэлт`,
            average: "дундаж",
            tokensHint: "нийт",
            breakdown: "Токены задаргаа",
            input: "Оролт (зураг + промпт)",
            output: "Гаралт (хариулт)",
            thinking: "Бодолт",
            recent: "Сүүлийн хүсэлтүүд",
            empty: "AI хүсэлт одоогоор бүртгэгдээгүй байна.",
            tokenCount: (n) => `${n} токен`,
            costNote: (rate) => `Зардлыг төлбөртэй багцын үнээр, 1 USD ≈ ${rate}₮ ханшаар тооцсон.`,
            freeTier: "Үнэгүй багцад төлбөр гарахгүй.",
        },
        errors: {
            nameEmpty: "Нэр хоосон байж болохгүй",
            nameTooLong: "Нэр 60 тэмдэгтээс ихгүй байх ёстой",
            notSignedIn: "Нэвтрээгүй байна",
            invalidAvatar: "Профайл зургийн холбоос буруу байна",
        },
    },
});
