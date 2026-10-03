import React, { useMemo } from "react";
import { BuildingRoom, CATEGORY_CONFIG } from "@/data/floorPlanData";
import { loadClassSchedule, DAYS, SLOT_LABELS, Session } from "@/lib/timetableStore";
import {
  X,
  Users,
  Maximize2,
  MapPin,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  FlaskConical,
  Briefcase,
  Shield,
  Compass,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadRoomwareIssues, extractRoomCode, resolveRoomIssue, RoomIssue } from "@/lib/roomwareStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RoomDetailModalProps {
  room: BuildingRoom | null;
  onClose: () => void;
  onSelectTimetable?: (roomCode: string) => void;
}

export function RoomDetailModal({ room, onClose, onSelectTimetable }: RoomDetailModalProps) {
  if (!room) return null;

  const { user } = useAuth();
  const config = CATEGORY_CONFIG[room.category] || CATEGORY_CONFIG.lecture;

  // Query all active timetable sessions for this room across default batches
  const roomSessions = useMemo(() => {
    // Check primary timetable programs
    const batchesToCheck = [
      { program: "AIDE", sem: "1", sec: "A" },
      { program: "CSE-GEN", sem: "1", sec: "F" },
      { program: "CSE-AIML", sem: "3", sec: "A" }
    ];

    const allSessions: Session[] = [];
    batchesToCheck.forEach((b) => {
      const state = loadClassSchedule(b.program, b.sem, b.sec);
      state.published.forEach((s) => {
        // Match room code (case-insensitive substring or exact)
        const sRoom = s.room.toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetRoom = room.code.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (sRoom.includes(targetRoom) || targetRoom.includes(sRoom)) {
          allSessions.push(s);
        }
      });
    });

    return allSessions;
  }, [room.code]);

  // Today's day of week
  const todayDayName = DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1] || "Monday";
  const todaySessions = roomSessions.filter((s) => s.day === todayDayName);

  // Determine current period occupancy (simulated or active)
  const isOccupiedNow = todaySessions.some((s) => s.slot === 1 || s.slot === 2);
  const activeSession = todaySessions.find((s) => s.slot === 1 || s.slot === 2);

  // Active room issues
  const roomIssues = useMemo(() => {
    const all = loadRoomwareIssues();
    const code = extractRoomCode(room.code).toLowerCase();
    const name = room.name.toLowerCase();
    return all.filter(
      (i) =>
        i.status !== "resolved" &&
        (i.roomCode.toLowerCase() === code ||
          code.includes(i.roomCode.toLowerCase()) ||
          name.includes(i.roomCode.toLowerCase()))
    );
  }, [room.code, room.name]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "lecture": return <GraduationCap size={16} />;
      case "lab": return <FlaskConical size={16} />;
      case "faculty": return <Briefcase size={16} />;
      case "admin": return <Shield size={16} />;
      default: return <Compass size={16} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#fffdf7] border border-[#d5d0c2] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div
          className="p-5 text-white flex items-start justify-between relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, #1d224e 0%, ${config.color} 100%)` }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
              >
                {getCategoryIcon(room.category)}
                {config.label}
              </span>
              <span className="text-white/80 text-xs font-mono">
                {room.block} · Floor {room.floor}
              </span>
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Room {room.code}
              <span className="text-sm font-sans font-normal text-white/80">({room.name})</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Active Room Issues Notification Bar */}
          {roomIssues.length > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-[#fee2e2] to-[#fff1f2] border-2 border-[#ef4444] border-l-6 border-l-[#dc2626] rounded-xl text-xs text-[#991b1b] shadow-xs space-y-2 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-black text-[#7f1d1d] uppercase tracking-wider font-mono text-[11px]">
                  <AlertTriangle size={15} className="text-[#dc2626] shrink-0 animate-pulse" />
                  <span>Room {room.code} Infrastructure Issue Notification ({roomIssues.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#dc2626] text-white">
                    {roomIssues[0].severity} Severity
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      resolveRoomIssue(roomIssues[0].id, user?.name || "Student");
                      toast.success(`Issue for Room ${room.code} marked as Resolved!`);
                      onClose();
                    }}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] border border-[#86efac] flex items-center gap-1 transition shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 size={11} className="text-[#16a34a]" />
                    <span>Issue Resolved</span>
                  </button>
                </div>
              </div>
              <p className="font-bold text-[#7f1d1d] text-xs leading-snug">
                {roomIssues[0].title}
              </p>
              <p className="text-[11px] text-[#991b1b] leading-relaxed">
                {roomIssues[0].description}
              </p>
              {roomIssues[0].classHour && (
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7f1d1d] bg-white/70 px-2 py-0.5 rounded border border-red-200 w-fit">
                  <Clock size={10} className="text-red-600" />
                  <span>Reported in class: <strong>{roomIssues[0].classDay || "Class"} · {roomIssues[0].classHour}</strong> {roomIssues[0].classSubject && `(${roomIssues[0].classSubject})`}</span>
                </div>
              )}
            </div>
          )}

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#faf8f2] border border-[#e5e1d5] rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-[#87838a] font-medium mb-1">
                <Users size={14} className="text-[#33409a]" /> Capacity
              </div>
              <div className="text-lg font-bold text-[#25252c]">{room.capacity} Seats</div>
              <div className="text-[10px] text-[#99959c]">Standard occupancy</div>
            </div>

            <div className="p-3 bg-[#faf8f2] border border-[#e5e1d5] rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-[#87838a] font-medium mb-1">
                <Maximize2 size={14} className="text-[#e3a62f]" /> Floor Area
              </div>
              <div className="text-lg font-bold text-[#25252c]">{room.areaSqm} SQM</div>
              <div className="text-[10px] text-[#99959c]">{Math.round(room.areaSqm * 10.764)} sq.ft</div>
            </div>

            <div className="p-3 bg-[#faf8f2] border border-[#e5e1d5] rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-[#87838a] font-medium mb-1">
                <MapPin size={14} className="text-[#2c8c87]" /> Location
              </div>
              <div className="text-sm font-bold text-[#25252c]">{room.block}</div>
              <div className="text-[10px] text-[#99959c]">Floor {room.floor} Wing</div>
            </div>

            <div className="p-3 bg-[#faf8f2] border border-[#e5e1d5] rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-[#87838a] font-medium mb-1">
                <Clock size={14} className="text-[#cc5a4b]" /> Live Status
              </div>
              {isOccupiedNow ? (
                <div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#fce8e6] text-[#c84232]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c84232] animate-pulse" />
                    In Session
                  </span>
                  <div className="text-[10px] text-[#99959c] truncate">{activeSession?.subject || "Active"}</div>
                </div>
              ) : (
                <div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#e5f4ef] text-[#2c8a63]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2c8a63]" />
                    Vacant
                  </span>
                  <div className="text-[10px] text-[#99959c]">Available slot</div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#78757c] mb-1.5">Overview</h4>
            <p className="text-sm text-[#47454c] leading-relaxed bg-[#faf8f2] p-3.5 rounded-lg border border-[#e5e1d5]">
              {room.description}
            </p>
          </div>

          {/* Installed Facilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#78757c] mb-2">Installed Equipment & Facilities</h4>
            <div className="flex flex-wrap gap-2">
              {room.facilities.map((fac, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[#f0ede4] text-[#333138] border border-[#ded9cb]"
                >
                  <CheckCircle2 size={13} className="text-[#2c8a63]" />
                  {fac}
                </span>
              ))}
            </div>
          </div>

          {/* Today's Schedule in this Room */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#78757c] flex items-center gap-1.5">
                <Calendar size={14} className="text-[#33409a]" />
                Timetable Allocations for {todayDayName} (P1–P8)
              </h4>
              <span className="text-[11px] text-[#99959c] font-medium">
                {todaySessions.length} session{todaySessions.length === 1 ? "" : "s"} scheduled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SLOT_LABELS.map((slotLabel, slotIdx) => {
                const sessionAtSlot = todaySessions.find((s) => s.slot === slotIdx);
                return (
                  <div
                    key={slotIdx}
                    className={`p-2.5 rounded-md border text-left transition ${
                      sessionAtSlot
                        ? "bg-[#eef1fb] border-[#c5ceee] shadow-xs"
                        : "bg-[#faf8f2] border-[#e8e4d8] opacity-75"
                    }`}
                  >
                    <div className="text-[10px] font-bold font-mono text-[#33409a] mb-1">
                      {slotLabel.split(" · ")[0]} <span className="text-[#88848a] font-normal">{slotLabel.split(" · ")[1]}</span>
                    </div>
                    {sessionAtSlot ? (
                      <div>
                        <div className="text-xs font-bold text-[#25252c] truncate" title={sessionAtSlot.subject}>
                          {sessionAtSlot.subject}
                        </div>
                        <div className="text-[10px] text-[#6b6770] truncate mt-0.5">
                          {sessionAtSlot.faculty} · {sessionAtSlot.batch}
                        </div>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white text-[#33409a] border border-[#c5ceee]">
                          {sessionAtSlot.type}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#9c98a0] italic py-1">Vacant</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f6f4ed] border-t border-[#ded9cb] flex items-center justify-between">
          <div className="text-xs text-[#78757c]">
            Room Code: <strong className="text-[#25252c]">{room.code}</strong> · Institutional Campus Asset
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs border-[#d5d0c2]">
              Close
            </Button>
            {onSelectTimetable && (
              <Button
                size="sm"
                onClick={() => {
                  onSelectTimetable(room.code);
                  onClose();
                }}
                className="h-8 text-xs bg-[#252b67] text-white hover:bg-[#33409a] gap-1.5"
              >
                Find in Timetable <ArrowUpRight size={13} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
