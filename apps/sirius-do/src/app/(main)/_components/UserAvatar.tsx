import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { cn } from "@/lib/utils";

export interface SidebarUser {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export function UserAvatar({ user, className }: { user: SidebarUser; className?: string }) {
  return (
    <Avatar className={cn("size-7", className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="object-cover" />}
      <AvatarFallback className="bg-app text-xs font-medium text-white">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
