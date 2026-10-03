import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getStudentsForBatch,
  isFacultyAssignedToCSEGen3F,
  isFacultyAssignedToCSEDs3A,
  Student
} from "@/data/studentsData";
import {
  AttendanceStatus,
  StudentAttendanceEntry,
  AttendanceSubmission,
  saveAttendanceSubmission,
  downloadHourlyAttendanceCSV,
  printHourlyAttendanceSheet
} from "@/lib/attendanceStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  Check,
  X,
  Clock,
  Send,
  Search,
  UsersRound,
  Calendar,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Lock,
  Download,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";

interface TakeAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  facultyName: string;
  defaultProgram?: string;
  defaultSemester?: string;
  defaultSection?: string;
  defaultSubject?: string;
  defaultSubjectCode?: string;
  defaultRoom?: string;
  defaultPeriod?: string;
  defaultType?: "Lecture" | "Lab";
  onSuccess?: (submission: AttendanceSubmission) => void;
}

const SECTION_F_COURSES = [
  { code: "OS", name: "Operating Systems", faculty: "Dr. Ravindra Raman Cholla", room: "215A", type: "Lecture" as const, period: "P1 · 8:45–9:45" },
  { code: "PP", name: "Python Programming", faculty: "Prof. Lanke Ravi Kumar", room: "215A", type: "Lecture" as const, period: "P2 · 9:45–10:45" },
  { code: "DT", name: "Design Thinking", faculty: "Dr. Rajasimha A Makaram", room: "215A", type: "Lab" as const, period: "P3-P4 · 11:00–1:00" },
  { code: "DMGT", name: "Discrete Mathematics and Graph Theory", faculty: "Dr. Vidya Shree", room: "215A", type: "Lecture" as const, period: "P1 · 8:45–9:45" },
  { code: "COA", name: "Computer Organization and Architecture", faculty: "Prof. Harpreet Kaur", room: "215A", type: "Lecture" as const, period: "P2 · 9:45–10:45" },
  { code: "BE", name: "Biology for Engineers", faculty: "NF1", room: "215A", type: "Lecture" as const, period: "P1 · 8:45–9:45" },
  { code: "OS", name: "Operating Systems Lab", faculty: "Dr. Ravindra Raman Cholla", room: "125 B", type: "Lab" as const, period: "P3-P4 · 11:00–1:00" },
  { code: "PP", name: "Python Programming Lab", faculty: "Prof. Lanke Ravi Kumar", room: "221B", type: "Lab" as const, period: "P3-P4 · 11:00–1:00" },
  { code: "PL01", name: "Placement Training", faculty: "Trainer", room: "215A", type: "Lecture" as const, period: "P5-P6 · 1:50–3:50" },
  { code: "SY", name: "Sports and Yoga", faculty: "Mr. Kiran N", room: "212", type: "Lab" as const, period: "P5-P6 · 1:50–3:50" },
  { code: "FoM-1", name: "Foundation of Mathematics - 1", faculty: "Mr. Vishwanatha S", room: "215A", type: "Lecture" as const, period: "P1-P2 · 8:45–10:45" },
  { code: "LIB", name: "Library / Self-Study", faculty: "Library In-Charge", room: "Central Library", type: "Lecture" as const, period: "P5 · 1:50–2:50" },
  { code: "E-LEARN", name: "E-Learning & Digital Lab", faculty: "Course Coordinator", room: "Digital Lab", type: "Lecture" as const, period: "P6 · 2:50–3:50" },
  { code: "REMEDIAL", name: "Remedial Class", faculty: "Faculty Mentors", room: "215A", type: "Lecture" as const, period: "P3-P4 · 11:00–1:00" },
  { code: "MM", name: "Mentor & Mentee", faculty: "Dr. Suriya Prakash J", room: "215A", type: "Lecture" as const, period: "P5 · 1:50–2:50" },
  { code: "CA", name: "Club Activity", faculty: "Activity Coordinator", room: "Activity Center", type: "Lecture" as const, period: "P6 · 2:50–3:50" }
];

const SECTION_A_DS_COURSES = [
  { code: "COA", name: "Computer Organization and Architecture", faculty: "Dr. S Annamalai", room: "214B", type: "Lecture" as const, period: "P1 · 8:45–9:45" },
  { code: "DMGT", name: "Discrete Mathematics and Graph Theory", faculty: "Mr. Manohar Kumar K", room: "214B", type: "Lecture" as const, period: "P2 · 9:45–10:45" },
  { code: "PLAC", name: "Placement Training", faculty: "Trainer 6", room: "214B", type: "Lecture" as const, period: "P3-P4 · 11:00–1:00" },
  { code: "OS", name: "Operating Systems", faculty: "Mr. Rajesh Pandian N", room: "214B", type: "Lecture" as const, period: "P1 · 8:45–9:45" },
  { code: "OS", name: "Operating Systems Lab", faculty: "Mr. Rajesh Pandian N", room: "221A", type: "Lab" as const, period: "P5-P6 · 1:50–3:50" },
  { code: "PP", name: "Python Programming", faculty: "Dr. I Ambika", room: "214B", type: "Lecture" as const, period: "P2 · 9:45–10:45" },
  { code: "PP", name: "Python Programming Lab", faculty: "Dr. I Ambika", room: "125B", type: "Lab" as const, period: "P1-P2 · 8:45–10:45" },
  { code: "DT", name: "Design Thinking", faculty: "Dr. John Basha", room: "214B", type: "Lab" as const, period: "P3-P4 · 11:00–1:00" },
  { code: "BE", name: "Biology for Engineers", faculty: "Dr. Rohini", room: "214B", type: "Lecture" as const, period: "P5 · 1:50–2:50" },
  { code: "FOM", name: "Foundation of Mathematics - 1", faculty: "Mr. Vishwanatha S", room: "214B", type: "Lecture" as const, period: "P1-P2 · 8:45–10:45" },
  { code: "MM", name: "Mentoring", faculty: "Prof. Rajesh Pandian N", room: "214B", type: "Lecture" as const, period: "P3 · 11:00–12:00" },
  { code: "LIB", name: "Library / Self-Study", faculty: "Library In-Charge", room: "Central Library", type: "Lecture" as const, period: "P6 · 2:50–3:50" },
  { code: "E-LEARN", name: "E-Learning & Digital Coursework", faculty: "Course Coordinator", room: "Digital Lab", type: "Lecture" as const, period: "P5 · 1:50–2:50" },
  { code: "CA", name: "Club Activities", faculty: "Activity Coordinator", room: "Activity Center", type: "Lecture" as const, period: "P3-P4 · 11:00–1:00" }
];

export function TakeAttendanceDialog({
  isOpen,
  onClose,
  facultyName,
  defaultProgram = "CSE-GEN",
  defaultSemester = "3",
  defaultSection = "F",
  defaultSubject = "Operating Systems",
  defaultSubjectCode = "OS",
  defaultRoom = "215A",
  defaultPeriod = "P1 · 8:45–9:45",
  defaultType = "Lecture",
  onSuccess
}: TakeAttendanceDialogProps) {
  const { user, isAdmin } = useAuth();

  // Session metadata states
  const [program, setProgram] = useState(defaultProgram);
  const [semester, setSemester] = useState(defaultSemester);
  const [section, setSection] = useState(defaultSection);
  const [subject, setSubject] = useState(defaultSubject);
  const [subjectCode, setSubjectCode] = useState(defaultSubjectCode);
  const [room, setRoom] = useState(defaultRoom);
  const [period, setPeriod] = useState(defaultPeriod);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"Lecture" | "Lab">(defaultType);
  const [remarks, setRemarks] = useState("");

  // Check if current class is CSE-GEN 3rd Sem Section F or CSE-DS Section A
  const isCSEGen3F =
    (program === "CSE-GEN" || program === "CSE") &&
    (semester === "3" || semester === "3rd") &&
    (section === "F" || section === "SEC F");

  const isCSEDs3A =
    (program === "DS" || program === "CSE-DS" || program === "CSE_DS") &&
    (semester === "3" || semester === "3rd") &&
    (section === "A" || section === "SEC A");

  const activeCoursesList = isCSEDs3A ? SECTION_A_DS_COURSES : SECTION_F_COURSES;

  // Authorization verification
  const isAuthorized =
    isAdmin ||
    (!isCSEGen3F && !isCSEDs3A) ||
    (isCSEGen3F && (isFacultyAssignedToCSEGen3F(facultyName) || isFacultyAssignedToCSEGen3F(user?.name))) ||
    (isCSEDs3A && (isFacultyAssignedToCSEDs3A(facultyName) || isFacultyAssignedToCSEDs3A(user?.name)));

  // Student list & statuses
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<AttendanceSubmission | null>(null);

  // Load students for current program/semester/section (returns Section F 56 students ONLY when CSE-GEN 3 F)
  const students: Student[] = useMemo(() => {
    return getStudentsForBatch(program, semester, section);
  }, [program, semester, section]);

  // Synchronize on dialog open
  useEffect(() => {
    if (isOpen) {
      setSubmittedRecord(null);
      setProgram(defaultProgram || "CSE-GEN");
      setSemester(defaultSemester || "3");
      setSection(defaultSection || "F");
      setSubject(defaultSubject || "Discrete Mathematics and Graph Theory");
      setSubjectCode(defaultSubjectCode || "M31");
      setRoom(defaultRoom || "202 [AC] Room");
      setPeriod(defaultPeriod || "P6 · 1:20–2:10");
      setType(defaultType || "Lecture");
      setDate(new Date().toISOString().split("T")[0]);
      setRemarks("");
      setSearchQuery("");
    }
  }, [isOpen, defaultProgram, defaultSemester, defaultSection, defaultSubject, defaultSubjectCode, defaultRoom, defaultPeriod, defaultType]);

  // Update attendanceMap whenever students change
  useEffect(() => {
    const initialMap: Record<string, { status: AttendanceStatus; notes?: string }> = {};
    students.forEach((s) => {
      initialMap[s.usn] = { status: "P" };
    });
    setAttendanceMap(initialMap);
  }, [students]);

  // Filtered student list for search
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Computed summary metrics
  const stats = useMemo(() => {
    const total = students.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    students.forEach((s) => {
      const entry = attendanceMap[s.usn];
      const st = entry?.status || "P";
      if (st === "P") present++;
      else if (st === "A") absent++;
      else if (st === "L") {
        late++;
        present++; // Late counts towards present in percentage
      } else if (st === "OD") {
        excused++;
        present++; // On-duty counts towards present
      }
    });

    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, absent, late, excused, percentage };
  }, [students, attendanceMap]);

  // Bulk actions
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; notes?: string }> = {};
    students.forEach((s) => {
      updated[s.usn] = { status };
    });
    setAttendanceMap(updated);
  };

  const handleSetStudentStatus = (usn: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [usn]: { ...prev[usn], status }
    }));
  };

  // Helper to compile current attendance state into an AttendanceSubmission object
  const getCurrentSubmissionDraft = (): AttendanceSubmission => {
    const entries: StudentAttendanceEntry[] = students.map((s) => ({
      usn: s.usn,
      name: s.name,
      status: attendanceMap[s.usn]?.status || "P",
      notes: attendanceMap[s.usn]?.notes
    }));

    return {
      id: `att-${program}-${semester}-${section}-${Date.now()}`,
      program,
      semester,
      section,
      subject,
      subjectCode,
      faculty: facultyName || "Faculty Instructor",
      room,
      date,
      period,
      type,
      students: entries,
      totalCount: stats.total,
      presentCount: stats.present,
      absentCount: stats.absent,
      lateCount: stats.late,
      excusedCount: stats.excused,
      attendancePercentage: stats.percentage,
      submittedAt: new Date().toISOString(),
      remarks: remarks || `Session attendance recorded by ${facultyName}`
    };
  };

  // 1-Click Hourly CSV Download (can be clicked anytime, even before submitting)
  const handleExportCurrentCSV = () => {
    const draft = getCurrentSubmissionDraft();
    downloadHourlyAttendanceCSV(draft);
    toast.success("Hourly Attendance CSV Generated", {
      description: `Downloaded attendance file for ${subjectCode} (${period}) · ${stats.present} / ${stats.total} Present (${stats.percentage}%).`
    });
  };

  // 1-Click Hourly Official Sheet Print (can be clicked anytime)
  const handlePrintCurrentSheet = () => {
    const draft = getCurrentSubmissionDraft();
    printHourlyAttendanceSheet(draft);
  };

  const handleSubmit = () => {
    if (isCSEGen3F && !isAuthorized) {
      toast.error("Unauthorized Attendance Submission", {
        description: "Only faculties officially assigned to CSE-GEN Section-F 3rd Semester (or Administrators) are authorized to submit attendance for this class."
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newSubmission = getCurrentSubmissionDraft();
      saveAttendanceSubmission(newSubmission);
      setIsSubmitting(false);
      setSubmittedRecord(newSubmission);

      toast.success("Attendance Sent to Portal!", {
        description: `Recorded ${stats.present} / ${stats.total} present (${stats.percentage}%) for ${program} S${semester} (${section}).`,
        action: {
          label: "📥 Download CSV",
          onClick: () => {
            downloadHourlyAttendanceCSV(newSubmission);
          }
        }
      });

      if (onSuccess) {
        onSuccess(newSubmission);
      }
    }, 350);
  };

  // Post-Submission Confirmation Screen
  if (submittedRecord) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg bg-[#fffdf7] border-[#ded9cc] text-[#25252c] shadow-2xl p-6">
          <div className="text-center py-3">
            <div className="w-16 h-16 bg-[#eaf6ef] text-[#247c50] rounded-full flex items-center justify-center mx-auto mb-3.5 border-2 border-[#bbf0cf] shadow-xs">
              <CheckCircle2 size={34} />
            </div>
            <h3 className="font-serif text-2xl text-[#262a68] mb-1 font-bold">
              Attendance Recorded!
            </h3>
            <p className="text-xs text-[#6e6a75] max-w-sm mx-auto mb-4">
              Session attendance for <strong>{submittedRecord.subjectCode} · {submittedRecord.period}</strong> was saved and synced live with the Institutional Attendance Portal.
            </p>

            <div className="p-3.5 bg-[#faf8f2] border border-[#e2ddd1] rounded-lg text-left text-xs mb-5 space-y-1.5">
              <div className="flex justify-between items-center pb-1 border-b border-[#ece8dd]">
                <span className="text-[#7c7982] font-medium">Course & Type:</span>
                <strong className="text-[#252b67]">{submittedRecord.subject} ({submittedRecord.type})</strong>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-[#ece8dd]">
                <span className="text-[#7c7982] font-medium">Faculty & Venue:</span>
                <strong className="text-[#252b67]">{submittedRecord.faculty.split(" - ")[0]} · {submittedRecord.room}</strong>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-[#ece8dd]">
                <span className="text-[#7c7982] font-medium">Batch & Period:</span>
                <strong className="text-[#252b67]">{submittedRecord.program} S{submittedRecord.semester} ({submittedRecord.section}) · {submittedRecord.period}</strong>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-[#7c7982] font-medium">Final Turnout:</span>
                <span className="font-bold text-[#15803d]">
                  {submittedRecord.presentCount} / {submittedRecord.totalCount} Present ({submittedRecord.attendancePercentage}%)
                </span>
              </div>
            </div>

            {/* Teacher Print / Download CSV actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center mb-3">
              <Button
                type="button"
                onClick={() => {
                  downloadHourlyAttendanceCSV(submittedRecord);
                  toast.success("Hourly CSV Downloaded!", {
                    description: `Attendance_${submittedRecord.subjectCode}_${submittedRecord.period.split(" · ")[0]}_${submittedRecord.date}.csv`
                  });
                }}
                className="h-10 text-xs bg-[#33409a] hover:bg-[#252b67] text-white gap-2 font-semibold shadow-xs flex-1"
              >
                <Download size={15} />
                <span>Download Hourly CSV</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => printHourlyAttendanceSheet(submittedRecord)}
                className="h-10 text-xs border-[#d5d0c2] text-[#252b67] hover:bg-white gap-2 font-semibold flex-1"
              >
                <Printer size={15} />
                <span>Print Official Sheet</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs text-[#7c7982] hover:text-[#252b67]"
            >
              Done / Close Window
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-[#fffdf7] border-[#ded9cc] text-[#25252c] shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#858286] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#33409a]" />
              {isCSEGen3F
                ? "OFFICIAL ATTENDANCE DESK · CSE-GEN S3 (SECTION F)"
                : `ATTENDANCE DESK · ${program} S${semester} (${section})`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCurrentCSV}
                className="h-7 text-[11px] border-[#d8d4c7] text-[#252b67] hover:bg-[#faf8f2] gap-1 px-2.5 font-medium"
                title="Download CSV for this hour's attendance"
              >
                <Download size={12} className="text-[#33409a]" />
                <span>Export CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintCurrentSheet}
                className="h-7 text-[11px] border-[#d8d4c7] text-[#555259] hover:bg-[#faf8f2] gap-1 px-2.5 hidden sm:flex font-medium"
                title="Print attendance sheet for this hour"
              >
                <Printer size={12} />
                <span>Print</span>
              </Button>
              <Badge className="bg-[#252b67] text-white border-0 text-[10px] px-2 py-0.5">
                {students.length} Enrolled Students {isCSEGen3F ? "· Section F" : ""}
              </Badge>
            </div>
          </div>
          <DialogTitle className="font-serif text-2xl text-[#262a68] mt-1">
            Capture Class Session Attendance
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77747a]">
            {isCSEGen3F
              ? "Mark student attendance for CSE-GEN Section F (3rd Semester). All entries are transmitted live to the Attendance Section Portal."
              : `Mark student attendance for ${program} Semester ${semester} Section ${section}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Permission status banner */}
        {isCSEGen3F && !isAuthorized ? (
          <div className="mt-2 p-3 bg-[#fdf2f0] rounded-md border border-[#f5c6cb] flex items-start gap-2.5 text-xs text-[#b93222]">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Attendance Permission Restricted</strong>
              <p className="mt-0.5 text-[11px] text-[#842029]">
                Only faculties officially assigned to <strong>CSE-GEN Section-F (3rd Semester)</strong> or Administrators are authorized to take attendance for this batch. Active account: <em>{user?.name || facultyName}</em>.
              </p>
            </div>
          </div>
        ) : isCSEGen3F ? (
          <div className="mt-1 p-2.5 bg-[#eef0fb] rounded-md border border-[#cfd6f5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#252b67]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#e3a62f] text-[#252b67] font-extrabold text-[10px] tracking-wide">
                CSE-GEN 3RD SEM · SEC F
              </span>
              <span className="font-semibold text-[#252b67]">
                Official 3rd Semester Class Roster
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#434e85]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2da46a]" />
              <span>56 Enrolled Students (25BTRGA000 – 25BTRGA088)</span>
            </div>
          </div>
        ) : null}

        {/* Session Metadata Row */}
        <div className="mt-2 p-3 bg-[#f5f1e6] rounded-md border border-[#e5dfd2] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#7e7a83] block mb-1">Target Class</span>
            <div className="flex items-center gap-1 font-semibold text-[#292830]">
              <UsersRound size={13} className="text-[#33409a]" />
              <span className="bg-[#252b67] text-white px-2 py-0.5 rounded text-[11px] font-bold">
                {program} · S{semester} ({section})
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#7e7a83] block mb-1">Course Subject</span>
            <select
              value={subjectCode}
              onChange={(e) => {
                const selectedCode = e.target.value;
                const found = activeCoursesList.find((c) => c.code === selectedCode);
                if (found) {
                  setSubjectCode(found.code);
                  setSubject(found.name);
                  setRoom(found.room);
                  setType(found.type);
                  setPeriod(found.period);
                } else {
                  setSubjectCode(selectedCode);
                }
              }}
              className="w-full bg-white border border-[#d8d3c5] rounded px-1.5 py-1 text-xs font-semibold text-[#292830] focus:outline-none focus:border-[#33409a]"
            >
              {activeCoursesList.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
              {!activeCoursesList.some((c) => c.code === subjectCode) && (
                <option value={subjectCode}>{subjectCode} · {subject}</option>
              )}
            </select>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#7e7a83] block mb-1">Date & Period</span>
            <div className="flex items-center gap-1 text-[#423f46]">
              <Calendar size={12} className="text-[#33409a]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-[#d8d3c5] rounded px-1.5 py-0.5 font-medium text-xs focus:outline-none focus:border-[#33409a]"
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#7e7a83] block mb-1">Instructor / Room</span>
            <span className="block text-[#423f46] font-medium truncate" title={`${facultyName} in ${room}`}>
              {facultyName.split(" - ")[0]} · {room}
            </span>
          </div>
        </div>

        {/* Live Metrics & Quick Mark Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-y border-[#ede8dd] my-1">
          {/* Metrics summary */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2da46a]" />
              <span className="text-[#555259]">Present:</span>
              <strong className="text-[#2da46a]">{stats.present}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cf3d2c]" />
              <span className="text-[#555259]">Absent:</span>
              <strong className="text-[#cf3d2c]">{stats.absent}</strong>
            </div>
            {stats.late > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d99616]" />
                <span className="text-[#555259]">Late:</span>
                <strong className="text-[#d99616]">{stats.late}</strong>
              </div>
            )}
            <div className="pl-2 border-l border-[#d8d3c5]">
              <span className="text-[#555259]">Turnout:</span>
              <strong className={`ml-1 font-semibold ${stats.percentage >= 75 ? "text-[#2da46a]" : "text-[#cf3d2c]"}`}>
                {stats.percentage}%
              </strong>
            </div>
          </div>

          {/* Bulk quick actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll("P")}
              className="h-7 text-xs border-[#bde2cb] text-[#247c50] hover:bg-[#eef8f2]"
            >
              <CheckCircle2 size={12} className="mr-1" /> All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll("A")}
              className="h-7 text-xs border-[#f3c1bc] text-[#b83525] hover:bg-[#fdf2f1]"
            >
              <XCircle size={12} className="mr-1" /> All Absent
            </Button>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-[#8c8892]" />
          <Input
            type="text"
            placeholder="Filter roster by student USN or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-white border-[#d8d3c5] focus:border-[#33409a]"
          />
        </div>

        {/* Student Roster Table */}
        <div className="border border-[#e2ddd1] rounded-md overflow-hidden bg-white max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#faf7ef] border-b border-[#e2ddd1] text-[#5e5a63] uppercase text-[10px] tracking-wider z-10">
              <tr>
                <th className="py-2 px-3 w-12 text-center">#</th>
                <th className="py-2 px-3 w-32">USN</th>
                <th className="py-2 px-3">Student Name</th>
                <th className="py-2 px-3 w-56 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeebe3]">
              {filteredStudents.map((s, idx) => {
                const currentStatus = attendanceMap[s.usn]?.status || "P";

                return (
                  <tr
                    key={s.usn}
                    className={`hover:bg-[#fbf9f4] transition ${
                      currentStatus === "A" ? "bg-[#fdf6f5]" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-[#8e8a93] font-mono text-[11px] font-semibold">
                      {s.sNo !== undefined ? s.sNo : idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-xs text-[#252b67] tracking-wider">
                      {s.usn}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-xs text-[#1e1d24] uppercase tracking-wide">
                      {s.name}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex items-center rounded-md border border-[#d8d4c7] p-0.5 bg-[#f7f5ee] gap-0.5">
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(s.usn, "P")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            currentStatus === "P"
                              ? "bg-[#2da46a] text-white shadow-xs"
                              : "text-[#58555e] hover:bg-white"
                          }`}
                          title="Present"
                        >
                          P
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(s.usn, "A")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            currentStatus === "A"
                              ? "bg-[#cf3d2c] text-white shadow-xs"
                              : "text-[#58555e] hover:bg-white"
                          }`}
                          title="Absent"
                        >
                          A
                        </button>

                        {/* Late */}
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(s.usn, "L")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            currentStatus === "L"
                              ? "bg-[#d99616] text-white shadow-xs"
                              : "text-[#58555e] hover:bg-white"
                          }`}
                          title="Late"
                        >
                          L
                        </button>

                        {/* Excused / On-Duty */}
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(s.usn, "OD")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                            currentStatus === "OD"
                              ? "bg-[#33409a] text-white shadow-xs"
                              : "text-[#58555e] hover:bg-white"
                          }`}
                          title="On-Duty / Excused"
                        >
                          OD
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Optional Session Remarks */}
        <div>
          <label className="block text-[11px] font-semibold text-[#666368] mb-1">
            Session Academic Remarks / Topics Covered (Optional)
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Conducted computational module test. Chapter 2 problem solving completed."
            className="h-8 text-xs bg-white border-[#d8d3c5]"
          />
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-[#e8e4da] pt-4 mt-2">
          <div className="text-xs text-[#7a767f]">
            Recording as: <strong className="text-[#33409a]">{facultyName}</strong>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCurrentCSV}
              className="text-xs h-9 border-[#33409a] text-[#33409a] hover:bg-[#eef0fb] gap-1.5 font-medium"
              title="Download CSV file for this hour's attendance"
            >
              <Download size={13} />
              <span>Download Hourly CSV</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePrintCurrentSheet}
              className="text-xs h-9 border-[#d8d4c7] text-[#555259] hover:bg-[#faf8f2] gap-1.5 font-medium hidden sm:flex"
              title="Print official attendance sheet for this hour"
            >
              <Printer size={13} />
              <span>Print Sheet</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 border-[#d8d4c7] text-[#555258]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || (isCSEGen3F && !isAuthorized)}
              onClick={handleSubmit}
              className={`text-xs h-9 gap-1.5 px-4 shadow-md font-medium text-white transition ${
                isCSEGen3F && !isAuthorized
                  ? "bg-[#9b97a2] cursor-not-allowed hover:bg-[#9b97a2] opacity-70"
                  : "bg-[#33409a] hover:bg-[#252b67]"
              }`}
              title={
                isCSEGen3F && !isAuthorized
                  ? "Only faculties assigned to CSE-GEN Section-F 3rd Sem (or Admin) can submit attendance"
                  : "Submit & Send to Attendance Portal"
              }
            >
              {isCSEGen3F && !isAuthorized ? <Lock size={13} /> : <Send size={13} />}
              {isSubmitting
                ? "Transmitting..."
                : isCSEGen3F && !isAuthorized
                ? "Unauthorized Faculty"
                : "Submit & Send to Attendance Portal"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
