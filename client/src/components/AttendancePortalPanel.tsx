import { useState, useMemo, useEffect } from "react";
import {
  loadAllAttendanceSubmissions,
  getAttendanceSubmissionsForClass,
  getStudentAttendanceSummary,
  subscribeToAttendance,
  AttendanceSubmission,
  StudentCumulativeStats,
  downloadHourlyAttendanceCSV,
  printHourlyAttendanceSheet
} from "@/lib/attendanceStore";
import { collegePrograms, semestersFor, sectionsFor } from "@/data/collegeData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckSquare,
  UsersRound,
  AlertTriangle,
  Download,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileSpreadsheet,
  Layers3,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Lock,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { isFacultyAssignedToCSEGen3F } from "@/data/studentsData";

interface AttendancePortalPanelProps {
  initialProgram?: string;
  initialSemester?: string;
  initialSection?: string;
  onOpenTakeAttendance?: () => void;
}

export default function AttendancePortalPanel({
  initialProgram = "CSE-GEN",
  initialSemester = "3",
  initialSection = "F",
  onOpenTakeAttendance
}: AttendancePortalPanelProps) {
  const { user, isAdmin } = useAuth();
  const [program, setProgram] = useState(initialProgram);
  const [semester, setSemester] = useState(initialSemester);
  const [section, setSection] = useState(initialSection);

  const isCSEGen3F =
    (program === "CSE-GEN" || program === "CSE") &&
    (semester === "3" || semester === "3rd") &&
    (section === "F" || section === "SEC F");

  const canMarkForBatch = !isCSEGen3F || isAdmin || isFacultyAssignedToCSEGen3F(user?.name);

  const [activeTab, setActiveTab] = useState<"roster" | "history" | "defaulters">("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<AttendanceSubmission | null>(null);

  // Load submissions and student stats
  const [allSubmissions, setAllSubmissions] = useState<AttendanceSubmission[]>(() =>
    loadAllAttendanceSubmissions()
  );

  const reloadData = () => {
    setAllSubmissions(loadAllAttendanceSubmissions());
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeToAttendance(() => {
      reloadData();
    });
    return unsubscribe;
  }, []);

  // Filtered submissions for the selected class
  const classSubmissions = useMemo(() => {
    return allSubmissions.filter(
      (s) => s.program === program && s.semester === semester && s.section === section
    );
  }, [allSubmissions, program, semester, section]);

  // Student cumulative stats
  const studentStats: StudentCumulativeStats[] = useMemo(() => {
    return getStudentAttendanceSummary(program, semester, section);
  }, [program, semester, section, allSubmissions]);

  // Key institutional metrics
  const classMetrics = useMemo(() => {
    const totalStudents = studentStats.length;
    const totalClasses = classSubmissions.length;
    const defaulters = studentStats.filter((s) => s.status === "Critical").length;
    const warnings = studentStats.filter((s) => s.status === "Warning").length;

    let overallSum = 0;
    studentStats.forEach((s) => (overallSum += s.percentage));
    const averageTurnout = totalStudents > 0 ? Math.round(overallSum / totalStudents) : 100;

    return { totalStudents, totalClasses, defaulters, warnings, averageTurnout };
  }, [studentStats, classSubmissions]);

  // Filtered student list for search
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return studentStats;
    return studentStats.filter(
      (s) => s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q)
    );
  }, [studentStats, searchQuery]);

  // Defaulters list (< 75%)
  const defaulterStudents = useMemo(() => {
    return studentStats.filter((s) => s.status === "Critical");
  }, [studentStats]);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = ["S.No", "USN", "Student Name", "Classes Attended", "Total Conducted", "Attendance %", "Compliance Status"];
    const rows = studentStats.map((s, idx) => [
      idx + 1,
      s.usn,
      `"${s.name}"`,
      s.attendedClasses,
      s.totalClasses,
      `${s.percentage}%`,
      s.status === "Critical" ? "Defaulter (<75%)" : s.status === "Warning" ? "Warning (75-84%)" : "Eligible (>=85%)"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${program}_S${semester}_${section}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Attendance CSV Exported", {
      description: `Saved report for ${program} S${semester} (${section}) with ${studentStats.length} student records.`
    });
  };

  return (
    <div className="attendance-portal-panel bg-[#fffdf7] border border-[#ded9cc] border-t-4 border-t-[#33409a] rounded-lg shadow-xl overflow-hidden mb-12 font-sans">
      {/* Portal Top Header */}
      <div className="p-5 border-b border-[#e5e1d5] bg-[#faf8f2]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#858286] uppercase mb-1">
              <CheckSquare size={13} className="text-[#33409a]" />
              INSTITUTIONAL ATTENDANCE SECTION PORTAL
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#262a68] font-normal tracking-tight m-0">
              Class Attendance & <em className="text-[#e3a62f] not-italic font-serif">Academic Compliance</em>
            </h2>
            <p className="text-xs text-[#716e75] mt-1">
              Central attendance register: Faculty session submissions, individual student turnout, and defaulter tracking (<strong className="text-[#b93222]">&lt;75% AICTE threshold</strong>).
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {onOpenTakeAttendance && (
              <Button
                onClick={() => {
                  if (isCSEGen3F && !canMarkForBatch) {
                    toast.error("Attendance Access Restricted", {
                      description: "Only faculties officially assigned to CSE-GEN Section-F 3rd Semester (or Administrators) can record attendance for this class."
                    });
                    return;
                  }
                  onOpenTakeAttendance();
                }}
                className={`h-9 text-xs gap-1.5 shadow-sm transition ${
                  isCSEGen3F && !canMarkForBatch
                    ? "bg-[#8b8792] hover:bg-[#7e7a85] text-white opacity-80"
                    : "bg-[#33409a] hover:bg-[#252b67] text-white"
                }`}
                title={
                  isCSEGen3F && !canMarkForBatch
                    ? "Only assigned faculties can take attendance for CSE-GEN Section-F 3rd Sem"
                    : "Take class attendance"
                }
              >
                {isCSEGen3F && !canMarkForBatch ? <Lock size={13} /> : <CheckSquare size={13} />}
                <span>{isCSEGen3F && !canMarkForBatch ? "Assigned Faculty Only" : "Take Attendance"}</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="h-9 text-xs border-[#d8d4c7] text-[#48454d] hover:bg-white gap-1.5"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Class Selector Bar */}
        <div className="mt-4 pt-4 border-t border-[#e8e4da] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#716d76] uppercase tracking-wider mb-1">
              Academic Program / Dept
            </label>
            <select
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                const sems = semestersFor(e.target.value);
                setSemester(sems[0] || "1");
                setSection("F");
              }}
              className="w-full h-9 px-3 text-xs bg-white border border-[#d8d4c7] rounded focus:outline-none focus:border-[#33409a]"
            >
              {collegePrograms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#716d76] uppercase tracking-wider mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-[#d8d4c7] rounded focus:outline-none focus:border-[#33409a]"
            >
              {semestersFor(program).map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#716d76] uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-[#d8d4c7] rounded focus:outline-none focus:border-[#33409a]"
            >
              {sectionsFor(program, semester).length > 0 ? (
                sectionsFor(program, semester).map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))
              ) : (
                <option value="F">Section F</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#fdfcf9] border-b border-[#e5e1d5]">
        <Card className="p-3.5 bg-white border-[#ded9cb] shadow-none">
          <span className="text-[10px] uppercase font-bold text-[#86838a] block">Average Turnout</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-serif text-[#252b67]">{classMetrics.averageTurnout}%</strong>
            <span className="text-[10px] text-[#2ba568] font-semibold">Institutional Grade</span>
          </div>
          <span className="text-[10px] text-[#86838a] mt-0.5 block">{classMetrics.totalStudents} enrolled students</span>
        </Card>

        <Card className="p-3.5 bg-white border-[#ded9cb] shadow-none">
          <span className="text-[10px] uppercase font-bold text-[#86838a] block">Sessions Conducted</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-serif text-[#252b67]">{classMetrics.totalClasses}</strong>
            <span className="text-[10px] text-[#6d6971]">periods logged</span>
          </div>
          <span className="text-[10px] text-[#86838a] mt-0.5 block">Recorded by faculty</span>
        </Card>

        <Card className="p-3.5 bg-white border-[#ded9cb] shadow-none">
          <span className="text-[10px] uppercase font-bold text-[#86838a] block">Defaulters (&lt;75%)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className={`text-2xl font-serif ${classMetrics.defaulters > 0 ? "text-[#cf3d2c]" : "text-[#2ba568]"}`}>
              {classMetrics.defaulters}
            </strong>
            <span className="text-[10px] text-[#cf3d2c] font-semibold">Critical Warning</span>
          </div>
          <span className="text-[10px] text-[#86838a] mt-0.5 block">Ineligible for exam seating</span>
        </Card>

        <Card className="p-3.5 bg-white border-[#ded9cb] shadow-none">
          <span className="text-[10px] uppercase font-bold text-[#86838a] block">Eligible (&ge;75%)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-serif text-[#2ba568]">
              {classMetrics.totalStudents - classMetrics.defaulters}
            </strong>
            <span className="text-[10px] text-[#2ba568] font-semibold">Compliant</span>
          </div>
          <span className="text-[10px] text-[#86838a] mt-0.5 block">Meeting mandatory attendance</span>
        </Card>
      </div>

      {/* Tabs Bar: Student Master Sheet vs Submitted Sessions vs Defaulters */}
      <div className="px-5 pt-4 border-b border-[#e5e1d5] flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("roster")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "roster"
                ? "border-[#33409a] text-[#33409a]"
                : "border-transparent text-[#716e75] hover:text-[#252b67]"
            }`}
          >
            Student Master Sheet ({studentStats.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "history"
                ? "border-[#33409a] text-[#33409a]"
                : "border-transparent text-[#716e75] hover:text-[#252b67]"
            }`}
          >
            Submitted Session History ({classSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab("defaulters")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "defaulters"
                ? "border-[#cf3d2c] text-[#cf3d2c]"
                : "border-transparent text-[#716e75] hover:text-[#cf3d2c]"
            }`}
          >
            Defaulter Warnings ({defaulterStudents.length})
          </button>
        </div>

        {activeTab === "roster" && (
          <div className="pb-2">
            <div className="relative w-64">
              <Search size={14} className="absolute left-2.5 top-2 text-[#8c8892]" />
              <Input
                type="text"
                placeholder="Search USN or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-[#faf8f2] border-[#ded9cc]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Student Master Sheet */}
      {activeTab === "roster" && (
        <div className="p-5">
          <div className="border border-[#e2ddd1] rounded-md overflow-hidden bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f7f5ee] border-b border-[#e2ddd1] text-[#555259] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-36">USN</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 w-28 text-center">Attended / Total</th>
                  <th className="py-2.5 px-3 w-36 text-center">Attendance Rate</th>
                  <th className="py-2.5 px-3 w-32 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeebe3]">
                {filteredStudents.map((s, idx) => (
                  <tr
                    key={s.usn}
                    className={`hover:bg-[#fbf9f4] transition ${
                      s.status === "Critical" ? "bg-[#fff7f6]" : ""
                    }`}
                  >
                    <td className="py-2 px-3 text-center text-[#8e8a93] font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-[#25242a]">
                      {s.usn}
                    </td>
                    <td className="py-2 px-3 font-medium text-[#2d2c33]">
                      {s.name}
                    </td>
                    <td className="py-2 px-3 text-center text-[#58555c] font-mono">
                      {s.attendedClasses} / {s.totalClasses}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-[#ede8dc] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.status === "Critical"
                                ? "bg-[#cf3d2c]"
                                : s.status === "Warning"
                                ? "bg-[#d99616]"
                                : "bg-[#2ba568]"
                            }`}
                            style={{ width: `${s.percentage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-[11px] font-mono w-9 text-right">
                          {s.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {s.status === "Critical" ? (
                        <Badge className="bg-[#fdeeed] text-[#b83525] border border-[#f6c7c2] text-[10px]">
                          Defaulter (&lt;75%)
                        </Badge>
                      ) : s.status === "Warning" ? (
                        <Badge className="bg-[#fef7e6] text-[#b37711] border border-[#f7e0af] text-[10px]">
                          Warning (75-84%)
                        </Badge>
                      ) : (
                        <Badge className="bg-[#eaf6ef] text-[#247c50] border border-[#c3e8d2] text-[10px]">
                          Eligible (&ge;85%)
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Submitted Session History */}
      {activeTab === "history" && (
        <div className="p-5 space-y-3">
          {classSubmissions.length > 0 ? (
            classSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 bg-white border border-[#e2ded2] rounded-md hover:border-[#33409a] transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[#33409a] text-white text-[10px]">{sub.type}</Badge>
                    <span className="font-semibold text-xs text-[#25242a]">{sub.subjectCode} · {sub.subject}</span>
                    <span className="text-[#88848d] text-xs">·</span>
                    <span className="text-xs text-[#6e6a73]">{sub.room}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6e6a73] mt-1.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-[#33409a]" /> {sub.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-[#33409a]" /> {sub.period}
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersRound size={11} className="text-[#33409a]" /> Instructor: <strong className="text-[#2b2a30]">{sub.faculty}</strong>
                    </span>
                  </div>

                  {sub.remarks && (
                    <p className="text-[11px] text-[#86838a] mt-2 italic bg-[#faf8f2] p-1.5 rounded">
                      "{sub.remarks}"
                    </p>
                  )}
                </div>

                {/* Turnout metrics badge & view details */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
                  <div className="text-right mr-1">
                    <div className="text-sm font-serif font-bold text-[#252b67]">
                      {sub.presentCount} / {sub.totalCount} Present
                    </div>
                    <div className="text-[10px] text-[#2ba568] font-semibold">
                      {sub.attendancePercentage}% Turnout Rate
                    </div>
                  </div>

                  {/* 1-Click Hourly CSV Download */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      downloadHourlyAttendanceCSV(sub);
                      toast.success("Hourly Attendance CSV Exported", {
                        description: `Saved attendance report for ${sub.subjectCode} (${sub.period}).`
                      });
                    }}
                    className="h-8 text-xs border-[#33409a] text-[#33409a] hover:bg-[#33409a] hover:text-white gap-1 transition font-medium"
                    title={`Download CSV file of attendance for ${sub.subjectCode} (${sub.period})`}
                  >
                    <Download size={13} />
                    <span>Hourly CSV</span>
                  </Button>

                  {/* 1-Click Official Sheet Print */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printHourlyAttendanceSheet(sub)}
                    className="h-8 text-xs border-[#d8d4c7] text-[#555259] hover:bg-[#faf8f2] gap-1 transition hidden sm:flex"
                    title={`Print official attendance report for ${sub.subjectCode} (${sub.period})`}
                  >
                    <Printer size={13} />
                    <span>Print</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSubmission(sub)}
                    className="h-8 text-xs border-[#d8d4c7] text-[#252b67] hover:bg-[#eef0fb]"
                  >
                    View Roster
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#8c8892] bg-[#faf8f2] rounded border border-[#e8e4da]">
              No sessions submitted yet for this class section. Use "Take Attendance" from the Faculty tab to record sessions.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Defaulter Warnings List */}
      {activeTab === "defaulters" && (
        <div className="p-5">
          <div className="p-3.5 bg-[#fdf2f0] border border-[#f5c6cb] rounded-md text-xs text-[#962e24] mb-4 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-[#cf3d2c] shrink-0 mt-0.5" />
            <div>
              <strong>Mandatory AICTE Attendance Compliance Notice</strong>
              <p className="text-[11px] text-[#b34035] mt-0.5">
                Students below <strong>75% cumulative attendance</strong> are classified as academic defaulters and will require official condonation or debarment notices prior to end-semester examinations.
              </p>
            </div>
          </div>

          <div className="border border-[#e2ddd1] rounded-md overflow-hidden bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f7f5ee] border-b border-[#e2ddd1] text-[#555259] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-36">USN</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 w-32 text-center">Attended / Total</th>
                  <th className="py-2.5 px-3 w-28 text-center">Turnout</th>
                  <th className="py-2.5 px-3 text-center">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeebe3]">
                {defaulterStudents.length > 0 ? (
                  defaulterStudents.map((s, idx) => (
                    <tr key={s.usn} className="bg-[#fff7f6] hover:bg-[#faeeec] transition">
                      <td className="py-2.5 px-3 text-center text-[#8e8a93] font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#b83525]">
                        {s.usn}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#2d2c33]">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#58555c] font-mono">
                        {s.attendedClasses} / {s.totalClasses}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-[#cf3d2c]">
                        {s.percentage}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge className="bg-[#cf3d2c] text-white text-[9px]">
                          Issue Parent Notice
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#2ba568]">
                      ✓ No attendance defaulters found in this class! All students are above the 75% threshold.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Submission Modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-[#fffdf7] border border-[#ded9cc] rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e5e1d5] pb-3 mb-4">
              <div>
                <h3 className="font-serif text-xl text-[#262a68] m-0">
                  {selectedSubmission.subjectCode} · {selectedSubmission.subject}
                </h3>
                <span className="text-xs text-[#78757d]">
                  Conducted by {selectedSubmission.faculty} on {selectedSubmission.date} ({selectedSubmission.period})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    downloadHourlyAttendanceCSV(selectedSubmission);
                    toast.success("Hourly Attendance CSV Exported", {
                      description: `Saved report for ${selectedSubmission.subjectCode} (${selectedSubmission.period}).`
                    });
                  }}
                  className="h-8 text-xs bg-[#33409a] hover:bg-[#252b67] text-white gap-1.5 shadow-xs font-semibold"
                >
                  <Download size={13} />
                  <span>Download Hourly CSV</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printHourlyAttendanceSheet(selectedSubmission)}
                  className="h-8 text-xs border-[#d8d4c7] text-[#252b67] hover:bg-[#eef0fb] gap-1.5 font-medium hidden sm:flex"
                >
                  <Printer size={13} />
                  <span>Print Sheet</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                  className="h-8 text-xs border-[#d8d4c7]"
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
              <div className="p-2 bg-[#eaf6ef] rounded text-[#247c50]">
                <strong className="block text-lg font-serif">{selectedSubmission.presentCount}</strong>
                <span>Present</span>
              </div>
              <div className="p-2 bg-[#fdeeed] rounded text-[#cf3d2c]">
                <strong className="block text-lg font-serif">{selectedSubmission.absentCount}</strong>
                <span>Absent</span>
              </div>
              <div className="p-2 bg-[#f0ecfa] rounded text-[#33409a]">
                <strong className="block text-lg font-serif">{selectedSubmission.attendancePercentage}%</strong>
                <span>Rate</span>
              </div>
            </div>

            <div className="border border-[#e2ddd1] rounded-md overflow-hidden bg-white max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#faf7ef] border-b border-[#e2ddd1] text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">USN</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeebe3]">
                  {selectedSubmission.students.map((st) => (
                    <tr key={st.usn}>
                      <td className="py-2 px-3 font-mono font-medium">{st.usn}</td>
                      <td className="py-2 px-3">{st.name}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.status === "P"
                              ? "bg-[#2da46a] text-white"
                              : st.status === "A"
                              ? "bg-[#cf3d2c] text-white"
                              : st.status === "L"
                              ? "bg-[#d99616] text-white"
                              : "bg-[#33409a] text-white"
                          }`}
                        >
                          {st.status === "P" ? "Present" : st.status === "A" ? "Absent" : st.status === "L" ? "Late" : "Excused"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
