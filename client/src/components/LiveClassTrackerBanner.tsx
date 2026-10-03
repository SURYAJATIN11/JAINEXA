import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Radio,
  Play,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  Sliders,
  RotateCcw,
  Calendar,
  Coffee,
  Moon,
  Zap,
  FlaskConical,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { findBuildingRoomByCodeOrName } from "@/data/floorPlanData";
import { RoomIssue, extractRoomCode } from "@/lib/roomwareStore";
import { Session } from "@/lib/timetableStore";

export interface PeriodScheduleItem {
  slot: number; // 0 to 7
  period: number; // 1 to 8
  label: string; // "P1"
  startMin: number;
  endMin: number;
  timeText: string;
}

// Official 6-period bell schedule for CSE-GEN Sem 3 Section F (Room 215A)
export const PERIOD_SCHEDULE_6: PeriodScheduleItem[] = [
  { slot: 0, period: 1, label: "P1", startMin: 8 * 60 + 45, endMin: 9 * 60 + 45, timeText: "8:45 – 9:45 AM" },
  { slot: 1, period: 2, label: "P2", startMin: 9 * 60 + 45, endMin: 10 * 60 + 45, timeText: "9:45 – 10:45 AM" },
  { slot: 2, period: 3, label: "P3", startMin: 11 * 60 + 0, endMin: 12 * 60 + 0, timeText: "11:00 AM – 12:00 PM" },
  { slot: 3, period: 4, label: "P4", startMin: 12 * 60 + 0, endMin: 13 * 60 + 0, timeText: "12:00 – 1:00 PM" },
  { slot: 4, period: 5, label: "P5", startMin: 13 * 60 + 50, endMin: 14 * 60 + 50, timeText: "1:50 – 2:50 PM" },
  { slot: 5, period: 6, label: "P6", startMin: 14 * 60 + 50, endMin: 15 * 60 + 50, timeText: "2:50 – 3:50 PM" },
];

// Standard 8-period bell schedule
export const PERIOD_SCHEDULE_8: PeriodScheduleItem[] = [
  { slot: 0, period: 1, label: "P1", startMin: 8 * 60 + 45, endMin: 9 * 60 + 35, timeText: "8:45 – 9:35 AM" },
  { slot: 1, period: 2, label: "P2", startMin: 9 * 60 + 40, endMin: 10 * 60 + 30, timeText: "9:40 – 10:30 AM" },
  { slot: 2, period: 3, label: "P3", startMin: 10 * 60 + 35, endMin: 11 * 60 + 25, timeText: "10:35 – 11:25 AM" },
  { slot: 3, period: 4, label: "P4", startMin: 11 * 60 + 30, endMin: 12 * 60 + 20, timeText: "11:30 AM – 12:20 PM" },
  { slot: 4, period: 5, label: "P5", startMin: 12 * 60 + 25, endMin: 13 * 60 + 15, timeText: "12:25 – 1:15 PM" },
  { slot: 5, period: 6, label: "P6", startMin: 13 * 60 + 20, endMin: 14 * 60 + 10, timeText: "1:20 – 2:10 PM" },
  { slot: 6, period: 7, label: "P7", startMin: 14 * 60 + 15, endMin: 15 * 60 + 5, timeText: "2:15 – 3:05 PM" },
  { slot: 7, period: 8, label: "P8", startMin: 15 * 60 + 10, endMin: 16 * 60 + 0, timeText: "3:10 – 4:00 PM" },
];

export const PERIOD_SCHEDULE = PERIOD_SCHEDULE_6;

export const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface LiveClassTrackerBannerProps {
  sessions: Session[];
  roomwareIssues?: RoomIssue[];
  onLocateRoomOnFloorPlan: (roomName: string, floorNumber: number) => void;
  onSelectSession?: (session: Session) => void;
  currentSimulatedSlot: number | null;
  onSetSimulatedSlot: (slot: number | null) => void;
  currentSimulatedDay: string | null;
  onSetSimulatedDay: (day: string | null) => void;
  periodSchedule?: PeriodScheduleItem[];
}

export function LiveClassTrackerBanner({
  sessions,
  roomwareIssues = [],
  onLocateRoomOnFloorPlan,
  onSelectSession,
  currentSimulatedSlot,
  onSetSimulatedSlot,
  currentSimulatedDay,
  onSetSimulatedDay,
  periodSchedule,
}: LiveClassTrackerBannerProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [showSimControls, setShowSimControls] = useState<boolean>(false);

  // Determine active schedule: explicit prop or detect from sessions
  const activeSchedule = useMemo(() => {
    if (periodSchedule && periodSchedule.length > 0) return periodSchedule;
    const maxSlot = sessions.reduce((max, s) => Math.max(max, s.slot), 0);
    return maxSlot <= 5 ? PERIOD_SCHEDULE_6 : PERIOD_SCHEDULE_8;
  }, [periodSchedule, sessions]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current Day
  const realDayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const activeDay = currentSimulatedDay || (DAYS_LIST.includes(realDayName) ? realDayName : "Wednesday");

  // Determine current Minute of day
  const realMinutes = now.getHours() * 60 + now.getMinutes();

  // If simulated slot is chosen, simulate the middle of that period
  const effectiveMinutes = useMemo(() => {
    if (currentSimulatedSlot !== null) {
      const p = activeSchedule[currentSimulatedSlot];
      if (p) return Math.floor((p.startMin + p.endMin) / 2);
    }
    return realMinutes;
  }, [currentSimulatedSlot, realMinutes, activeSchedule]);

  // Current active period (if any)
  const activePeriod = useMemo(() => {
    return activeSchedule.find(
      (p) => effectiveMinutes >= p.startMin && effectiveMinutes <= p.endMin
    ) || null;
  }, [effectiveMinutes, activeSchedule]);

  // Next upcoming period today
  const nextPeriod = useMemo(() => {
    return activeSchedule.find((p) => p.startMin > effectiveMinutes) || null;
  }, [effectiveMinutes, activeSchedule]);

  // Active session happening right now
  const currentSession = useMemo(() => {
    if (!activePeriod) return null;
    return sessions.find(
      (s) => s.day === activeDay && s.slot === activePeriod.slot
    ) || null;
  }, [sessions, activeDay, activePeriod]);

  // Next session today
  const upcomingSession = useMemo(() => {
    if (!nextPeriod) return null;
    return sessions.find(
      (s) => s.day === activeDay && s.slot === nextPeriod.slot
    ) || null;
  }, [sessions, activeDay, nextPeriod]);

  // Calculate timing stats
  const timeStats = useMemo(() => {
    if (!activePeriod) {
      if (nextPeriod) {
        const minsUntilNext = nextPeriod.startMin - effectiveMinutes;
        return { type: "passing", minsUntilNext };
      }
      if (effectiveMinutes < (activeSchedule[0]?.startMin ?? 525)) {
        return { type: "before_college" };
      }
      return { type: "after_college" };
    }

    const elapsed = effectiveMinutes - activePeriod.startMin;
    const total = activePeriod.endMin - activePeriod.startMin;
    const remaining = Math.max(1, activePeriod.endMin - effectiveMinutes);
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

    return {
      type: "in_class",
      elapsed,
      total,
      remaining,
      progress,
    };
  }, [activePeriod, nextPeriod, effectiveMinutes]);

  // Room details for active session
  const currentRoomInfo = useMemo(() => {
    if (!currentSession) return null;
    return findBuildingRoomByCodeOrName(currentSession.room);
  }, [currentSession]);

  // Room details for upcoming session
  const upcomingRoomInfo = useMemo(() => {
    if (!upcomingSession) return null;
    return findBuildingRoomByCodeOrName(upcomingSession.room);
  }, [upcomingSession]);

  // Check if active room has issue
  const activeRoomIssue = useMemo(() => {
    if (!currentSession) return null;
    const code = extractRoomCode(currentSession.room).toLowerCase();
    return roomwareIssues.find(
      (iss) =>
        iss.status !== "resolved" &&
        (iss.roomCode.toLowerCase() === code ||
          iss.roomName.toLowerCase().includes(code) ||
          currentSession.room.toLowerCase().includes(iss.roomCode.toLowerCase()))
    );
  }, [currentSession, roomwareIssues]);

  const isSimulating = currentSimulatedSlot !== null || currentSimulatedDay !== null;

  return (
    <div className="mb-4 rounded-xl border border-[#ded8c8] bg-gradient-to-r from-[#fffdf7] via-[#faf7ee] to-[#f5f0e1] shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Ticker Header Bar */}
      <div className="px-4 py-2 bg-[#252b67] text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e3a62f] opacity-80" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e3a62f]" />
          </span>
          <span className="font-bold tracking-wider uppercase text-[#e3a62f] flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse" />
            LIVE CLASS TRACKER
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/90 font-medium">
            {activeDay}, {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          {isSimulating && (
            <Badge className="bg-[#e3a62f] text-[#252b67] font-bold text-[9px] hover:bg-[#d6961c] px-1.5 py-0">
              ⚡ SIMULATION
            </Badge>
          )}
        </div>

        {/* Simulation Controls Toggle */}
        <div className="flex items-center gap-2">
          {isSimulating && (
            <button
              type="button"
              onClick={() => {
                onSetSimulatedSlot(null);
                onSetSimulatedDay(null);
              }}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#e3a62f] text-[10px] font-bold flex items-center gap-1 transition"
              title="Reset to live system clock"
            >
              <RotateCcw size={10} /> Reset Live Time
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSimControls(!showSimControls)}
            className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium flex items-center gap-1.5 transition"
            title="Toggle fast time simulation mode to test classes at any hour"
          >
            <Sliders size={12} className="text-[#e3a62f]" />
            <span>{showSimControls ? "Hide Time Controls" : "Time Travel / Simulate"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Time Simulation / Fast Test Panel */}
      {showSimControls && (
        <div className="px-4 py-2.5 bg-[#1b204e] text-white/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#e3a62f] text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Zap size={11} /> Simulate Day:
            </span>
            <div className="flex flex-wrap gap-1">
              {DAYS_LIST.map((d) => (
                <button
                  key={d}
                  onClick={() => onSetSimulatedDay(d)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    activeDay === d
                      ? "bg-[#e3a62f] text-[#252b67] font-bold"
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#e3a62f] text-[10px] uppercase tracking-wider">
              Simulate Period:
            </span>
            <div className="flex flex-wrap gap-1">
              {activeSchedule.map((p) => (
                <button
                  key={p.period}
                  onClick={() => onSetSimulatedSlot(p.slot)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    activePeriod?.slot === p.slot
                      ? "bg-[#e3a62f] text-[#252b67] font-black shadow-xs ring-1 ring-white"
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => {
                  onSetSimulatedSlot(null);
                  onSetSimulatedDay(null);
                }}
                className="px-2 py-0.5 rounded bg-[#c84232] text-white hover:bg-[#b03628] text-[10px] font-bold"
                title="Return to real-time clock"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tracker Content Body */}
      <div className="p-3.5 sm:p-4">
        {/* CASE 1: CLASS IN PROGRESS RIGHT NOW */}
        {activePeriod && currentSession ? (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Session metadata & status badge */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  HAPPENING NOW · {activePeriod.label}
                </span>
                <span className="text-xs font-semibold text-[#6e6b72]">
                  {activePeriod.timeText}
                </span>
                <span className="text-xs font-bold text-[#e3a62f] font-mono">
                  (Ends in {timeStats.remaining}m)
                </span>
                {activeRoomIssue && (
                  <span className="px-2 py-0.5 rounded-full bg-[#fdeeed] text-[#c93b2b] text-[10px] font-bold border border-[#f3c5c0] flex items-center gap-1">
                    <AlertTriangle size={11} /> Room Notice: {activeRoomIssue.title}
                  </span>
                )}
              </div>

              {/* Course Title & Details */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#252b67] tracking-tight leading-snug">
                  {currentSession.subject}
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#e8eaf6] text-[#252b67] font-mono font-bold text-xs">
                  {currentSession.code}
                </span>
                <Badge className="bg-[#33409a] text-white text-[10px]">
                  {currentSession.type === "Lab" ? "Laboratory Block" : "Lecture Class"}
                </Badge>
              </div>

              {/* Faculty & Room row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#524f56] mt-1.5">
                <span className="flex items-center gap-1 font-medium text-[#2d2c33]">
                  <GraduationCap size={14} className="text-[#33409a]" />
                  {currentSession.faculty}
                </span>
                <span className="flex items-center gap-1 font-bold text-[#252b67]">
                  <MapPin size={14} className="text-[#c84232]" />
                  {currentSession.room}
                  {currentRoomInfo && (
                    <span className="text-[#89858c] font-normal">
                      · Floor {currentRoomInfo.floorNumber} ({currentRoomInfo.room.block})
                    </span>
                  )}
                </span>
              </div>

              {/* Progress bar of current period */}
              <div className="mt-2.5 max-w-md flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[#e6e2d4] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#e3a62f] to-[#e68a19] rounded-full transition-all duration-500"
                    style={{ width: `${timeStats.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#89858c]">
                  {timeStats.progress}%
                </span>
              </div>
            </div>

            {/* Right: 1-Click Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <Button
                onClick={() => {
                  const floor = currentRoomInfo ? currentRoomInfo.floorNumber : 2;
                  onLocateRoomOnFloorPlan(currentSession.room, floor);
                }}
                className="h-10 px-4 bg-gradient-to-r from-[#252b67] to-[#33409a] hover:from-[#1b204e] hover:to-[#273277] text-white font-bold text-xs gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                title="Open CAD blueprint with room locator beacon"
              >
                <MapPin size={15} className="text-[#e3a62f] group-hover:scale-125 transition-transform" />
                <span>Locate on CAD Floor Plan</span>
                <Compass size={13} className="opacity-70" />
              </Button>

              {onSelectSession && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectSession(currentSession)}
                  className="h-10 border-[#d5d0c2] bg-white text-[#252b67] hover:bg-[#faf8f2] text-xs font-semibold gap-1.5"
                >
                  <span>Class Details</span>
                  <ArrowUpRight size={13} />
                </Button>
              )}
            </div>
          </div>
        ) : activePeriod && !currentSession ? (
          /* CASE 2: CURRENT PERIOD IS FREE OR LUNCH BREAK */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fbf0d2] text-[#af7e19] flex items-center justify-center shrink-0">
                <Coffee size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#af7e19] font-mono">
                    {activePeriod.period === 4 ? "LUNCH BREAK / FREE PERIOD" : `PERIOD ${activePeriod.period} · OPEN WINDOW`}
                  </span>
                  <span className="text-xs text-[#89858c]">({activePeriod.timeText})</span>
                </div>
                <strong className="text-sm font-semibold text-[#302f36] block">
                  {activePeriod.period === 4 ? "Official Campus Lunch Break" : "No lecture scheduled for this period"}
                </strong>
                {upcomingSession && (
                  <span className="text-xs text-[#5f5c64] block mt-0.5">
                    Next Class: <strong>{upcomingSession.subject}</strong> at {nextPeriod?.timeText} in <strong>{upcomingSession.room}</strong>
                  </span>
                )}
              </div>
            </div>

            {upcomingSession && (
              <Button
                size="sm"
                onClick={() => {
                  const floor = upcomingRoomInfo ? upcomingRoomInfo.floorNumber : 2;
                  onLocateRoomOnFloorPlan(upcomingSession.room, floor);
                }}
                className="h-9 bg-[#33409a] text-white hover:bg-[#252b67] text-xs font-bold gap-1.5 shrink-0"
              >
                <MapPin size={13} className="text-[#e3a62f]" />
                <span>Locate Next Room ({upcomingSession.room})</span>
              </Button>
            )}
          </div>
        ) : timeStats.type === "passing" ? (
          /* CASE 3: PASSING PERIOD BETWEEN CLASSES */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#eef0fb] text-[#33409a] flex items-center justify-center shrink-0 font-bold">
                <Clock size={20} className="animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#33409a] font-mono">
                    TRANSIT / PASSING PERIOD
                  </span>
                  <span className="text-xs font-bold text-[#e3a62f]">
                    (Next period starts in {timeStats.minsUntilNext}m)
                  </span>
                </div>
                <strong className="text-sm font-semibold text-[#252b67] block">
                  {upcomingSession
                    ? `Heading to: ${upcomingSession.subject} (${upcomingSession.code})`
                    : `Upcoming: Period ${nextPeriod?.period} at ${nextPeriod?.timeText}`}
                </strong>
                {upcomingSession && (
                  <span className="text-xs text-[#6e6b72] block">
                    Venue: <strong>{upcomingSession.room}</strong> · Faculty: {upcomingSession.faculty}
                  </span>
                )}
              </div>
            </div>

            {upcomingSession && (
              <Button
                size="sm"
                onClick={() => {
                  const floor = upcomingRoomInfo ? upcomingRoomInfo.floorNumber : 2;
                  onLocateRoomOnFloorPlan(upcomingSession.room, floor);
                }}
                className="h-9 bg-[#252b67] text-white hover:bg-[#1b204e] text-xs font-bold gap-1.5 shrink-0 shadow-sm"
              >
                <MapPin size={14} className="text-[#e3a62f] animate-bounce" />
                <span>Locate Next Class on Blueprint</span>
              </Button>
            )}
          </div>
        ) : (
          /* CASE 4: OUTSIDE REGULAR COLLEGE HOURS */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f1f3f9] text-[#252b67] flex items-center justify-center shrink-0">
                <Moon size={18} className="text-[#33409a]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6b72] font-mono">
                  ACADEMIC TIMETABLE STATUS
                </span>
                <strong className="text-sm font-serif font-bold text-[#252b67] block">
                  College Hours Concluded (8:45 AM – 4:00 PM)
                </strong>
                <span className="text-xs text-[#78757c] block mt-0.5">
                  Scheduled classes run Monday through Saturday. Click <strong>Time Travel / Simulate</strong> above to test any period live.
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowSimControls(true);
                onSetSimulatedSlot(2); // Simulate Period 3 by default
                onSetSimulatedDay("Wednesday");
              }}
              className="h-9 border-[#33409a] text-[#33409a] hover:bg-[#eef0fb] text-xs font-bold gap-1.5 shrink-0"
            >
              <Zap size={13} className="text-[#e3a62f]" />
              <span>Simulate Active Period (P3)</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
