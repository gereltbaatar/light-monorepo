"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProjectsSidebar } from "./ProjectsSidebar";
import { Header } from "./Header";
import type { SecretGroup } from "@/types/secrets";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Pages where sidebar should be hidden
const PAGES_WITHOUT_SIDEBAR = ["signup", "signin"];

// Check if pathname matches /dotenv/[id] pattern (UUID)
const isDotenvDetailPage = (path: string) => {
  const uuidPattern = /^\/dotenv\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(path);
};

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [groups, setGroups] = useState<SecretGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  // Check if current page should hide sidebar
  const shouldHideSidebar =
    PAGES_WITHOUT_SIDEBAR.some((page) => pathname.includes(`/${page}`)) ||
    isDotenvDetailPage(pathname);

  useEffect(() => {
    if (!shouldHideSidebar) {
      fetchGroups();
    }
  }, [shouldHideSidebar]);

  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await fetch("/api/groups");
      const data = await response.json();
      setGroups(data.groups || []);
      if (data.groups?.length > 0 && !activeGroupId) {
        setActiveGroupId(data.groups[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setActiveGroupId(groupId);
    router.push(`/dotenv/${groupId}`);
    setSidebarOpen(false);
  };

  const handleCreateGroup = () => {
    setShowCreateDialog(true);
  };

  // If on auth pages, just render children without sidebar
  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  // Determine initialActiveNav based on pathname
  const getInitialActiveNav = () => {
    if (pathname.startsWith("/dotenv")) return "secrets";
    return "database";
  };

  // Determine page name based on pathname
  const getPageName = () => {
    if (pathname === "/") return "Knowledge Base";
    if (pathname.startsWith("/dotenv/")) return "Secrets Management";
    if (pathname === "/dotenv") return "Projects";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Management";
  };

  // Get sidebar page name (different from header page name for some routes)
  const getSidebarPageName = () => {
    if (pathname === "/") return "Home";
    if (pathname === "/dotenv" || pathname.startsWith("/dotenv/")) return "Projects";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Home";
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <ProjectsSidebar
        groups={groups}
        activeGroupId={activeGroupId}
        onGroupSelect={handleGroupSelect}
        onCreateGroup={handleCreateGroup}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        initialActiveNav={getInitialActiveNav()}
        pageName={getSidebarPageName()}
        isLoading={isLoadingGroups}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} pageName={getPageName()} />
        {children}
      </div>
    </div>
  );
}
