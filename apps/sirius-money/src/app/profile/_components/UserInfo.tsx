import { ArrowUpRight } from "lucide-react";
import { moneyFormatter } from "@/components/functions";
import { getProfileStats } from "@/lib/profile-stats";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";

export const UserInfo = async () => {
    const locale = await getLocale();
    const t = (await getT(profileDict)).userInfo;
    const profileStats = await getProfileStats();
    const stats = {
        ...profileStats,
        lastLoginDate: profileStats.lastSignInAt ? new Date(profileStats.lastSignInAt) : new Date(),
        totalGoals: profileStats.activeGoals + profileStats.completedGoals,
    };

    // Format last login time
    const formatLastLogin = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return t.justNow;
        if (diffMins < 60) return t.minutesAgo(diffMins);
        if (diffHours < 24) return t.hoursAgo(diffHours);
        if (diffDays < 7) return t.daysAgo(diffDays);

        return date.toLocaleDateString(INTL_LOCALE[locale], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getLastLoginDetail = (date: Date): string => {
        return date.toLocaleString(INTL_LOCALE[locale], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="w-full px-4">
            <div className="grid grid-cols-2 gap-1.5">
                {/* All Transactions Card */}
                <div className="relative bg-surface rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-foreground opacity-30 group-hover:opacity-50 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-foreground tracking-tight">{stats.totalTransactions}</p>
                        <p className="text-sm font-semibold text-foreground tracking-tight">{t.allTransactions}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-[#2D5016] dark:text-[#7BC47F] tracking-tight">{t.allTime}</p>
                        </div>
                    </div>
                </div>

                {/* This Month Card */}
                <div className="relative bg-surface rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-[#2D5016] dark:text-[#7BC47F] opacity-30 group-hover:opacity-50 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-foreground tracking-tight">{stats.monthTransactions}</p>
                        <p className="text-sm font-semibold text-foreground tracking-tight">{t.monthTransactions}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-[#2D5016] dark:text-[#7BC47F] tracking-tight">
                                {t.spent(moneyFormatter(Math.round(stats.monthSpent)))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Last Login Card */}
                <div className="relative bg-surface rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-[#1565C0] dark:text-[#64B5F6] opacity-40 group-hover:opacity-60 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-foreground tracking-tight">{formatLastLogin(stats.lastLoginDate)}</p>
                        <p className="text-sm font-semibold text-[#1565C0] dark:text-[#64B5F6] tracking-tight">{t.lastLogin}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-[#1565C0] dark:text-[#64B5F6] font-medium">{getLastLoginDetail(stats.lastLoginDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Active Goals Card */}
                <div className="relative bg-surface rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-[#E65100] dark:text-[#FF9E40] opacity-40 group-hover:opacity-60 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-foreground tracking-tight">{stats.activeGoals}</p>
                        <p className="text-sm font-semibold text-[#E65100] dark:text-[#FF9E40] tracking-tight">{t.activeGoals}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-[#2D5016] dark:text-[#7BC47F] font-medium">{t.completed(stats.completedGoals)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">•</p>
                            <p className="text-xs text-muted-foreground font-medium">{t.total(stats.totalGoals)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}