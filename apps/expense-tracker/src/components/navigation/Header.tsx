import Image from "next/image";
import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/profile";
import { Greeting } from "./Greeting";
import { getT } from "@/lib/i18n/server";
import { homeDict } from "@/lib/i18n/dictionaries/home";

export const Header = async () => {
    const profile = await getCurrentProfile();
    const t = await getT(homeDict);
    const name = getDisplayName(profile);
    const avatar = profile?.avatar_url || "/profile_image.jpg";

    return (
        <header className="w-full ">
            <div className="w-full px-4 py-6">
                <div className="flex items-center justify-between">
                    {/* Greeting Section */}
                    <div className="flex flex-col justify-center">
                        <Greeting />
                        <h1 className="text-2xl font-bold text-foreground tracking-tight h-[30px]">
                            {name}
                        </h1>
                    </div>

                    {/* Profile Picture */}
                    <Link href="/profile" className="relative">
                        <div className="w-14 h-14 rounded-full bg-surface-2 overflow-hidden">
                            <Image
                                src={avatar}
                                alt={t.profileAlt}
                                width={56}
                                height={56}
                                className="rounded-full"
                            />
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
};
