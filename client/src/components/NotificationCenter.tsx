import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Wind,
  MonitorPlay,
  Mic,
  Zap,
  Armchair,
  PenTool,
  Sparkles,
  Wrench,
  Clock,
  Building2,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import {
  loadRoomwareIssues,
  subscribeToRoomwareChanges,
  resolveRoomIssue,
  RoomIssue,
  IssueCategory,
  CATEGORY_METADATA
} from "@/lib/roomwareStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NotificationCenterProps {
  onSelectRoom?: (roomName: string) => void;
  onOpenReportModal?: () => void;
}

const CATEGORY_ICONS: Record<IssueCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  ac: Wind,
  projector: MonitorPlay,
  audio: Mic,
  electrical: Zap,
  furniture: Armchair,
  smartboard: PenTool,
  cleanliness: Sparkles,
  other: Wrench
};

export function NotificationCenter({
  onSelectRoom,
  onOpenReportModal
}: NotificationCenterProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<RoomIssue[]>(() => loadRoomwareIssues());
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "high" | "ac_av">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToRoomwareChanges((updated) => {
      setIssues(updated);
    });
    return unsub;
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeIssues = issues.filter((i) => i.status !== "resolved");
  const urgentCount = activeIssues.filter((i) => i.severity === "high" || i.severity === "critical").length;

  const filteredIssues = activeIssues.filter((i) => {
    if (filter === "high") return i.severity === "high" || i.severity === "critical";
    if (filter === "ac_av") return i.category === "ac" || i.category === "projector" || i.category === "audio";
    return true;
  });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-8 px-2.5 rounded-lg border border-[#d5d0c2] bg-[#fffdf7] hover:bg-[#faf8ef] text-[#252b67] flex items-center gap-1.5 transition shadow-xs text-xs font-semibold cursor-pointer"
        title="View live room wear-and-tear notifications"
        aria-label="Roomware notifications"
      >
        <Bell size={15} className={urgentCount > 0 ? "text-[#c84232] animate-bounce" : "text-[#33409a]"} />
        <span className="hidden sm:inline">Alerts</span>

        {activeIssues.length > 0 && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
              urgentCount > 0 ? "bg-[#c84232] animate-pulse" : "bg-[#33409a]"
            }`}
          >
            {activeIssues.length}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-[340px] sm:w-[410px] bg-[#fffdf7] border border-[#d5d0c2] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#252b67]">
          {/* Header */}
          <div className="p-3.5 px-4 bg-[#252b67] text-white flex items-center justify-between border-b border-[#3b438c]">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#e3a62f]" />
              <h4 className="font-bold text-xs tracking-wide uppercase text-[#faf8ef]">
                Roomware & Maintenance Alerts
              </h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-[#faf8ef] font-mono">
              {activeIssues.length} Active
            </span>
          </div>

          {/* Quick Filter Tabs */}
          <div className="p-2 bg-[#f6f2e6] border-b border-[#e5decb] flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                filter === "all" ? "bg-[#252b67] text-white shadow-xs" : "text-[#555259] hover:bg-[#ece7d8]"
              }`}
            >
              All Alerts ({activeIssues.length})
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                filter === "high" ? "bg-[#c84232] text-white shadow-xs" : "text-[#555259] hover:bg-[#ece7d8]"
              }`}
            >
              Urgent ({urgentCount})
            </button>
            <button
              onClick={() => setFilter("ac_av")}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                filter === "ac_av" ? "bg-[#0284c7] text-white shadow-xs" : "text-[#555259] hover:bg-[#ece7d8]"
              }`}
            >
              AC & Projectors
            </button>
          </div>

          {/* Alert Cards List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#ece7d8] p-1">
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-[#77747b]">
                <CheckCircle2 size={28} className="mx-auto text-[#16a34a] mb-2 opacity-80" />
                <p className="text-xs font-semibold">No active issues in this category</p>
                <p className="text-[11px] text-[#88848a] mt-0.5">All rooms are operating normally.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const meta = CATEGORY_METADATA[issue.category];
                const Icon = CATEGORY_ICONS[issue.category];

                return (
                  <div
                    key={issue.id}
                    onClick={() => {
                      if (onSelectRoom) {
                        onSelectRoom(issue.roomName);
                      }
                      setIsOpen(false);
                    }}
                    className="p-3 hover:bg-[#faf6eb] transition cursor-pointer rounded-xl group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Room Badge */}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#252b67] text-white tracking-wide shadow-2xs">
                          {issue.roomCode}
                        </span>

                        {/* Category Pill */}
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
                          style={{ backgroundColor: meta.badgeBg, color: meta.color }}
                        >
                          <Icon size={11} />
                          {meta.label.split("/")[0]?.trim()}
                        </span>

                        {/* Severity Indicator */}
                        {(issue.severity === "high" || issue.severity === "critical") && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#fee2e2] text-[#dc2626]">
                            HIGH
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-[#88848a] flex items-center gap-1 shrink-0">
                        <Clock size={10} />
                        {timeAgo(issue.createdAt)}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-[#252b67] mt-1.5 line-clamp-1 group-hover:text-[#33409a]">
                      {issue.title}
                    </h5>

                    <p className="text-[11px] text-[#555259] mt-0.5 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>

                    {/* Verified Class Hour Badge */}
                    {issue.classHour && (
                      <div className="flex items-center gap-1 text-[9.5px] text-[#334155] bg-[#f1f5f9] px-2 py-0.5 rounded w-fit mt-1 border border-slate-200">
                        <Clock size={10} className="text-[#3b82f6]" />
                        <span>{issue.classDay || "Class"} · {issue.classHour} {issue.classSubject && `(${issue.classSubject})`}</span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#77747b] pt-1.5 border-t border-[#f0ecdf]">
                      <span>
                        Reported by <strong className="text-[#252b67]">{issue.reportedBy}</strong> ({issue.batch || issue.reporterRole})
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveRoomIssue(issue.id, user?.name || "Student");
                            toast.success(`Issue Resolved for ${issue.roomName}!`);
                            setIssues(loadRoomwareIssues());
                          }}
                          className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] border border-[#86efac] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <CheckCircle2 size={10} className="text-[#16a34a]" />
                          <span>Issue Resolved</span>
                        </button>

                        <span className="text-[#33409a] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                          Inspect <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-[#f6f2e6] border-t border-[#e5decb] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenReportModal) {
                  onOpenReportModal();
                }
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-[#c84232] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle size={12} /> Report Issue
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSelectRoom && activeIssues[0]) {
                  onSelectRoom(activeIssues[0].roomName);
                }
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-[#252b67] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Roomware Studio <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
