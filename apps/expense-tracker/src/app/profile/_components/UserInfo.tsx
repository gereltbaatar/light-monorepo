import { ArrowUpRight, Clock, Target } from "lucide-react";

export const UserInfo = () => {
    // Mock data - replace with real data later
    const stats = {
        accounts: 7,
        transactions: 700,
        lastLoginDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        totalGoals: 5, // Total number of goals
        completedGoals: 2, // Number of completed goals
        activeGoals: 3, // Number of active goals
    };

    // Calculate goal completion percentage
    const goalCompletionPercentage = stats.totalGoals > 0
        ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
        : 0;

    // Format last login time
    const formatLastLogin = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getLastLoginDetail = (date: Date): string => {
        return date.toLocaleString('en-US', {
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
                {/* All Accounts Card */}
                <div className="relative bg-[#F8F9FA] rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-[#1C1C1E] opacity-30 group-hover:opacity-50 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-[#090909] tracking-tight">{stats.accounts}</p>
                        <p className="text-sm font-semibold text-[#090909] tracking-tight">All Accounts</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-[#2D5016] tracking-tight">Mbank, Xacbank, Khan bank</p>
                        </div>
                    </div>
                </div>

                {/* All Transactions Card */}
                <div className="relative bg-[#CFDDCA] rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-[#2D5016] opacity-30 group-hover:opacity-50 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-[#090909] tracking-tight">{stats.transactions}</p>
                        <p className="text-sm font-semibold text-[#090909] tracking-tight">All Transactions</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-[#2D5016] tracking-tight">this month</p>
                        </div>
                    </div>
                </div>

                {/* Last Login Card */}
                <div className="relative bg-[#E3F2FD] rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-[#1565C0] opacity-40 group-hover:opacity-60 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-[#090909] tracking-tight">{formatLastLogin(stats.lastLoginDate)}</p>
                        <p className="text-sm font-semibold text-[#1565C0] tracking-tight">Last Login</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-[#1565C0] font-medium">{getLastLoginDetail(stats.lastLoginDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Active Goals Card */}
                <div className="relative bg-[#FFF3E0] rounded-3xl h-23 overflow-hidden cursor-pointer">
                    <div className="absolute top-3 right-3 text-[#E65100] opacity-40 group-hover:opacity-60 transition-opacity">
                        <ArrowUpRight size={30} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start p-3">
                        <p className="text-xl font-bold text-[#090909] tracking-tight">{stats.activeGoals}</p>
                        <p className="text-sm font-semibold text-[#E65100] tracking-tight">Active Goals</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-[#2D5016] font-medium">{stats.completedGoals} completed</p>
                            </div>
                            <p className="text-xs text-[#8E8E93]">•</p>
                            <p className="text-xs text-[#8E8E93] font-medium">{stats.totalGoals} total</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}