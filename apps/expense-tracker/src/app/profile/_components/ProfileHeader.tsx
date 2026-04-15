import Link from "next/link";
import Image from "next/image";


export const ProfileHeader = () => {

    return (
        <header className="w-full ">
            <div className="w-full px-4 py-6">
                <div className="flex items-center justify-between">
                    {/* Greeting Section */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl font-bold text-[#090909] tracking-tight h-[30px]">
                            Gereltbaatar
                        </h1>
                        <p className="text-2xl font-bold text-[#A6A6A6] tracking-tight h-[30px]">
                            mglgerelt@gmail.com
                        </p>
                    </div>

                    {/* Profile Picture */}
                    <Link href="/profile" className="relative">
                        <div className="w-14 h-14 rounded-full bg-[#E9ECEF]">
                            <Image
                                src="/profile_image.jpg"
                                alt="Profile"
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