import { BottomNav } from "@/components/navigation/BottomNav";

export default function StatsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
            <div className="max-w-[430px] mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Statistics
                    </h1>
                    <p className="text-gray-600">
                        Your spending insights and trends
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm mb-1">
                            Total Spent
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            $2,847
                        </div>
                        <div className="text-green-600 text-xs mt-1">
                            ↓ 12% from last month
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm mb-1">
                            Transactions
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            64
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                            This month
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Top Categories
                    </h2>

                    <div className="space-y-4">
                        {[
                            { name: "Food & Dining", amount: "$842", percent: 30, color: "bg-purple-500" },
                            { name: "Shopping", amount: "$628", percent: 22, color: "bg-blue-500" },
                            { name: "Transportation", amount: "$445", percent: 16, color: "bg-green-500" },
                            { name: "Entertainment", amount: "$312", percent: 11, color: "bg-pink-500" },
                            { name: "Others", amount: "$620", percent: 21, color: "bg-gray-400" },
                        ].map((category) => (
                            <div key={category.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                        {category.name}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {category.amount}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full ${category.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${category.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Comparison */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Monthly Comparison
                    </h2>

                    <div className="space-y-3">
                        {[
                            { month: "January", amount: "$3,245", trend: "up" },
                            { month: "February", amount: "$2,847", trend: "down" },
                            { month: "March", amount: "$3,120", trend: "up" },
                        ].map((month) => (
                            <div
                                key={month.month}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                                <span className="text-sm font-medium text-gray-700">
                                    {month.month}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {month.amount}
                                    </span>
                                    <span
                                        className={`text-xs ${month.trend === "up"
                                            ? "text-red-600"
                                            : "text-green-600"
                                            }`}
                                    >
                                        {month.trend === "up" ? "↑" : "↓"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
