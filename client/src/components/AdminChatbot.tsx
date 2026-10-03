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
  removeStudentRecord,
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
  | "faculty_add_name"
  | "faculty_add_dept"
  | "faculty_add_phone"
  | "faculty_add_code"
  | "faculty_remove_select"
  | "faculty_assign_code_select"
  | "faculty_assign_code_input"
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

  const programMatch = text.match(/\b(CSE-GEN|CSE-DS|CSE-AIML|AIML|DS|AIDE|CSE|MCA|MBA|SE|AI-DevOPS)\b/i);
  if (programMatch) result.program = programMatch[1].toUpperCase();

  const semMatch = text.match(/(?:sem(?:ester)?\s*(\d)|(\d)(?:st|nd|rd|th)\s*sem)/i);
  if (semMatch) result.semester = semMatch[1] || semMatch[2];

  const secMatch = text.match(/(?:sec(?:tion)?\s*([A-Z])|\b([A-Z])\s*section)/i);
  if (secMatch) result.section = (secMatch[1] || secMatch[2]).toUpperCase();

  return result;
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

  const startAddFacultyFlow = useCallback(() => {
    setFacultyDraft({});
    setMode("faculty_add_name");

    addMsg({
      text: `👨‍🏫 **Register New Faculty — Step 1/4: Faculty Name**\n\nWhat is the full name of the new faculty member?\nExample: \`Dr. Ramesh Kumar\` or \`Prof. Anita Sharma\``,
      status: "info",
      actions: [{ label: "❌ Cancel", variant: "danger", fn: cancelFlow }]
    });
  }, [addMsg, cancelFlow]);

  const handleFacultyAddName = (text: string) => {
    addMsg({ role: "user", text });
    const name = text.trim();
    setFacultyDraft((prev) => ({ ...prev, name }));
    setMode("faculty_add_dept");

    addMsg({
      text: `🏛️ **Register New Faculty — Step 2/4: Department**\n\nFaculty: **${name}**\nWhich department do they belong to? Pick a suggestion or type custom department:`,
      status: "info",
      actions: [
        { label: "Computer Science & Engineering", fn: () => handleFacultyAddDept("Computer Science & Engineering") },
        { label: "Information Science & Engineering", fn: () => handleFacultyAddDept("Information Science & Engineering") },
        { label: "Department of Mathematics", fn: () => handleFacultyAddDept("Department of Mathematics") },
        { label: "Department of Chemistry & Basic Sciences", fn: () => handleFacultyAddDept("Department of Chemistry & Basic Sciences") },
        { label: "Humanities & Social Sciences", fn: () => handleFacultyAddDept("Humanities & Social Sciences") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const handleFacultyAddDept = (text: string) => {
    addMsg({ role: "user", text });
    const department = text.trim();
    setFacultyDraft((prev) => ({ ...prev, department }));
    setMode("faculty_add_phone");

    addMsg({
      text: `📱 **Register New Faculty — Step 3/4: Mobile Number**\n\nDepartment: **${department}**\nWhat is their registered 10-digit mobile number for portal authentication?\nExample: \`9845019001\``,
      status: "info",
      actions: [
        { label: "Auto: 9845019001", fn: () => handleFacultyAddPhone("9845019001") },
        { label: "Auto: 9845019002", fn: () => handleFacultyAddPhone("9845019002") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const handleFacultyAddPhone = (text: string) => {
    addMsg({ role: "user", text });
    const phone = text.replace(/[^0-9]/g, "").slice(-10);
    if (phone.length < 10) {
      addMsg({ text: "⚠️ Please enter a valid 10-digit mobile number.", status: "warning" });
      return;
    }
    setFacultyDraft((prev) => ({ ...prev, phone }));
    setMode("faculty_add_code");

    const defaultCode = `JGI-FAC-${phone.slice(-4)}`;

    addMsg({
      text: `🔑 **Register New Faculty — Step 4/4: Faculty Passcode & Role**\n\nMobile: **${phone}**\nWhat faculty verification code and designation should be assigned?\n(Pick a passcode or type your own code):`,
      status: "info",
      actions: [
        { label: `Auto Code: ${defaultCode}`, variant: "primary", fn: () => finalizeAddFaculty(`${defaultCode} Assistant Professor`) },
        { label: "JGI-FAC-2026 (Assistant Professor)", fn: () => finalizeAddFaculty("JGI-FAC-2026 Assistant Professor") },
        { label: "JGI-FAC-3001 (Associate Professor)", fn: () => finalizeAddFaculty("JGI-FAC-3001 Associate Professor") },
        { label: "JGI-FAC-5001 (Professor)", fn: () => finalizeAddFaculty("JGI-FAC-5001 Professor") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const finalizeAddFaculty = (text: string) => {
    addMsg({ role: "user", text });
    const codeMatch = text.match(/\b([A-Za-z0-9_-]+)\b/);
    const code = codeMatch ? codeMatch[1].toUpperCase() : `JGI-FAC-${facultyDraft.phone?.slice(-4) || "2026"}`;
    const designation = text.includes("Professor") ? text.replace(code, "").trim() || "Assistant Professor" : "Assistant Professor";

    const name = facultyDraft.name || "New Faculty";
    const phone = facultyDraft.phone || "9845019001";
    const department = facultyDraft.department || "Computer Science & Engineering";

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

    addMsg({
      text: `🎉 **Faculty Member Successfully Registered!**\n\n• 👨‍🏫 **Name:** **${name}**\n• 🏛️ **Department:** ${department}\n• 📱 **Registered Phone:** \`${phone}\`\n• 🔑 **Faculty Passcode:** \`${code}\`\n• 🎖️ **Designation:** ${designation}\n\n✅ **Instant Live Access:** This faculty member can now log in immediately on the homepage using their Phone (\`${phone}\`) and Code (\`${code}\`), and will appear in timetable scheduling!`,
      status: "ok",
      actions: [
        { label: "👨‍🏫 Add Another Faculty", variant: "primary", fn: () => startAddFacultyFlow() },
        { label: "📋 List All Faculty", fn: () => handleGeneralCommand("list all faculty") }
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

  const startAddStudentFlow = useCallback(() => {
    setStudentDraft({});
    setMode("student_add_name");

    addMsg({
      text: `🎓 **Register New Student — Step 1/4: Student Full Name**\n\nWhat is the student's registered full name?\nExample: \`ARJUN PATEL\` or \`PRIYA KRISHNA\``,
      status: "info",
      actions: [{ label: "❌ Cancel", variant: "danger", fn: cancelFlow }]
    });
  }, [addMsg, cancelFlow]);

  const handleStudentAddName = (text: string) => {
    addMsg({ role: "user", text });
    const name = text.trim().toUpperCase();
    setStudentDraft((prev) => ({ ...prev, name }));
    setMode("student_add_usn");

    addMsg({
      text: `🆔 **Register New Student — Step 2/4: University USN**\n\nStudent: **${name}**\nWhat is their University Seat Number (USN)?\nExample: \`25BTRGA075\` or \`25BTDS050\``,
      status: "info",
      actions: [
        { label: "Auto: 25BTRGA075", fn: () => handleStudentAddUSN("25BTRGA075") },
        { label: "Auto: 25BTRGA080", fn: () => handleStudentAddUSN("25BTRGA080") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const handleStudentAddUSN = (text: string) => {
    addMsg({ role: "user", text });
    const usn = text.trim().toUpperCase();
    setStudentDraft((prev) => ({ ...prev, usn }));
    setMode("student_add_class");

    addMsg({
      text: `🏫 **Register New Student — Step 3/4: Class & Section**\n\nUSN: **${usn}**\nWhich branch, semester, and section should they be enrolled in?`,
      status: "info",
      actions: [
        { label: `✅ Current: ${program} S${semester} Sec ${section}`, variant: "primary", fn: () => handleStudentAddClass(`${program} ${semester} ${section}`) },
        { label: "CSE-GEN · Sem 3 · Sec F", fn: () => handleStudentAddClass("CSE-GEN 3 F") },
        { label: "CSE-DS · Sem 3 · Sec A", fn: () => handleStudentAddClass("CSE-DS 3 A") },
        { label: "AIDE · Sem 1 · Sec A", fn: () => handleStudentAddClass("AIDE 1 A") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const handleStudentAddClass = (text: string) => {
    addMsg({ role: "user", text });
    const parsed = parseClass(text);
    const p = parsed.program || program;
    const s = parsed.semester || semester;
    const sec = parsed.section || section;

    setStudentDraft((prev) => ({ ...prev, program: p, semester: s, section: sec }));
    setMode("student_add_phone");

    const defaultPhone = `9845010${studentDraft.usn?.slice(-3) || "075"}`;

    addMsg({
      text: `📱 **Register New Student — Step 4/4: Registered Mobile Number**\n\nEnrolling in: **${p} Sem ${s} Sec ${sec}**\nWhat 10-digit mobile number will the student use for verification?\n*(Required for exact two-factor authentication)*:`,
      status: "info",
      actions: [
        { label: `Auto: ${defaultPhone}`, variant: "primary", fn: () => finalizeAddStudent(defaultPhone) },
        { label: "Use 9845010001 (Krushna Demo Phone)", fn: () => finalizeAddStudent("9845010001") },
        { label: "❌ Cancel", variant: "danger", fn: cancelFlow }
      ]
    });
  };

  const finalizeAddStudent = (text: string) => {
    addMsg({ role: "user", text });
    const phone = text.replace(/[^0-9]/g, "").slice(-10);

    const name = studentDraft.name || "NEW STUDENT";
    const usn = studentDraft.usn || "25BTRGA075";
    const p = studentDraft.program || program;
    const s = studentDraft.semester || semester;
    const sec = studentDraft.section || section;

    const newStudent: Student = {
      sNo: 99,
      usn,
      name,
      program: p,
      semester: s,
      section: sec,
      phone
    };

    const res = addStudentRecord(newStudent);
    if (!res.success) {
      addMsg({ text: `❌ ${res.error || "Failed to add student."}`, status: "error" });
      setMode("idle");
      return;
    }

    toast.success(`Student ${name} (${usn}) registered successfully!`);
    setMode("idle");
    setStudentDraft({});

    addMsg({
      text: `🎉 **Student Successfully Enrolled!**\n\n• 🎓 **Name:** **${name}**\n• 🆔 **USN:** \`${usn}\`\n• 🏫 **Batch:** **${p} · Semester ${s} · Section ${sec}**\n• 📱 **Registered Phone:** \`${phone}\`\n\n✅ **Instant Live Access:** This student is now enrolled in the official class roster, will appear in attendance marking, and can log in on the homepage using their Phone (\`${phone}\`) and USN (\`${usn}\`)!`,
      status: "ok",
      actions: [
        { label: "🎓 Add Another Student", variant: "primary", fn: () => startAddStudentFlow() },
        { label: "📋 View Enrolled Students", fn: () => handleGeneralCommand("list students") }
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

    // Global cancel / abort
    if (/\b(cancel|stop|exit|abort|nevermind)\b/i.test(t) && mode !== "idle") {
      cancelFlow();
      return;
    }

    // Active wizard step router
    if (mode === "schedule_year_sem") { handleScheduleYearSem(rawText); return; }
    if (mode === "schedule_day_slot") { handleScheduleDaySlot(rawText); return; }
    if (mode === "schedule_subject") { handleScheduleSubject(rawText); return; }
    if (mode === "schedule_teacher") { handleScheduleTeacher(rawText); return; }
    if (mode === "schedule_room_type") { finalizeSchedule(rawText); return; }

    if (mode === "faculty_add_name") { handleFacultyAddName(rawText); return; }
    if (mode === "faculty_add_dept") { handleFacultyAddDept(rawText); return; }
    if (mode === "faculty_add_phone") { handleFacultyAddPhone(rawText); return; }
    if (mode === "faculty_add_code") { finalizeAddFaculty(rawText); return; }
    if (mode === "faculty_remove_select") { handleRemoveFaculty(rawText); return; }

    if (mode === "faculty_assign_code_select") { handleAssignCodeSelect(rawText); return; }
    if (mode === "faculty_assign_code_input") { finalizeAssignCode(rawText); return; }

    if (mode === "student_add_name") { handleStudentAddName(rawText); return; }
    if (mode === "student_add_usn") { handleStudentAddUSN(rawText); return; }
    if (mode === "student_add_class") { handleStudentAddClass(rawText); return; }
    if (mode === "student_add_phone") { finalizeAddStudent(rawText); return; }
    if (mode === "student_remove_select") { handleRemoveStudent(rawText); return; }

    // Feature 5: Assign Special Code to Teachers
    if (
      /\b(feature\s*5|assign\s*(special\s*)?code|teacher\s*code|faculty\s*code|set\s*(special\s*)?code|change\s*(special\s*)?code|update\s*(special\s*)?code)\b/i.test(t) ||
      (t.includes("code") && (t.includes("teacher") || t.includes("faculty") || t.includes("assign")))
    ) {
      startAssignCodeFlow();
      return;
    }

    // Faculty commands
    if (/\b(add|new|register|create)\s*(faculty|teacher|professor)\b/i.test(t)) {
      startAddFacultyFlow();
      return;
    }
    if (/\b(remove|delete|drop)\s*(faculty|teacher|professor)\b/i.test(t)) {
      startRemoveFacultyFlow();
      return;
    }
    if (/\b(list|show|display)\s*(faculty|teachers|professors)\b/i.test(t)) {
      const all = loadAllFaculty();
      const list = all.slice(0, 10).map((f) => `• **${f.name}** — ${f.department} (\`${f.specialCode}\` · 📱 ${f.phone})`).join("\n");
      addMsg({
        text: `👨‍🏫 **Registered University Faculty (${all.length} total):**\n\n${list}\n\n*(Showing top 10)*`,
        status: "info",
        actions: [
          { label: "👨‍🏫 Add New Faculty", variant: "primary", fn: startAddFacultyFlow },
          { label: "❌ Remove Faculty", variant: "danger", fn: startRemoveFacultyFlow }
        ]
      });
      return;
    }

    // Student commands
    if (/\b(add|new|register|enroll|create)\s*(student)\b/i.test(t)) {
      startAddStudentFlow();
      return;
    }
    if (/\b(remove|delete|drop)\s*(student)\b/i.test(t)) {
      startRemoveStudentFlow();
      return;
    }
    if (/\b(list|show|display)\s*(students?|roster)\b/i.test(t)) {
      const all = loadAllStudents();
      const matching = all.filter((s) => s.program === program && s.semester === semester && s.section === section);
      const targetList = matching.length > 0 ? matching : all.slice(0, 10);
      const rows = targetList.map((s) => `• \`${s.usn}\`: **${s.name}** (${s.program} S${s.semester} ${s.section})`).join("\n");
      addMsg({
        text: `🎓 **Enrolled Students in ${program} S${semester} Sec ${section}** (${matching.length || all.length} total):\n\n${rows}`,
        status: "info",
        actions: [
          { label: "🎓 Add New Student", variant: "primary", fn: startAddStudentFlow },
          { label: "❌ Remove Student", variant: "danger", fn: startRemoveStudentFlow }
        ]
      });
      return;
    }

    // User management summary
    if (/\b(manage\s*(users?|faculty|students?)|user\s*management)\b/i.test(t)) {
      addMsg({
        text: `👥 **JAINEXA User & Credential Controller**\n\nAs Master Administrator, you have complete authority to manage teachers and students:\n\n• **Faculty:** Add new professors, set department, phone and special code for portal authentication.\n• **Students:** Enroll new students with USN and phone, granting immediate access to class timetables & attendance.`,
        status: "info",
        actions: [
          { label: "👨‍🏫 Add Faculty", variant: "primary", fn: startAddFacultyFlow },
          { label: "❌ Remove Faculty", variant: "danger", fn: startRemoveFacultyFlow },
          { label: "🎓 Add Student", variant: "primary", fn: startAddStudentFlow },
          { label: "❌ Remove Student", variant: "danger", fn: startRemoveStudentFlow }
        ]
      });
      return;
    }

    // Schedule class commands
    if (/\b(add|schedule|create|update|change|modify|assign|new)\s*(session|class|slot|period|timetable|subject|lecture|lab)?\b/i.test(t)) {
      startScheduleFlow();
      return;
    }

    // Help
    if (/\b(help|commands?|usage|what can you)\b/i.test(t)) {
      addMsg({
        text: `**JAINEXA Admin Assistant Guide**\n\n⚡ **1. Class Scheduling:**\n• *"schedule class"* — multi-turn interview for Year, Slot, Subject, Teacher & Room\n• *"publish draft"* / *"revert draft"* / *"reset baseline"*\n\n👨‍🏫 **2. Faculty Operations:**\n• *"add faculty"* — register a new professor with department, phone, and passcode\n• *"remove faculty"* — revoke credentials for any faculty\n• *"list faculty"* — view all registered teachers\n\n🎓 **3. Student Operations:**\n• *"add student"* — enroll student with USN, batch, and phone for 2FA access\n• *"remove student"* — drop student from roster\n• *"list students"* — view class enrollment\n\n🔧 **4. Campus Facilities & Roomware:**\n• *"list issues"* / *"resolve issue in room 105"*\n\n🔑 **5. Feature 5: Assign Teacher Special Code:**\n• *"assign teacher code"* / *"set faculty code"* — assign a unique code to any teacher; teachers must log in with that code ONLY (all bypasses wiped clean)!`,
        status: "info",
        actions: [
          { label: "⚡ Schedule Class", variant: "primary", fn: () => startScheduleFlow() },
          { label: "🔑 Feature 5: Assign Code", fn: startAssignCodeFlow },
          { label: "👨‍🏫 Add Faculty", fn: startAddFacultyFlow },
          { label: "🎓 Add Student", fn: startAddStudentFlow },
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
                        mode === "faculty_add_name"
                          ? "Type Faculty Name (e.g. Dr. Ramesh Kumar)..."
                          : mode === "faculty_add_phone"
                          ? "Type 10-digit mobile number..."
                          : mode === "student_add_name"
                          ? "Type Student Full Name..."
                          : mode === "student_add_usn"
                          ? "Type University USN (e.g. 25BTRGA075)..."
                          : mode === "student_add_phone"
                          ? "Type student registered phone..."
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
