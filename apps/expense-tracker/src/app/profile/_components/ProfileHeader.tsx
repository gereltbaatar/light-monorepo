import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile, getDisplayName } from "@/lib/profile";
import { getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";


export const ProfileHeader = async () => {
    const profile = await getCurrentProfile();
    const name = getDisplayName(profile);
    const email = profile?.email ?? "";
    const avatar = profile?.avatar_url || "/profile_image.jpg";
    const t = (await getT(profileDict)).activity;

    return (
        <header className="w-full ">
            <div className="w-full px-4 py-6">
                <div className="flex items-center justify-between">
                    {/* Greeting Section */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight h-[30px]">
                            {name}
                        </h1>
                        <p className="text-2xl font-bold text-muted-foreground tracking-tight h-[30px]">
                            {email}
                        </p>
                    </div>

                    {/* Profile Picture */}
                    <Link href="/profile" className="relative">
                        <div className="w-14 h-14 rounded-full bg-surface-2 overflow-hidden">
                            <Image
                                src={avatar}
                                alt={t.avatarAlt}
                                width={56}
                                height={56}
                                className="rounded-full"
                            />
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    )
}
