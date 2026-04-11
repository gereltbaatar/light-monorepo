"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { SecretGroup } from "@/types/secrets";
import { LeftNavBar } from "./sidebar/LeftNavBar";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SearchBar } from "./sidebar/SearchBar";
import { ExpandButton } from "./sidebar/ExpandButton";
import { DotEnvPageContent } from "./sidebar/DotEnvPageContent";
import { HomePageContent } from "./sidebar/HomePageContent";

interface ProjectsSidebarProps {
  groups: SecretGroup[];
  activeGroupId: string | null;
  onGroupSelect: (groupId: string) => void;
  onCreateGroup: () => void;
  isOpen: boolean;
  onClose: () => void;
  initialActiveNav?: string;
  pageName?: string;
  isLoading?: boolean;
}

// Simulated folder structure for demo
const folderStructure = [
  {
    id: "general",
    name: "General Knowledge",
    count: 10,
    children: [
      {
        id: "onboarding",
        name: "Onboarding",
        count: 3,
        children: [
          { id: "sub1", name: "Subfolder 1", count: 5 },
          { id: "sub2", name: "Subfolder 2", count: 10 },
        ],
      },
      { id: "integrations", name: "Integrations", count: 0 },
      { id: "documents", name: "Documents", count: 0 },
    ],
  },
  { id: "onboarding-design", name: "Onboarding Design", count: 0 },
  { id: "team-interviews", name: "Team Interviews", count: 0 },
];

export function ProjectsSidebar({
  groups,
  activeGroupId,
  onGroupSelect,
  onCreateGroup,
  isOpen,
  onClose,
  initialActiveNav = "database",
  pageName = "Knowledge Base",
  isLoading = false,
}: ProjectsSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["general", "onboarding"])
  );
  const [activeNav, setActiveNav] = useState(initialActiveNav);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine content type based on pathname
  const isHomePage = pathname === "/" || pathname.startsWith("/home");

  // Sync activeNav with pathname to avoid hydration errors
  useEffect(() => {
    if (pathname.startsWith("/dotenv")) {
      setActiveNav("secrets");
    } else if (pathname === "/") {
      setActiveNav("database");
    }
  }, [pathname]);

  // Keyboard shortcut: Command+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Left Navigation Bar */}
      <LeftNavBar activeNav={activeNav} onNavChange={setActiveNav} />

      {/* Main Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-16 z-50
          bg-zinc-950 border-r border-zinc-800
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-0 md:w-0 border-r-0" : "w-72"}
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onCreateGroup={onCreateGroup}
          onClose={onClose}
          pageName={pageName}
        />

        {/* Search */}
        {!isCollapsed && (
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        )}

        {/* Content - Show different views based on page */}
        {isHomePage ? (
          <HomePageContent
            groups={groups}
            activeGroupId={activeGroupId}
            searchQuery={searchQuery}
            onGroupSelect={onGroupSelect}
            onCreateGroup={onCreateGroup}
            onClose={onClose}
            isCollapsed={isCollapsed}
            folderStructure={folderStructure}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            isLoading={isLoading}
          />
        ) : (
          <DotEnvPageContent
            groups={groups}
            activeGroupId={activeGroupId}
            searchQuery={searchQuery}
            onGroupSelect={onGroupSelect}
            onCreateGroup={onCreateGroup}
            onClose={onClose}
            isCollapsed={isCollapsed}
            isLoading={isLoading}
          />
        )}
      </aside>
    </>
  );
}
