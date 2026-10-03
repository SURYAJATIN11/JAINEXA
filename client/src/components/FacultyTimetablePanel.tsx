import { useState, useMemo, useEffect } from "react";
import {
  collegeFacultyNames,
  getFacultyTimetable,
  getFacultyAssignments,
  getAllClassTeachers,
  ClassTeacherRecord,
  collegeSubjects,
  getSubjectByCode
} from "@/data/collegeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search,
  UsersRound,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  FlaskConical,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  CheckSquare,
  Lock,
  Download,
  Printer
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TakeAttendanceDialog } from "./TakeAttendanceDialog";
import { isFacultyAssignedToCSEGen3F } from "@/data/studentsData";
import {
  downloadHourlyAttendanceCSV,
  printHourlyAttendanceSheet,
  getFacultyAttendanceSubmissions,
  subscribeToAttendance,
  AttendanceSubmission
} from "@/lib/attendanceStore";

const FEATURED_FACULTY = [
  "Dr. Kamlesh Tiwari - Professor (HOD CSE)",
  "Dr. Anita Chaturvedi - Professor",
  "Prof. Anil Rao",
  "Dr. Anu V. R. - Professor (DyDean)",
  "Dr. Meera Nair",
  "Dr. Ajay Kumar Singh - Professor (ProgHead)",
  "Dr. J Somasekar - Professor (ProgHead)",
  "Dr. N. Vikram - Associate Professor (ProgHead)"
];

const SLOT_LABELS = [
  "P1 · 8:45–9:35",
  "P2 · 9:40–10:30",
  "P3 · 10:35–11:25",
  "P4 · 11:30–12:20",
  "P5 · 12:25–1:15",
  "P6 · 1:20–2:10",
  "P7 · 2:15–3:05",
  "P8 · 3:10–4:00"
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday"
};

interface FacultyTimetablePanelProps {
  initialFaculty?: string;
  onSelectSession?: (session: {
    subject: string;
    code: string;
    faculty: string;
    room: string;
    batch: string;
    day: string;
    slot: number;
    type: "Lecture" | "Lab";
    color: string;
    note: string;
  }) => void;
  onOpenRoleModal?: () => void;
}

export default function FacultyTimetablePanel({
  initialFaculty = "Dr. Kamlesh Tiwari - Professor (HOD CSE)",
  onSelectSession,
  onOpenRoleModal
}: FacultyTimetablePanelProps) {
  const { user, isAdmin, canAccessAttendance } = useAuth();
  const [selectedFaculty, setSelectedFaculty] = useState(initialFaculty);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"timetable" | "classTeachers">("timetable");
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [attendanceTarget, setAttendanceTarget] = useState<{
    program: string;
    semester: string;
    section: string;
    subject: string;
    subjectCode: string;
    room: string;
    period: string;
    type: "Lecture" | "Lab";
  } | null>(null);

  // Class Teachers filter
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>("All");
  const [classTeacherSearch, setClassTeacherSearch] = useState("");

  // All class teachers
  const classTeachers = useMemo(() => getAllClassTeachers(), []);

  // Filtered faculty list for autocomplete search
  const filteredFaculty = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return collegeFacultyNames.slice(0, 15);
    return collegeFacultyNames.filter((name) => name.toLowerCase().includes(q)).slice(0, 20);
  }, [searchQuery]);

  // Hourly attendance submissions recorded by the selected faculty
  const [facultySubmissions, setFacultySubmissions] = useState<AttendanceSubmission[]>(() =>
    getFacultyAttendanceSubmissions(selectedFaculty)
  );

  useEffect(() => {
    setFacultySubmissions(getFacultyAttendanceSubmissions(selectedFaculty));
    const unsub = subscribeToAttendance(() => {
      setFacultySubmissions(getFacultyAttendanceSubmissions(selectedFaculty));
    });
    return unsub;
  }, [selectedFaculty]);

  // Current faculty timetable and assignments
  const facultyData = useMemo(() => {
    return getFacultyTimetable(selectedFaculty);
  }, [selectedFaculty]);

  const assignments = useMemo(() => {
    return getFacultyAssignments(selectedFaculty);
  }, [selectedFaculty]);

  // Helper to resolve readable subject name for batch code in cell
  const resolveSubjectName = (codePart: string) => {
    const cleanCode = codePart.replace(/\(L\)/i, "").trim();
    const assignment = assignments.find((a) => a.code === cleanCode || cleanCode.startsWith(a.code));
    if (assignment) return assignment.name;
    const sub = getSubjectByCode(cleanCode, "CSE-GEN", "3", "F");
    if (sub?.name) return sub.name;
    const subject = collegeSubjects.find((s) => s.codes.includes(cleanCode));
    return subject?.name || cleanCode;
  };

  const openAttendanceForCell = (codePart: string, room: string, periodNum: number, isLab: boolean) => {
    // Attendance is accessible ONLY to admin and faculties
    if (!canAccessAttendance) {
      toast.error("Attendance Access Restricted", {
        description: "Marking student attendance is strictly restricted to Faculty and Administrators. Please sign in with a Faculty or Admin account."
      });
      if (onOpenRoleModal) onOpenRoleModal();
      return;
    }

    const cleanCode = codePart.replace(/\(L\)/i, "").trim();
    const assignment = assignments.find((a) => a.code === cleanCode || cleanCode.startsWith(a.code));

    // Determine target batch from cell text and assignment
    const hasF = cleanCode.toUpperCase().includes("F") || cleanCode.toUpperCase().endsWith("F") || assignment?.section === "F";

    const isCSEGen3F = hasF && (assignment?.program === "CSE-GEN" || !assignment?.program);
    const targetProgram = assignment?.program || (hasF ? "CSE-GEN" : "CSE-GEN");
    const targetSem = isCSEGen3F ? "3" : assignment?.semester || "1";
    const targetSec = assignment?.section || (hasF ? "F" : "A");
    const targetSubject = resolveSubjectName(codePart) || assignment?.name || "Class Session";

    // Enforce permission: If slot belongs to CSE-GEN Section-F 3rd Sem, only assigned faculty or admin can take attendance!
    if (targetProgram === "CSE-GEN" && targetSem === "3" && targetSec === "F") {
      const isAssigned = isAdmin || isFacultyAssignedToCSEGen3F(selectedFaculty) || isFacultyAssignedToCSEGen3F(user?.name);
      if (!isAssigned) {
        toast.error("Unauthorized Attendance Action", {
          description: "Only faculties officially assigned to CSE-GEN Section-F 3rd Semester (or Administrators) can record attendance for this batch."
        });
        return;
      }
    }

    setAttendanceTarget({
      program: targetProgram,
      semester: targetSem,
      section: targetSec,
      subject: targetSubject,
      subjectCode: cleanCode,
      room: room || "Classroom",
      period: SLOT_LABELS[periodNum - 1] || `P${periodNum}`,
      type: isLab ? "Lab" : "Lecture"
    });
    setIsAttendanceOpen(true);
  };

  // Compute workload statistics
  const stats = useMemo(() => {
    if (!facultyData?.grid) return { totalSlots: 0, labSlots: 0, lectureSlots: 0, uniqueBatches: 0 };
    let total = 0;
    let lab = 0;
    let lecture = 0;
    const batches = new Set<string>();

    DAYS.forEach((day) => {
      const dayRow = (facultyData.grid as any)[day] || {};
      for (let p = 1; p <= 8; p++) {
        const cell = dayRow[String(p)];
        if (cell && cell.text && cell.type !== "free" && cell.type !== "lunch" && cell.type !== "lab-continue") {
          total++;
          if (cell.type === "lab" || /\(L\)/i.test(cell.text)) {
            lab++;
          } else {
            lecture++;
          }
          const batchCode = cell.text.split(" in ")[0]?.replace(/\(L\)/i, "").trim();
          if (batchCode) batches.add(batchCode);
        }
      }
    });

    return {
      totalSlots: total,
      labSlots: lab,
      lectureSlots: lecture,
      uniqueBatches: batches.size
    };
  }, [facultyData]);

  const handleSelectFaculty = (name: string) => {
    setSelectedFaculty(name);
    setSearchQuery("");
    setIsSearchOpen(false);
    setActiveTab("timetable");
  };

  // Filtered class teachers
  const filteredClassTeachers = useMemo(() => {
    return classTeachers.filter((item) => {
      const matchesSem = selectedSemesterFilter === "All" || item.semester === selectedSemesterFilter;
      const q = classTeacherSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.classTeacher.toLowerCase().includes(q) ||
        item.program.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q);
      return matchesSem && matchesSearch;
    });
  }, [classTeachers, selectedSemesterFilter, classTeacherSearch]);

  return (
    <div className="faculty-timetable-container bg-[#fffdf7] border border-[#ded9cc] border-t-4 border-t-[#33409a] rounded-lg shadow-xl overflow-hidden mb-12">
      {/* Header bar */}
      <div className="p-5 border-b border-[#e5e1d5] bg-[#faf8f2]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#858286] uppercase mb-1">
              <UsersRound size={13} className="text-[#33409a]" />
              SOURCE DIRECTORY · FACULTY ALLOCATION PIPELINE
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#262a68] font-normal tracking-tight m-0">
              Faculty <em className="text-[#e3a62f] not-italic font-serif">Timetable & Allocations</em>
            </h2>
            <p className="text-xs text-[#716e75] mt-1">
              Search any of the <strong>205 verified faculty members</strong> to view their weekly timetable schedule, assigned classrooms, laboratories, and course workloads.
            </p>
          </div>

          {/* Mode Switcher: Schedule vs Class Teachers */}
          <div className="flex items-center gap-1.5 p-1 bg-[#ede9dd] rounded-md self-start lg:self-auto border border-[#dbd6c9]">
            <button
              onClick={() => setActiveTab("timetable")}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "timetable"
                  ? "bg-[#252b67] text-white shadow-sm"
                  : "text-[#58555e] hover:text-[#252b67]"
              }`}
            >
              <Calendar size={13} />
              <span>Faculty Schedule</span>
            </button>
            <button
              onClick={() => setActiveTab("classTeachers")}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "classTeachers"
                  ? "bg-[#252b67] text-white shadow-sm"
                  : "text-[#58555e] hover:text-[#252b67]"
              }`}
            >
              <GraduationCap size={13} />
              <span>Class Teachers ({classTeachers.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Quick Chips Bar (shown in timetable mode) */}
        {activeTab === "timetable" && (
          <div className="mt-4 pt-4 border-t border-[#e8e4da] space-y-3">
            {/* Search Input Box */}
            <div className="relative max-w-xl">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-[#8b8791]" />
                <Input
                  type="text"
                  placeholder="Search faculty name, designation, or department..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="pl-10 pr-4 h-10 bg-white border-[#d8d3c5] text-xs focus:border-[#33409a] shadow-sm"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsSearchOpen(false)}
                  />
                  <div className="absolute top-11 left-0 right-0 z-30 bg-[#fffdf7] border border-[#d8d3c5] rounded-md shadow-2xl max-h-72 overflow-y-auto divide-y divide-[#eeebe3]">
                    {filteredFaculty.length > 0 ? (
                      filteredFaculty.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleSelectFaculty(name)}
                          className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#f4efe3] transition flex items-center justify-between group"
                        >
                          <div>
                            <strong className="block text-[#27262c] group-hover:text-[#33409a]">
                              {name}
                            </strong>
                            <span className="text-[10px] text-[#7a767f]">
                              {getFacultyAssignments(name).length} Course Assignments
                            </span>
                          </div>
                          <ChevronRight size={13} className="text-[#a4a0a9] group-hover:text-[#33409a]" />
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-[#8c8892] text-center">
                        No faculty found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Featured Faculty Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-[#86828a] uppercase tracking-wider mr-1 flex items-center gap-1">
                <Sparkles size={12} className="text-[#e3a62f]" /> Quick Select:
              </span>
              {FEATURED_FACULTY.map((name) => {
                const shortName = name.split(" - ")[0];
                const isCurrent = selectedFaculty === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectFaculty(name)}
                    className={`px-2.5 py-1 rounded-full text-[11px] transition border ${
                      isCurrent
                        ? "bg-[#33409a] text-white border-[#33409a] font-medium shadow-xs"
                        : "bg-white border-[#dad5c7] text-[#4d4a51] hover:bg-[#f6f2e6]"
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === "timetable" ? (
        <div>
          {/* Active Faculty Summary Banner */}
          <div className="p-4 sm:p-5 bg-[#252b67] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#e3a62f] text-[#252b67] font-serif font-bold text-lg grid place-items-center shrink-0 shadow-inner">
                {selectedFaculty.charAt(0)}
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-white m-0 leading-tight">
                  {selectedFaculty}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#c5c9e6]">
                  <span className="bg-[#384189] px-2 py-0.5 rounded text-[10px] text-[#e3a62f] font-semibold tracking-wide">
                    VERIFIED FACULTY REGISTER
                  </span>
                  <span>·</span>
                  <span>{assignments.length} Course Offerings</span>
                  <span>·</span>
                  <span>{stats.uniqueBatches} Class Batches</span>
                </div>
              </div>
            </div>

            {/* Metrics Chips & Take Attendance Button */}
            <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l border-[#3a428a] pt-3 md:pt-0 md:pl-5">
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase tracking-wider text-[#a9aed5]">Total Classes</span>
                <strong className="text-lg text-white font-serif">{stats.totalSlots}</strong>
                <span className="block text-[9px] text-[#8e94c4]">periods/week</span>
              </div>
              <div className="text-center px-2 border-l border-[#3a428a]">
                <span className="block text-[10px] uppercase tracking-wider text-[#a9aed5]">Theory</span>
                <strong className="text-lg text-[#e3a62f] font-serif">{stats.lectureSlots}</strong>
                <span className="block text-[9px] text-[#8e94c4]">lectures</span>
              </div>
              <div className="text-center px-2 border-l border-[#3a428a]">
                <span className="block text-[10px] uppercase tracking-wider text-[#a9aed5]">Labs</span>
                <strong className="text-lg text-[#ec6f60] font-serif">{stats.labSlots}</strong>
                <span className="block text-[9px] text-[#8e94c4]">practical</span>
              </div>
              <div className="pl-3 border-l border-[#3a428a]">
                {(() => {
                  const isSec3FAssigned = isFacultyAssignedToCSEGen3F(selectedFaculty);
                  const isUserAssigned = isFacultyAssignedToCSEGen3F(user?.name);
                  const canMarkSec3F = isAdmin || isSec3FAssigned || isUserAssigned;

                  if (!canMarkSec3F) {
                    return (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#32397a] border border-[#444d99] text-[#b4bae6] text-xs">
                        <Lock size={12} className="text-[#e3a62f]" />
                        <span className="text-[10px] font-medium">
                          Sec F (3rd Sem) Attendance: Assigned Faculty Only
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Button
                      onClick={() => {
                        if (!canAccessAttendance) {
                          toast.error("Attendance Access Restricted", {
                            description: "Marking student attendance is strictly restricted to Faculty and Administrators. Please switch to a Faculty or Admin account."
                          });
                          if (onOpenRoleModal) onOpenRoleModal();
                          return;
                        }

                        const cseF = assignments.find((a) => a.program === "CSE-GEN" && (a.section === "F" || a.semester === "3"));
                        setAttendanceTarget({
                          program: "CSE-GEN",
                          semester: "3",
                          section: "F",
                          subject: cseF?.name || assignments[0]?.name || "Discrete Mathematics and Graph Theory",
                          subjectCode: cseF?.code || assignments[0]?.code || "M31",
                          room: "202 [AC] Room",
                          period: "P6 · 1:20–2:10",
                          type: "Lecture"
                        });
                        setIsAttendanceOpen(true);
                      }}
                      className="h-9 text-xs bg-[#e3a62f] hover:bg-[#cf8e18] text-[#252b67] font-bold gap-1.5 shadow-md px-3.5"
                      title="Mark attendance for CSE-GEN Section F 3rd Sem (56 Students)"
                    >
                      <CheckSquare size={14} />
                      <span>Mark Attendance · CSE-GEN 3F</span>
                      <span className="ml-1 px-1.5 py-0.5 bg-[#252b67] text-white rounded text-[9px] font-semibold">
                        56 Students
                      </span>
                    </Button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Weekly Timetable Grid */}
          {/* Weekly Timetable Grid (Structured Fixed Table Layout) */}
          <div className="overflow-x-auto rounded-xl border border-[#e3dfd3] shadow-xs bg-[#fffdf7]">
            <table className="w-full min-w-[1240px] border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "130px" }} />
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <col key={i} style={{ width: "calc((100% - 130px) / 8)" }} />
                ))}
              </colgroup>
              <thead className="bg-[#fbf9f4] border-b border-[#e3dfd3]">
                <tr>
                  <th className="p-3 text-[11px] font-bold text-[#8c8890] uppercase tracking-wider text-left border-r border-[#e3dfd3] align-middle">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#e3a62f]" />
                      <span>Day / Period</span>
                    </div>
                  </th>
                  {SLOT_LABELS.map((slot) => {
                    const [pNum, pTime] = slot.split(" · ");
                    return (
                      <th key={slot} className="p-2.5 text-center border-r border-[#e3dfd3] last:border-r-0 align-middle">
                        <span className="text-[10px] font-bold text-[#e3a62f] tracking-wider block">{pNum}</span>
                        <strong className="text-xs text-[#302f35] font-semibold block mt-0.5 whitespace-nowrap">{pTime}</strong>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ede9dd]">
                {DAYS.map((day) => {
                  const dayRow = (facultyData?.grid as any)?.[day] || {};

                  return (
                    <tr key={day} className="h-[96px] hover:bg-[#faf8f2]/40 transition-colors">
                      {/* Day Label Column */}
                      <td className="p-3 bg-[#fbf9f4] border-r border-[#e3dfd3] align-middle">
                        <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-[#e3a62f] tracking-wider uppercase">{day}</span>
                          <strong className="text-sm font-serif text-[#262a68]">{DAY_FULL[day]}</strong>
                        </div>
                      </td>

                      {/* 8 Period Columns */}
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => {
                        const cell = dayRow[String(periodNum)];

                        // Lunch Slot
                        if (cell?.type === "lunch" || /lunch/i.test(cell?.text || "")) {
                          return (
                            <td
                              key={`${day}-${periodNum}`}
                              className="p-1 border-r border-[#e3dfd3] last:border-r-0 bg-[#f7f5ef] align-middle text-center"
                            >
                              <div className="h-full flex items-center justify-center">
                                <span className="text-[9px] font-bold tracking-widest text-[#9d99a2] uppercase select-none opacity-70">
                                  LUNCH BREAK
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // Continuation of lab
                        if (cell?.type === "lab-continue") {
                          return (
                            <td
                              key={`${day}-${periodNum}`}
                              className="p-1.5 border-r border-[#e3dfd3] last:border-r-0 bg-[#fdf2f0]/60 align-middle text-center"
                            >
                              <div className="h-full flex items-center justify-center text-[10px] text-[#cc5a4b] italic">
                                <span>↳ (Lab contd.)</span>
                              </div>
                            </td>
                          );
                        }

                        // Occupied Teaching Slot
                        if (cell && cell.text && cell.type !== "free") {
                          const [codePart, ...roomParts] = cell.text.split(" in ");
                          const room = roomParts.join(" in ").trim() || "Room Allocated";
                          const isLab = cell.type === "lab" || /\(L\)/i.test(cell.text);
                          const subjectName = resolveSubjectName(codePart);
                          const isSectionF = codePart.toUpperCase().includes("F") || codePart.toUpperCase().endsWith("F") || /\bF\b/i.test(codePart);

                          return (
                            <td
                              key={`${day}-${periodNum}`}
                              className="p-1.5 border-r border-[#e3dfd3] last:border-r-0 bg-white align-top"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectSession) {
                                    onSelectSession({
                                      subject: subjectName,
                                      code: codePart,
                                      faculty: selectedFaculty,
                                      room,
                                      batch: isSectionF ? "CSE-GEN · S3 · F" : `Batch ${codePart}`,
                                      day: DAY_FULL[day] || day,
                                      slot: periodNum - 1,
                                      type: isLab ? "Lab" : "Lecture",
                                      color: isLab ? "#CC5A4B" : "#33409A",
                                      note: `${selectedFaculty} teaching ${subjectName} in ${room}.`
                                    });
                                  }
                                }}
                                className={`w-full h-full min-h-[82px] p-2 rounded-lg text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden flex flex-col justify-between group ${
                                  isLab
                                    ? "bg-[#fdf2f0] border-l-4 border-l-[#cc5a4b] border-t border-r border-b border-[#f3d4ce]"
                                    : isSectionF
                                    ? "bg-[#f4f6fd] border-l-4 border-l-[#e3a62f] border-t border-r border-b border-[#d7def5]"
                                    : "bg-[#f2f4fc] border-l-4 border-l-[#33409a] border-t border-r border-b border-[#d7def5]"
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span
                                        className={`text-[8px] font-bold tracking-wider uppercase px-1 py-0.5 rounded flex items-center gap-0.5 shrink-0 ${
                                          isLab ? "bg-[#cc5a4b] text-white" : "bg-[#33409a] text-white"
                                        }`}
                                      >
                                        {isLab && <FlaskConical size={8} />}
                                        {isLab ? "LAB" : "LECTURE"}
                                      </span>
                                      {isSectionF && (
                                        <span className="text-[7.5px] font-extrabold tracking-wider uppercase px-1 py-0.5 rounded bg-[#e3a62f] text-[#252b67] truncate">
                                          SEC F (56)
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-bold text-[#2d2c33] shrink-0 font-mono">
                                      {codePart}
                                    </span>
                                  </div>

                                  <strong className="block text-[11px] font-bold text-[#25242a] leading-tight line-clamp-2">
                                    {subjectName}
                                  </strong>
                                </div>

                                <div className="mt-1.5 pt-1 border-t border-black/5 text-[9px] text-[#6d6971] flex items-center justify-between gap-1">
                                  <span className="truncate flex items-center gap-0.5 font-medium">
                                    <MapPin size={9} className="text-[#33409a]" /> {room}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {(() => {
                                      const canMarkCell = !isSectionF || isAdmin || isFacultyAssignedToCSEGen3F(selectedFaculty) || isFacultyAssignedToCSEGen3F(user?.name);

                                      if (isSectionF && !canMarkCell) {
                                        return (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toast.error("Unauthorized Attendance Action", {
                                                description: "Only faculties officially assigned to CSE-GEN Section-F 3rd Semester (or Administrators) can record attendance for this batch."
                                              });
                                            }}
                                            className="px-1.5 py-0.5 rounded text-[8px] font-bold transition flex items-center gap-0.5 bg-[#eae7de] text-[#7a767f] cursor-not-allowed opacity-75 shadow-xs"
                                            title="Sec-F Attendance Restricted: Only assigned faculty can mark attendance"
                                          >
                                            <Lock size={9} className="text-[#cf3d2c]" />
                                            <span>Locked</span>
                                          </button>
                                        );
                                      }

                                      return (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openAttendanceForCell(codePart, room, periodNum, isLab);
                                          }}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition flex items-center gap-0.5 shadow-xs ${
                                            isSectionF
                                              ? "bg-[#e3a62f] text-[#252b67] hover:bg-[#cf8e18]"
                                              : "bg-[#33409a] text-white hover:bg-[#252b67] opacity-0 group-hover:opacity-100"
                                          }`}
                                          title={
                                            !canAccessAttendance
                                              ? "Attendance marking is restricted to Faculty & Admin accounts"
                                              : `Record attendance for ${isSectionF ? "CSE-GEN Section F (56 students)" : codePart}`
                                          }
                                        >
                                          {canAccessAttendance ? (
                                            <CheckSquare size={9} />
                                          ) : (
                                            <Lock size={9} className="text-[#cf3d2c]" />
                                          )}
                                          <span>
                                            {!canAccessAttendance
                                              ? "Faculty Only"
                                              : isSectionF
                                              ? "Attendance"
                                              : "Attend"}
                                          </span>
                                        </button>
                                      );
                                    })()}
                                    <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 text-[#33409a]" />
                                  </div>
                                </div>
                              </button>
                            </td>
                          );
                        }

                        // Free Period
                        return (
                          <td
                            key={`${day}-${periodNum}`}
                            className="p-1 border-r border-[#e3dfd3] last:border-r-0 bg-[#fdfbf7] align-middle text-center"
                          >
                            <span className="text-[#c5c1b8] text-xs font-light select-none">—</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subject Allocation Table Section */}
          <div className="p-5 border-t border-[#e5e1d5] bg-[#fdfcf9]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-serif text-lg text-[#262a68] m-0 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-[#33409a]" />
                  Subject Allocation Table
                </h4>
                <p className="text-xs text-[#757278] mt-0.5">
                  Complete list of courses, LTPE credits, programs, semesters, and sections assigned to {selectedFaculty.split(" - ")[0]}.
                </p>
              </div>
              <Badge variant="outline" className="border-[#ded9cb] text-[#666369] text-xs">
                {assignments.length} Assigned Courses
              </Badge>
            </div>

            {assignments.length > 0 ? (
              <div className="overflow-x-auto border border-[#e5e1d5] rounded-md bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f7f5ee] border-b border-[#e5e1d5] text-[#555259] uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3">LTPE (L-T-P-C)</th>
                      <th className="py-2.5 px-3">Program</th>
                      <th className="py-2.5 px-3">Semester</th>
                      <th className="py-2.5 px-3">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eeebe3]">
                    {assignments.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#fbf9f4] transition">
                        <td className="py-2.5 px-3 font-semibold text-[#33409a]">
                          {item.code}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#2d2c32]">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#58555c]">
                          <span className="px-1.5 py-0.5 bg-[#f0ece1] rounded text-[11px] font-mono">
                            {item.ltpe}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#58555c]">
                          {item.program}
                        </td>
                        <td className="py-2.5 px-3 text-[#58555c]">
                          Semester {item.semester}
                        </td>
                        <td className="py-2.5 px-3 text-[#58555c]">
                          Section {item.section}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#8c8892] bg-[#f8f6f0] rounded border border-[#e8e4da]">
                No explicit subject allocation records listed in source register for this faculty member.
              </div>
            )}
          </div>

          {/* Recent Hourly Attendance Submissions & CSV Export Section */}
          <div className="p-5 border-t border-[#e5e1d5] bg-[#faf8f2]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="font-serif text-lg text-[#262a68] m-0 flex items-center gap-2">
                  <CheckSquare size={16} className="text-[#33409a]" />
                  Hourly Attendance Submissions & CSV Records
                </h4>
                <p className="text-xs text-[#757278] mt-0.5">
                  Official hour-by-hour attendance logs recorded by {selectedFaculty.split(" - ")[0]}. Print or export CSV for any session.
                </p>
              </div>
              <Badge variant="outline" className="border-[#ded9cb] text-[#666369] text-xs">
                {facultySubmissions.length} Recorded Sessions
              </Badge>
            </div>

            {facultySubmissions.length > 0 ? (
              <div className="space-y-2.5">
                {facultySubmissions.slice(0, 5).map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-white border border-[#e5e1d5] rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:border-[#33409a] transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-[#33409a] text-white text-[9px] px-1.5 py-0.2">{sub.type}</Badge>
                        <strong className="text-xs text-[#252b67]">{sub.subjectCode} · {sub.subject}</strong>
                        <span className="text-[#888] text-xs">·</span>
                        <span className="text-xs text-[#666]">{sub.program} S{sub.semester} ({sub.section})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#716e75]">
                        <span className="flex items-center gap-1"><Calendar size={11} className="text-[#33409a]" /> {sub.date}</span>
                        <span className="flex items-center gap-1"><Clock size={11} className="text-[#33409a]" /> {sub.period}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} className="text-[#33409a]" /> {sub.room}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
                      <div className="text-right mr-1">
                        <div className="text-xs font-bold text-[#15803d]">
                          {sub.presentCount} / {sub.totalCount} Present ({sub.attendancePercentage}%)
                        </div>
                        <div className="text-[10px] text-[#716e75]">
                          {sub.absentCount} Absent
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          downloadHourlyAttendanceCSV(sub);
                          toast.success("Hourly Attendance CSV Exported", {
                            description: `Saved report for ${sub.subjectCode} (${sub.period}).`
                          });
                        }}
                        className="h-8 text-xs border-[#33409a] text-[#33409a] hover:bg-[#33409a] hover:text-white gap-1.5 transition font-semibold"
                        title={`Download CSV file of attendance for ${sub.subjectCode} (${sub.period})`}
                      >
                        <Download size={13} />
                        <span>Hourly CSV</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printHourlyAttendanceSheet(sub)}
                        className="h-8 text-xs border-[#d8d4c7] text-[#555259] hover:bg-[#faf8f2] gap-1.5 transition"
                        title={`Print official attendance report for ${sub.subjectCode} (${sub.period})`}
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#8c8892] bg-white rounded border border-[#e8e4da]">
                No class attendance recorded yet for this faculty member. Click "Attendance" on any active timetable period above to take and print attendance.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Class Teachers Directory Tab */
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="font-serif text-lg text-[#262a68] m-0 flex items-center gap-2">
                <GraduationCap size={16} className="text-[#33409a]" />
                Institutional Class Teachers Directory
              </h4>
              <p className="text-xs text-[#757278] mt-0.5">
                Every class section assigned teacher across programs. Click any teacher to view their full schedule.
              </p>
            </div>

            {/* Semester Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-[10px] font-bold text-[#86828a] uppercase tracking-wider mr-1">
                Semester:
              </span>
              {["All", "1", "3", "5", "7"].map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemesterFilter(sem)}
                  className={`px-2.5 py-1 rounded text-xs transition border ${
                    selectedSemesterFilter === sem
                      ? "bg-[#252b67] text-white border-[#252b67] font-semibold"
                      : "bg-white border-[#dad5c7] text-[#4d4a51] hover:bg-[#f6f2e6]"
                  }`}
                >
                  {sem === "All" ? "All Semesters" : `Sem ${sem}`}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="mb-4 max-w-md">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#8c8892]" />
              <Input
                type="text"
                placeholder="Filter by teacher name, department, or section..."
                value={classTeacherSearch}
                onChange={(e) => setClassTeacherSearch(e.target.value)}
                className="pl-9 h-8 text-xs bg-white border-[#d8d3c5]"
              />
            </div>
          </div>

          {/* Class Teachers Table */}
          <div className="overflow-x-auto border border-[#e5e1d5] rounded-md bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f7f5ee] border-b border-[#e5e1d5] text-[#555259] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Program / Dept</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Designated Class Teacher</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeebe3]">
                {filteredClassTeachers.map((record) => (
                  <tr key={record.key} className="hover:bg-[#fbf9f4] transition">
                    <td className="py-2.5 px-3 font-semibold text-[#292830]">
                      {record.program}
                    </td>
                    <td className="py-2.5 px-3 text-[#58555c]">
                      Semester {record.semester}
                    </td>
                    <td className="py-2.5 px-3 text-[#58555c]">
                      Section {record.section}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#33409a]">
                      {record.classTeacher}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          handleSelectFaculty(record.classTeacher);
                        }}
                        className="h-7 text-xs text-[#33409a] hover:bg-[#eef0fb] gap-1 px-2"
                      >
                        View Timetable
                        <ArrowUpRight size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Take Attendance Dialog */}
      <TakeAttendanceDialog
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        facultyName={selectedFaculty}
        defaultProgram={attendanceTarget?.program || "CSE-GEN"}
        defaultSemester={attendanceTarget?.semester || "1"}
        defaultSection={attendanceTarget?.section || "F"}
        defaultSubject={attendanceTarget?.subject || "Computational Chemistry"}
        defaultSubjectCode={attendanceTarget?.subjectCode || "M22"}
        defaultRoom={attendanceTarget?.room || "318B Math [AC] Lab"}
        defaultPeriod={attendanceTarget?.period || "P3 · 10:35–11:25"}
        defaultType={attendanceTarget?.type || "Lecture"}
      />
    </div>
  );
}
