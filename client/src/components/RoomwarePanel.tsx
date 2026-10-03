import React, { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
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
  Users,
  Calendar,
  ThumbsUp,
  Plus,
  Filter,
  CheckSquare,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Info,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { collegeRooms, collegeRoomData } from "@/data/collegeData";
import {
  loadRoomwareIssues,
  subscribeToRoomwareChanges,
  upvoteRoomIssue,
  updateIssueStatus,
  resolveRoomIssue,
  RoomIssue,
  IssueCategory,
  CATEGORY_METADATA,
  extractRoomCode
} from "@/lib/roomwareStore";
import { ReportIssueModal } from "./ReportIssueModal";
import { useAuth } from "@/contexts/AuthContext";

interface RoomwarePanelProps {
  initialSelectedRoom?: string;
  onNavigateTimetable?: (roomCode: string) => void;
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

export default function RoomwarePanel({
  initialSelectedRoom,
  onNavigateTimetable
}: RoomwarePanelProps) {
  const { user, isAdmin, isFaculty } = useAuth();

  const [issues, setIssues] = useState<RoomIssue[]>(() => loadRoomwareIssues());
  const [selectedRoomName, setSelectedRoomName] = useState<string>(
    initialSelectedRoom || "105 Room"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "class" | "lab" | "ac" | "issues">("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Subscribe to live roomware updates
  useEffect(() => {
    const unsub = subscribeToRoomwareChanges((updated) => {
      setIssues(updated);
    });
    return unsub;
  }, []);

  // Update selection if initialSelectedRoom changes
  useEffect(() => {
    if (initialSelectedRoom) {
      setSelectedRoomName(initialSelectedRoom);
    }
  }, [initialSelectedRoom]);

  // Active issues dictionary mapped by roomCode and roomName
  const issuesByRoom = useMemo(() => {
    const map: Record<string, RoomIssue[]> = {};
    issues.forEach((issue) => {
      if (issue.status === "resolved") return;

      const code = issue.roomCode.toLowerCase();
      const name = issue.roomName.toLowerCase();

      if (!map[code]) map[code] = [];
      map[code].push(issue);

      if (!map[name]) map[name] = [];
      if (!map[name].some((i) => i.id === issue.id)) {
        map[name].push(issue);
      }
    });
    return map;
  }, [issues]);

  const getRoomIssues = (roomNameStr: string): RoomIssue[] => {
    const code = extractRoomCode(roomNameStr).toLowerCase();
    const name = roomNameStr.toLowerCase();
    return issuesByRoom[code] || issuesByRoom[name] || [];
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return collegeRooms.filter((room) => {
      const roomIssues = getRoomIssues(room.name);
      const isAC = room.name.toLowerCase().includes("[ac]") || room.name.toLowerCase().includes("ac");
      const isLab = room.type.toLowerCase().includes("lab") || room.name.toLowerCase().includes("lab");

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = room.name.toLowerCase().includes(q);
        const matchesType = room.type.toLowerCase().includes(q);
        const matchesIssue = roomIssues.some(
          (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesType && !matchesIssue) return false;
      }

      // Filter Type match
      if (filterType === "class" && isLab) return false;
      if (filterType === "lab" && !isLab) return false;
      if (filterType === "ac" && !isAC) return false;
      if (filterType === "issues" && roomIssues.length === 0) return false;

      // Floor filter
      if (floorFilter !== "all") {
        const code = extractRoomCode(room.name);
        const floorNum = code.charAt(0);
        if (floorFilter === "G" && !code.startsWith("G") && !code.startsWith("0")) return false;
        if (floorFilter === "1" && floorNum !== "1") return false;
        if (floorFilter === "2" && floorNum !== "2") return false;
        if (floorFilter === "3" && floorNum !== "3") return false;
        if (floorFilter === "4" && floorNum !== "4") return false;
      }

      return true;
    });
  }, [searchQuery, filterType, floorFilter, issuesByRoom]);

  // Selected room details
  const selectedRoomObj = useMemo(() => {
    return (
      collegeRooms.find((r) => r.name === selectedRoomName) ||
      collegeRooms.find((r) => extractRoomCode(r.name) === extractRoomCode(selectedRoomName)) ||
      collegeRooms[0]
    );
  }, [selectedRoomName]);

  const activeSelectedIssues = useMemo(() => {
    if (!selectedRoomObj) return [];
    return getRoomIssues(selectedRoomObj.name);
  }, [selectedRoomObj, issuesByRoom]);

  // Schedule for selected room from verified college room data
  const selectedRoomSchedule = useMemo(() => {
    if (!selectedRoomObj) return null;
    return (collegeRoomData as any)[selectedRoomObj.name] || null;
  }, [selectedRoomObj]);

  const handleUpvote = (issueId: string) => {
    const success = upvoteRoomIssue(issueId);
    if (success) {
      toast.success("Issue confirmed!", {
        description: "Your verification has been recorded for the maintenance team."
      });
    } else {
      toast.info("Already verified", {
        description: "You have already confirmed this issue."
      });
    }
  };

  const handleResolve = (issueId: string) => {
    resolveRoomIssue(issueId, user?.name || "Student");
    setIssues(loadRoomwareIssues());
    toast.success("Issue Resolved!", {
      description: "Room equipment and facilities have been verified operational."
    });
  };

  const totalActiveIssues = useMemo(() => {
    return issues.filter((i) => i.status !== "resolved").length;
  }, [issues]);

  const roomsWithIssuesCount = useMemo(() => {
    const affectedRooms = new Set<string>();
    issues.forEach((i) => {
      if (i.status !== "resolved") {
        affectedRooms.add(i.roomCode);
      }
    });
    return affectedRooms.size;
  }, [issues]);

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
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-[#1f255b] via-[#252b67] to-[#343d88] text-white p-5 md:p-6 rounded-2xl shadow-lg border border-[#3f4794] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#e3a62f]/20 border border-[#e3a62f]/40 text-[#e3a62f] text-xs font-bold font-mono uppercase tracking-wider">
            <Wrench size={12} /> ROOMWARE & WEAR-AND-TEAR TRACKER
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Campus Room Equipment & Wear-and-Tear
          </h2>
          <p className="text-xs md:text-sm text-[#cbd0ed] leading-relaxed">
            Real-time status of AC units, projectors, audio mics, electrical switches, and furniture across all classrooms and laboratories.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsReportModalOpen(true)}
            className="bg-[#e3a62f] text-[#252b67] hover:bg-[#efb544] font-bold text-xs gap-1.5 shadow-md h-9 px-4"
          >
            <Plus size={15} /> Report Room Issue
          </Button>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 px-3 rounded-xl border border-white/15 text-xs">
            <span className="flex items-center gap-1 font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-[#c84232] animate-pulse" />
              {totalActiveIssues} Active Issues
            </span>
            <span className="text-white/30">|</span>
            <span className="text-[#cbd0ed]">{roomsWithIssuesCount} Rooms Affected</span>
          </div>
        </div>
      </div>

      {/* Dynamic Top Alert Notification Bar for Selected Room */}
      {activeSelectedIssues.length > 0 && (
        <div className="bg-gradient-to-r from-[#fee2e2] via-[#fff1f2] to-[#fffbeb] border-2 border-[#ef4444] border-l-8 border-l-[#dc2626] rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#dc2626] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <AlertTriangle size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-[#991b1b] uppercase tracking-wider font-mono">
                  ROOM NOTIFICATION BAR · {extractRoomCode(selectedRoomObj.name)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#dc2626] text-white shadow-2xs">
                  {activeSelectedIssues[0].severity} Severity
                </span>
                <span className="text-xs text-[#7f1d1d] font-bold">
                  ({activeSelectedIssues.length} Active Issue{activeSelectedIssues.length > 1 ? "s" : ""})
                </span>
              </div>
              <p className="text-sm font-bold text-[#7f1d1d] mt-0.5 leading-snug">
                {activeSelectedIssues[0].title}
              </p>
              <p className="text-xs text-[#991b1b]/90 line-clamp-1">
                {activeSelectedIssues[0].description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => handleUpvote(activeSelectedIssues[0].id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#dc2626] hover:bg-[#b91c1c] text-white transition shadow-xs cursor-pointer"
              title="Confirm you have also observed this issue"
            >
              <ThumbsUp size={12} />
              <span>Confirm / Me Too ({activeSelectedIssues[0].upvotes})</span>
            </button>
            {(isAdmin || isFaculty) && (
              <button
                onClick={() => handleResolve(activeSelectedIssues[0].id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#15803d] hover:bg-[#166534] text-white transition shadow-xs cursor-pointer"
              >
                <CheckSquare size={12} />
                <span>Mark Fixed</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid & Inspection Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Room Grid & Filters (Matches user's screenshot layout) */}
        <div className="lg:col-span-7 bg-[#fffdf7] border border-[#d5d0c2] rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77747b] block">
                ROOM DIRECTORY
              </span>
              <h3 className="text-base font-bold text-[#252b67]">
                Select Room to Inspect Wear & Tear
              </h3>
            </div>
            <span className="text-xs text-[#555259] bg-[#f0ece1] px-2.5 py-1 rounded-md font-mono">
              Showing {filteredRooms.length} of {collegeRooms.length} Rooms
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77747b]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms (e.g. 102, 105, 114B, 204, Lab, AC)..."
              className="w-full h-10 pl-9 pr-4 text-xs md:text-sm bg-[#faf8f1] border border-[#d5d0c2] rounded-xl text-[#252b67] placeholder:text-[#99959e] outline-none focus:border-[#e3a62f] focus:bg-white transition"
            />
          </div>

          {/* Type Filter Pills (Like in user screenshot: All, Class, Lab, AC, Free Rooms, With Issues) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "all"
                  ? "bg-[#252b67] text-white shadow-xs"
                  : "bg-[#f5f1e6] text-[#555259] hover:bg-[#ece7d8]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("class")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "class"
                  ? "bg-[#252b67] text-white shadow-xs"
                  : "bg-[#f5f1e6] text-[#555259] hover:bg-[#ece7d8]"
              }`}
            >
              Class
            </button>
            <button
              onClick={() => setFilterType("lab")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "lab"
                  ? "bg-[#252b67] text-white shadow-xs"
                  : "bg-[#f5f1e6] text-[#555259] hover:bg-[#ece7d8]"
              }`}
            >
              Lab
            </button>
            <button
              onClick={() => setFilterType("ac")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "ac"
                  ? "bg-[#0284c7] text-white shadow-xs"
                  : "bg-[#e0f2fe] text-[#0369a1] hover:bg-[#bae6fd]"
              }`}
            >
              AC Rooms
            </button>
            <button
              onClick={() => setFilterType("issues")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterType === "issues"
                  ? "bg-[#c84232] text-white shadow-xs"
                  : "bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca]"
              }`}
            >
              <AlertTriangle size={12} />
              With Issues ({roomsWithIssuesCount})
            </button>
          </div>

          {/* Floor Quick Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#77747b] pt-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Floor:</span>
            {["all", "1", "2", "3", "4"].map((f) => (
              <button
                key={f}
                onClick={() => setFloorFilter(f)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  floorFilter === f
                    ? "bg-[#252b67] text-white font-bold"
                    : "bg-[#ece7d8] text-[#555259] hover:bg-[#dfd9c9]"
                }`}
              >
                {f === "all" ? "All Floors" : `Floor ${f}`}
              </button>
            ))}
          </div>

          {/* Room Buttons Grid (Replicating exact look & feel of screenshot) */}
          <div className="max-h-[520px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredRooms.map((room) => {
                const roomIssues = getRoomIssues(room.name);
                const isSelected =
                  selectedRoomObj &&
                  (selectedRoomObj.name === room.name ||
                    extractRoomCode(selectedRoomObj.name) === extractRoomCode(room.name));
                const hasCritical = roomIssues.some(
                  (i) => i.severity === "high" || i.severity === "critical"
                );
                const hasIssues = roomIssues.length > 0;

                return (
                  <button
                    key={room.name}
                    type="button"
                    onClick={() => setSelectedRoomName(room.name)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between min-h-[66px] cursor-pointer group ${
                      isSelected
                        ? "bg-[#252b67] border-[#252b67] text-white shadow-md ring-2 ring-[#e3a62f]/80 translate-y-[-1px]"
                        : hasIssues
                        ? "bg-[#fff7f5] border-[#f87171] hover:border-[#dc2626] text-[#252b67]"
                        : "bg-[#faf8f1] border-[#d5d0c2] hover:bg-white hover:border-[#252b67] text-[#252b67]"
                    }`}
                  >
                    {/* Top Row: Room Name */}
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-xs font-bold leading-tight line-clamp-1 ${
                          isSelected ? "text-white" : "text-[#252b67]"
                        }`}
                      >
                        {room.name.replace(" Room", "").replace(" Lab", "")}
                      </span>

                      {/* Issue Alert Pill */}
                      {hasIssues && (
                        <span
                          className={`shrink-0 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 ${
                            isSelected
                              ? "bg-[#e3a62f] text-[#252b67]"
                              : hasCritical
                              ? "bg-[#c84232] text-white animate-pulse"
                              : "bg-[#ea580c] text-white"
                          }`}
                          title={`${roomIssues.length} issue(s) reported`}
                        >
                          <AlertTriangle size={9} />
                          {roomIssues.length}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Room Type & Capacity or Issue Tag */}
                    <div className="flex items-center justify-between text-[10px] mt-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#ece7d8] text-[#555259]"
                        }`}
                      >
                        {room.type}
                      </span>

                      {hasIssues ? (
                        <span
                          className={`font-semibold text-[9px] truncate max-w-[80px] ${
                            isSelected ? "text-[#e3a62f]" : "text-[#c84232]"
                          }`}
                        >
                          {roomIssues[0]?.category === "ac"
                            ? "❄️ AC Issue"
                            : roomIssues[0]?.category === "projector"
                            ? "📽️ Projector"
                            : roomIssues[0]?.category === "audio"
                            ? "🎙️ Mic Down"
                            : "⚠️ Wear & Tear"}
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] ${
                            isSelected ? "text-[#faf8ef]/70" : "text-[#88848a]"
                          }`}
                        >
                          {room.seating ? `${room.seating} Seats` : "✓ Clear"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Room Dossier & Wear-and-Tear Details */}
        <div className="lg:col-span-5 space-y-4">
          {selectedRoomObj && (
            <div className="bg-[#fffdf7] border border-[#d5d0c2] rounded-2xl p-5 shadow-sm space-y-4">
              {/* Room Header Ribbon */}
              <div className="flex items-start justify-between gap-3 border-b border-[#ece7d8] pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#252b67] text-white">
                      {extractRoomCode(selectedRoomObj.name)}
                    </span>
                    <span className="text-xs font-semibold text-[#555259] bg-[#f0ede4] px-2 py-0.5 rounded">
                      {selectedRoomObj.type}
                    </span>
                    {selectedRoomObj.name.includes("[AC]") && (
                      <span className="text-[10px] font-bold text-[#0284c7] bg-[#e0f2fe] px-2 py-0.5 rounded flex items-center gap-1">
                        <Wind size={11} /> AC Room
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#252b67] mt-1.5">
                    {selectedRoomObj.name}
                  </h3>
                  <p className="text-xs text-[#77747b] flex items-center gap-2 mt-0.5">
                    <Users size={12} /> Seating Capacity: {selectedRoomObj.seating || "Standard (60)"}
                    <span>•</span>
                    <span>Floor {extractRoomCode(selectedRoomObj.name).charAt(0)}</span>
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                  className="bg-[#252b67] text-white hover:bg-[#33409a] text-xs font-semibold gap-1.5 shrink-0 shadow-xs"
                >
                  <AlertTriangle size={13} className="text-[#e3a62f]" />
                  Report Issue
                </Button>
              </div>

              {/* Prominently Highlighted Room Issues Notification Bar */}
              {activeSelectedIssues.length > 0 ? (
                <div className="bg-gradient-to-r from-[#fff5f5] via-[#fef2f2] to-[#fffbeb] border-2 border-[#f87171] border-l-6 border-l-[#dc2626] rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#fecaca] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#dc2626] text-white flex items-center justify-center shrink-0 animate-pulse">
                        <AlertTriangle size={14} />
                      </span>
                      <span className="text-xs font-black text-[#991b1b] uppercase tracking-wider font-mono">
                        ATTENTION: ROOM {extractRoomCode(selectedRoomObj.name)} ISSUES REPORTED
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#dc2626] text-white shadow-2xs">
                      {activeSelectedIssues.length} Fault{activeSelectedIssues.length > 1 ? "s" : ""} Active
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeSelectedIssues.map((issue) => {
                      const meta = CATEGORY_METADATA[issue.category];
                      const Icon = CATEGORY_ICONS[issue.category];
                      return (
                        <div key={issue.id} className="p-3 bg-white/90 rounded-lg border border-[#fca5a5] shadow-2xs space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                                style={{ backgroundColor: meta.badgeBg, color: meta.color }}
                              >
                                <Icon size={11} />
                                {meta.label.split("/")[0]?.trim()}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#fee2e2] text-[#dc2626]">
                                {issue.severity} Impact
                              </span>
                            </div>
                            <span className="text-[10px] text-[#88848a] flex items-center gap-1">
                              <Clock size={10} />
                              {timeAgo(issue.createdAt)}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-[#991b1b] leading-tight">
                            {issue.title}
                          </h4>
                          <p className="text-xs text-[#555259] leading-relaxed">
                            {issue.description}
                          </p>

                          {/* Verified Class Time & Hour Badge */}
                          {issue.classHour && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#f1f5f9] text-[#1e293b] text-[10px] font-semibold w-fit border border-slate-200">
                              <Clock size={11} className="text-[#3b82f6]" />
                              <span>Class Session: <strong>{issue.classDay || "Class"} · {issue.classHour}</strong> {issue.classSubject && `(${issue.classSubject})`}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[#f2ece0] text-[10px]">
                            <span className="text-[#77747b]">
                              Reported by <strong>{issue.reportedBy}</strong> ({issue.batch || issue.reporterRole})
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpvote(issue.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold bg-[#fee2e2] hover:bg-[#fca5a5] text-[#b91c1c] transition cursor-pointer"
                                title="Click to corroborate"
                              >
                                <ThumbsUp size={10} />
                                <span>Me Too ({issue.upvotes})</span>
                              </button>
                              
                              {/* Universal Issue Resolved Option */}
                              <button
                                onClick={() => handleResolve(issue.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] border border-[#86efac] transition cursor-pointer shadow-2xs"
                                title="Mark this issue as resolved"
                              >
                                <CheckSquare size={11} className="text-[#16a34a]" />
                                <span>Issue Resolved</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-[#f0fdf4] border border-[#86efac] border-l-4 border-l-[#16a34a] rounded-xl p-3 flex items-center justify-between text-xs text-[#166534] shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                    <div>
                      <span className="font-bold">All Equipment Verified Operational</span>
                      <p className="text-[11px] text-[#15803d]">No active infrastructure faults reported for {extractRoomCode(selectedRoomObj.name)}.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-[10px] font-semibold text-[#166534] underline hover:text-[#14532d] shrink-0 cursor-pointer ml-2"
                  >
                    Report Issue
                  </button>
                </div>
              )}

              {/* Equipment Health Snapshot */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77747b] block mb-2">
                  ROOM EQUIPMENT HEALTH CHECKLIST
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Air Conditioning",
                      icon: Wind,
                      hasIssue: activeSelectedIssues.some((i) => i.category === "ac"),
                      issueText: "Dripping / Temp Issue"
                    },
                    {
                      label: "AV Projector",
                      icon: MonitorPlay,
                      hasIssue: activeSelectedIssues.some((i) => i.category === "projector"),
                      issueText: "No signal / Port broken"
                    },
                    {
                      label: "Microphone & Audio",
                      icon: Mic,
                      hasIssue: activeSelectedIssues.some((i) => i.category === "audio"),
                      issueText: "Mic dead / Buzzing"
                    },
                    {
                      label: "Electrical & Lights",
                      icon: Zap,
                      hasIssue: activeSelectedIssues.some((i) => i.category === "electrical"),
                      issueText: "Sparks / Lights off"
                    },
                    {
                      label: "Benches & Chairs",
                      icon: Armchair,
                      hasIssue: activeSelectedIssues.some((i) => i.category === "furniture"),
                      issueText: "Broken desks"
                    },
                    {
                      label: "Smart Board",
                      icon: PenTool,
                      hasIssue: activeSelectedIssues.some((i) => i.category === "smartboard"),
                      issueText: "Marker / Touch down"
                    }
                  ].map((eq) => {
                    const Icon = eq.icon;
                    return (
                      <div
                        key={eq.label}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          eq.hasIssue
                            ? "bg-[#fff5f5] border-[#fca5a5] text-[#b91c1c]"
                            : "bg-[#faf8f1] border-[#e5decb] text-[#555259]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={eq.hasIssue ? "text-[#dc2626]" : "text-[#77747b]"} />
                          <div>
                            <div className="font-semibold leading-tight text-[11px]">{eq.label}</div>
                            {eq.hasIssue ? (
                              <div className="text-[9px] font-bold text-[#b91c1c] leading-tight">
                                {eq.issueText}
                              </div>
                            ) : (
                              <div className="text-[9px] text-[#16a34a] font-medium leading-tight">
                                Operational
                              </div>
                            )}
                          </div>
                        </div>

                        {eq.hasIssue ? (
                          <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping shrink-0" />
                        ) : (
                          <CheckCircle2 size={13} className="text-[#16a34a] shrink-0 opacity-80" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Issues for Selected Room */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#77747b] flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-[#c84232]" />
                    ACTIVE ISSUES & STUDENT REPORTS ({activeSelectedIssues.length})
                  </span>
                </div>

                {activeSelectedIssues.length === 0 ? (
                  <div className="p-5 text-center bg-[#f7fbf8] border border-[#d1e7dd] rounded-xl text-[#2b6441] space-y-1">
                    <CheckCircle2 size={24} className="mx-auto text-[#198754]" />
                    <h5 className="text-xs font-bold">All Systems Operational</h5>
                    <p className="text-[11px] text-[#3c763d] leading-relaxed">
                      No active issues reported for {selectedRoomObj.name}. Projector, AC, audio and physical seating are verified normal.
                    </p>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="mt-2 text-xs font-semibold text-[#198754] underline hover:text-[#0f5132] cursor-pointer"
                    >
                      Found a problem? Click here to report it
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeSelectedIssues.map((issue) => {
                      const meta = CATEGORY_METADATA[issue.category];
                      const Icon = CATEGORY_ICONS[issue.category];

                      return (
                        <div
                          key={issue.id}
                          className="p-3.5 rounded-xl border border-[#fecaca] bg-[#fffbfb] shadow-2xs space-y-2 text-[#252b67]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                                style={{ backgroundColor: meta.badgeBg, color: meta.color }}
                              >
                                <Icon size={12} />
                                {meta.label.split("/")[0]?.trim()}
                              </span>

                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  issue.severity === "high" || issue.severity === "critical"
                                    ? "bg-[#fee2e2] text-[#dc2626]"
                                    : "bg-[#fef9c3] text-[#ca8a04]"
                                }`}
                              >
                                {issue.severity} Impact
                              </span>

                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#ece7d8] text-[#555259]">
                                {issue.status.replace("_", " ")}
                              </span>
                            </div>

                            <span className="text-[10px] text-[#88848a] flex items-center gap-1 shrink-0">
                              <Clock size={10} />
                              {timeAgo(issue.createdAt)}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-[#1f255b] leading-snug">
                            {issue.title}
                          </h4>

                          <p className="text-xs text-[#555259] leading-relaxed">
                            {issue.description}
                          </p>

                          {/* Verified Class Time & Hour Badge */}
                          {issue.classHour && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#f1f5f9] text-[#1e293b] text-[10px] font-semibold w-fit my-1 border border-slate-200">
                              <Clock size={11} className="text-[#3b82f6]" />
                              <span>Class Session: <strong>{issue.classDay || "Class"} · {issue.classHour}</strong> {issue.classSubject && `(${issue.classSubject})`}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[#f2ece0] text-[11px]">
                            <span className="text-[10px] text-[#77747b]">
                              Reported by <strong>{issue.reportedBy}</strong> ({issue.batch || issue.reporterRole})
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Confirm / Me Too Button */}
                              <button
                                onClick={() => handleUpvote(issue.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#f0ece1] hover:bg-[#e4decb] text-[#252b67] transition cursor-pointer"
                                title="Click to confirm you also noticed this problem"
                              >
                                <ThumbsUp size={11} className="text-[#33409a]" />
                                <span>Me Too ({issue.upvotes})</span>
                              </button>

                              {/* Universal Issue Resolved Option */}
                              <button
                                onClick={() => handleResolve(issue.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] border border-[#86efac] transition cursor-pointer shadow-2xs"
                                title="Mark this issue as resolved"
                              >
                                <CheckSquare size={12} className="text-[#16a34a]" />
                                <span>Issue Resolved</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Room Timetable Link / Weekly Occupancy */}
              {selectedRoomSchedule && (
                <div className="p-3 bg-[#faf8f1] rounded-xl border border-[#e5decb] text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#252b67] flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#33409a]" />
                      Scheduled Classes in {extractRoomCode(selectedRoomObj.name)}
                    </span>
                    {onNavigateTimetable && (
                      <button
                        onClick={() => onNavigateTimetable(extractRoomCode(selectedRoomObj.name))}
                        className="text-[11px] font-semibold text-[#33409a] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        Open in Timetable <ArrowUpRight size={11} />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#77747b]">
                    Subjects hosted: {selectedRoomSchedule.subjects?.slice(0, 4).map((s: any) => typeof s === "string" ? s : (s.name || s.code)).join(", ") || "General Lectures"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultRoomName={selectedRoomObj?.name}
        onIssueReported={(roomName) => {
          setSelectedRoomName(roomName);
        }}
      />
    </div>
  );
}
