/**
 * AdminChatbot.tsx
 *
 * A conversational AI assistant panel for the Campus Ledger Admin Studio.
 * Allows administrators to:
 *  1. Interactive Timetable Scheduling (Year/Sem, Day/Slot, Subject, Teacher, Room)
 *  2. Add & Remove Faculty data with instant live authentication & department records
 *  3. Add & Remove Student data with instant live roster enrollment & 2FA authentication
 *  4. Manage room issues, publish drafts, and query active schedules
 *
 * Everything is handled conversationally inside the chatbot with interactive action chips!
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Minimize2,
  Maximize2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Trash2,
  FileEdit,
  Zap,
  HelpCircle,
  CalendarDays,
  GraduationCap,
  BookOpen,
  UserCheck,
  Building,
  ArrowRight,
  UserPlus,
  UserMinus,
  Users,
  KeyRound
} from "lucide-react";
import { toast } from "sonner";
import {
  loadClassSchedule,
  saveDraftSession,
  removeDraftSession,
  publishClassSchedule,
  revertDraftToPublished,
  resetClassScheduleToDefault,
  DAYS,
  PALETTE,
  Session,
  getAcademicYearFromSemester
} from "@/lib/timetableStore";
import {
  loadRoomwareIssues,
  updateIssueStatus,
  reportRoomIssue,
  saveRoomwareIssues,
  type IssueStatus,
  type IssueCategory,
  type IssueSeverity
} from "@/lib/roomwareStore";
import {
  collegeBatches,
  collegePrograms,
  collegeFacultyNames,
  collegeSubjects,
  semestersFor,
  sectionsFor
} from "@/data/collegeData";
import {
  loadAllFaculty,
  addFacultyRecord,
  removeFacultyRecord,
  assignFacultySpecialCode,
  type FacultyAuthRecord
} from "@/data/facultyAuthData";
import {
  loadAllStudents,
  addStudentRecord,
  addMultipleStudents,
  removeStudentRecord,
  getStudentRegisteredPhone,
  type Student
} from "@/data/studentsData";

/* ─────────────── TYPES ─────────────── */

type MsgRole = "user" | "assistant" | "system";

export interface ChatAction {
  label: string;
  value?: string;
  variant?: "primary" | "secondary" | "danger" | "amber";
  fn?: () => void;
}

export interface ChatMsg {
  id: string;
  role: MsgRole;
  text: string;
  ts: Date;
  status?: "ok" | "error" | "warning" | "info";
  actions?: ChatAction[];
}

export interface AdminChatbotProps {
  program: string;
  semester: string;
  section: string;
  adminName?: string;
  onDataChange?: () => void;
  onClassSwitch?: (program: string, semester: string, section: string) => void;
}

// Multi-turn Wizard state
export type WizardMode =
  | "idle"
  | "schedule_year_sem"
  | "schedule_day_slot"
  | "schedule_subject"
  | "schedule_teacher"
  | "schedule_room_type"
  | "faculty_add_dept"
  | "faculty_add_name"
  | "faculty_add_phone"
  | "faculty_add_code"
  | "faculty_remove_select"
  | "faculty_assign_code_select"
  | "faculty_assign_code_input"
  | "student_add_target"
  | "student_add_input"
  | "student_add_name"
  | "student_add_usn"
  | "student_add_class"
  | "student_add_phone"
  | "student_remove_select";

export interface ScheduleWizardDraft {
  program: string;
  semester: string;
  section: string;
  day?: string;
  slot?: number;
  subject?: string;
  code?: string;
  faculty?: string;
  room?: string;
  type?: "Lecture" | "Lab" | "Tutorial" | "Seminar";
}

export interface FacultyWizardDraft {
  name?: string;
  department?: string;
  phone?: string;
  specialCode?: string;
  designation?: string;
}

export interface StudentWizardDraft {
  academicYear?: string;
  name?: string;
  usn?: string;
  program?: string;
  semester?: string;
  section?: string;
  phone?: string;
}

/* ─────────────── HELPERS ─────────────── */

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const DAY_ALIASES: Record<string, string> = {
  mon: "Monday", monday: "Monday",
  tue: "Tuesday", tuesday: "Tuesday",
  wed: "Wednesday", wednesday: "Wednesday",
  thu: "Thursday", thursday: "Thursday",
  fri: "Friday", friday: "Friday",
  sat: "Saturday", saturday: "Saturday",
};

const SLOT_ALIASES: Record<string, number> = {
  "p1": 0, "slot1": 0, "period1": 0, "1st": 0, "first": 0, "p 1": 0,
  "p2": 1, "slot2": 1, "period2": 1, "2nd": 1, "second": 1, "p 2": 1,
  "p3": 2, "slot3": 2, "period3": 2, "3rd": 2, "third": 2, "p 3": 2,
  "p4": 3, "slot4": 3, "period4": 3, "4th": 3, "fourth": 3, "p 4": 3,
  "p5": 4, "slot5": 4, "period5": 4, "5th": 4, "fifth": 4, "p 5": 4,
  "p6": 5, "slot6": 5, "period6": 5, "6th": 5, "sixth": 5, "p 6": 5,
  "p7": 6, "slot7": 6, "period7": 6, "7th": 6, "seventh": 6, "p 7": 6,
  "p8": 7, "slot8": 7, "period8": 7, "8th": 7, "eighth": 7, "p 8": 7,
};

function parseDay(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [alias, day] of Object.entries(DAY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(lower)) return day;
  }
  return null;
}

function parseSlot(text: string): number | null {
  const lower = text.toLowerCase();
  for (const [alias, slot] of Object.entries(SLOT_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(lower)) return slot;
  }
  const numMatch = text.match(/(?:slot|period|p)\s*(\d)/i);
  if (numMatch) return parseInt(numMatch[1], 10) - 1;
  return null;
}

function parseClass(text: string): { program?: string; semester?: string; section?: string } {
  const result: { program?: string; semester?: string; section?: string } = {};

  const programMatch = text.match(/\b(CSE-GEN|CSE-DS|CSE-AIML|AIML|DS|AIDE|CSE|MCA|MBA|SE|AI-DevOPS|ECE|MECH|CIVIL)\b/i);
  if (programMatch) result.program = programMatch[1].toUpperCase();

  const semMatch = text.match(/(?:sem(?:ester)?\s*(\d)|(\d)(?:st|nd|rd|th)\s*sem)/i);
  if (semMatch) result.semester = semMatch[1] || semMatch[2];

  const secMatch = text.match(/(?:sec(?:tion)?\s*([A-Z])|\b([A-Z])\s*section)/i);
  if (secMatch) result.section = (secMatch[1] || secMatch[2]).toUpperCase();

  return result;
}

function parseAcademicYearAndClass(
  text: string,
  defaultProgram: string,
  defaultSemester: string,
  defaultSection: string
): {
  academicYear: string;
  program: string;
  semester: string;
  section: string;
} {
  const upper = text.toUpperCase();
  let prog = defaultProgram;
  let sem = defaultSemester;
  let sec = defaultSection;

  // Program / Branch matching
  const progMatch = upper.match(/\b(CSE-GEN|CSE-DS|CSE-AIML|AIDE|AIML|CSE|DS|ECE|MECH|CIVIL|MCA|MBA|SE)\b/i);
  if (progMatch) {
    prog = progMatch[1].toUpperCase();
    if (prog === "CSE") prog = "CSE-GEN";
  }

  // Academic Year / Semester matching
  if (/\b(1ST\s*YEAR|FIRST\s*YEAR|FRESHMEN|FRESHMAN|NEW\s*ACADEMIC\s*YEAR|AY\s*2026|AY\s*2027|2026-27|2027-28)\b/i.test(upper)) {
    sem = "1";
  } else if (/\b(2ND\s*YEAR|SECOND\s*YEAR|SOPHOMORE)\b/i.test(upper)) {
    sem = "3";
  } else if (/\b(3RD\s*YEAR|THIRD\s*YEAR|JUNIOR)\b/i.test(upper)) {
    sem = "5";
  } else if (/\b(4TH\s*YEAR|FOURTH\s*YEAR|SENIOR)\b/i.test(upper)) {
    sem = "7";
  }

  const semMatch = upper.match(/(?:SEM(?:ESTER)?\s*([1-8])|([1-8])(?:ST|ND|RD|TH)\s*SEM|\bS([1-8])\b)/i);
  if (semMatch) {
    sem = semMatch[1] || semMatch[2] || semMatch[3];
  } else {
    const directMatch = upper.match(/\b(?:CSE-GEN|CSE-DS|AIDE|ECE|MECH|CIVIL)\s+([1-8])\b/i);
    if (directMatch) sem = directMatch[1];
  }

  // Section matching
  const secMatch = upper.match(/(?:SEC(?:TION)?\s*([A-H])|\b([A-H])\s*SECTION|\bS[1-8]\s*([A-H])\b)/i);
  if (secMatch) {
    sec = (secMatch[1] || secMatch[2] || secMatch[3]).toUpperCase();
  } else {
    const spaceSec = upper.match(/\b[1-8]\s+([A-H])\b/);
    if (spaceSec) {
      sec = spaceSec[1];
    } else {
      const joined = upper.match(/\b[1-8]([A-H])\b/);
      if (joined) sec = joined[1];
    }
  }

  const academicYear = getAcademicYearFromSemester(sem);
  return { academicYear, program: prog, semester: sem, section: sec };
}

function parseStudentEntries(
  input: string,
  targetProgram: string,
  targetSemester: string,
  targetSection: string
): Student[] {
  let rawItems = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawItems.length === 1 && rawItems[0].includes(",")) {
    rawItems = rawItems[0].split(",").map((s) => s.trim()).filter(Boolean);
  }

  const allExisting = loadAllStudents();
  const existingUSNSet = new Set(allExisting.map((s) => s.usn.toUpperCase().trim()));

  const progCode = (targetProgram || "CSE").replace(/[^A-Z]/gi, "").slice(0, 4).toUpperCase();
  const yrPrefix = parseInt(targetSemester, 10) <= 2 ? "26BT" : "25BT";

  const students: Student[] = [];
  let autoSeq = 1;

  for (const item of rawItems) {
    const usnMatch = item.match(/\b([0-9]{2}[A-Z0-9]{5,10})\b/i);
    let usn = "";
    let name = "";

    if (usnMatch) {
      usn = usnMatch[1].toUpperCase();
      name = item.replace(usnMatch[0], "").replace(/[-–—:,]/g, " ").trim();
    } else {
      name = item.replace(/^[0-9]+[.)]\s*/, "").trim();
    }

    if (!name && usn) {
      name = `STUDENT ${usn}`;
    }

    name = name.replace(/\s+/g, " ").trim();
    if (!name) continue;

    if (!usn) {
      while (autoSeq <= 999) {
        const candidate = `${yrPrefix}${progCode}${String(autoSeq).padStart(3, "0")}`;
        if (!existingUSNSet.has(candidate) && !students.some((s) => s.usn === candidate)) {
          usn = candidate;
          break;
        }
        autoSeq++;
      }
      if (!usn) {
        usn = `${yrPrefix}${progCode}${Date.now().toString().slice(-4)}`;
      }
    }

    students.push({
      sNo: allExisting.length + students.length + 1,
      usn: usn.toUpperCase(),
      name: name.toUpperCase(),
      program: targetProgram,
      semester: targetSemester,
      section: targetSection,
      phone: getStudentRegisteredPhone(usn)
    });
  }

  return students;
}

/* ─────────────── COMPONENT ─────────────── */

export function AdminChatbot({
  program,
  semester,
  section,
  adminName = "Master Admin",
  onDataChange,
  onClassSwitch,
}: AdminChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Mode and draft states
  const [mode, setMode] = useState<WizardMode>("idle");
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleWizardDraft>({ program, semester, section });
  const [facultyDraft, setFacultyDraft] = useState<FacultyWizardDraft>({});
  const [studentDraft, setStudentDraft] = useState<StudentWizardDraft>({});
  const [assignCodeDraft, setAssignCodeDraft] = useState<{ facultyId?: string; facultyName?: string; phone?: string; currentCode?: string }>({});

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uid(),
      role: "assistant",
      text: `👋 Hello **${adminName}**! I am your **Master Admin AI Controller**.\n\nEverything in the portal can be managed directly here in the chat:\n• ⚡ **Interactive Class Scheduling** (Year, Slot, Subject, Teacher, Room)\n• 👨‍🏫 **Add & Remove Faculty Members** (Instant portal credentials & assignments)\n• 🎓 **Add & Remove Students** (Instant roster enrollment & 2FA mobile sign-in)\n• 🔧 **Campus Facility & Roomware Operations** (Verified Session Faults & Universal Resolution)\n• 🔑 **Feature 5: Assign Special Code to Teachers** (Teachers must log in with this assigned code ONLY)\n\nPick a quick action below or type any command!`,
      ts: new Date(),
      status: "info"
    }
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addMsg = useCallback((partial: Partial<ChatMsg>) => {
    const msg: ChatMsg = {
      id: uid(),
      role: partial.role || "assistant",
      text: partial.text || "",
      ts: new Date(),
      status: partial.status,
      actions: partial.actions,
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (mode === "idle") {
      setScheduleDraft((prev) => ({ ...prev, program, semester, section }));
    }
  }, [program, semester, section, mode]);

  const cancelFlow = useCallback(() => {
    setMode("idle");
    setFacultyDraft({});
    setStudentDraft({});
    setAssignCodeDraft({});
    setScheduleDraft({ program, semester, section });
    addMsg({
      text: "❌ Action cancelled. How else can I assist you?",
      status: "info"
    });
  }, [program, semester, section, addMsg]);

  /* ─────────────── 1. TIMETABLE SCHEDULING FLOW ─────────────── */

  const startScheduleFlow = useCallback((initial?: Partial<ScheduleWizardDraft>) => {
    const p = initial?.program || program;
    const s = initial?.semester || semester;
    const sec = initial?.section || section;
    const yr = getAcademicYearFromSemester(s);

    setScheduleDraft({ program: p, semester: s, section: sec, ...initial });
    setMode("schedule_year_sem");

    addMsg({
      text: `🎓 **Step 1/5: Academic Year & Semester**\n\nWhich program, year, and semester would you like to update?\n• Current: **${p} · ${yr} · Sem ${s} · Sec ${sec}**`,
      status: "info",
      actions: [
        {
          label: `✅ Keep Current (${p} S${s} ${sec})`,
          variant: "primary",
          fn: () => handleScheduleYearSem(`${p} ${s} ${sec}`)
        },
        { label: "CSE-GEN · 2nd Year (Sem 3) · Sec F", fn: () => handleScheduleYearSem("CSE-GEN 3 F") },
        { label: "CSE-DS · 2nd Year (Sem 3) · Sec A", fn: () => handleScheduleYearSem("CSE-DS 3 A") },
        { label: "AIDE · 1st Year (Sem 1) · Sec A", fn: () => handleScheduleYearSem("AIDE 1 A") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  }, [program, semester, section, addMsg, cancelFlow]);

  const handleScheduleYearSem = (text: string) => {
    addMsg({ role: "user", text });
    let p = scheduleDraft.program || program;
    let s = scheduleDraft.semester || semester;
    let sec = scheduleDraft.section || section;

    const parsed = parseClass(text);
    if (parsed.program) p = parsed.program;
    if (parsed.semester) s = parsed.semester;
    if (parsed.section) sec = parsed.section;

    const updated = { ...scheduleDraft, program: p, semester: s, section: sec };
    setScheduleDraft(updated);
    setMode("schedule_day_slot");

    addMsg({
      text: `⏰ **Step 2/5: Day & Slot / Period**\n\nSelected: **${p} S${s} Sec ${sec}**\nWhich **Day** and **Period (P1–P8)** should this session be scheduled on?`,
      status: "info",
      actions: [
        { label: "Monday P1 (8:45)", fn: () => handleScheduleDaySlot("Monday P1") },
        { label: "Monday P2 (9:45)", fn: () => handleScheduleDaySlot("Monday P2") },
        { label: "Monday P3 (11:00)", fn: () => handleScheduleDaySlot("Monday P3") },
        { label: "Tuesday P2 (9:45)", fn: () => handleScheduleDaySlot("Tuesday P2") },
        { label: "Wednesday P4 (12:00)", fn: () => handleScheduleDaySlot("Wednesday P4") },
        { label: "Thursday P1 (8:45)", fn: () => handleScheduleDaySlot("Thursday P1") },
        { label: "Friday P5 (1:50)", fn: () => handleScheduleDaySlot("Friday P5") },
        { label: "Saturday P2 (9:45)", fn: () => handleScheduleDaySlot("Saturday P2") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const handleScheduleDaySlot = (text: string) => {
    addMsg({ role: "user", text });
    const day = parseDay(text) || scheduleDraft.day || "Monday";
    const slot = parseSlot(text) !== null ? parseSlot(text)! : (scheduleDraft.slot ?? 0);

    const updated = { ...scheduleDraft, day, slot };
    setScheduleDraft(updated);
    setMode("schedule_subject");

    const sampleSubjects = [
      { name: "Operating Systems", code: "OS" },
      { name: "Python Programming", code: "PP" },
      { name: "Design Thinking", code: "DT" },
      { name: "Data Structures & Algorithms", code: "DSA" },
      { name: "Computer Architecture", code: "COA" },
      { name: "Discrete Mathematics", code: "DM" }
    ];

    addMsg({
      text: `📚 **Step 3/5: Subject Name & Code**\n\nSlot: **${day} · Period P${slot + 1}**\nWhat **Subject** will be taught? Pick a suggestion or type any subject name:`,
      status: "info",
      actions: [
        ...sampleSubjects.map((sub) => ({
          label: `${sub.name} (${sub.code})`,
          fn: () => handleScheduleSubject(`${sub.name} (${sub.code})`)
        })),
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const handleScheduleSubject = (text: string) => {
    addMsg({ role: "user", text });
    let subject = text.trim();
    let code = "SUB";

    const match = text.match(/^(.+?)\s*\(([A-Za-z0-9_-]+)\)$/);
    if (match) {
      subject = match[1].trim();
      code = match[2].trim().toUpperCase();
    } else {
      const words = subject.split(/\s+/);
      code = words.length > 1 ? words.map((w) => w[0]).join("").toUpperCase() : subject.substring(0, 4).toUpperCase();
    }

    const updated = { ...scheduleDraft, subject, code };
    setScheduleDraft(updated);
    setMode("schedule_teacher");

    // Load registered faculty from dynamic store
    const registered = loadAllFaculty().slice(0, 6);

    addMsg({
      text: `👨‍🏫 **Step 4/5: Subject Teacher / Faculty**\n\nSubject: **${subject}** (${code})\n**Who will handle this class?** Choose a faculty or type any teacher's name:`,
      status: "info",
      actions: [
        ...registered.map((f) => ({
          label: f.name,
          fn: () => handleScheduleTeacher(f.name)
        })),
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const handleScheduleTeacher = (text: string) => {
    addMsg({ role: "user", text });
    const faculty = text.trim();
    const updated = { ...scheduleDraft, faculty };
    setScheduleDraft(updated);
    setMode("schedule_room_type");

    const defaultRoom = updated.program === "CSE-GEN" ? "215A" : updated.program === "CSE-DS" ? "214B" : "105";

    addMsg({
      text: `🏛️ **Step 5/5: Classroom / Lab & Class Type**\n\nTeacher: **${faculty}**\nWhich **Classroom** will host this session, and is it a Lecture or Lab?`,
      status: "info",
      actions: [
        { label: `Room ${defaultRoom} · Lecture`, variant: "primary", fn: () => finalizeSchedule(`Room ${defaultRoom} Lecture`) },
        { label: "Room 215A · Lecture", fn: () => finalizeSchedule("Room 215A Lecture") },
        { label: "Room 214B · Lecture", fn: () => finalizeSchedule("Room 214B Lecture") },
        { label: `Lab ${defaultRoom} · Practical Lab`, fn: () => finalizeSchedule(`Lab ${defaultRoom} Lab`) },
        { label: "Lab 102 · Practical Lab", fn: () => finalizeSchedule("Lab 102 Lab") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const finalizeSchedule = (text: string) => {
    addMsg({ role: "user", text });
    const isLab = /\b(lab|practical|studio)\b/i.test(text);
    const roomMatch = text.match(/(?:room|lab)?\s*([0-9]{3}[A-Za-z]?|[A-Za-z]-[0-9]+)/i);
    const room = roomMatch ? roomMatch[1] : (scheduleDraft.program === "CSE-GEN" ? "215A" : "214B");

    const p = scheduleDraft.program;
    const s = scheduleDraft.semester;
    const sec = scheduleDraft.section;
    const day = scheduleDraft.day || "Monday";
    const slot = scheduleDraft.slot ?? 0;
    const subject = scheduleDraft.subject || "Lecture";
    const code = scheduleDraft.code || "LEC";
    const faculty = scheduleDraft.faculty || "Faculty In-Charge";
    const type = isLab ? "Lab" : "Lecture";

    const newSession: Session = {
      id: `sess-${p}-${s}-${sec}-${day.substring(0, 3)}-${slot}-${uid()}`,
      day,
      slot,
      subject,
      code,
      faculty,
      room,
      batch: `${p} · S${s} · ${sec}`,
      type,
      color: isLab ? PALETTE.red : PALETTE.indigo,
      note: `Scheduled via Admin Chatbot by ${adminName}`
    };

    saveDraftSession(p, s, sec, newSession);
    publishClassSchedule(p, s, sec, adminName, `Updated: ${subject} (${faculty}) on ${day} P${slot + 1}`);

    if (p !== program || s !== semester || sec !== section) {
      onClassSwitch?.(p, s, sec);
    }
    onDataChange?.();

    toast.success("Timetable Updated & Published Live!");
    setMode("idle");

    const yr = getAcademicYearFromSemester(s);
    addMsg({
      text: `🎉 **Timetable Successfully Updated & Published Live!**\n\n• 🎓 **Class:** ${p} · ${yr} · Sem ${s} · Sec ${sec}\n• ⏰ **Slot:** **${day} · Period P${slot + 1}**\n• 📚 **Subject:** **${subject}** (\`${code}\`)\n• 👨‍🏫 **Teacher:** **${faculty}**\n• 🏛️ **Room:** **Room ${room}** · ${type}\n\n✅ **Live Status:** Saved to official store and broadcast live across all student/faculty screens!`,
      status: "ok",
      actions: [
        { label: "⚡ Schedule Another Slot", variant: "primary", fn: () => startScheduleFlow({ program: p, semester: s, section: sec }) },
        { label: "📅 View Class Schedule", fn: () => handleGeneralCommand("show all sessions") }
      ]
    });
  };

  /* ─────────────── 2. FACULTY MANAGEMENT FLOW ─────────────── */

  const startAddFacultyFlow = useCallback((presetDept?: string) => {
    if (presetDept) {
      setFacultyDraft({ department: presetDept });
      setMode("faculty_add_name");
      addMsg({
        text: `👨‍🏫 **Register New Faculty — Step 2/3: Faculty Name**\n\nBranch / Department: **${presetDept}**\nWhat is the full name of the professor / faculty member?\nExample: \`Dr. Ramesh Kumar\` or \`Prof. Anita Sharma\``,
        status: "info",
        actions: [{ label: "❌ Cancel", variant: "danger", fn: cancelFlow }]
      });
      return;
    }

    setFacultyDraft({});
    setMode("faculty_add_dept");

    addMsg({
      text: `👨‍🏫 **Register New Faculty — Step 1/3: Branch / Department**\n\nWhich academic branch or department does this faculty member belong to?\n*(Pick a department or type any branch name)*:`,
      status: "info",
      actions: [
        { label: "Computer Science & Engineering (CSE)", variant: "primary", fn: () => handleFacultyAddDept("Computer Science & Engineering") },
        { label: "Data Science & AI (CSE-DS / AIDE)", fn: () => handleFacultyAddDept("Data Science & Artificial Intelligence") },
        { label: "Electronics & Communication (ECE)", fn: () => handleFacultyAddDept("Electronics & Communication Engineering") },
        { label: "Department of Mathematics", fn: () => handleFacultyAddDept("Department of Mathematics") },
        { label: "Mechanical / Civil Engineering", fn: () => handleFacultyAddDept("Mechanical & Civil Engineering") },
        { label: "Basic Sciences & Humanities", fn: () => handleFacultyAddDept("Basic Sciences & Humanities") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  }, [addMsg, cancelFlow]);

  const handleFacultyAddDept = (text: string) => {
    addMsg({ role: "user", text });
    const department = text.trim();
    setFacultyDraft((prev) => ({ ...prev, department }));
    setMode("faculty_add_name");

    addMsg({
      text: `👨‍🏫 **Register New Faculty — Step 2/3: Faculty Full Name**\n\nBranch / Department: **${department}**\nWhat is the full name of the professor / faculty member?\nExample: \`Dr. Ramesh Kumar\` or \`Prof. Anita Sharma\``,
      status: "info",
      actions: [{ label: "❌ Cancel", variant: "danger", fn: cancelFlow }]
    });
  };

  const handleFacultyAddName = (text: string) => {
    addMsg({ role: "user", text });
    const name = text.trim();
    setFacultyDraft((prev) => ({ ...prev, name }));
    setMode("faculty_add_code");

    const dept = facultyDraft.department || "Computer Science & Engineering";
    const randomCode = `JGI-FAC-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPhone = `98450${Math.floor(10000 + Math.random() * 90000)}`;

    addMsg({
      text: `🔑 **Register New Faculty — Step 3/3: Mobile & Passcode**\n\n• 👨‍🏫 **Faculty:** **${name}**\n• 🏛️ **Branch / Dept:** ${dept}\n\nEnter their 10-digit mobile number and/or assign their Special Passcode:\n*(Pick an auto-assigned credential below or type phone & passcode in chat)*:`,
      status: "info",
      actions: [
        { label: `Auto: ${randomCode} (Assistant Professor)`, variant: "primary", fn: () => finalizeAddFaculty(`${randomPhone} ${randomCode} Assistant Professor`) },
        { label: `Auto: ${randomCode} (Associate Professor)`, fn: () => finalizeAddFaculty(`${randomPhone} ${randomCode} Associate Professor`) },
        { label: `Auto: ${randomCode} (Professor / HoD)`, fn: () => finalizeAddFaculty(`${randomPhone} ${randomCode} Professor & HoD`) },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const finalizeAddFaculty = (text: string) => {
    addMsg({ role: "user", text });
    const name = facultyDraft.name || "New Faculty";
    const department = facultyDraft.department || "Computer Science & Engineering";

    // Extract phone if present
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
    const phone = phoneMatch ? phoneMatch[1] : facultyDraft.phone || `98450${Math.floor(10000 + Math.random() * 90000)}`;

    // Extract special code
    const codeMatch = text.match(/\b(JGI-FAC-[A-Z0-9]+|FAC-[A-Z0-9]+|[A-Z]{3,}-[0-9]{3,})\b/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : `JGI-FAC-${phone.slice(-4)}`;

    // Extract designation
    let designation = "Assistant Professor";
    if (text.toLowerCase().includes("associate professor")) designation = "Associate Professor";
    else if (text.toLowerCase().includes("professor & hod") || text.toLowerCase().includes("hod")) designation = "Professor & Head of Department";
    else if (text.toLowerCase().includes("professor")) designation = "Professor";
    else if (text.toLowerCase().includes("lecturer")) designation = "Senior Lecturer";

    const newFaculty: FacultyAuthRecord = {
      id: `fac_${Date.now()}_${uid()}`,
      name,
      phone,
      specialCode: code,
      codeAliases: [code, "FACULTY123"],
      department,
      designation,
      avatarInitials: name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
      canMarkAttendance: true
    };

    const res = addFacultyRecord(newFaculty);
    if (!res.success) {
      addMsg({ text: `❌ ${res.error || "Failed to add faculty."}`, status: "error" });
      setMode("idle");
      return;
    }

    toast.success(`Faculty ${name} registered successfully!`);
    setMode("idle");
    setFacultyDraft({});
    onDataChange?.();

    addMsg({
      text: `🎉 **Faculty Member Successfully Registered!**\n\n• 👨‍🏫 **Name:** **${name}**\n• 🏛️ **Branch / Department:** ${department}\n• 📱 **Registered Phone:** \`${phone}\`\n• 🔑 **Faculty Passcode:** \`${code}\`\n• 🎖️ **Designation:** ${designation}\n\n✅ **Instant Live Access:** This faculty member can now log in immediately on the homepage using their Phone (\`${phone}\`) and Code (\`${code}\`), and is now available for timetable scheduling across the university!`,
      status: "ok",
      actions: [
        { label: "👨‍🏫 Add Another Faculty", variant: "primary", fn: () => startAddFacultyFlow(department) },
        { label: "📋 List All Faculty", fn: () => handleGeneralCommand("list all faculty") },
        { label: `⚡ Schedule Class for ${name}`, fn: () => startScheduleFlow({ faculty: name }) }
      ]
    });
  };

  const startRemoveFacultyFlow = useCallback(() => {
    const list = loadAllFaculty().slice(0, 8);
    setMode("faculty_remove_select");

    addMsg({
      text: `🗑️ **Remove Faculty Member**\n\nWhich faculty member would you like to remove from the university portal?\n*(Click a faculty below or type their name or phone number)*:`,
      status: "warning",
      actions: [
        ...list.map((f) => ({
          label: f.name,
          variant: "danger" as const,
          fn: () => handleRemoveFaculty(f.name)
        })),
        { label: "❌ Cancel", fn: cancelFlow }
      ]
    });
  }, [addMsg, cancelFlow]);

  const handleRemoveFaculty = (text: string) => {
    addMsg({ role: "user", text });
    const res = removeFacultyRecord(text);
    setMode("idle");

    if (res.success && res.removedFaculty) {
      toast.success(`Removed faculty: ${res.removedFaculty.name}`);
      addMsg({
        text: `🗑️ **Faculty Member Removed:**\n• Name: **${res.removedFaculty.name}**\n• Department: ${res.removedFaculty.department}\n• Phone: ${res.removedFaculty.phone}\n\n✅ **Status:** Their credentials have been revoked and they can no longer access attendance or faculty timetables.`,
        status: "ok"
      });
    } else {
      addMsg({ text: `❌ ${res.error || `Could not find faculty matching "${text}".`}`, status: "error" });
    }
  };

  /* ─────────────── 2B. FEATURE 5: ASSIGN SPECIAL CODE TO TEACHERS ─────────────── */

  const startAssignCodeFlow = useCallback(() => {
    const list = loadAllFaculty();
    setAssignCodeDraft({});
    setMode("faculty_assign_code_select");

    addMsg({
      text: `🔑 **Feature 5: Assign Special Code to Teachers**\n\nWhich teacher would you like to assign a new special code to?\n*(After assigning, that teacher must log in with this assigned code ONLY)*:`,
      status: "info",
      actions: [
        ...list.slice(0, 8).map((f) => ({
          label: `${f.name.split(" - ")[0]} (${f.specialCode})`,
          variant: "primary" as const,
          fn: () => handleAssignCodeSelect(f.name)
        })),
        { label: "❌ Cancel", variant: "danger" as const, fn: cancelFlow }
      ]
    });
  }, [addMsg, cancelFlow]);

  const handleAssignCodeSelect = (text: string) => {
    addMsg({ role: "user", text });
    const list = loadAllFaculty();
    const norm = text.trim().toUpperCase();
    const normPhone = text.replace(/[^0-9]/g, "").slice(-10);

    const target = list.find((f) => {
      if (f.id.toUpperCase() === norm) return true;
      if (f.name.toUpperCase().includes(norm) || norm.includes(f.name.toUpperCase())) return true;
      if (normPhone && f.phone.includes(normPhone)) return true;
      return false;
    });

    if (!target) {
      addMsg({
        text: `⚠️ Could not find a teacher matching "${text}". Please choose from the registered faculty:`,
        status: "warning",
        actions: [
          ...list.slice(0, 5).map((f) => ({
            label: `${f.name.split(" - ")[0]} (${f.specialCode})`,
            fn: () => handleAssignCodeSelect(f.name)
          })),
          { label: "❌ Cancel", variant: "danger" as const, fn: cancelFlow }
        ]
      });
      return;
    }

    setAssignCodeDraft({
      facultyId: target.id,
      facultyName: target.name,
      phone: target.phone,
      currentCode: target.specialCode
    });
    setMode("faculty_assign_code_input");

    const suggested1 = `JGI-FAC-${Math.floor(1000 + Math.random() * 9000)}`;
    const suggested2 = `FAC-${target.phone.slice(-4)}`;
    const suggested3 = `TEACHER-${Math.floor(100 + Math.random() * 900)}`;

    addMsg({
      text: `🔑 **Assign New Special Code for ${target.name}**\n\n• **Current Code:** \`${target.specialCode}\`\n• **Registered Mobile:** \`${target.phone}\`\n• **Department:** ${target.department}\n\nWhat new special code should be assigned to this teacher?\n*(Pick a suggested code below or type any custom code in the chat)*:\n\n⚠️ **Strict Enforcement:** All alias bypasses will be revoked. **${target.name}** must log in with this assigned code ONLY!`,
      status: "info",
      actions: [
        { label: `🔑 ${suggested1}`, variant: "primary", fn: () => finalizeAssignCode(suggested1) },
        { label: `🔑 ${suggested2}`, fn: () => finalizeAssignCode(suggested2) },
        { label: `🔑 ${suggested3}`, fn: () => finalizeAssignCode(suggested3) },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const finalizeAssignCode = (text: string) => {
    addMsg({ role: "user", text });
    const targetIdentifier = assignCodeDraft.facultyId || assignCodeDraft.facultyName || "";
    if (!targetIdentifier) {
      addMsg({ text: "❌ Session expired. Please start Feature 5 again.", status: "error" });
      setMode("idle");
      return;
    }

    // Extract the code cleanly
    const cleanCode = text.trim().replace(/^code\s*[:=]?\s*/i, "").split(/\s+/)[0].toUpperCase();

    if (!cleanCode || cleanCode.length < 3) {
      addMsg({
        text: "⚠️ Special code must be at least 3 characters long (e.g. `JGI-FAC-7788`). Please enter a valid code:",
        status: "warning"
      });
      return;
    }

    const res = assignFacultySpecialCode(targetIdentifier, cleanCode);
    if (!res.success || !res.faculty) {
      addMsg({ text: `❌ ${res.error || "Failed to assign special code."}`, status: "error" });
      setMode("idle");
      return;
    }

    const updated = res.faculty;
    toast.success(`Special code assigned to ${updated.name}!`);
    setMode("idle");
    setAssignCodeDraft({});
    onDataChange?.();

    addMsg({
      text: `🎉 **Feature 5: Special Code Successfully Assigned!**\n\n• 👨‍🏫 **Teacher:** **${updated.name}**\n• 📱 **Registered Phone:** \`${updated.phone}\`\n• 🔑 **New Special Code:** \`${updated.specialCode}\`\n• 🔒 **Previous Code:** ~~${res.previousCode || "None"}~~\n\n✅ **Strict Authentication Active:**\nFrom now on, **${updated.name}** must log in using **\`${updated.specialCode}\` ONLY** on the login page. All bypasses and loose aliases have been revoked and will be rejected!`,
      status: "ok",
      actions: [
        { label: "🔑 Assign Code to Another Teacher", variant: "primary", fn: startAssignCodeFlow },
        { label: "📋 View All Faculty", fn: () => handleGeneralCommand("list all faculty") }
      ]
    });
  };

  /* ─────────────── 3. STUDENT MANAGEMENT FLOW ─────────────── */

  const startAddStudentFlow = useCallback((preset?: { program?: string; semester?: string; section?: string; academicYear?: string }) => {
    const p = preset?.program || program;
    const s = preset?.semester || semester;
    const sec = preset?.section || section;
    const yr = preset?.academicYear || getAcademicYearFromSemester(s);

    setStudentDraft({ program: p, semester: s, section: sec, academicYear: yr });
    setMode("student_add_target");

    addMsg({
      text: `🎓 **Register Student(s) — Step 1/2: Academic Year, Branch & Class**\n\nSelect the target Academic Year, Branch, and Section for student enrollment:\n• Active Class: **${p} · ${yr} · Sem ${s} · Sec ${sec}**\n\n*(Choose a preset below or type custom, e.g. "1st Year Freshmen CSE-GEN Sem 1 Sec A" or "New Academic Year 2026-27 CSE-DS 1 A")*:`,
      status: "info",
      actions: [
        {
          label: `📌 Active: ${p} S${s} ${sec}`,
          variant: "primary",
          fn: () => handleStudentAddTarget(`${p} ${s} ${sec}`)
        },
        {
          label: `✨ New AY (1st Year Freshmen · CSE-GEN S1 Sec A)`,
          fn: () => handleStudentAddTarget("1st Year CSE-GEN 1 A")
        },
        {
          label: `✨ New AY (1st Year Freshmen · CSE-DS S1 Sec A)`,
          fn: () => handleStudentAddTarget("1st Year CSE-DS 1 A")
        },
        {
          label: `✨ Same AY (2nd Year · CSE-GEN S3 Sec F)`,
          fn: () => handleStudentAddTarget("2nd Year CSE-GEN 3 F")
        },
        {
          label: `✨ Same AY (2nd Year · CSE-DS S3 Sec A)`,
          fn: () => handleStudentAddTarget("2nd Year CSE-DS 3 A")
        },
        {
          label: `✨ 3rd Year · CSE-GEN S5 Sec A`,
          fn: () => handleStudentAddTarget("3rd Year CSE-GEN 5 A")
        },
        {
          label: `✨ 4th Year · CSE-GEN S7 Sec A`,
          fn: () => handleStudentAddTarget("4th Year CSE-GEN 7 A")
        },
        {
          label: "❌ Cancel",
          variant: "danger",
          fn: cancelFlow
        }
      ]
    });
  }, [program, semester, section, addMsg, cancelFlow]);

  const handleStudentAddTarget = (text: string) => {
    addMsg({ role: "user", text });
    const parsed = parseAcademicYearAndClass(text, studentDraft.program || program, studentDraft.semester || semester, studentDraft.section || section);

    setStudentDraft((prev) => ({
      ...prev,
      academicYear: parsed.academicYear,
      program: parsed.program,
      semester: parsed.semester,
      section: parsed.section
    }));
    setMode("student_add_input");

    const yrPrefix = parseInt(parsed.semester, 10) <= 2 ? "26BT" : "25BT";
    const progCode = parsed.program.replace(/[^A-Z]/gi, "").slice(0, 4);

    const sampleBatch = `${yrPrefix}${progCode}001 ARJUN SHARMA\n${yrPrefix}${progCode}002 PRIYA PATEL\n${yrPrefix}${progCode}003 RAHUL VERMA`;
    const sampleSingle = `${yrPrefix}${progCode}099 NEW STUDENT`;

    addMsg({
      text: `📋 **Register Student(s) — Step 2/2: Student Name(s) or Full List**\n\n🎯 **Target:** **${parsed.academicYear} · ${parsed.program} · Semester ${parsed.semester} · Section ${parsed.section}**\n\nEnter a **single student** OR paste a **batch list** of students!\n\n**Accepted Formats:**\n• \`USN Full Name\` (one student per line, e.g. \`${yrPrefix}${progCode}001 ARJUN SHARMA\`)\n• Just student names (one per line or comma-separated) — USNs will be auto-generated sequentially!\n\n*(Type or paste in the chat, or click a quick sample below)*:`,
      status: "info",
      actions: [
        {
          label: `⚡ Auto Batch (3 Sample Students)`,
          variant: "primary",
          fn: () => handleStudentAddInput(sampleBatch)
        },
        {
          label: `⚡ Add Single: ${sampleSingle}`,
          fn: () => handleStudentAddInput(sampleSingle)
        },
        {
          label: "❌ Cancel",
          variant: "danger",
          fn: cancelFlow
        }
      ]
    });
  };

  const handleStudentAddInput = (text: string) => {
    addMsg({ role: "user", text });
    const targetProgram = studentDraft.program || program;
    const targetSemester = studentDraft.semester || semester;
    const targetSection = studentDraft.section || section;
    const academicYear = studentDraft.academicYear || getAcademicYearFromSemester(targetSemester);

    const parsedList = parseStudentEntries(text, targetProgram, targetSemester, targetSection);

    if (parsedList.length === 0) {
      addMsg({
        text: `⚠️ No valid student entries found in input. Please enter student names or USNs (e.g. \`26BTRGA001 ARJUN SHARMA\` or \`Arjun Sharma, Priya Patel\`):`,
        status: "warning"
      });
      return;
    }

    const res = addMultipleStudents(parsedList);

    setMode("idle");
    setStudentDraft({});

    if (res.totalAdded === 0 && res.existing.length > 0) {
      addMsg({
        text: `⚠️ All provided USNs are already registered in the system:\n${res.existing.map((u) => `• \`${u}\``).join("\n")}`,
        status: "warning"
      });
      return;
    }

    toast.success(`Successfully enrolled ${res.totalAdded} student(s)!`);

    const previewList = res.added.slice(0, 8).map((s) => `• \`${s.usn}\`: **${s.name}**`).join("\n");
    const moreCount = res.totalAdded > 8 ? `\n*...and ${res.totalAdded - 8} more students*` : "";
    const existingNote = res.existing.length > 0 ? `\n\n*(Note: ${res.existing.length} existing USN(s) were skipped)*` : "";

    addMsg({
      text: `🎉 **Successfully Enrolled ${res.totalAdded} Student(s)!**\n\n• 🎓 **Academic Year:** ${academicYear}\n• 🏫 **Branch & Class:** **${targetProgram} · Semester ${targetSemester} · Section ${targetSection}**\n• 👥 **Enrolled Students:**\n${previewList}${moreCount}${existingNote}\n\n✅ **Instant Student Login:**\nOnly the student's **USN** is required for login. These students can log in immediately on the student portal using their assigned USN!`,
      status: "ok",
      actions: [
        {
          label: "🎓 Add More Students",
          variant: "primary",
          fn: () => startAddStudentFlow({ program: targetProgram, semester: targetSemester, section: targetSection, academicYear })
        },
        {
          label: `📋 View Roster (${targetProgram} S${targetSemester} ${targetSection})`,
          fn: () => handleGeneralCommand(`list students in ${targetProgram} ${targetSemester} ${targetSection}`)
        },
        {
          label: `🔄 Switch Studio View to ${targetProgram} S${targetSemester} ${targetSection}`,
          fn: () => {
            onClassSwitch?.(targetProgram, targetSemester, targetSection);
            toast.success(`Switched studio view to ${targetProgram} S${targetSemester} Sec ${targetSection}`);
          }
        }
      ]
    });
  };

  const startRemoveStudentFlow = useCallback(() => {
    setMode("student_remove_select");

    const sample = loadAllStudents().slice(0, 6);

    addMsg({
      text: `🗑️ **Remove Student from Roster**\n\nEnter the USN or Full Name of the student you wish to remove from the registry:\n*(Click a suggestion or type any USN)*:`,
      status: "warning",
      actions: [
        ...sample.map((s) => ({
          label: `${s.usn} (${s.name.split(" ")[0]})`,
          variant: "danger" as const,
          fn: () => handleRemoveStudent(s.usn)
        })),
        { label: "❌ Cancel", fn: cancelFlow }
      ]
    });
  }, [addMsg, cancelFlow]);

  const handleRemoveStudent = (text: string) => {
    addMsg({ role: "user", text });
    const res = removeStudentRecord(text);
    setMode("idle");

    if (res.success && res.removedStudent) {
      toast.success(`Removed student: ${res.removedStudent.name} (${res.removedStudent.usn})`);
      addMsg({
        text: `🗑️ **Student Removed from University Records:**\n• USN: \`${res.removedStudent.usn}\`\n• Name: **${res.removedStudent.name}**\n• Batch: ${res.removedStudent.program} S${res.removedStudent.semester} ${res.removedStudent.section}\n\n✅ **Status:** Student record removed from rosters and login access disabled.`,
        status: "ok"
      });
    } else {
      addMsg({ text: `❌ ${res.error || `Could not find student matching "${text}".`}`, status: "error" });
    }
  };

  /* ─────────────── 4. GENERAL COMMAND & TEXT ROUTER ─────────────── */

  const handleGeneralCommand = useCallback((rawText: string) => {
    const t = rawText.toLowerCase().trim();

    // Check if user is issuing a top-level command or intent
    const isCancel = /\b(cancel|stop|exit|abort|nevermind)\b/i.test(t);
    const isAddStudentCmd = /\b(add|new|register|enroll|create|bulk|batch|import)\s*(students?|roster|student\s*list)\b/i.test(t) || /^(add\s*students?|new\s*students?|enroll\s*students?|student\s*list|students\s*list)$/i.test(t);
    const isListStudentCmd = /\b(list|show|display|view)\s*(students?|roster)\b/i.test(t);
    const isRemoveStudentCmd = /\b(remove|delete|drop)\s*(students?)\b/i.test(t);
    const isAddFacultyCmd = /\b(add|new|register|create)\s*(faculty|teacher|professor)\b/i.test(t) || /^(add\s*faculty|new\s*faculty|add\s*teacher|new\s*teacher)$/i.test(t);
    const isRemoveFacultyCmd = /\b(remove|delete|drop)\s*(faculty|teacher|professor)\b/i.test(t);
    const isListFacultyCmd = /\b(list|show|display|view)\s*(faculty|teachers|professors)\b/i.test(t);
    const isAssignCodeCmd = /\b(feature\s*5|assign\s*(special\s*)?code|teacher\s*code|faculty\s*code|set\s*(special\s*)?code|change\s*(special\s*)?code|update\s*(special\s*)?code)\b/i.test(t) || (t.includes("code") && (t.includes("teacher") || t.includes("faculty") || t.includes("assign")));
    const isScheduleCmd = /\b(schedule\s*(class|session|period|slot|timetable|lecture|lab)?|create\s*(timetable|schedule|session)|add\s*(session|slot|period|lecture|lab))\b/i.test(t) || /^(schedule|schedule\s*class)$/i.test(t);
    const isManageUsersCmd = /\b(manage\s*(users?|faculty|students?)|user\s*management)\b/i.test(t);
    const isHelpCmd = /\b(help|commands?|usage|what can you)\b/i.test(t);

    const isTopLevelIntent = isCancel || isAddStudentCmd || isListStudentCmd || isRemoveStudentCmd || isAddFacultyCmd || isRemoveFacultyCmd || isListFacultyCmd || isAssignCodeCmd || isScheduleCmd || isManageUsersCmd || isHelpCmd;

    // Critical Bug Fix: If a top-level command is detected while inside a wizard, abort wizard immediately!
    if (isTopLevelIntent && mode !== "idle") {
      if (isCancel) {
        cancelFlow();
        return;
      }
      setMode("idle");
      setScheduleDraft({ program, semester, section });
      setFacultyDraft({});
      setStudentDraft({});
      setAssignCodeDraft({});
    }

    // Active wizard step router (only runs when mode is active and not intercepted by top-level command)
    if (mode === "schedule_year_sem") { handleScheduleYearSem(rawText); return; }
    if (mode === "schedule_day_slot") { handleScheduleDaySlot(rawText); return; }
    if (mode === "schedule_subject") { handleScheduleSubject(rawText); return; }
    if (mode === "schedule_teacher") { handleScheduleTeacher(rawText); return; }
    if (mode === "schedule_room_type") { finalizeSchedule(rawText); return; }

    if (mode === "faculty_add_dept") { handleFacultyAddDept(rawText); return; }
    if (mode === "faculty_add_name") { handleFacultyAddName(rawText); return; }
    if (mode === "faculty_add_code") { finalizeAddFaculty(rawText); return; }
    if (mode === "faculty_remove_select") { handleRemoveFaculty(rawText); return; }

    if (mode === "faculty_assign_code_select") { handleAssignCodeSelect(rawText); return; }
    if (mode === "faculty_assign_code_input") { finalizeAssignCode(rawText); return; }

    if (mode === "student_add_target") { handleStudentAddTarget(rawText); return; }
    if (mode === "student_add_input") { handleStudentAddInput(rawText); return; }
    if (mode === "student_remove_select") { handleRemoveStudent(rawText); return; }

    // Direct single-line student add shortcut: e.g. "add student 26BTRGA001 ARJUN SHARMA in CSE-GEN Sem 1 Sec A"
    if (/\b(add|enroll|register)\s+students?\s+/i.test(t) && /\b(in|to|for|batch|class)\b/i.test(t)) {
      const parts = rawText.split(/\b(?:in|to|for|batch|class)\b/i);
      if (parts.length >= 2) {
        const studentPart = parts[0].replace(/\b(?:add|enroll|register)\s+students?\b/i, "").trim();
        const classPart = parts.slice(1).join(" ").trim();
        const targetClass = parseAcademicYearAndClass(classPart, program, semester, section);
        const parsedList = parseStudentEntries(studentPart, targetClass.program, targetClass.semester, targetClass.section);
        if (parsedList.length > 0) {
          setStudentDraft({
            program: targetClass.program,
            semester: targetClass.semester,
            section: targetClass.section,
            academicYear: targetClass.academicYear
          });
          handleStudentAddInput(studentPart);
          return;
        }
      }
    }

    // Direct single-line faculty add shortcut: e.g. "add faculty Dr. Anand in CSE"
    if (/\b(add|register)\s+faculty\s+/i.test(t) && /\b(in|to|for|dept|department|branch)\b/i.test(t)) {
      const parts = rawText.split(/\b(?:in|to|for|dept|department|branch)\b/i);
      if (parts.length >= 2) {
        const facName = parts[0].replace(/\b(?:add|register)\s+faculty\b/i, "").trim();
        const facDept = parts.slice(1).join(" ").trim();
        if (facName && facDept) {
          setFacultyDraft({ name: facName, department: facDept });
          setMode("faculty_add_code");
          handleFacultyAddName(facName);
          return;
        }
      }
    }

    // Feature 5: Assign Special Code to Teachers
    if (isAssignCodeCmd) {
      startAssignCodeFlow();
      return;
    }

    // Faculty commands
    if (isAddFacultyCmd) {
      startAddFacultyFlow();
      return;
    }
    if (isRemoveFacultyCmd) {
      startRemoveFacultyFlow();
      return;
    }
    if (isListFacultyCmd) {
      const all = loadAllFaculty();
      const list = all.slice(0, 10).map((f) => `• **${f.name}** — ${f.department} (\`${f.specialCode}\` · 📱 ${f.phone})`).join("\n");
      addMsg({
        text: `👨‍🏫 **Registered University Faculty (${all.length} total):**\n\n${list}\n\n*(Showing top 10)*`,
        status: "info",
        actions: [
          { label: "👨‍🏫 Add New Faculty", variant: "primary", fn: () => startAddFacultyFlow() },
          { label: "❌ Remove Faculty", variant: "danger", fn: startRemoveFacultyFlow }
        ]
      });
      return;
    }

    // Student commands
    if (isAddStudentCmd) {
      startAddStudentFlow();
      return;
    }
    if (isRemoveStudentCmd) {
      startRemoveStudentFlow();
      return;
    }
    if (isListStudentCmd) {
      const parsed = parseAcademicYearAndClass(rawText, program, semester, section);
      const all = loadAllStudents();
      const matching = all.filter((s) => s.program.toUpperCase() === parsed.program.toUpperCase() && s.semester === parsed.semester && s.section.toUpperCase() === parsed.section.toUpperCase());
      const targetList = matching.length > 0 ? matching : all.slice(0, 15);
      const rows = targetList.map((s) => `• \`${s.usn}\`: **${s.name}** (${s.program} S${s.semester} ${s.section})`).join("\n");
      const title = matching.length > 0
        ? `🎓 **Enrolled Students in ${parsed.program} Sem ${parsed.semester} Sec ${parsed.section}** (${matching.length} total):`
        : `🎓 **Registered Students Roster** (${all.length} total in system, showing ${targetList.length}):`;
      addMsg({
        text: `${title}\n\n${rows}`,
        status: "info",
        actions: [
          { label: "🎓 Add Students to This Class", variant: "primary", fn: () => startAddStudentFlow({ program: parsed.program, semester: parsed.semester, section: parsed.section }) },
          { label: "❌ Remove Student", variant: "danger", fn: startRemoveStudentFlow }
        ]
      });
      return;
    }

    // User management summary
    if (isManageUsersCmd) {
      addMsg({
        text: `👥 **JAINEXA User & Credential Controller**\n\nAs Master Administrator, you have complete authority to manage teachers and students across all academic years and branches:\n\n• **Faculty:** Add new professors by department & branch, assign phone and unique special code for portal authentication.\n• **Students:** Enroll single students or batch lists for any Academic Year (Freshmen, Sophomores, etc.), branch, and section. Instant access via **USN only**!`,
        status: "info",
        actions: [
          { label: "👨‍🏫 Add Faculty", variant: "primary", fn: () => startAddFacultyFlow() },
          { label: "❌ Remove Faculty", variant: "danger", fn: startRemoveFacultyFlow },
          { label: "🎓 Add Student(s)", variant: "primary", fn: () => startAddStudentFlow() },
          { label: "❌ Remove Student", variant: "danger", fn: startRemoveStudentFlow }
        ]
      });
      return;
    }

    // Schedule class commands
    if (isScheduleCmd) {
      startScheduleFlow();
      return;
    }

    // Help
    if (isHelpCmd) {
      addMsg({
        text: `**JAINEXA Admin Assistant Guide**\n\n⚡ **1. Class Scheduling:**\n• *"schedule class"* — multi-turn interview for Year, Slot, Subject, Teacher & Room\n• *"publish draft"* / *"revert draft"* / *"reset baseline"*\n\n👨‍🏫 **2. Faculty Operations:**\n• *"add faculty"* — register a professor by branch/department with phone and passcode\n• *"remove faculty"* — revoke credentials for any faculty\n• *"list faculty"* — view all registered teachers\n\n🎓 **3. Student Operations:**\n• *"add student"* — enroll single student or batch list for any academic year, branch, and class\n• *"remove student"* — drop student from roster\n• *"list students"* — view class enrollment (Login requires **USN only**)\n\n🔧 **4. Campus Facilities & Roomware:**\n• *"list issues"* / *"resolve issue in room 105"*\n\n🔑 **5. Feature 5: Assign Teacher Special Code:**\n• *"assign teacher code"* / *"set faculty code"* — assign a unique code to any teacher; teachers must log in with that code ONLY (all bypasses wiped clean)!`,
        status: "info",
        actions: [
          { label: "⚡ Schedule Class", variant: "primary", fn: () => startScheduleFlow() },
          { label: "🔑 Feature 5: Assign Code", fn: startAssignCodeFlow },
          { label: "👨‍🏫 Add Faculty", fn: () => startAddFacultyFlow() },
          { label: "🎓 Add Student", fn: () => startAddStudentFlow() },
          { label: "👥 Manage Users", fn: () => handleGeneralCommand("manage users") }
        ]
      });
      return;
    }

    // List sessions
    if (/\b(list|show|display|print)\s*(sessions?|timetable|schedule|classes)\b/i.test(t)) {
      const state = loadClassSchedule(program, semester, section);
      const sessions = state.draft;
      if (sessions.length === 0) {
        addMsg({ text: `No sessions found in draft for ${program} S${semester} ${section}.`, status: "warning" });
        return;
      }
      const byDay = DAYS.map((day) => {
        const daySessions = sessions.filter((s) => s.day === day);
        if (daySessions.length === 0) return null;
        const rows = daySessions.map((s) => `  • P${s.slot + 1}: **${s.subject}** (${s.faculty}) — Room ${s.room}`).join("\n");
        return `**${day}**\n${rows}`;
      }).filter(Boolean);

      addMsg({
        text: `📅 **Current Timetable — ${program} S${semester} Sec ${section}** (${sessions.length} sessions):\n\n` + byDay.join("\n\n"),
        status: "ok",
        actions: [{ label: "⚡ Schedule / Update Slot", variant: "primary", fn: () => startScheduleFlow() }]
      });
      return;
    }

    // Publish
    if (/\b(publish|make live|go live|release)\b/i.test(t)) {
      publishClassSchedule(program, semester, section, adminName, "Published via Admin Assistant");
      toast.success("Draft published live!");
      onDataChange?.();
      addMsg({
        text: `🚀 **Timetable published successfully!** The schedule for **${program} S${semester} Sec ${section}** is now live for all students and faculty.`,
        status: "ok"
      });
      return;
    }

    // List & Manage Room Issues
    if (/\b(list|show|view|active)\s*(issues?|faults?|problems?|wear|tear)\b/i.test(t)) {
      const allIssues = loadRoomwareIssues();
      const active = allIssues.filter((i) => i.status !== "resolved");
      if (active.length === 0) {
        addMsg({
          text: `🎉 **No Active Room Infrastructure Issues!** All classrooms and laboratories have been verified operational with zero faults reported.`,
          status: "ok"
        });
        return;
      }

      const issueLines = active.map((iss) => {
        const timeInfo = iss.classHour ? `\n    ⏰ *Class Session:* ${iss.classDay || "Class"} ${iss.classHour} (${iss.classSubject || "Lecture"})` : "";
        return `• **${iss.roomName}** [${iss.severity.toUpperCase()}]: **${iss.title}**${timeInfo}\n    *Reported by:* ${iss.reportedBy} (${iss.batch || iss.reporterRole})`;
      }).join("\n\n");

      addMsg({
        text: `🔧 **Active Campus Infrastructure Issues (${active.length}):**\n\n${issueLines}\n\nClick below to mark any issue resolved:`,
        status: "warning",
        actions: active.slice(0, 3).map((iss) => ({
          label: `✓ Resolve: ${iss.roomName}`,
          variant: "primary",
          fn: () => {
            updateIssueStatus(iss.id, "resolved", `Resolved by Master Admin (${adminName})`);
            toast.success(`Issue for ${iss.roomName} marked as Resolved!`);
            onDataChange?.();
            addMsg({
              text: `✅ **Issue Resolved:** The fault in **${iss.roomName}** ("*${iss.title}*") has been marked as resolved and verified operational.`,
              status: "ok"
            });
          }
        }))
      });
      return;
    }

    // Direct "Issue Resolved" / "Resolve Issue" Command
    if (/\b(resolve|fixed?|close|mark\s*resolved?)\s*(issue|fault|problem)?/i.test(t)) {
      const allIssues = loadRoomwareIssues();
      const active = allIssues.filter((i) => i.status !== "resolved");
      if (active.length === 0) {
        addMsg({
          text: `All campus roomware issues are already resolved!`,
          status: "info"
        });
        return;
      }

      // Check if a room was mentioned
      const matched = active.find((iss) => t.toLowerCase().includes(iss.roomCode.toLowerCase()) || t.toLowerCase().includes(iss.roomName.toLowerCase()));
      if (matched) {
        updateIssueStatus(matched.id, "resolved", `Resolved by Master Admin (${adminName})`);
        toast.success(`Issue for ${matched.roomName} marked as Resolved!`);
        onDataChange?.();
        addMsg({
          text: `✅ **Issue Resolved:** Fault in **${matched.roomName}** ("*${matched.title}*") has been closed and marked as operational.`,
          status: "ok"
        });
        return;
      }

      // Otherwise offer action buttons to resolve active issues
      addMsg({
        text: `Which issue would you like to mark as **Issue Resolved**?`,
        status: "info",
        actions: active.map((iss) => ({
          label: `✓ ${iss.roomName}: ${iss.title.substring(0, 20)}...`,
          variant: "primary",
          fn: () => {
            updateIssueStatus(iss.id, "resolved", `Resolved by Master Admin (${adminName})`);
            toast.success(`Issue for ${iss.roomName} marked as Resolved!`);
            onDataChange?.();
            addMsg({
              text: `✅ **Issue Resolved:** Fault in **${iss.roomName}** has been marked as resolved.`,
              status: "ok"
            });
          }
        }))
      });
      return;
    }

    // Default fallback
    addMsg({
      text: `🤔 I can help you schedule classes, add/remove faculty & students, assign special teacher codes, and manage campus facilities. What would you like to do?`,
      status: "info",
      actions: [
        { label: "⚡ Schedule Class", variant: "primary", fn: () => startScheduleFlow() },
        { label: "🔑 Feature 5: Assign Code", fn: startAssignCodeFlow },
        { label: "👨‍🏫 Add Faculty", fn: startAddFacultyFlow },
        { label: "🎓 Add Student", fn: startAddStudentFlow },
        { label: "👥 Manage Users", fn: () => handleGeneralCommand("manage users") },
        { label: "❓ Full Help", fn: () => handleGeneralCommand("help") }
      ]
    });
  }, [mode, program, semester, section, adminName, onDataChange, onClassSwitch, addMsg, cancelFlow, startScheduleFlow, startAddFacultyFlow, startRemoveFacultyFlow, startAssignCodeFlow, startAddStudentFlow, startRemoveStudentFlow]);

  /* ─────────────── SEND HANDLER ─────────────── */

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMsg = { id: uid(), role: "user", text, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 200));
    setIsTyping(false);

    handleGeneralCommand(text);
  }, [input, handleGeneralCommand]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMode("idle");
    setMessages([
      {
        id: uid(),
        role: "assistant",
        text: `Chat cleared. Ready for timetable scheduling, faculty & student administration for **${program} S${semester} Sec ${section}**.`,
        ts: new Date(),
        status: "info",
        actions: [
          { label: "⚡ Schedule Class", variant: "primary", fn: () => startScheduleFlow() },
          { label: "🔑 Assign Teacher Code", fn: startAssignCodeFlow },
          { label: "👨‍🏫 Add Faculty", fn: startAddFacultyFlow },
          { label: "🎓 Add Student", fn: startAddStudentFlow }
        ]
      }
    ]);
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-inherit">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
      }
      if (part === "\n") {
        return <br key={i} />;
      }
      if (part.startsWith("• ")) {
        return <span key={i} className="block pl-1.5 my-0.5 font-medium">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const statusIcon = (status?: string) => {
    if (status === "ok") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />;
    if (status === "error") return <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />;
    if (status === "warning") return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
    if (status === "info") return <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />;
    return <Bot className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />;
  };

  const QUICK_COMMANDS = [
    { label: "⚡ Schedule Class", cmd: "schedule class" },
    { label: "🔑 Feature 5: Assign Code", cmd: "assign teacher code" },
    { label: "👨‍🏫 Add Faculty", cmd: "add faculty" },
    { label: "🎓 Add Student", cmd: "add student" },
    { label: "👥 Manage Users", cmd: "manage users" },
    { label: "📅 Show Sessions", cmd: "show all sessions" },
    { label: "❓ Help", cmd: "help" },
  ];

  return (
    <>
      {/* ─── Floating Trigger Button ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 w-13 h-13 rounded-full bg-[#0a1e3a] text-white shadow-2xl flex items-center justify-center cursor-pointer border-2 border-[#e5a00d] hover:bg-[#142e54] transition-all"
            title="Open Admin AI Controller"
          >
            <Bot className="w-6 h-6 text-[#faf8ef]" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#e5a00d] rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Floating Chat Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-5 right-5 z-50 flex flex-col shadow-2xl border border-slate-300 rounded-2xl bg-white overflow-hidden"
            style={{
              width: isMinimized ? "300px" : "420px",
              height: isMinimized ? "auto" : "580px",
              maxHeight: "88vh",
            }}
          >
            {/* ── Header ── */}
            <div className="bg-[#0a1e3a] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#e5a00d]/20 border border-[#e5a00d]/60 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 text-[#e5a00d]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold tracking-wide leading-none">Admin AI Controller</p>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 leading-none font-medium">
                    {program} · Sem {semester} · Sec {section}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearHistory}
                  className="p-1.5 rounded hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            {!isMinimized && (
              <>
                {/* Active Wizard Mode Banner */}
                {mode !== "idle" && (
                  <div className="bg-[#fcf8ed] border-b border-[#f1deae] px-3.5 py-1.5 flex items-center justify-between text-[10px] text-[#8c5e0d] shrink-0 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#cf8e18] animate-spin" style={{ animationDuration: "3s" }} />
                      <span>
                        {mode.startsWith("schedule") && "Interactive Timetable Scheduling"}
                        {mode.startsWith("faculty_assign_code") && "🔑 Feature 5: Assign Teacher Special Code"}
                        {mode.startsWith("faculty_add") && "Faculty Registration"}
                        {mode.startsWith("faculty_remove") && "Faculty Management"}
                        {mode.startsWith("student") && "Student Management"}
                      </span>
                    </div>
                    <button
                      onClick={cancelFlow}
                      className="text-[9.5px] text-red-600 hover:underline cursor-pointer font-semibold"
                    >
                      Cancel Wizard
                    </button>
                  </div>
                )}

                {/* Quick Command Chips */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 overflow-x-auto scrollbar-hide shrink-0 bg-slate-50/90">
                  {QUICK_COMMANDS.map((qc) => (
                    <button
                      key={qc.cmd}
                      onClick={() => {
                        setMode("idle");
                        setScheduleDraft({ program, semester, section });
                        setFacultyDraft({});
                        setStudentDraft({});
                        setAssignCodeDraft({});
                        handleGeneralCommand(qc.cmd);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-all shadow-2xs shrink-0 border ${
                        qc.cmd === "schedule class"
                          ? "bg-[#0a1e3a] text-white border-[#0a1e3a] hover:bg-[#142e54]"
                          : qc.cmd === "assign teacher code"
                          ? "bg-[#fef3c7] text-[#78350f] border-[#f59e0b] hover:bg-[#fde68a] font-bold"
                          : qc.cmd === "add faculty"
                          ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                          : qc.cmd === "add student"
                          ? "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100"
                          : "bg-white text-slate-700 border-slate-200 hover:border-[#0a1e3a] hover:text-[#0a1e3a]"
                      }`}
                    >
                      {qc.label}
                    </button>
                  ))}
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 min-h-0 bg-[#fafaf9]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6.5 h-6.5 rounded-full bg-[#0a1e3a]/10 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                          {statusIcon(msg.status)}
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-relaxed max-w-[88%] break-words shadow-2xs ${
                          msg.role === "user"
                            ? "bg-[#0a1e3a] text-white rounded-tr-xs"
                            : msg.status === "error"
                            ? "bg-red-50 text-red-900 border border-red-200 rounded-tl-xs"
                            : msg.status === "warning"
                            ? "bg-amber-50 text-amber-950 border border-amber-200 rounded-tl-xs"
                            : msg.status === "ok"
                            ? "bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-tl-xs"
                            : "bg-white text-slate-900 border border-slate-200 rounded-tl-xs"
                        }`}
                      >
                        {renderText(msg.text)}

                        {/* Action Buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200/80">
                            {msg.actions.map((act, i) => (
                              <button
                                key={i}
                                onClick={act.fn}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all shadow-2xs ${
                                  act.variant === "primary"
                                    ? "bg-[#0a1e3a] text-white hover:bg-[#1a3862]"
                                    : act.variant === "danger"
                                    ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                    : act.variant === "amber"
                                    ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                                }`}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#0a1e3a]/10 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-200 px-3.5 py-3 shrink-0 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={
                        mode === "student_add_target"
                          ? "Select or type Class (e.g. 1st Year CSE-GEN Sem 1 Sec A)..."
                          : mode === "student_add_input"
                          ? "Type student name(s) or paste list (e.g. 26BTRGA001 ARJUN SHARMA)..."
                          : mode === "faculty_add_dept"
                          ? "Type Department or Branch (e.g. Computer Science)..."
                          : mode === "faculty_add_name"
                          ? "Type Faculty Name (e.g. Dr. Ramesh Kumar)..."
                          : mode === "faculty_add_code"
                          ? "Type mobile number and special passcode..."
                          : mode.startsWith("schedule")
                          ? "Provide scheduling answer..."
                          : "Type a command or ask anything..."
                      }
                      className="flex-1 text-[11.5px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#0a1e3a] focus:ring-1 focus:ring-[#0a1e3a]/20 placeholder:text-slate-400 transition-all font-sans"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-8 h-8 rounded-xl bg-[#0a1e3a] hover:bg-[#142e54] text-white disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 px-0.5">
                    <span>
                      Active: <strong className="text-slate-600 font-semibold">{program} S{semester} Sec {section}</strong>
                    </span>
                    <span>Press <kbd className="px-1 py-0.2 bg-slate-100 rounded border border-slate-200 text-[8px]">Enter</kbd> to submit</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
