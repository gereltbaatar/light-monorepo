import { ProfileHeader, UserInfo, Settings } from "@/app/profile/_components";

import { BottomNav } from "@/components/navigation/BottomNav";

const ProfilePage = () => {
    return (
        <div className="w-full max-w-[430px] mx-auto pb-24">
            <ProfileHeader />
            <UserInfo />
            <Settings />
            <BottomNav />
        </div>
    );
}

export default ProfilePage;