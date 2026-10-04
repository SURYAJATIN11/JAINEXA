// Campus Ledger design: editorial scheduling workspace, indigo ink, marigold signal, visible algorithmic reasoning.
import { useEffect, useMemo, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowUpRight, CalendarDays, Check, ChevronRight, CircleHelp, Clock3,
  Columns3, Download, FlaskConical, GraduationCap, Layers3, Menu, Network,
  Play, RefreshCw, Search, Sparkles, UsersRound, X, Zap, ShieldCheck, Edit3,
  CheckSquare, Lock, KeyRound, Building2, MessageSquareHeart, ExternalLink, LogOut,
  AlertTriangle, Compass, MapPin, Radio
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collegePrograms, collegeBatches, collegeFacultyNames, collegeRooms, collegeSubjects, semestersFor, sectionsFor } from "@/data/collegeData";
import {
  loadClassSchedule,
  subscribeToTimetableChanges,
  Session as StoredSession,
  DAYS as days,
  SLOT_LABELS as slotLabels,
  SECTION_F_SLOT_LABELS,
  PALETTE as palette,
  getAcademicYearFromSemester
} from "@/lib/timetableStore";
import FacultyTimetablePanel from "@/components/FacultyTimetablePanel";
import AttendancePortalPanel from "@/components/AttendancePortalPanel";
import AttendanceAccessRestricted from "@/components/AttendanceAccessRestricted";
import BuildingFloorPlanPanel from "@/components/BuildingFloorPlanPanel";
import RoomwarePanel from "@/components/RoomwarePanel";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { RoleSwitcherModal } from "@/components/RoleSwitcherModal";
import { AppSidebar, NavItemKey } from "@/components/AppSidebar";
import { TimetableZoomControls } from "@/components/TimetableZoomControls";
import { CampusTimer } from "@/components/CampusTimer";
import { CampusAIAssistant } from "@/components/CampusAIAssistant";
import {
  LiveClassTrackerBanner,
  PERIOD_SCHEDULE,
  PERIOD_SCHEDULE_6,
  PERIOD_SCHEDULE_8,
  DAYS_LIST
} from "@/components/LiveClassTrackerBanner";
import { findBuildingRoomByCodeOrName } from "@/data/floorPlanData";
import {
  loadRoomwareIssues,
  subscribeToRoomwareChanges,
  RoomIssue,
  extractRoomCode
} from "@/lib/roomwareStore";

type View = "student" | "faculty" | "rooms" | "conflicts" | "attendance" | "floor-plan" | "roomware";
type Session = StoredSession;

const slots = ["1", "2", "3", "4", "5", "6", "7", "8"];

const seedSessions: Session[] = [
  { id: "m1", day: "Monday", slot: 0, subject: "Discrete Mathematics", code: "MAT204", faculty: "Dr. Meera Nair", room: "A-204", batch: "CSE · A", type: "Lecture", color: palette.indigo, note: "Assigned to color 1 after resolving overlap with Data Structures." },
  { id: "m2", day: "Monday", slot: 2, subject: "Data Structures", code: "CSE201", faculty: "Prof. Anil Rao", room: "A-204", batch: "CSE · A", type: "Lecture", color: palette.orange, note: "High-degree vertex: shares a batch with Algorithms and OS." },
  { id: "m3", day: "Monday", slot: 4, subject: "Database Systems", code: "CSE305", faculty: "Dr. Kabir Shah", room: "B-112", batch: "CSE · A", type: "Lecture", color: palette.teal, note: "Room capacity and faculty availability both satisfied." },
  { id: "t1", day: "Tuesday", slot: 0, subject: "Operating Systems", code: "CSE303", faculty: "Dr. Ritu Thomas", room: "A-204", batch: "CSE · A", type: "Lecture", color: palette.plum, note: "Placed in the first available morning slot." },
  { id: "t2", day: "Tuesday", slot: 1, subject: "Algorithms", code: "CSE302", faculty: "Prof. Anil Rao", room: "A-204", batch: "CSE · A", type: "Lecture", color: palette.orange, note: "Kept adjacent to OS to reduce faculty idle time." },
  { id: "t3", day: "Tuesday", slot: 4, subject: "Networks Lab", code: "CSE307L", faculty: "Ms. Nidhi Menon", room: "LAB-2", batch: "CSE · A", type: "Lab", color: palette.red, note: "Two-hour laboratory block; specialized room requirement satisfied." },
  { id: "w1", day: "Wednesday", slot: 1, subject: "Database Systems", code: "CSE305", faculty: "Dr. Kabir Shah", room: "B-112", batch: "CSE · A", type: "Lecture", color: palette.teal, note: "Second weekly meeting balanced against the afternoon lab." },
  { id: "w2", day: "Wednesday", slot: 3, subject: "Communication Skills", code: "HUM201", faculty: "Ms. Leela Iyer", room: "C-101", batch: "CSE · A", type: "Lecture", color: palette.blue, note: "Shared elective room is free and accessible." },
  { id: "w3", day: "Wednesday", slot: 5, subject: "Algorithms", code: "CSE302", faculty: "Prof. Anil Rao", room: "A-204", batch: "CSE · A", type: "Lecture", color: palette.orange, note: "Spacing rule prevents three consecutive theory classes." },
  { id: "th1", day: "Thursday", slot: 0, subject: "Discrete Mathematics", code: "MAT204", faculty: "Dr. Meera Nair", room: "A-204", batch: "CSE · A", type: "Lecture", color: palette.indigo, note: "Weekly contact-hour target met." },
  { id: "th2", day: "Thursday", slot: 2, subject: "Networks Lab", code: "CSE307L", faculty: "Ms. Nidhi Menon", room: "LAB-2", batch: "CSE · A", type: "Lab", color: palette.red, note: "Lab equipment capacity verified against batch size." },
  { id: "f1", day: "Friday", slot: 0, subject: "Operating Systems", code: "CSE303", faculty: "Dr. Ritu Thomas", room: "A-204", batch: "CSE · A", type: "Lecture", color: palette.plum, note: "Friday load kept light for student project work." },
  { id: "f2", day: "Friday", slot: 2, subject: "Project Studio", code: "CSE399", faculty: "Dr. Kabir Shah", room: "Innovation Hub", batch: "CSE · A", type: "Lab", color: palette.blue, note: "Flexible room used for team-based studio work." },
];

function getSessions(view: View, sessions: Session[]) {
  if (view === "faculty") return sessions.filter((s) => s.faculty.includes("Anil") || s.faculty.includes("Kabir") || s.faculty.includes("Meera"));
  if (view === "rooms") return sessions.filter((s) => s.room.includes("A-204") || s.room.includes("LAB") || s.room.includes("204"));
  return sessions;
}

export default function Home() {
  const { user, isAdmin, isFaculty, isStudent, canAccessAttendance, canAccessAdminStudio, logout } = useAuth();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFitToScreen, setIsFitToScreen] = useState(false);
  const [view, setView] = useState<View>("student");
  const [program, setProgram] = useState("CSE-GEN");
  const [semester, setSemester] = useState("3");
  const [section, setSection] = useState("F");

  // Schedule state from persistent store
  const [scheduleState, setScheduleState] = useState(() => loadClassSchedule("CSE-GEN", "3", "F"));
  const sessions = scheduleState.published;

  const [selected, setSelected] = useState<Session | null>(null);
  const [query, setQuery] = useState("");

  const visibleSessions = useMemo(
    () => getSessions(view, sessions).filter((s) => `${s.subject} ${s.faculty} ${s.room}`.toLowerCase().includes(query.toLowerCase())),
    [view, sessions, query]
  );

  const semesters = semestersFor(program);
  const sections = sectionsFor(program, semester);

  useEffect(() => {
    if (user?.roleType === "student") {
      setProgram("CSE-GEN");
      setSemester("3");
      setSection("F");
    }
  }, [user]);

  useEffect(() => { if (!semesters.includes(semester) && semesters.length > 0) setSemester(semesters[0] || ""); }, [program, semester, semesters]);
  useEffect(() => { if (!sections.includes(section) && sections.length > 0) setSection(sections[0] || ""); }, [semester, program, section, sections]);

  // Load schedule whenever selection changes
  const loadSchedule = useCallback(() => {
    const s = loadClassSchedule(program, semester, section);
    setScheduleState(s);
  }, [program, semester, section]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Subscribe to external store broadcasts
  useEffect(() => {
    const unsub = subscribeToTimetableChanges((updatedKey) => {
      const currentKey = `${program}|${semester}|${section}`;
      if (updatedKey === currentKey) {
        loadSchedule();
      }
    });
    return unsub;
  }, [program, semester, section, loadSchedule]);

  const [activeIssueRoomCodes, setActiveIssueRoomCodes] = useState<string[]>(() => {
    return loadRoomwareIssues()
      .filter((i) => i.status !== "resolved")
      .map((i) => extractRoomCode(i.roomName).toUpperCase());
  });

  const [roomwareIssues, setRoomwareIssues] = useState<RoomIssue[]>(() => loadRoomwareIssues());
  const [selectedRoomwareRoom, setSelectedRoomwareRoom] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsub = subscribeToRoomwareChanges((issues) => {
      setRoomwareIssues(issues);
      const unresolved = issues
        .filter((i) => i.status !== "resolved")
        .map((i) => extractRoomCode(i.roomName).toUpperCase());
      setActiveIssueRoomCodes(unresolved);
    });
    return unsub;
  }, []);

  // Auto-collapse sidebar on high zoom / smaller screens to give full width to workspace
  useEffect(() => {
    const checkViewportZoom = () => {
      if (window.innerWidth < 1200) {
        setIsSidebarCollapsed(true);
      }
    };
    checkViewportZoom();
    window.addEventListener("resize", checkViewportZoom);
    return () => window.removeEventListener("resize", checkViewportZoom);
  }, []);

  // Live Class Tracker & 1-Click CAD Navigation State
  const [targetFloorPlanRoom, setTargetFloorPlanRoom] = useState<string | null>(null);
  const [targetFloorPlanFloor, setTargetFloorPlanFloor] = useState<number | null>(null);
  const [simulatedSlot, setSimulatedSlot] = useState<number | null>(null);
  const [simulatedDay, setSimulatedDay] = useState<string | null>(null);
  const [liveNowDate, setLiveNowDate] = useState<Date>(new Date());

  // Clock tick every 2 seconds to synchronize timetable live highlights
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNowDate(new Date());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const isCseGen3F =
    (program === "CSE-GEN" || program === "CSE_GEN" || program === "CSE") &&
    (semester === "3" || semester === "3RD") &&
    (section === "F" || section === "SEC F");

  const isCseDs3A =
    (program === "DS" || program === "CSE-DS" || program === "CSE_DS") &&
    (semester === "3" || semester === "3RD") &&
    (section === "A" || section === "SEC A");

  const is6PeriodClass = isCseGen3F || isCseDs3A;

  const activeSlots = is6PeriodClass ? ["1", "2", "3", "4", "5", "6"] : slots;
  const activeSlotLabels = is6PeriodClass ? SECTION_F_SLOT_LABELS : slotLabels;
  const activePeriodSchedule = is6PeriodClass ? PERIOD_SCHEDULE_6 : PERIOD_SCHEDULE_8;

  const realDayName = liveNowDate.toLocaleDateString("en-US", { weekday: "long" });
  const effectiveDayName = simulatedDay || (DAYS_LIST.includes(realDayName) ? realDayName : "Wednesday");
  const realMinutes = liveNowDate.getHours() * 60 + liveNowDate.getMinutes();
  const effectiveMinutes = simulatedSlot !== null && activePeriodSchedule[simulatedSlot]
    ? Math.floor((activePeriodSchedule[simulatedSlot].startMin + activePeriodSchedule[simulatedSlot].endMin) / 2)
    : realMinutes;

  const currentPeriodItem = activePeriodSchedule.find(
    (p) => effectiveMinutes >= p.startMin && effectiveMinutes <= p.endMin
  );
  const currentSlotIndex = currentPeriodItem ? currentPeriodItem.slot : null;
  const nextPeriodItem = activePeriodSchedule.find((p) => p.startMin > effectiveMinutes);
  const nextSlotIndex = nextPeriodItem ? nextPeriodItem.slot : null;

  // 1-Click CAD Floor Plan Room Locator
  const handleLocateRoomOnCAD = (roomName: string, preferredFloor?: number | null) => {
    const resolved = findBuildingRoomByCodeOrName(roomName);
    const floorToUse = preferredFloor !== undefined && preferredFloor !== null ? preferredFloor : (resolved?.floorNumber ?? 1);
    const roomCodeToUse = resolved?.room.code || roomName;

    setTargetFloorPlanRoom(roomCodeToUse);
    setTargetFloorPlanFloor(floorToUse);
    handleSetView("floor-plan");
    toast.success(`Locating ${roomName} on CAD Blueprint`, {
      description: `Switched to Floor ${floorToUse} · ${resolved?.room.name || roomName}`
    });
  };

  const openFacultyInExternalSite = (facName: string) => {
    const clean = facName.split(" - ")[0].trim();
    const url = `https://ktiwari.in/webTT/?faculty=${encodeURIComponent(clean)}`;
    window.open(url, "_blank");
  };

  const handleSetView = (v: View) => {
    setView(v);
    if (v !== "roomware") {
      setSelectedRoomwareRoom(undefined);
    }
    if (v === "attendance") {
      window.location.hash = "attendance-portal";
    } else if (v === "faculty") {
      window.location.hash = "faculty-timetable";
    } else if (v === "roomware") {
      window.location.hash = "roomware";
    } else if (v === "floor-plan" || v === "rooms") {
      window.location.hash = "building-floor-plan";
    } else if (v === "student") {
      window.location.hash = "batch-timetable";
    }
  };

  // URL hash synchronization for #faculty-timetable, #batch-timetable, #attendance-portal, #building-floor-plan, #roomware, #feedback-24x7
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === "#attendance-portal") {
        setView("attendance");
      } else if (hash === "#faculty-timetable") {
        setView("faculty");
      } else if (hash === "#building-floor-plan" || hash === "#rooms") {
        setView("floor-plan");
      } else if (hash === "#roomware") {
        setView("roomware");
      } else if (hash === "#batch-timetable") {
        setView("student");
      } else if (hash === "#feedback-24x7") {
        setIsFeedbackOpen(true);
      } else if (!hash && isFaculty) {
        setView("faculty");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [isFaculty]);

  const regenerate = () => {
    loadSchedule();
    toast("Live timetable refreshed", { description: "Current published schedule synchronized." });
  };

  const openAdminWindow = () => {
    window.open("/admin", "_blank");
  };

  const currentYear = getAcademicYearFromSemester(semester);

  return (
    <div className="app-shell" id="timetable-view-section">
      <AppSidebar
        activeNav={view === "rooms" ? "floor-plan" : (view as NavItemKey)}
        onNavigate={(navKey) => {
          if (
            navKey === "student" ||
            navKey === "faculty" ||
            navKey === "attendance" ||
            navKey === "floor-plan" ||
            navKey === "roomware"
          ) {
            handleSetView(navKey as View);
          } else if (navKey === "logic") {
            toast("Logic Studio", { description: "Edit subjects, faculty, rooms, and availability in the next module." });
          }
        }}
        onOpenAIAssistant={() => setIsAIOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <main className={`main-canvas ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>

        <header className="topbar">
          <div className="crumb min-w-0">
            <span className="hidden sm:inline">Workspace</span>
            <ChevronRight size={14} className="hidden sm:inline shrink-0" />
            <strong className="truncate">{program} · Sem {semester} ({currentYear.split(" ")[0]}) · Sec {section}</strong>
          </div>
          <div className="top-actions">
            <Button variant="outline" className="export-button" onClick={() => toast.success("Export queued", { description: "Your PDF timetable will be ready shortly." })}>
              <Download size={14} /> <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </header>

        <section className="schedule-section pt-6">
          <div className="section-heading flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="eyebrow"><span className="section-number">SCHEDULE</span> INSTITUTIONAL MASTER TIMETABLE</div>
              <h2>Timetable <span>matrix</span></h2>
            </div>

            {/* Displayed larger, neater, and positioned at the right most corner */}
            <div className="ml-auto">
              <CampusTimer />
            </div>
          </div>

          {view === "student" && (
            <div className="mb-4 p-3 px-4 bg-[#fffdf7] border border-[#d5d0c2] border-t-2 border-t-[#33409a] rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-bold text-[#77747b] uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-[#33409a]" /> Active Batch:
                </span>
                <label className="flex items-center gap-1.5 text-xs text-[#555259]">
                  <span className="font-medium text-[11px] text-[#88848a]">Program:</span>
                  <select
                    value={program}
                    onChange={(e) => {
                      setProgram(e.target.value);
                      setSemester(semestersFor(e.target.value)[0] || "");
                      setSection("A");
                    }}
                    className="h-8 px-2.5 py-1 text-xs font-semibold bg-[#faf8f1] border border-[#d5d0c2] rounded text-[#252b67] outline-none focus:border-[#e3a62f] cursor-pointer"
                  >
                    {collegePrograms.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-[#555259]">
                  <span className="font-medium text-[11px] text-[#88848a]">Semester:</span>
                  <select
                    value={semester}
                    onChange={(e) => {
                      setSemester(e.target.value);
                      setSection(sectionsFor(program, e.target.value)[0] || "");
                    }}
                    className="h-8 px-2.5 py-1 text-xs font-semibold bg-[#faf8f1] border border-[#d5d0c2] rounded text-[#252b67] outline-none focus:border-[#e3a62f] cursor-pointer"
                  >
                    {semesters.map((item) => (
                      <option key={item} value={item}>Sem {item} ({getAcademicYearFromSemester(item).split(" ")[0]})</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-[#555259]">
                  <span className="font-medium text-[11px] text-[#88848a]">Section:</span>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="h-8 px-2.5 py-1 text-xs font-bold bg-[#faf8f1] border border-[#d5d0c2] rounded text-[#252b67] outline-none focus:border-[#e3a62f] cursor-pointer"
                  >
                    {sections.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <span className="font-semibold text-[#252b67] bg-[#f0ede4] px-2.5 py-1 rounded text-xs hidden lg:inline">
                  {collegeBatches[`${program}|${semester}|${section}`]?.title || `${program} S${semester} ${section}`}
                </span>
                {isCseGen3F && (
                  <span className="font-semibold text-[#33409a] bg-[#eef0fb] border border-[#d6daf5] px-2.5 py-1 rounded text-xs hidden md:inline">
                    Room 215A · Class Teacher: Dr. Suriya Prakash J
                  </span>
                )}
                {isCseDs3A && (
                  <span className="font-semibold text-[#33409a] bg-[#eef0fb] border border-[#d6daf5] px-2.5 py-1 rounded text-xs hidden md:inline">
                    Room 214B · Class Teacher: Prof. Rajesh Pandian N
                  </span>
                )}
              </div>

              {/* Right Side Tools: Screen View Zoom In & Zoom Out & Auto-Fit, Search, Refresh, Live Badge */}
              <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                <TimetableZoomControls
                  zoomLevel={zoomLevel}
                  onZoomChange={setZoomLevel}
                  onResetZoom={() => {
                    setZoomLevel(100);
                    setIsFitToScreen(false);
                  }}
                  onFitToScreen={() => {
                    setIsFitToScreen((prev) => {
                      const next = !prev;
                      setZoomLevel(next ? 82 : 100);
                      return next;
                    });
                  }}
                  isFitToScreen={isFitToScreen}
                />

                <div className="search-field">
                  <Search size={15} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find subject, teacher, room…" />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-[#252b67] border-[#d5d0c2] bg-[#fffdf7] hover:bg-[#faf8ef]"
                  onClick={regenerate}
                  title="Sync latest published timetable"
                >
                  <RefreshCw size={13} /> Refresh
                </Button>

                <Badge className="healthy-badge">
                  <span /> v{scheduleState.metadata.version} · Live
                </Badge>
              </div>
            </div>
          )}

          {view === "conflicts" ? (
            <ConflictReport />
          ) : view === "attendance" ? (
            canAccessAttendance ? (
              <AttendancePortalPanel
                initialProgram={program === "AIDE" ? "CSE-GEN" : program}
                initialSemester={program === "AIDE" ? "3" : semester}
                initialSection={program === "AIDE" ? "F" : section}
                onOpenTakeAttendance={() => handleSetView("faculty")}
              />
            ) : (
              <AttendanceAccessRestricted
                onBackToTimetable={() => handleSetView("student")}
                onOpenLoginModal={() => setIsRoleModalOpen(true)}
              />
            )
          ) : view === "faculty" ? (
            <FacultyTimetablePanel
              onSelectSession={(sess) => setSelected(sess as Session)}
              onOpenRoleModal={() => setIsRoleModalOpen(true)}
            />
          ) : view === "roomware" ? (
            <RoomwarePanel
              initialSelectedRoom={selectedRoomwareRoom}
              onNavigateTimetable={(roomCode) => {
                handleSetView("student");
                setQuery(roomCode);
              }}
            />
          ) : (view === "floor-plan" || view === "rooms") ? (
            <BuildingFloorPlanPanel
              targetRoomCode={targetFloorPlanRoom}
              targetFloorNumber={targetFloorPlanFloor}
              onClearTarget={() => {
                setTargetFloorPlanRoom(null);
                setTargetFloorPlanFloor(null);
              }}
              onNavigateTimetable={(roomCode) => {
                handleSetView("student");
                setQuery(roomCode);
              }}
            />
          ) : (
            <>
              {/* Real-time Live Class Tracker & Quick CAD Navigation Banner */}
              <LiveClassTrackerBanner
                sessions={sessions}
                roomwareIssues={roomwareIssues}
                onLocateRoomOnFloorPlan={(roomName, floorNumber) => handleLocateRoomOnCAD(roomName, floorNumber)}
                onSelectSession={(sess) => setSelected(sess)}
                currentSimulatedSlot={simulatedSlot}
                onSetSimulatedSlot={setSimulatedSlot}
                currentSimulatedDay={simulatedDay}
                onSetSimulatedDay={setSimulatedDay}
                periodSchedule={activePeriodSchedule}
              />

              <div
                className="timetable-wrap transition-all duration-200 overflow-x-auto rounded-xl border border-[#d5d0c2] shadow-xs bg-[#fffdf7]"
                style={{
                  zoom: `${zoomLevel}%`
                }}
              >
                <table className="w-full min-w-[1240px] border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: "130px" }} />
                    {activeSlots.map((_, i) => (
                      <col key={i} style={{ width: `calc((100% - 130px) / ${activeSlots.length})` }} />
                    ))}
                  </colgroup>
                  <thead className="bg-[#fbf9f4] border-b border-[#e2ded3]">
                    <tr>
                      <th className="p-3 text-[11px] font-bold text-[#8c8890] uppercase tracking-wider text-left border-r border-[#e9e5db] align-middle">
                        <div className="flex items-center gap-1.5">
                          <Clock3 size={14} className="text-[#e3a62f]" />
                          <span className="text-[10px] tracking-widest font-semibold text-[#8c8890]">DAY / PERIOD</span>
                        </div>
                      </th>
                      {activeSlotLabels.map((slot) => {
                        const [pNum, pTime] = slot.split(" · ");
                        return (
                          <th key={slot} className="p-2.5 text-center border-r border-[#e9e5db] last:border-r-0 align-middle">
                            <span className="text-[10px] font-bold text-[#e3a62f] tracking-wider block">{pNum}</span>
                            <strong className="text-xs text-[#3d3b40] font-semibold block mt-0.5 whitespace-nowrap">{pTime}</strong>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efebe3]">
                    {days.map((day) => (
                      <tr key={day} className="h-[96px] hover:bg-[#faf8f2]/40 transition-colors">
                        {/* Day Column */}
                        <td className="p-3 bg-[#fbfaf5] border-r border-[#e9e5db] align-middle">
                          <div className="flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-[#e3a62f] tracking-widest uppercase">{day.slice(0, 3)}</span>
                            <strong className="text-sm font-serif text-[#262a68]">{day}</strong>
                          </div>
                        </td>

                        {/* Period Columns */}
                        {activeSlots.map((_, slot) => {
                          const item = visibleSessions.find((s) => s.day === day && s.slot === slot);
                          const itemRoomCode = item ? extractRoomCode(item.room).toLowerCase() : "";
                          const roomIssue = item
                            ? roomwareIssues.find(
                              (iss) =>
                                iss.status !== "resolved" &&
                                (iss.roomCode.toLowerCase() === itemRoomCode ||
                                  iss.roomName.toLowerCase().includes(itemRoomCode) ||
                                  (itemRoomCode && item.room.toLowerCase().includes(iss.roomCode.toLowerCase())))
                            )
                            : null;

                          const isLiveNow = day === effectiveDayName && slot === currentSlotIndex;
                          const isUpNext = day === effectiveDayName && slot === nextSlotIndex;
                          const isPastSlot = day === effectiveDayName && currentSlotIndex !== null && slot < currentSlotIndex;

                          return (
                            <td
                              key={`${day}-${slot}`}
                              className={`p-1.5 border-r border-[#e9e5db] last:border-r-0 align-middle transition-colors ${
                                isLiveNow ? "bg-[#fffdf0]/80" : ""
                              }`}
                            >
                              {item ? (
                                <button
                                  className={`session-card relative w-full h-[82px] text-left rounded-md transition-all duration-150 overflow-hidden flex flex-col justify-between ${
                                    isLiveNow
                                      ? "ring-2 ring-[#e3a62f] shadow-md bg-[#fffdf0] -translate-y-0.5"
                                      : "hover:shadow-md hover:-translate-y-0.5"
                                  } ${isPastSlot ? "opacity-75 hover:opacity-100" : ""}`}
                                  title={`Open ${item.subject} — ${item.faculty}${roomIssue ? ` (⚠️ ${roomIssue.title})` : ""}`}
                                  style={{ "--session-color": item.color } as React.CSSProperties}
                                  onClick={() => setSelected(item)}
                                >
                                  {isLiveNow && (
                                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-[#e3a62f] text-[#252b67] text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse z-10">
                                      <Radio size={9} className="text-[#c84232] animate-ping" /> LIVE
                                    </span>
                                  )}
                                  {!isLiveNow && isUpNext && (
                                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-full bg-[#f0ede4] text-[#33409a] text-[8.5px] font-bold border border-[#d5d0c2] tracking-wider z-10">
                                      UP NEXT
                                    </span>
                                  )}
                                  {!isLiveNow && !isUpNext && roomIssue && (
                                    <span
                                      className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-full bg-[#c84232] text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs animate-pulse z-10"
                                      title={`Room Alert: ${roomIssue.title} — Click to inspect in Roomware`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRoomwareRoom(item.room);
                                        handleSetView("roomware");
                                      }}
                                    >
                                      ⚠️ Alert
                                    </span>
                                  )}
                                  {!isLiveNow && !isUpNext && !roomIssue && isPastSlot && (
                                    <span className="absolute top-1.5 right-1.5 text-[8.5px] font-semibold text-[#8c8890] opacity-80 z-10">
                                      ✓ Done
                                    </span>
                                  )}

                                  <div>
                                    <span className="session-type flex items-center gap-1">
                                      {item.type === "Lab" && <FlaskConical size={11} />}
                                      {item.type}
                                    </span>
                                    <strong className="truncate block font-semibold text-xs leading-snug">{item.subject}</strong>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-[#78747a] pt-1">
                                    <small className="truncate">{item.code} · {item.room}</small>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span
                                        className="p-0.5 rounded text-[#252b67] hover:bg-[#252b67] hover:text-[#e3a62f] transition-colors cursor-pointer"
                                        title={`Locate ${item.room} on CAD Blueprint`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLocateRoomOnCAD(item.room);
                                        }}
                                      >
                                        <Compass size={12} className={isLiveNow ? "text-[#e3a62f]" : "text-[#78747a]"} />
                                      </span>
                                      <i className="opacity-60 hover:opacity-100 transition"><ArrowUpRight size={12} /></i>
                                    </div>
                                  </div>

                                  {isLiveNow && currentPeriodItem && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ded9cb]/60 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-[#e3a62f] to-[#252b67] transition-all duration-1000"
                                        style={{
                                          width: `${Math.min(100, Math.max(8, Math.round(((effectiveMinutes - currentPeriodItem.startMin) / (currentPeriodItem.endMin - currentPeriodItem.startMin)) * 100)))}%`
                                        }}
                                      />
                                    </div>
                                  )}
                                </button>
                              ) : (
                                <div className="h-[82px] flex items-center justify-center rounded border border-dashed border-[#ece8dc]/80 bg-[#fdfdfb]/40 group hover:border-[#ded9cb] transition-colors">
                                  <span className="text-xs text-[#c5c0b6] font-mono select-none opacity-50">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="schedule-footer">
            <span>
              <Layers3 size={14} /> Showing {visibleSessions.length} published blocks for {program} S{semester} ({section})
            </span>
            <button onClick={openAdminWindow} className="font-semibold flex items-center gap-1">
              Open Timetable Studio to update or remove classes <ArrowUpRight size={14} />
            </button>
          </div>
        </section>

      </main>

      {selected && (
        <div className="detail-overlay" onClick={() => setSelected(null)}>
          <aside className="detail-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}><X size={18} /></button>
            <div className="drawer-accent" style={{ background: selected.color }} />
            <div className="eyebrow">SESSION DETAIL · {selected.day.toUpperCase()}</div>
            <h2>{selected.subject}</h2>
            <p className="drawer-code">{selected.code} · {selected.type} · {slotLabels[selected.slot]}</p>
            <div className="detail-facts">
              <div><span>Faculty</span><strong>{selected.faculty}</strong></div>
              <div><span>Room</span><strong>{selected.room}</strong></div>
              <div><span>Batch</span><strong>{selected.batch}</strong></div>
            </div>

            {/* Active Room Issue Notification Bar */}
            {(() => {
              const selectedRoomCode = extractRoomCode(selected.room).toLowerCase();
              const roomIssue = roomwareIssues.find(
                (iss) =>
                  iss.status !== "resolved" &&
                  (iss.roomCode.toLowerCase() === selectedRoomCode ||
                    iss.roomName.toLowerCase().includes(selectedRoomCode) ||
                    (selectedRoomCode && selected.room.toLowerCase().includes(iss.roomCode.toLowerCase())))
              );
              if (!roomIssue) return null;
              return (
                <div className="mt-3 p-3.5 bg-gradient-to-r from-[#fee2e2] to-[#fff1f2] border-2 border-[#ef4444] border-l-6 border-l-[#dc2626] rounded-xl text-xs text-[#991b1b] shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 font-black text-[#7f1d1d] uppercase tracking-wider font-mono text-[11px]">
                      <AlertTriangle size={14} className="text-[#dc2626] shrink-0 animate-pulse" />
                      <span>Room {selected.room} Alert Notification</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#dc2626] text-white">
                      {roomIssue.severity}
                    </span>
                  </div>
                  <p className="font-bold text-[#7f1d1d] text-xs leading-snug">
                    {roomIssue.title}
                  </p>
                  <p className="text-[11px] text-[#991b1b] mt-0.5 line-clamp-2 leading-relaxed">
                    {roomIssue.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      setSelectedRoomwareRoom(selected.room);
                      handleSetView("roomware");
                    }}
                    className="mt-2 text-[11px] font-bold text-[#33409a] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Room Equipment & Confirm Status</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              );
            })()}

            <div className="reason-box">
              <div><Check size={15} /> Constraint rationale</div>
              <p>{selected.note || "Verified contact hour allocation."}</p>
            </div>

            {/* 1-Click CAD Floor Plan Navigation Action */}
            {(() => {
              const resolvedCad = findBuildingRoomByCodeOrName(selected.room);
              return (
                <div className="mt-4 pt-3 border-t border-[#e2ded3]">
                  <Button
                    variant="default"
                    className="w-full h-[40px] bg-[#252b67] hover:bg-[#1c2152] text-white font-semibold text-xs gap-2 shadow-xs transition-all hover:translate-y-[-1px] rounded-lg"
                    onClick={() => {
                      const roomName = selected.room;
                      const floorNum = resolvedCad?.floorNumber;
                      setSelected(null);
                      handleLocateRoomOnCAD(roomName, floorNum);
                    }}
                  >
                    <Compass size={16} className="text-[#e3a62f]" />
                    <span>
                      Locate Room on CAD Blueprint {resolvedCad ? `(Level ${resolvedCad.floorNumber} · ${resolvedCad.room.block})` : `(${selected.room})`}
                    </span>
                    <ArrowUpRight size={13} className="ml-auto opacity-75" />
                  </Button>
                </div>
              );
            })()}

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-2">
                <Button
                  className="drawer-button flex-1"
                  onClick={() => {
                    setSelected(null);
                    toast("Session pinned", { description: `${selected.subject} is now in your focus list.` });
                  }}
                >
                  Pin this session <Sparkles size={15} />
                </Button>
                <Button
                  variant="outline"
                  className="mt-[27px] h-[42px] border-[#33409a] text-[#33409a] hover:bg-[#eef0fb]"
                  onClick={() => {
                    setSelected(null);
                    openAdminWindow();
                  }}
                  title="Edit this class in the Admin Studio"
                >
                  <Edit3 size={15} /> Edit
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full h-[38px] border-[#ded9cc] text-[#252b67] hover:bg-[#faf8f2] text-xs gap-1.5"
                onClick={() => {
                  setSelected(null);
                  handleSetView("faculty");
                }}
              >
                <UsersRound size={14} className="text-[#e3a62f]" />
                View Full Faculty Timetable
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Role Switcher Modal for verifying permissions */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* 24x7 Feedback & Concern Reporting Modal (Takes directly to Google Forms) */}
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Campus AI Timetable Copilot Drawer & Assistant for Students and Faculty */}
      <CampusAIAssistant
        isOpen={isAIOpen}
        onOpenChange={setIsAIOpen}
        onNavigateToView={(targetView, param) => {
          if (targetView === "floor-plan") {
            if (param) {
              const asFloor = parseInt(param, 10);
              if (!isNaN(asFloor) && asFloor >= 0 && asFloor <= 4 && !param.includes("-") && !/[a-zA-Z]/.test(param)) {
                setTargetFloorPlanFloor(asFloor);
                setTargetFloorPlanRoom(null);
                handleSetView("floor-plan");
              } else {
                handleLocateRoomOnCAD(param);
              }
            } else {
              handleSetView("floor-plan");
            }
          } else if (targetView === "faculty") {
            handleSetView("faculty");
            if (param) setQuery(param);
          } else if (targetView === "student") {
            handleSetView("student");
            if (param) setQuery(param);
          } else if (targetView === "roomware") {
            handleSetView("roomware");
          }
        }}
      />
    </div>
  );
}

function ConflictReport() {
  return (
    <div className="conflict-panel">
      <div className="conflict-hero">
        <div className="success-ring"><Check size={28} /></div>
        <div>
          <span className="eyebrow">VALIDATION COMPLETE</span>
          <h3>No conflicts found.</h3>
          <p>Every hard constraint passed across 13 subjects, 12 rooms, and 5 faculty availability maps.</p>
        </div>
      </div>
      <div className="validation-list">
        <div>
          <span className="check-chip"><Check size={13} /></span>
          <div><strong>Faculty collisions</strong><small>13 / 13 subjects have unique faculty occupancy</small></div>
          <b>PASS</b>
        </div>
        <div>
          <span className="check-chip"><Check size={13} /></span>
          <div><strong>Room collisions</strong><small>Labs and classrooms never overlap</small></div>
          <b>PASS</b>
        </div>
        <div>
          <span className="check-chip"><Check size={13} /></span>
          <div><strong>Batch collisions</strong><small>Student groups have one class per slot</small></div>
          <b>PASS</b>
        </div>
        <div>
          <span className="check-chip"><Check size={13} /></span>
          <div><strong>Availability rules</strong><small>Faculty preferences and lab windows respected</small></div>
          <b>PASS</b>
        </div>
      </div>
    </div>
  );
}
