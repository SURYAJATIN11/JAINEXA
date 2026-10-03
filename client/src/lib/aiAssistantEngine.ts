import {
  collegeBatches,
  collegeFaculty,
  collegeFacultyNames,
  collegeRooms,
  collegeSubjects,
  getSubjectByCode,
  getAllClassTeachers,
  CollegeBatch,
} from "@/data/collegeData";
import { CAMPUS_FLOORS, BuildingRoom } from "@/data/floorPlanData";
import { User } from "@/contexts/AuthContext";

export interface SessionItem {
  day: string;
  period: string;
  periodNumber: number;
  timeLabel: string;
  subject: string;
  code: string;
  room: string;
  faculty: string;
  type: string;
  isCurrent?: boolean;
  isNext?: boolean;
}

export interface AssistantResponse {
  id: string;
  sender: "assistant";
  timestamp: string;
  text: string;
  actionData?: {
    type: "sessions" | "room" | "rooms_list" | "free_slots" | "faculty_card" | "navigation";
    title?: string;
    sessions?: SessionItem[];
    room?: BuildingRoom;
    rooms?: Array<{
      code: string;
      name: string;
      floor: number;
      category: string;
      capacity: number;
      block: string;
    }>;
    freeSlots?: Array<{
      day: string;
      period: string;
      timeLabel: string;
    }>;
    navigationTarget?: {
      view: "student" | "faculty" | "floor-plan" | "roomware";
      param?: string;
    };
  };
}

export const PERIOD_TIMES: Record<string, { label: string; startMin: number; endMin: number }> = {
  "1": { label: "P1 · 8:45–9:35 AM", startMin: 8 * 60 + 45, endMin: 9 * 60 + 35 },
  "2": { label: "P2 · 9:40–10:30 AM", startMin: 9 * 60 + 40, endMin: 10 * 60 + 30 },
  "3": { label: "P3 · 10:35–11:25 AM", startMin: 10 * 60 + 35, endMin: 11 * 60 + 25 },
  "4": { label: "P4 · 11:30–12:20 PM", startMin: 11 * 60 + 30, endMin: 12 * 60 + 20 },
  "5": { label: "P5 · 12:25–1:15 PM", startMin: 12 * 60 + 25, endMin: 13 * 60 + 15 },
  "6": { label: "P6 · 1:20–2:10 PM", startMin: 13 * 60 + 20, endMin: 14 * 60 + 10 },
  "7": { label: "P7 · 2:15–3:05 PM", startMin: 14 * 60 + 15, endMin: 15 * 60 + 5 },
  "8": { label: "P8 · 3:10–4:00 PM", startMin: 15 * 60 + 10, endMin: 16 * 60 + 0 },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAY_MAP: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};
const FULL_TO_SHORT_DAY: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

export function getEffectiveDayName(now: Date = new Date()): string {
  const day = DAY_NAMES[now.getDay()];
  return day === "Sunday" ? "Monday" : day;
}

export function getCurrentPeriodNumber(now: Date = new Date()): { current: number | null; next: number | null } {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let current: number | null = null;
  let next: number | null = null;

  for (let p = 1; p <= 8; p++) {
    const time = PERIOD_TIMES[String(p)];
    if (currentMinutes >= time.startMin && currentMinutes <= time.endMin) {
      current = p;
      next = p < 8 ? p + 1 : null;
      break;
    }
    if (currentMinutes < time.startMin) {
      next = p;
      break;
    }
  }

  return { current, next };
}

export function resolveStudentBatch(user: User | null): { program: string; semester: string; section: string; key: string } {
  if (user && user.roleType === "student") {
    const dept = user.department || "";
    if (dept.includes("CSE-GEN") || dept.includes("Section F")) {
      return { program: "CSE-GEN", semester: "3", section: "F", key: "CSE-GEN|3|F" };
    }
    if (dept.includes("AIDE")) {
      return { program: "AIDE", semester: "1", section: "A", key: "AIDE|1|A" };
    }
  }
  return { program: "CSE-GEN", semester: "3", section: "F", key: "CSE-GEN|3|F" };
}

export function resolveFacultyKey(user: User | null): string | null {
  if (!user || user.roleType !== "faculty") return null;

  const target = user.name.toLowerCase();
  for (const name of collegeFacultyNames) {
    const cleanName = name.split(" - ")[0].trim().toLowerCase();
    if (target.includes(cleanName) || cleanName.includes(target)) {
      return name;
    }
  }
  if (user.id.includes("punyasamudran") || target.includes("punyasamudran")) {
    const match = collegeFacultyNames.find((n) => n.toLowerCase().includes("punyasamudran"));
    if (match) return match;
  }
  if (user.id.includes("vidhya") || target.includes("vidhya")) {
    const match = collegeFacultyNames.find((n) => n.toLowerCase().includes("vidhya"));
    if (match) return match;
  }
  if (user.id.includes("saravanakumar") || target.includes("saravanakumar")) {
    const match = collegeFacultyNames.find((n) => n.toLowerCase().includes("saravanakumar"));
    if (match) return match;
  }
  if (user.id.includes("aishwarya") || target.includes("aishwarya")) {
    const match = collegeFacultyNames.find((n) => n.toLowerCase().includes("aishwarya"));
    if (match) return match;
  }
  return collegeFacultyNames[0] || null;
}

export function findRoomDetails(query: string): BuildingRoom | null {
  const clean = query.trim().toUpperCase();
  for (const floor of CAMPUS_FLOORS) {
    for (const room of floor.rooms) {
      if (
        room.code.toUpperCase() === clean ||
        room.id.toUpperCase() === clean ||
        clean.includes(room.code.toUpperCase()) ||
        room.name.toUpperCase().includes(clean)
      ) {
        return room;
      }
    }
  }
  return null;
}

export function getBatchSessionsForDay(batchKey: string, dayShort: string): SessionItem[] {
  const batch = collegeBatches[batchKey];
  if (!batch) return [];

  const [program, semester, section] = batchKey.split("|");
  const dayGrid = (batch.grid as Record<string, Record<string, { text: string; type: string; colspan: number }>>)[dayShort] || {};
  const sessions: SessionItem[] = [];

  for (let p = 1; p <= 8; p++) {
    const cell = dayGrid[String(p)];
    if (!cell || !cell.text || cell.type === "free" || cell.type === "lunch" || cell.type === "lab-continue") {
      continue;
    }
    const [codePart, ...roomParts] = cell.text.split(" in ");
    const code = codePart.replace(/\(L\)/i, "").trim();
    const room = roomParts.join(" in ").trim() || "Assigned Classroom";
    const sub = getSubjectByCode(code, program, semester, section);

    sessions.push({
      day: SHORT_DAY_MAP[dayShort] || dayShort,
      period: `P${p}`,
      periodNumber: p,
      timeLabel: PERIOD_TIMES[String(p)]?.label || `Period ${p}`,
      subject: sub?.name || code,
      code,
      room,
      faculty: sub?.faculty || "Department Faculty",
      type: cell.type === "lab" || /\(L\)/i.test(cell.text) ? "Lab" : "Lecture",
    });
  }

  return sessions;
}

export function getFacultySessionsForDay(facultyName: string, dayShort: string): SessionItem[] {
  const facSchedule = collegeFaculty[facultyName as keyof typeof collegeFaculty];
  if (!facSchedule) return [];

  const dayGrid = (facSchedule.grid as Record<string, Record<string, { text: string; type: string; colspan: number }>>)[dayShort] || {};
  const sessions: SessionItem[] = [];

  for (let p = 1; p <= 8; p++) {
    const cell = dayGrid[String(p)];
    if (!cell || !cell.text || cell.type === "free" || cell.type === "lunch" || cell.type === "lab-continue") {
      continue;
    }
    const [codePart, ...roomParts] = cell.text.split(" in ");
    const code = codePart.replace(/\(L\)/i, "").trim();
    const room = roomParts.join(" in ").trim() || "Classroom";

    sessions.push({
      day: SHORT_DAY_MAP[dayShort] || dayShort,
      period: `P${p}`,
      periodNumber: p,
      timeLabel: PERIOD_TIMES[String(p)]?.label || `Period ${p}`,
      subject: code,
      code,
      room,
      faculty: facultyName.split(" - ")[0],
      type: cell.type === "lab" || /\(L\)/i.test(cell.text) ? "Lab" : "Lecture",
    });
  }

  return sessions;
}

export function calculateFacultyWeeklyLoad(facultyName: string): { totalHours: number; lectureCount: number; labCount: number } {
  const facSchedule = collegeFaculty[facultyName as keyof typeof collegeFaculty];
  if (!facSchedule) return { totalHours: 0, lectureCount: 0, labCount: 0 };

  let totalHours = 0;
  let lectureCount = 0;
  let labCount = 0;

  for (const day of facSchedule.days) {
    const grid = (facSchedule.grid as Record<string, Record<string, { text: string; type: string; colspan: number }>>)[day] || {};
    for (const p of facSchedule.periods) {
      const cell = grid[p];
      if (!cell || !cell.text || cell.type === "free" || cell.type === "lunch" || cell.type === "lab-continue") continue;
      const isLab = cell.type === "lab" || /\(L\)/i.test(cell.text);
      const span = cell.colspan || 1;
      totalHours += span;
      if (isLab) labCount += span;
      else lectureCount += span;
    }
  }

  return { totalHours, lectureCount, labCount };
}

export function getFacultyFreePeriods(facultyName: string, dayShort: string): Array<{ period: string; timeLabel: string }> {
  const facSchedule = collegeFaculty[facultyName as keyof typeof collegeFaculty];
  if (!facSchedule) return [];

  const grid = (facSchedule.grid as Record<string, Record<string, { text: string; type: string; colspan: number }>>)[dayShort] || {};
  const free: Array<{ period: string; timeLabel: string }> = [];

  for (let p = 1; p <= 8; p++) {
    const cell = grid[String(p)];
    const isOccupied = cell && cell.text && cell.type !== "free" && cell.type !== "lunch";
    if (!isOccupied) {
      free.push({
        period: `P${p}`,
        timeLabel: PERIOD_TIMES[String(p)]?.label || `Period ${p}`,
      });
    }
  }
  return free;
}

export async function processCampusQuery(
  rawQuery: string,
  user: User | null
): Promise<AssistantResponse> {
  const q = rawQuery.trim().toLowerCase();
  const now = new Date();
  const todayName = getEffectiveDayName(now);
  const todayShort = FULL_TO_SHORT_DAY[todayName] || "Mon";
  const { current: currentP, next: nextP } = getCurrentPeriodNumber(now);

  const isStudent = !user || user.roleType === "student";
  const isFaculty = user?.roleType === "faculty";
  const studentBatch = resolveStudentBatch(user);
  const facultyKey = resolveFacultyKey(user);

  // 1. GREETING / CAPABILITIES
  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q.includes("who are you") ||
    q.includes("what can you do") ||
    q === "help"
  ) {
    if (isFaculty) {
      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Hello ${user?.name || "Professor"} 👋
I am your **Campus Timetable AI Copilot**, configured for **Faculty Assistance**.

Here are some things you can ask me:
- *"What are my lectures today?"*
- *"Am I free in Period 4 on Wednesday?"*
- *"What is my total teaching load this week?"*
- *"Where is Room 204 located?"*
- *"Find an empty classroom on Floor 2 in Period 3"*
- *"Who is the class teacher of CSE-GEN Section F?"*`,
      };
    } else {
      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Hello ${user?.name || "Student"} 👋
I am your **Campus Timetable AI Copilot**, ready to help with your classes, rooms, and faculty schedules.

You can ask me questions like:
- *"What is my schedule today?"*
- *"Where is my next class?"*
- *"Who teaches Chemistry / Operating Systems?"*
- *"Where is Room 204 or LAB-2 located?"*
- *"When are our lab sessions this week?"*
- *"Who is our Class Teacher?"*`,
      };
    }
  }

  // 2. NEXT CLASS / WHERE IS MY CLASS NOW
  if (
    q.includes("next class") ||
    q.includes("next lecture") ||
    q.includes("current class") ||
    q.includes("where is my class") ||
    q.includes("what is next")
  ) {
    if (isFaculty && facultyKey) {
      const sessions = getFacultySessionsForDay(facultyKey, todayShort);
      if (sessions.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `You have **no lectures scheduled for today (${todayName})**. You have a free schedule!`,
        };
      }

      const targetPeriod = currentP || nextP || 1;
      const upcoming = sessions.find((s) => s.periodNumber >= targetPeriod) || sessions[0];
      const roomDetails = findRoomDetails(upcoming.room);

      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Your Next Lecture Today (${todayName})
Your upcoming session is **${upcoming.subject}** during **${upcoming.period} (${upcoming.timeLabel})**.

- **Room**: **${upcoming.room}** ${roomDetails ? `(${roomDetails.block}, Floor ${roomDetails.floor})` : ""}
- **Session Type**: ${upcoming.type}`,
        actionData: {
          type: "sessions",
          title: "Next Scheduled Lecture",
          sessions: [{ ...upcoming, isNext: true }],
          room: roomDetails || undefined,
        },
      };
    } else {
      const sessions = getBatchSessionsForDay(studentBatch.key, todayShort);
      if (sessions.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `You have **no classes scheduled for today (${todayName})** for **${studentBatch.program} ${studentBatch.section}**.`,
        };
      }

      const targetPeriod = currentP || nextP || 1;
      const upcoming = sessions.find((s) => s.periodNumber >= targetPeriod) || sessions[0];
      const roomDetails = findRoomDetails(upcoming.room);

      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Your Next Class Today (${todayName})
Your upcoming class for **${studentBatch.program} Section ${studentBatch.section}** is:

- **Subject**: **${upcoming.subject}** (${upcoming.code})
- **Period**: **${upcoming.period}** (${upcoming.timeLabel})
- **Room**: **${upcoming.room}** ${roomDetails ? `· **${roomDetails.block} (Floor ${roomDetails.floor})**` : ""}
- **Faculty**: **${upcoming.faculty}**
- **Type**: ${upcoming.type}`,
        actionData: {
          type: "sessions",
          title: "Upcoming Session",
          sessions: [{ ...upcoming, isNext: true }],
          room: roomDetails || undefined,
        },
      };
    }
  }

  // 3. TODAY'S / TOMORROW'S / SPECIFIC DAY SCHEDULE
  const dayMatch = Object.keys(FULL_TO_SHORT_DAY).find((d) => q.includes(d.toLowerCase()));
  const isTomorrow = q.includes("tomorrow");
  const isToday = q.includes("today") || (!dayMatch && !isTomorrow && (q.includes("schedule") || q.includes("classes") || q.includes("timetable") || q.includes("lectures")));

  if (isToday || isTomorrow || dayMatch) {
    let targetDayFull = todayName;
    if (isTomorrow) {
      const tomorrowIndex = (now.getDay() + 1) % 7;
      const tomorrowName = DAY_NAMES[tomorrowIndex];
      targetDayFull = tomorrowName === "Sunday" ? "Monday" : tomorrowName;
    } else if (dayMatch) {
      targetDayFull = dayMatch;
    }

    const targetDayShort = FULL_TO_SHORT_DAY[targetDayFull] || "Mon";

    if (isFaculty && facultyKey) {
      const sessions = getFacultySessionsForDay(facultyKey, targetDayShort);
      if (sessions.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `You have **no lectures scheduled on ${targetDayFull}**. Your day is completely free for research and administrative work!`,
        };
      }

      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Teaching Schedule for ${targetDayFull}
You have **${sessions.length} session(s)** scheduled on ${targetDayFull}:`,
        actionData: {
          type: "sessions",
          title: `${user?.name || "Faculty"} · ${targetDayFull} Schedule`,
          sessions,
        },
      };
    } else {
      const sessions = getBatchSessionsForDay(studentBatch.key, targetDayShort);
      if (sessions.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `No classes scheduled on **${targetDayFull}** for **${studentBatch.program} Section ${studentBatch.section}**.`,
        };
      }

      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Class Schedule for ${targetDayFull}
Here is the timetable for **${studentBatch.program} Sem ${studentBatch.semester} Section ${studentBatch.section}** (${sessions.length} classes):`,
        actionData: {
          type: "sessions",
          title: `${studentBatch.program} Sec ${studentBatch.section} · ${targetDayFull}`,
          sessions,
        },
      };
    }
  }

  // 4. FREE PERIODS / AM I FREE
  if (q.includes("free in") || q.includes("free period") || q.includes("free slot") || q.includes("am i free")) {
    if (isFaculty && facultyKey) {
      const periodMatch = q.match(/p(?:eriod)?\s*([1-8])/i);
      if (periodMatch) {
        const pNum = periodMatch[1];
        const sessions = getFacultySessionsForDay(facultyKey, todayShort);
        const occupied = sessions.find((s) => s.periodNumber === parseInt(pNum, 10));

        if (occupied) {
          return {
            id: crypto.randomUUID(),
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: `❌ **You are NOT free during Period ${pNum}** today (${todayName}).
You are teaching **${occupied.subject}** in **Room ${occupied.room}** (${PERIOD_TIMES[pNum]?.label}).`,
            actionData: {
              type: "sessions",
              sessions: [occupied],
            },
          };
        } else {
          return {
            id: crypto.randomUUID(),
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: `✅ **Yes, you are completely free during Period ${pNum}** today (${todayName}, ${PERIOD_TIMES[pNum]?.label}). You have no teaching assignment.`,
          };
        }
      }

      const freeSlots = getFacultyFreePeriods(facultyKey, todayShort);
      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Free Time Slots Today (${todayName})
You have **${freeSlots.length} free periods** today:`,
        actionData: {
          type: "free_slots",
          freeSlots: freeSlots.map((f) => ({ day: todayName, period: f.period, timeLabel: f.timeLabel })),
        },
      };
    } else {
      const sessions = getBatchSessionsForDay(studentBatch.key, todayShort);
      const occupiedPeriods = new Set(sessions.map((s) => s.periodNumber));
      const freeSlots = [1, 2, 3, 4, 5, 6, 7, 8]
        .filter((p) => !occupiedPeriods.has(p))
        .map((p) => ({
          day: todayName,
          period: `P${p}`,
          timeLabel: PERIOD_TIMES[String(p)]?.label || `Period ${p}`,
        }));

      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Free Periods Today for ${studentBatch.program} Sec ${studentBatch.section}
You have **${freeSlots.length} free slot(s)** today (${todayName}):`,
        actionData: {
          type: "free_slots",
          freeSlots,
        },
      };
    }
  }

  // 5. WORKLOAD & TEACHING HOURS (For Faculty)
  if (q.includes("workload") || q.includes("hours do i teach") || q.includes("teaching hours") || q.includes("weekly load")) {
    if (facultyKey) {
      const { totalHours, lectureCount, labCount } = calculateFacultyWeeklyLoad(facultyKey);
      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Weekly Teaching Workload Summary
**Faculty:** ${facultyKey}

- ⏱️ **Total Contact Hours:** **${totalHours} hours / week**
- 📖 **Theory Lectures:** **${lectureCount} hours**
- 🔬 **Laboratory Sessions:** **${labCount} hours**
- ⚖️ **Workload Balance:** ${
          totalHours > 18 ? "⚠️ High (above 18 hours)" : totalHours >= 12 ? "✅ Optimal academic load" : "🟢 Light load"
        }`,
      };
    }
  }

  // 6. ROOM LOOKUP & LOCATION ("where is room 204", "location of lab 2")
  if (q.includes("room") || q.includes("lab") || q.includes("hall") || q.includes("where is")) {
    const roomMatch = q.match(/(?:room|lab|hall)?\s*([a-z0-9-]+)/i);
    const candidateQuery = roomMatch ? roomMatch[1] : q;

    for (const floor of CAMPUS_FLOORS) {
      for (const room of floor.rooms) {
        if (
          q.includes(room.code.toLowerCase()) ||
          q.includes(room.name.toLowerCase()) ||
          room.code.toLowerCase() === candidateQuery.toLowerCase()
        ) {
          return {
            id: crypto.randomUUID(),
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: `### 📍 Room Location: ${room.name} (${room.code})
- **Floor**: **${floor.levelTitle}**
- **Building Block**: **${room.block}**
- **Category**: ${room.category.toUpperCase()}
- **Seating Capacity**: **${room.capacity} seats** (${room.areaSqm} m²)
- **Facilities**: ${room.facilities.join(", ")}
- **Description**: ${room.description}`,
            actionData: {
              type: "room",
              room,
              navigationTarget: {
                view: "floor-plan",
                param: String(floor.floorNumber),
              },
            },
          };
        }
      }
    }
  }

  // 7. WHO TEACHES [SUBJECT]
  if (q.includes("who teaches") || q.includes("faculty for") || q.includes("teacher for") || q.includes("professor for")) {
    const cleanSubQuery = q
      .replace(/who teaches/i, "")
      .replace(/faculty for/i, "")
      .replace(/teacher for/i, "")
      .replace(/professor for/i, "")
      .trim();

    const batch = collegeBatches[studentBatch.key];
    const foundInBatch = (batch?.subjects as any[] || []).filter(
      (s) =>
        s.name.toLowerCase().includes(cleanSubQuery) ||
        s.code.toLowerCase().includes(cleanSubQuery)
    );

    if (foundInBatch.length > 0) {
      const listText = foundInBatch
        .map((s) => `- **${s.name}** (${s.code}): Taught by **${s.faculty || "Assigned Faculty"}**`)
        .join("\n");

      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Subject Faculty Assignment
For **${studentBatch.program} Section ${studentBatch.section}**:

${listText}`,
      };
    }

    const globalFound = collegeSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(cleanSubQuery) ||
        s.codes.some((c) => c.toLowerCase().includes(cleanSubQuery))
    );

    if (globalFound.length > 0) {
      const topMatches = globalFound.slice(0, 3);
      const listText = topMatches
        .map((s) => `- **${s.name}** (${s.codes.join(", ")})`)
        .join("\n");

      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Found subject(s) in the college catalog:
${listText}

*(Tip: Inquire about a specific batch like "Who teaches Chemistry in CSE-GEN F?" for exact faculty assignments.)*`,
      };
    }
  }

  // 8. CLASS TEACHER LOOKUP
  if (q.includes("class teacher") || q.includes("mentor") || q.includes("coordinator")) {
    const classTeachers = getAllClassTeachers();
    const myClassTeacher = classTeachers.find((ct) => ct.key === studentBatch.key);

    if (myClassTeacher) {
      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### 🎓 Class Teacher
The designated Class Teacher for **${studentBatch.program} Sem ${studentBatch.semester} Section ${studentBatch.section}** is:

👉 **${myClassTeacher.classTeacher}**
Departmental office is located in Block A.`,
      };
    }
  }

  // 9. FACULTY SEARCH / FACULTY TIMETABLE LOOKUP
  const matchedFaculty = collegeFacultyNames.find((name) => {
    const nameOnly = name.split(" - ")[0].toLowerCase();
    return q.includes(nameOnly.toLowerCase()) || nameOnly.split(" ").some((part) => part.length > 3 && q.includes(part));
  });

  if (matchedFaculty) {
    const sessionsToday = getFacultySessionsForDay(matchedFaculty, todayShort);
    const { totalHours } = calculateFacultyWeeklyLoad(matchedFaculty);

    return {
      id: crypto.randomUUID(),
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `### Faculty Details: ${matchedFaculty}
- ⏱️ **Total Weekly Teaching:** **${totalHours} hours**
- 📅 **Sessions Today (${todayName}):** ${sessionsToday.length} lecture(s)/lab(s) scheduled.`,
      actionData: {
        type: "sessions",
        title: `${matchedFaculty.split(" - ")[0]} · ${todayName}`,
        sessions: sessionsToday,
      },
    };
  }

  // 10. LAB SESSIONS LOOKUP
  if (q.includes("lab") || q.includes("practical")) {
    const batch = collegeBatches[studentBatch.key];
    const labSessions: SessionItem[] = [];

    if (batch) {
      for (const day of batch.days) {
        const sessions = getBatchSessionsForDay(studentBatch.key, day);
        labSessions.push(...sessions.filter((s) => s.type === "Lab"));
      }
    }

    if (labSessions.length > 0) {
      return {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### Weekly Laboratory Schedule
Here are all the lab sessions scheduled for **${studentBatch.program} Section ${studentBatch.section}**:`,
        actionData: {
          type: "sessions",
          title: "Weekly Lab Schedule",
          sessions: labSessions,
        },
      };
    }
  }

  // 11. FALLBACK / GENERAL HELPFUL GUIDE
  return {
    id: crypto.randomUUID(),
    sender: "assistant",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text: `I couldn't pinpoint an exact record for *"**${rawQuery}**"*. 

Here are some quick things you can ask me:
- **"What is my schedule today?"** (Shows all classes for your cohort)
- **"Where is my next class?"** (Points to upcoming period & room location)
- **"Where is Room 215B?"** (Displays floor plan & capacity)
- **"Who teaches Operating Systems?"** (Finds assigned professor)
- **"Am I free in Period 4?"** (Checks free/busy slots)
- **"Who is our class teacher?"**`,
  };
}
