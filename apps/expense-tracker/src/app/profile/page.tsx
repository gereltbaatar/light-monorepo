"use client";

import { User, Mail, Bell, Shield, Palette, LogOut, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/navigation/BottomNav";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
            <div className="max-w-[430px] mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Profile
                    </h1>
                    <p className="text-gray-600">
                        Manage your account settings
                    </p>
                </div>

                {/* Profile Card */}
                <div className="bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#a855f7] rounded-2xl p-6 mb-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                            <User className="w-10 h-10 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-1">
                                John Doe
                            </h2>
                            <p className="text-white/80 text-sm">
                                Premium Member
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-white/20">
                        <div className="flex-1">
                            <div className="text-white/70 text-xs mb-1">
                                Balance
                            </div>
                            <div className="text-white text-xl font-bold">
                                $12,847
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="text-white/70 text-xs mb-1">
                                Expenses
                            </div>
                            <div className="text-white text-xl font-bold">
                                $2,847
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* Account Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                Account
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {[
                                {
                                    icon: User,
                                    title: "Personal Information",
                                    subtitle: "Update your details",
                                },
                                {
                                    icon: Mail,
                                    title: "Email Settings",
                                    subtitle: "john.doe@example.com",
                                },
                                {
                                    icon: Shield,
                                    title: "Privacy & Security",
                                    subtitle: "Manage your security",
                                },
                            ].map((item, index) => (
                                <button
                                    key={index}
                                    className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1]/10 to-[#a855f7]/10 rounded-full flex items-center justify-center">
                                        <item.icon className="w-5 h-5 text-[#8b5cf6]" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {item.subtitle}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                Preferences
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {[
                                {
                                    icon: Bell,
                                    title: "Notifications",
                                    subtitle: "Manage alerts and reminders",
                                },
                                {
                                    icon: Palette,
                                    title: "Appearance",
                                    subtitle: "Customize your theme",
                                },
                            ].map((item, index) => (
                                <button
                                    key={index}
                                    className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1]/10 to-[#a855f7]/10 rounded-full flex items-center justify-center">
                                        <item.icon className="w-5 h-5 text-[#8b5cf6]" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {item.subtitle}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 flex items-center gap-3 hover:bg-red-50 hover:border-red-200 transition-colors group">
                        <div className="w-10 h-10 bg-red-50 group-hover:bg-red-100 rounded-full flex items-center justify-center transition-colors">
                            <LogOut className="w-5 h-5 text-red-600" strokeWidth={2} />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-red-600">
                                Log Out
                            </div>
                            <div className="text-xs text-red-500">
                                Sign out of your account
                            </div>
                        </div>
                    </button>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
