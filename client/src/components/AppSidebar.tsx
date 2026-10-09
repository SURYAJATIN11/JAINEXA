import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  UsersRound,
  CheckSquare,
  ShieldCheck,
  Building2,
  MessageSquareHeart,
  Network,
  KeyRound,
  Lock,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Sparkles,
  LogOut,
  CalendarRange
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { loadRoomwareIssues, subscribeToRoomwareChanges } from "@/lib/roomwareStore";

export type NavItemKey =
  | "student"
  | "faculty"
  | "calendar"
  | "ai-copilot"
  | "attendance"
  | "admin"
  | "floor-plan"
  | "roomware"
  | "feedback"
  | "logic";

interface AppSidebarProps {
  activeNav: NavItemKey;
  onNavigate: (navKey: NavItemKey) => void;
  onOpenRoleModal: () => void;
  onOpenFeedback: () => void;
  onOpenAIAssistant?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function AppSidebar({
  activeNav,
  onNavigate,
  onOpenRoleModal,
  onOpenFeedback,
  onOpenAIAssistant,
  isCollapsed = false,
  onToggleCollapse,
  className = ""
}: AppSidebarProps) {
  const { user, canAccessAdminStudio, canAccessAttendance, logout } = useAuth();
  const [activeIssueCount, setActiveIssueCount] = useState<number>(() => {
    return loadRoomwareIssues().filter((i) => i.status !== "resolved").length;
  });

  useEffect(() => {
    const unsub = subscribeToRoomwareChanges((issues) => {
      setActiveIssueCount(issues.filter((i) => i.status !== "resolved").length);
    });
    return unsub;
  }, []);

  const handleItemClick = (key: NavItemKey) => {
    if (key === "ai-copilot") {
      if (onOpenAIAssistant) {
        onOpenAIAssistant();
      }
      return;
    }

    if (key === "admin") {
      if (window.location.pathname === "/admin") {
        return;
      }
      window.open("/admin", "_blank");
      return;
    }

    if (key === "feedback") {
      onOpenFeedback();
      return;
    }

    if (key === "floor-plan") {
      onNavigate("floor-plan");
      return;
    }

    if (key === "roomware") {
      onNavigate("roomware");
      return;
    }

    if (key === "calendar") {
      onNavigate("calendar");
      return;
    }

    onNavigate(key);
  };

  const navItems = [
    {
      key: "student" as NavItemKey,
      label: "Batch Timetable",
      icon: CalendarDays,
      hasLock: false,
      hasExternal: false,
      tooltip: "Student Batch Timetable Matrix"
    },
    {
      key: "faculty" as NavItemKey,
      label: "Faculty Timetable",
      icon: UsersRound,
      hasLock: false,
      hasExternal: false,
      tooltip: "Individual Professor & Faculty Schedules"
    },
    {
      key: "calendar" as NavItemKey,
      label: "Academic Calendar",
      icon: CalendarRange,
      hasLock: false,
      hasExternal: false,
      tooltip: "Interactive Academic Calendar & Campus Timetable Events"
    },
    {
      key: "ai-copilot" as NavItemKey,
      label: "AI Timetable Copilot",
      icon: Sparkles,
      hasLock: false,
      hasExternal: false,
      tooltip: "Campus AI Timetable Copilot (Ctrl+K)"
    },
    {
      key: "roomware" as NavItemKey,
      label: "Roomware & Wear",
      icon: Wrench,
      hasLock: false,
      hasExternal: false,
      badgeCount: activeIssueCount,
      tooltip: "Roomware & Equipment Wear-and-Tear Tracker (AC, Projector, Audio, Furniture)"
    },
    {
      key: "attendance" as NavItemKey,
      label: "Attendance Portal",
      icon: CheckSquare,
      hasLock: !canAccessAttendance,
      hasExternal: false,
      tooltip: canAccessAttendance
        ? "Attendance Portal (Faculty & Admin)"
        : "Attendance Portal (Faculty & Admin Only - Restricted for Students)"
    },
    {
      key: "floor-plan" as NavItemKey,
      label: "Building Floor Plan",
      icon: Building2,
      hasLock: false,
      hasExternal: false,
      tooltip: "CAD Architectural Floor Maps (Floor 0 to 4)"
    },
    {
      key: "admin" as NavItemKey,
      label: "Admin Studio",
      icon: ShieldCheck,
      hasLock: !canAccessAdminStudio,
      hasExternal: true,
      tooltip: canAccessAdminStudio
        ? "Timetable Administration Studio (Separate Window)"
        : "Admin Studio (Master Admin Only - Restricted for Students & Faculty)"
    },
    {
      key: "feedback" as NavItemKey,
      label: "24x7 Feedback",
      icon: MessageSquareHeart,
      hasLock: false,
      hasExternal: true,
      tooltip: "24x7 Academic Timetable Feedback (Google Forms)"
    },
    {
      key: "logic" as NavItemKey,
      label: "Logic Studio",
      icon: Network,
      hasLock: false,
      hasExternal: false,
      tooltip: "Constraint & Logic Management Studio"
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 bg-[#252b67] text-[#faf8ef] flex flex-col transition-all duration-300 ease-in-out select-none border-r border-[#1f255b] shadow-2xl ${
        isCollapsed ? "w-[68px] px-2 py-4" : "w-[224px] px-3.5 py-5"
      } ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }}
      aria-label="Side Navigation Bar"
    >
      {/* Top Brand Area */}
      <div className="border-b border-white/15 pb-3 mb-3 relative flex items-center justify-between">
        {!isCollapsed ? (
          <div className="w-full">
            <div className="bg-white rounded-xl p-2 px-3 flex items-center justify-center shadow-md hover:shadow-lg transition">
              <img
                src="/images/jain-university-logo.png"
                alt="JAIN (Deemed-To-Be University)"
                className="w-full h-auto max-h-12 object-contain block"
              />
            </div>
            <div className="mt-2.5 px-0.5 leading-tight">
              <div className="text-[10px] font-bold text-[#faf8ef] tracking-wider uppercase font-mono">
                CSE DEPARTMENT
              </div>
              <div className="text-[9px] text-[#e3a62f] font-medium tracking-normal mt-0.5 truncate">
                JAIN (DEEMED-TO-BE UNIVERSITY)
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-1">
              <div className="w-8 h-8 rounded-lg bg-[#252b67] text-[#e3a62f] font-extrabold text-xs flex items-center justify-center">
                JGi
              </div>
            </div>
            <span className="text-[8px] font-bold text-[#e3a62f] mt-1 font-mono tracking-wider">
              CSE
            </span>
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`absolute -right-3 top-3 w-6 h-6 rounded-full bg-[#e3a62f] text-[#252b67] flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all z-50 cursor-pointer border border-[#faf8ef]/40 ${
              isCollapsed ? "translate-x-1" : ""
            }`}
            title={isCollapsed ? "Expand Navigation Bar (Zoom/Full View)" : "Collapse Navigation Bar (Fit Screen)"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden py-1 pr-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.key;

          const buttonContent = (
            <button
              key={item.key}
              type="button"
              onClick={() => handleItemClick(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 text-left relative group cursor-pointer ${
                isActive
                  ? "bg-[#f9f7ef] text-[#252b67] font-semibold shadow-md translate-x-0.5"
                  : "text-[#cbd0ed] hover:text-white hover:bg-white/10 hover:translate-x-0.5"
              } ${isCollapsed ? "justify-center px-0 py-2.5" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative shrink-0">
                <Icon
                  size={18}
                  className={`${
                    isActive
                      ? "text-[#252b67]"
                      : item.key === "admin" || item.key === "feedback"
                      ? "text-[#e3a62f]"
                      : "text-[#cbd0ed] group-hover:text-white"
                  }`}
                />
                {isCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#c84232] ring-2 ring-[#252b67] animate-pulse" />
                )}
              </div>

              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 tracking-tight">{item.label}</span>

                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#c84232] text-white shadow-2xs">
                      {item.badgeCount}
                    </span>
                  )}

                  {item.hasLock && (
                    <Lock
                      size={12}
                      className="text-[#e05244] opacity-80 shrink-0 ml-auto"
                      aria-label="Locked feature"
                    />
                  )}

                  {item.hasExternal && (
                    <ArrowUpRight
                      size={13}
                      className={`opacity-70 shrink-0 ${item.hasLock ? "ml-1" : "ml-auto"}`}
                    />
                  )}
                </>
              )}

              {/* Active Pill Indicator on left border */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#e3a62f] rounded-r-full" />
              )}
            </button>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.key} delayDuration={150}>
                <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                <TooltipContent side="right" className="bg-[#252b67] text-white border border-[#3f4794] text-xs py-1.5 px-2.5 font-medium shadow-xl flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.hasLock && <Lock size={11} className="text-[#e05244]" />}
                  {item.hasExternal && <ArrowUpRight size={11} className="opacity-70" />}
                </TooltipContent>
              </Tooltip>
            );
          }

          return buttonContent;
        })}
      </nav>

      {/* Bottom Switch Role & Active User Profile */}
      <div className="pt-3 mt-auto border-t border-white/15 flex flex-col gap-2">
        {/* Switch Role Button */}
        {isCollapsed ? (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenRoleModal}
                className="w-full flex items-center justify-center p-2.5 rounded-lg text-[#cbd0ed] hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Switch User Role"
              >
                <KeyRound size={18} className="text-[#e3a62f]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252b67] text-white border border-[#3f4794] text-xs py-1.5 px-2.5 font-medium">
              Switch Role (Student / Teacher / Admin)
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#cbd0ed] hover:text-white hover:bg-white/10 transition group cursor-pointer text-left"
          >
            <KeyRound size={16} className="text-[#e3a62f] shrink-0" />
            <span className="truncate">Switch Role</span>
          </button>
        )}

        {/* User Badge Ribbon */}
        <div
          onClick={onOpenRoleModal}
          className={`flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={`Active User: ${user?.name || "Student"} (${user?.role || "Student"}) — Click to switch role`}
        >
          <div className="w-8 h-8 rounded-full bg-[#e3a62f] text-[#252b67] font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-[#faf8ef] shadow-sm">
            {user?.avatarInitials || "ST"}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || "Student User"}
              </div>
              <div className="text-[10px] text-[#e3a62f] truncate flex items-center gap-1">
                <span>{user?.role || "Student"}</span>
                {user?.roleType === "admin" && (
                  <span className="text-[9px] bg-[#e3a62f]/20 text-[#e3a62f] px-1 rounded font-mono">
                    MASTER
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        {isCollapsed ? (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center p-2 rounded-lg text-[#cbd0ed] hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#252b67] text-white border border-[#3f4794] text-xs py-1.5 px-2.5 font-medium">
              Sign Out
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-[#cbd0ed]/70 hover:text-rose-300 hover:bg-rose-500/15 transition group cursor-pointer text-left"
          >
            <LogOut size={14} className="text-[#cbd0ed]/70 group-hover:text-rose-300 shrink-0" />
            <span className="truncate font-medium">Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
