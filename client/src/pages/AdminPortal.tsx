import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminLogin from "./AdminLogin";
import AdminAccessRestricted from "@/components/AdminAccessRestricted";
import {
  loadClassSchedule,
  saveDraftSession,
  removeDraftSession,
  publishClassSchedule,
  revertDraftToPublished,
  resetClassScheduleToDefault,
  subscribeToTimetableChanges,
  DAYS,
  SLOTS,
  SLOT_LABELS,
  SECTION_F_SLOT_LABELS,
  PALETTE,
  Session,
  ClassScheduleState,
  getAcademicYearFromSemester
} from "@/lib/timetableStore";
import {
  collegePrograms,
  collegeBatches,
  semestersFor,
  sectionsFor
} from "@/data/collegeData";
import { SessionEditorDialog } from "@/components/SessionEditorDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock3,
  Layers3,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  LogOut,
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  GraduationCap,
  Eye
} from "lucide-react";
import { Link } from "wouter";
import { AppSidebar, NavItemKey } from "@/components/AppSidebar";
import { TimetableZoomControls } from "@/components/TimetableZoomControls";
import { CampusTimer } from "@/components/CampusTimer";
import { RoleSwitcherModal } from "@/components/RoleSwitcherModal";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { AdminChatbot } from "@/components/AdminChatbot";

export default function AdminPortal() {
  const { user, isAuthenticated, canAccessAdminStudio, switchRole, logout } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFitToScreen, setIsFitToScreen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Selected class filters
  const [program, setProgram] = useState("AIDE");
  const [semester, setSemester] = useState("1");
  const [section, setSection] = useState("A");

  // Timetable state
  const [scheduleState, setScheduleState] = useState<ClassScheduleState>(() =>
    loadClassSchedule("AIDE", "1", "A")
  );

  // Session Editor Dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [targetDay, setTargetDay] = useState(DAYS[0]);
  const [targetSlot, setTargetSlot] = useState(0);

  // Publish Dialog state
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishNote, setPublishNote] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Reset to college default confirmation
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Academic Years mapping
  const academicYears = [
    { label: "1st Year (Freshmen)", semesters: ["1", "2"] },
    { label: "2nd Year (Sophomore)", semesters: ["3", "4"] },
    { label: "3rd Year (Junior)", semesters: ["5", "6"] },
    { label: "4th Year (Senior)", semesters: ["7", "8"] },
  ];

  // Available semesters and sections
  const availableSemesters = useMemo(() => semestersFor(program), [program]);
  const availableSections = useMemo(() => sectionsFor(program, semester), [program, semester]);

  // Sync available selections
  useEffect(() => {
    if (!availableSemesters.includes(semester) && availableSemesters.length > 0) {
      setSemester(availableSemesters[0]);
    }
  }, [program, semester, availableSemesters]);

  useEffect(() => {
    if (!availableSections.includes(section) && availableSections.length > 0) {
      setSection(availableSections[0]);
    }
  }, [semester, program, section, availableSections]);

  // Load schedule when class changes
  const reloadCurrentSchedule = useCallback(() => {
    const updated = loadClassSchedule(program, semester, section);
    setScheduleState(updated);
  }, [program, semester, section]);

  useEffect(() => {
    reloadCurrentSchedule();
  }, [reloadCurrentSchedule]);

  // Subscribe to changes across tabs or windows
  useEffect(() => {
    const unsubscribe = subscribeToTimetableChanges((changedKey) => {
      if (changedKey === `${program}|${semester}|${section}`) {
        reloadCurrentSchedule();
      }
    });
    return unsubscribe;
  }, [program, semester, section, reloadCurrentSchedule]);

  // Handlers for Add / Edit / Remove
  const handleOpenAdd = (day: string, slot: number) => {
    setSessionToEdit(null);
    setTargetDay(day);
    setTargetSlot(slot);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (session: Session) => {
    setSessionToEdit(session);
    setTargetDay(session.day);
    setTargetSlot(session.slot);
    setIsEditorOpen(true);
  };

  const handleSaveSession = (savedSession: Session) => {
    const newState = saveDraftSession(program, semester, section, savedSession);
    setScheduleState(newState);
    toast.success(sessionToEdit ? "Class updated in draft" : "Class added to draft", {
      description: `${savedSession.subject} scheduled for ${savedSession.day} period P${savedSession.slot + 1}. Remember to publish when ready!`
    });
  };

  const handleDeleteSession = (sessionId: string, day: string, slot: number) => {
    const newState = removeDraftSession(program, semester, section, { id: sessionId, day, slot });
    setScheduleState(newState);
    toast.info("Slot removed from draft", {
      description: `Period slot ${day} P${slot + 1} cleared. Click "Publish Timetable" to update the live class.`
    });
  };

  // Revert draft changes
  const handleRevertDraft = () => {
    const newState = revertDraftToPublished(program, semester, section);
    setScheduleState(newState);
    toast.info("Draft discarded", {
      description: "Reverted all unsaved changes back to the currently published live timetable."
    });
  };

  // Reset to college defaults
  const handleConfirmReset = () => {
    const newState = resetClassScheduleToDefault(
      program,
      semester,
      section,
      user?.name || "Academic Administrator"
    );
    setScheduleState(newState);
    setIsResetDialogOpen(false);
    toast.success("Schedule reset", {
      description: "Restored official college baseline schedule and published live."
    });
  };

  // Publish timetable to live
  const handlePublishTimetable = () => {
    setIsPublishing(true);
    setTimeout(() => {
      const newState = publishClassSchedule(
        program,
        semester,
        section,
        user?.name || "Academic Coordinator",
        publishNote || `Published revised timetable for ${program} Semester ${semester} Section ${section}.`
      );
      setScheduleState(newState);
      setIsPublishing(false);
      setIsPublishDialogOpen(false);
      setPublishNote("");
      toast.success("Timetable Published Successfully!", {
        description: `Version ${newState.metadata.version} is now LIVE for ${program} S${semester} ${section}. Students & faculty see this immediately!`
      });
    }, 400);
  };

  // If not logged in, show Admin Login view
  if (!isAuthenticated || !user) {
    return <AdminLogin onSuccess={reloadCurrentSchedule} />;
  }

  // Strict Admin authorization check: ADMIN STUDIO IS ONLY ACCESSIBLE TO ADMIN
  if (!canAccessAdminStudio) {
    return (
      <AdminAccessRestricted
        user={user}
        onSwitchToAdmin={() => {
          switchRole("admin");
          reloadCurrentSchedule();
        }}
      />
    );
  }

  const currentYearLabel = getAcademicYearFromSemester(semester);
  const totalClasses = scheduleState.draft.length;
  const labClasses = scheduleState.draft.filter((s) => s.type === "Lab").length;
  const theoryClasses = scheduleState.draft.filter((s) => s.type !== "Lab").length;

  const isCseGen3F =
    (program === "CSE-GEN" || program === "CSE_GEN" || program === "CSE") &&
    (semester === "3" || semester === "3RD") &&
    (section === "F" || section === "SEC F");

  const isCseDs3A =
    (program === "DS" || program === "CSE-DS" || program === "CSE_DS") &&
    (semester === "3" || semester === "3RD") &&
    (section === "A" || section === "SEC A");

  const is6PeriodClass = isCseGen3F || isCseDs3A;
  const activeSlots = is6PeriodClass ? ["1", "2", "3", "4", "5", "6"] : SLOTS;
  const activeSlotLabels = is6PeriodClass ? SECTION_F_SLOT_LABELS : SLOT_LABELS;

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#25252c] font-sans pb-16 relative">
      {/* Texture background overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-cover"
        style={{ backgroundImage: "url('/manus-storage/campus-ledger-texture_15d6d0cc.png')" }}
      />

      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-[#252b67] text-[#faf8ef] border-b border-[#1f255b] px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-bold tracking-wider text-xs uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e3a62f] shadow-[0_0_8px_#e3a62f]" />
              <span className="text-[#faf8ef]">JAINEXA</span>
              <span className="text-[#9ea3c7]">/</span>
              <span className="text-[#e3a62f] font-normal">ADMINISTRATION PORTAL</span>
            </div>
          </div>

          {/* User Profile, Public Link, and Logout */}
          <div className="flex items-center gap-3">
            {/* Open Public Timetable in separate window */}
            <a
              href="/timetable"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#343b7e] hover:bg-[#3f4794] text-[#eceffb] transition border border-[#444c9b]"
              title="Open the student & faculty live timetable view in a separate window"
            >
              <Eye size={13} className="text-[#e3a62f]" />
              <span>View Live Timetable</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>

            {/* Authenticated user badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#3a4185]">
              <div className="w-7 h-7 rounded-full bg-[#e3a62f] text-[#252b67] font-bold text-xs grid place-items-center">
                {user.avatarInitials}
              </div>
              <div className="hidden sm:block text-left">
                <strong className="block text-xs text-[#faf8ef] leading-tight">{user.name}</strong>
                <span className="text-[10px] text-[#b8bde0]">{user.role}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-1.5 rounded hover:bg-[#343b7e] text-[#c0c5ea] hover:text-white transition"
              title="Sign out of administration studio"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Canvas */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-8 pt-6 relative z-10">
        {/* Page Title & Status Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#e5e1d5]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#858286] uppercase mb-1">
              <GraduationCap size={14} className="text-[#33409a]" />
              ACADEMIC SCHEDULE CONTROLLER · {currentYearLabel.toUpperCase()}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#262a68] font-normal tracking-tight m-0">
              Manage & Publish <em className="text-[#e3a62f] not-italic font-serif">Class Timetable</em>
            </h1>
            <p className="text-xs text-[#716e75] mt-1">
              Select any academic year, department, and class section to update, add, or clear timetable slots, then publish revisions directly to the public timetable.
            </p>
          </div>

          {/* Publication and Status Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {scheduleState.hasDraftChanges ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#fdf6e7] border border-[#f1deae] text-[#916518] text-xs">
                <span className="w-2 h-2 rounded-full bg-[#cf8e18] animate-pulse" />
                <span className="font-medium">Unpublished Draft Changes</span>
                <span className="text-[10px] text-[#a87a27]">· Modified just now</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#eaf4ef] border border-[#cfebd9] text-[#2c7759] text-xs">
                <CheckCircle2 size={14} className="text-[#35926c]" />
                <span className="font-medium">Live Published v{scheduleState.metadata.version}</span>
                <span className="text-[10px] text-[#488e72]">
                  · {new Date(scheduleState.metadata.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}

            {/* Revert button if draft changes exist */}
            {scheduleState.hasDraftChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevertDraft}
                className="h-9 text-xs border-[#d8d4c7] text-[#6d6a71] hover:text-[#252b67] bg-white gap-1.5"
              >
                <RotateCcw size={13} />
                Discard Draft
              </Button>
            )}

            {/* Reset to college baseline */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetDialogOpen(true)}
              className="h-9 text-xs border-[#d8d4c7] text-[#6d6a71] hover:text-[#9e2f23] bg-white gap-1.5"
            >
              Reset to Baseline
            </Button>

            {/* PUBLISH BUTTON */}
            <Button
              size="sm"
              onClick={() => setIsPublishDialogOpen(true)}
              className={`h-9 text-xs px-4 gap-2 font-medium shadow-md transition-all ${
                scheduleState.hasDraftChanges
                  ? "bg-[#cf8e18] hover:bg-[#b07812] text-white animate-bounce-subtle"
                  : "bg-[#33409a] hover:bg-[#252b67] text-white"
              }`}
            >
              <Send size={13} />
              {scheduleState.hasDraftChanges ? "Publish Changes Live" : "Republish Schedule"}
            </Button>
          </div>
        </div>

        {/* Academic Year, Program, Semester, and Section Controls */}
        <section className="my-5 p-4 bg-[#252b67] text-white rounded-md border border-[#1d2254] shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Year & Program */}
            <div>
              <label className="block text-[10px] font-bold text-[#b9bfe3] uppercase tracking-wider mb-1.5">
                1. Academic Program / Dept
              </label>
              <select
                value={program}
                onChange={(e) => {
                  setProgram(e.target.value);
                  const sems = semestersFor(e.target.value);
                  setSemester(sems[0] || "1");
                  setSection("A");
                }}
                className="w-full h-9 px-3 text-xs bg-[#333b80] text-white border border-[#48529e] rounded focus:outline-none focus:border-[#e3a62f]"
              >
                {collegePrograms.map((prog) => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>

            {/* Academic Year Grouping */}
            <div>
              <label className="block text-[10px] font-bold text-[#b9bfe3] uppercase tracking-wider mb-1.5">
                2. Academic Year
              </label>
              <select
                value={
                  academicYears.find((y) => y.semesters.includes(semester))?.label || academicYears[0].label
                }
                onChange={(e) => {
                  const matched = academicYears.find((y) => y.label === e.target.value);
                  if (matched && matched.semesters.length > 0) {
                    // Pick semester if available for this program
                    const targetSem = matched.semesters.find((s) => availableSemesters.includes(s)) || matched.semesters[0];
                    setSemester(targetSem);
                  }
                }}
                className="w-full h-9 px-3 text-xs bg-[#333b80] text-white border border-[#48529e] rounded focus:outline-none focus:border-[#e3a62f]"
              >
                {academicYears.map((yr) => (
                  <option key={yr.label} value={yr.label}>{yr.label}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-[10px] font-bold text-[#b9bfe3] uppercase tracking-wider mb-1.5">
                3. Semester
              </label>
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  const secs = sectionsFor(program, e.target.value);
                  setSection(secs[0] || "A");
                }}
                className="w-full h-9 px-3 text-xs bg-[#333b80] text-white border border-[#48529e] rounded focus:outline-none focus:border-[#e3a62f]"
              >
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem} ({getAcademicYearFromSemester(sem).split(" ")[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-[10px] font-bold text-[#b9bfe3] uppercase tracking-wider mb-1.5">
                4. Class Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#333b80] text-white border border-[#48529e] rounded focus:outline-none focus:border-[#e3a62f]"
              >
                {availableSections.length > 0 ? (
                  availableSections.map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))
                ) : (
                  <option value="A">Section A</option>
                )}
              </select>
            </div>
          </div>

          {/* Selected Class Summary Strip */}
          <div className="mt-3 pt-3 border-t border-[#373e87] flex flex-wrap items-center justify-between text-xs text-[#c5c9e6]">
            <div>
              Active Class: <strong className="text-white font-medium">{program} · Semester {semester} · Section {section}</strong>
              <span className="text-[#a4a9cf] ml-2">({collegeBatches[`${program}|${semester}|${section}`]?.title || "Batch Class"})</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span><strong>{totalClasses}</strong> Scheduled Slots</span>
              <span><strong>{theoryClasses}</strong> Lectures</span>
              <span><strong>{labClasses}</strong> Practical Labs</span>
            </div>
          </div>
        </section>

        {/* Timetable Editing Matrix */}
        <section className="bg-[#fffdf7] border border-[#d9d4c6] border-t-4 border-t-[#33409a] rounded-lg shadow-lg overflow-hidden">
          {/* Matrix Header bar */}
          <div className="p-4 border-b border-[#e6e2d6] flex flex-wrap items-center justify-between gap-3 bg-[#fdfbf6]">
            <div>
              <h2 className="font-serif text-xl text-[#262a68] m-0">
                Interactive Schedule Matrix
              </h2>
              <p className="text-xs text-[#7d7981] mt-0.5">
                Click any existing session to <strong>edit details</strong> or <strong>remove</strong> it. Click any empty slot (+) to <strong>schedule a new class</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#6e6b72]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#33409a]" /> Lecture
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#cc5a4b]" /> Practical Lab
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2c8c87]" /> Tutorial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#a6a196]" /> Vacant Slot
              </span>
            </div>
          </div>

          {/* Matrix Grid Wrapper */}
          <div className="overflow-x-auto rounded-xl border border-[#e6e2d6] bg-[#fffdf7] shadow-xs">
            <table className="w-full min-w-[1240px] border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "130px" }} />
                {activeSlots.map((_, i) => (
                  <col key={i} style={{ width: `calc((100% - 130px) / ${activeSlots.length})` }} />
                ))}
              </colgroup>
              <thead className="bg-[#fbf9f4] border-b border-[#e6e2d6]">
                <tr>
                  <th className="p-3 text-[11px] font-bold text-[#8c8890] uppercase tracking-wider text-left border-r border-[#e6e2d6] align-middle">
                    <div className="flex items-center gap-1.5">
                      <Clock3 size={13} className="text-[#e3a62f]" />
                      <span>Day / Period</span>
                    </div>
                  </th>
                  {activeSlotLabels.map((slot) => {
                    const [pNum, pTime] = slot.split(" · ");
                    return (
                      <th key={slot} className="p-2.5 text-center border-r border-[#e6e2d6] last:border-r-0 align-middle">
                        <span className="text-[10px] font-bold text-[#e3a62f] tracking-wider block">{pNum}</span>
                        <strong className="text-xs text-[#302f35] font-semibold block mt-0.5 whitespace-nowrap">{pTime}</strong>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece8dc]">
                {DAYS.map((day) => (
                  <tr key={day} className="h-[96px] hover:bg-[#faf8f2]/40 transition-colors">
                    {/* Day Column */}
                    <td className="p-3 bg-[#fbf9f4] border-r border-[#e6e2d6] align-middle">
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-[#e3a62f] tracking-wider uppercase">{day.slice(0, 3)}</span>
                        <strong className="text-sm font-serif text-[#262a68]">{day}</strong>
                      </div>
                    </td>

                    {/* Period Slots */}
                    {activeSlots.map((_, slotIdx) => {
                      const session = scheduleState.draft.find(
                        (s) => s.day === day && s.slot === slotIdx
                      );

                      if (session) {
                        return (
                          <td
                            key={`${day}-${slotIdx}`}
                            className="p-1.5 border-r border-[#e6e2d6] last:border-r-0 bg-white align-middle"
                          >
                            <div
                              onClick={() => handleOpenEdit(session)}
                              className="w-full h-full min-h-[82px] p-2.5 rounded text-left cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden flex flex-col justify-between group"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${session.color || PALETTE.indigo} 12%, #fffdf7)`,
                                borderLeft: `4px solid ${session.color || PALETTE.indigo}`,
                                borderTop: `1px solid color-mix(in srgb, ${session.color || PALETTE.indigo} 25%, transparent)`,
                                borderRight: `1px solid color-mix(in srgb, ${session.color || PALETTE.indigo} 15%, transparent)`,
                                borderBottom: `1px solid color-mix(in srgb, ${session.color || PALETTE.indigo} 15%, transparent)`
                              }}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: session.color || PALETTE.indigo,
                                      color: "#ffffff"
                                    }}
                                  >
                                    {session.type}
                                  </span>
                                  <span className="text-[10px] font-semibold text-[#5a575f]">
                                    {session.code}
                                  </span>
                                </div>

                                <strong className="block text-xs font-semibold text-[#25242a] leading-tight line-clamp-2 mt-1">
                                  {session.subject}
                                </strong>
                              </div>

                              <div className="mt-2 pt-1 border-t border-black/5 text-[10px] text-[#6d6971] space-y-0.5">
                                <div className="truncate font-medium text-[#46434a]">
                                  {session.faculty}
                                </div>
                                <div className="text-[9px] text-[#837f88] flex items-center justify-between">
                                  <span>{session.room}</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <span className="text-[#33409a] font-semibold">
                                      Edit ✎
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(session.id, session.day, session.slot);
                                      }}
                                      className="p-0.5 rounded text-[#c93b2b] hover:bg-[#fdeeed] transition"
                                      title="Clear this class slot"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Empty Slot: Allow Add
                      return (
                        <td
                          key={`${day}-${slotIdx}`}
                          className="p-1.5 border-r border-[#e6e2d6] last:border-r-0 bg-[#fdfbf6] hover:bg-[#f6f2e6] transition-colors group cursor-pointer align-middle"
                          onClick={() => handleOpenAdd(day, slotIdx)}
                        >
                          <div className="w-full h-full min-h-[82px] border border-dashed border-[#d8d3c5] group-hover:border-[#33409a] rounded flex flex-col items-center justify-center p-2 text-[#9a959f] group-hover:text-[#33409a] transition">
                            <Plus size={16} className="opacity-40 group-hover:opacity-100 transition transform group-hover:scale-110" />
                            <span className="text-[10px] font-medium mt-1 opacity-0 group-hover:opacity-100 transition">
                              Add Class
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Footer */}
          <div className="p-3 bg-[#fbf9f4] border-t border-[#e6e2d6] flex flex-wrap items-center justify-between text-xs text-[#7e7b82]">
            <div className="flex items-center gap-2">
              <Layers3 size={14} className="text-[#33409a]" />
              <span>
                Viewing <strong>{scheduleState.draft.length} classes</strong> scheduled for {program} S{semester} ({section})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Click any slot to update or remove</span>
              <span>·</span>
              <button
                onClick={() => setIsPublishDialogOpen(true)}
                className="text-[#33409a] hover:underline font-medium"
              >
                Publish updates live →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Session Editor Dialog (Add / Edit / Remove) */}
      <SessionEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        sessionToEdit={sessionToEdit}
        targetDay={targetDay}
        targetSlot={targetSlot}
        program={program}
        semester={semester}
        section={section}
        currentDraftSessions={scheduleState.draft}
        onSave={handleSaveSession}
        onDelete={handleDeleteSession}
      />

      {/* Publish Confirmation Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="max-w-md bg-[#fffdf7] border-[#d8d3c5] text-[#25252c] shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#858286] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#33409a]" />
              PUBLICATION PIPELINE
            </div>
            <DialogTitle className="font-serif text-2xl text-[#262a68] mt-1">
              Publish Timetable to Live Class
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77747a]">
              This will commit the current draft schedule as <strong>Version {scheduleState.metadata.version + 1}</strong>.
              All students and faculty viewing <strong>{program} Semester {semester} Section {section}</strong> will see these changes immediately in real-time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="p-3 bg-[#f5f2e8] rounded border border-[#e5e1d4] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#737077]">Target Class:</span>
                <strong className="text-[#2a282f]">{program} · S{semester} · Section {section}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737077]">Academic Year:</span>
                <strong className="text-[#2a282f]">{currentYearLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737077]">Total Periods Scheduled:</span>
                <strong className="text-[#2a282f]">{scheduleState.draft.length} Slots</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737077]">Authorizing Coordinator:</span>
                <strong className="text-[#33409a]">{user.name} ({user.role})</strong>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#666368] mb-1">
                Release Note / Revision Remarks (Optional)
              </label>
              <Input
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="e.g. Adjusted Mathematics slot and allocated Lab 204..."
                className="h-9 text-xs bg-white border-[#d8d4c7]"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between border-t border-[#e8e4da] pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
              className="text-xs h-9 border-[#d8d4c7]"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishTimetable}
              disabled={isPublishing}
              className="bg-[#33409a] hover:bg-[#252b67] text-white text-xs h-9 gap-1.5 px-4 shadow-sm"
            >
              <Send size={13} />
              {isPublishing ? "Publishing..." : "Confirm & Publish Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-md bg-[#fffdf7] border-[#d8d3c5] text-[#25252c] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#9e2f23]">
              Reset to College Baseline?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77747a]">
              This will overwrite all custom changes for <strong>{program} S{semester} ({section})</strong> and restore the original college timetable source allocation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              className="text-xs h-8 border-[#d8d4c7]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReset}
              className="bg-[#9e2f23] hover:bg-[#83241a] text-white text-xs h-8"
            >
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Admin AI Chatbot (floating, bottom-right) ── */}
      <AdminChatbot
        program={program}
        semester={semester}
        section={section}
        adminName={user?.name || "Master Admin"}
        onDataChange={reloadCurrentSchedule}
        onClassSwitch={(p, s, sec) => {
          setProgram(p);
          setSemester(s);
          setSection(sec);
        }}
      />
    </div>
  );
}
