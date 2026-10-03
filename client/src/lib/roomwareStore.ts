// Reactive Roomware & Wear-and-Tear Store for College Timetable AI
// Manages real-time room issues, student reports, upvotes, and notifications with localStorage persistence.

export type IssueCategory =
  | "ac"
  | "projector"
  | "audio"
  | "electrical"
  | "furniture"
  | "smartboard"
  | "cleanliness"
  | "other";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export type IssueStatus = "open" | "investigating" | "in_progress" | "resolved";

export interface RoomIssue {
  id: string;
  roomName: string; // e.g. "105 Room" or "102 [AC] Room"
  roomCode: string; // e.g. "105", "102", "114B"
  category: IssueCategory;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reportedBy: string;
  reporterRole: "Student" | "Faculty" | "Staff" | "Anonymous";
  batch?: string;
  createdAt: string;
  upvotes: number;
  upvotedBy?: string[];
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  classDay?: string; // e.g. "Monday"
  classHour?: string; // e.g. "P1 · 8:45–9:45"
  classSubject?: string; // e.g. "Operating Systems (OS)"
  classBatch?: string; // e.g. "CSE-GEN 3 F"
}

export const CATEGORY_METADATA: Record<
  IssueCategory,
  { label: string; iconName: string; defaultSeverity: IssueSeverity; color: string; badgeBg: string }
> = {
  ac: {
    label: "Air Conditioning / Ventilation",
    iconName: "Wind",
    defaultSeverity: "medium",
    color: "#0284c7",
    badgeBg: "#e0f2fe"
  },
  projector: {
    label: "Projector & AV Display",
    iconName: "MonitorPlay",
    defaultSeverity: "high",
    color: "#d97706",
    badgeBg: "#fef3c7"
  },
  audio: {
    label: "Audio & Microphone",
    iconName: "Mic",
    defaultSeverity: "medium",
    color: "#7c3aed",
    badgeBg: "#ede9fe"
  },
  electrical: {
    label: "Electrical, Lights & Fans",
    iconName: "Zap",
    defaultSeverity: "high",
    color: "#dc2626",
    badgeBg: "#fee2e2"
  },
  furniture: {
    label: "Furniture, Benches & Chairs",
    iconName: "Armchair",
    defaultSeverity: "medium",
    color: "#ca8a04",
    badgeBg: "#fef9c3"
  },
  smartboard: {
    label: "Whiteboard & Smart Board",
    iconName: "PenTool",
    defaultSeverity: "low",
    color: "#0d9488",
    badgeBg: "#ccfbf1"
  },
  cleanliness: {
    label: "Cleanliness & Sanitation",
    iconName: "Sparkles",
    defaultSeverity: "low",
    color: "#16a34a",
    badgeBg: "#dcfce7"
  },
  other: {
    label: "General Wear & Tear",
    iconName: "Wrench",
    defaultSeverity: "medium",
    color: "#475569",
    badgeBg: "#f1f5f9"
  }
};

const STORAGE_KEY = "college_timetable_roomware_issues_v2";

const SEED_ISSUES: RoomIssue[] = [
  {
    id: "rw-105-proj",
    roomName: "105 Room",
    roomCode: "105",
    category: "projector",
    title: "Projector HDMI connection broken / No signal",
    description: "Main ceiling projector displays a flickering blue screen. The HDMI port on the lecturer podium wall is loose and pins are damaged.",
    severity: "high",
    status: "open",
    reportedBy: "Rahul Sharma",
    reporterRole: "Student",
    batch: "CSE S1 A",
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(), // 28 mins ago
    upvotes: 6,
    upvotedBy: ["user-seed-1", "user-seed-2"]
  },
  {
    id: "rw-102-ac",
    roomName: "102 [AC] Room",
    roomCode: "102",
    category: "ac",
    title: "Front left AC unit dripping water & not cooling",
    description: "The AC unit above row 2 makes a loud rattling sound, drips condensation onto desk #6, and temperature remains high during afternoon lectures.",
    severity: "medium",
    status: "in_progress",
    reportedBy: "Priya Krishna",
    reporterRole: "Student",
    batch: "AIDE S1 A",
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(), // 1.25 hours ago
    upvotes: 9,
    upvotedBy: ["user-seed-3"]
  },
  {
    id: "rw-114b-furn",
    roomName: "114B [AC] Room",
    roomCode: "114B",
    category: "furniture",
    title: "Damaged benches & exposed screws in row 4",
    description: "Two shared student desks in the fourth row have broken wooden top joints and wobble dangerously. A sharp fixing bolt is exposed.",
    severity: "medium",
    status: "open",
    reportedBy: "Prof. Anil Rao",
    reporterRole: "Faculty",
    batch: "Faculty · CSE",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    upvotes: 4,
    upvotedBy: []
  },
  {
    id: "rw-204-mic",
    roomName: "204 Room",
    roomCode: "204",
    category: "audio",
    title: "Podium wireless mic dead & speaker humming",
    description: "Microphone receiver battery contacts corroded; podium microphone will not turn on and ceiling speakers emit a 50Hz hum.",
    severity: "high",
    status: "open",
    reportedBy: "Dr. Meera Nair",
    reporterRole: "Faculty",
    batch: "Faculty · Math",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    upvotes: 7,
    upvotedBy: []
  },
  {
    id: "rw-116a-fan",
    roomName: "116A [AC] Room",
    roomCode: "116A",
    category: "electrical",
    title: "Switchboard 3 sparking / 2 ceiling tube lights off",
    description: "The switchboard next to the side door gives small visible sparks when flipping the light switches. Back corner is dim.",
    severity: "critical",
    status: "investigating",
    reportedBy: "Aditya Verma",
    reporterRole: "Student",
    batch: "CSE-AIML S3 A",
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    upvotes: 11,
    upvotedBy: []
  }
];

type RoomwareListener = (issues: RoomIssue[]) => void;
const listeners: Set<RoomwareListener> = new Set();

function notifyListeners(issues: RoomIssue[]) {
  listeners.forEach((listener) => {
    try {
      listener(issues);
    } catch (e) {
      console.error("Error in Roomware listener", e);
    }
  });
}

// Extract clean room code from any string, e.g. "105 Room" -> "105", "114B [AC] Room" -> "114B"
export function extractRoomCode(roomStr: string): string {
  if (!roomStr) return "";
  const match = roomStr.match(/^(\d+[A-Za-z]?)/);
  if (match) return match[1];
  return roomStr.split(" ")[0] || roomStr;
}

export function loadRoomwareIssues(): RoomIssue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ISSUES));
      return SEED_ISSUES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ISSUES));
    return SEED_ISSUES;
  } catch (err) {
    console.error("Failed to load Roomware issues from localStorage", err);
    return SEED_ISSUES;
  }
}

export function saveRoomwareIssues(issues: RoomIssue[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    // Trigger custom event for same window
    window.dispatchEvent(new CustomEvent("roomware-updated", { detail: issues }));
    notifyListeners(issues);
  } catch (err) {
    console.error("Failed to save Roomware issues to localStorage", err);
  }
}

export function reportRoomIssue(input: {
  roomName: string;
  category: IssueCategory;
  title: string;
  description: string;
  severity: IssueSeverity;
  reportedBy: string;
  reporterRole: "Student" | "Faculty" | "Staff" | "Anonymous";
  batch?: string;
  classDay?: string;
  classHour?: string;
  classSubject?: string;
  classBatch?: string;
}): RoomIssue {
  const issues = loadRoomwareIssues();
  const roomCode = extractRoomCode(input.roomName);

  const newIssue: RoomIssue = {
    id: `rw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    roomName: input.roomName,
    roomCode,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    severity: input.severity,
    status: "open",
    reportedBy: input.reportedBy.trim() || "Anonymous Student",
    reporterRole: input.reporterRole,
    batch: input.batch?.trim() || "Student",
    classDay: input.classDay,
    classHour: input.classHour,
    classSubject: input.classSubject,
    classBatch: input.classBatch,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    upvotedBy: ["creator"]
  };

  const updated = [newIssue, ...issues];
  saveRoomwareIssues(updated);
  return newIssue;
}

export function upvoteRoomIssue(issueId: string, userId: string = "browser-user"): boolean {
  const issues = loadRoomwareIssues();
  let changed = false;

  const updated = issues.map((issue) => {
    if (issue.id === issueId) {
      const upvotedBy = issue.upvotedBy || [];
      if (upvotedBy.includes(userId)) {
        // Already upvoted
        return issue;
      }
      changed = true;
      return {
        ...issue,
        upvotes: issue.upvotes + 1,
        upvotedBy: [...upvotedBy, userId]
      };
    }
    return issue;
  });

  if (changed) {
    saveRoomwareIssues(updated);
  }
  return changed;
}

export function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  resolutionNote?: string,
  resolvedBy?: string
): void {
  const issues = loadRoomwareIssues();
  const updated = issues.map((issue) => {
    if (issue.id === issueId) {
      return {
        ...issue,
        status: newStatus,
        resolutionNote: resolutionNote !== undefined ? resolutionNote : issue.resolutionNote,
        resolvedAt: newStatus === "resolved" ? new Date().toISOString() : undefined,
        resolvedBy: resolvedBy || (newStatus === "resolved" ? (issue.resolvedBy || "Student") : undefined)
      };
    }
    return issue;
  });
  saveRoomwareIssues(updated);
}

/**
 * Direct "Issue Resolved" action accessible to students, faculty, and admins.
 */
export function resolveRoomIssue(
  issueId: string,
  resolvedByName: string = "Student",
  note?: string
): void {
  updateIssueStatus(
    issueId,
    "resolved",
    note || `Issue verified and resolved by ${resolvedByName}`,
    resolvedByName
  );
}

export function getIssuesForRoom(roomIdentifier: string, issues?: RoomIssue[]): RoomIssue[] {
  const all = issues || loadRoomwareIssues();
  const targetCode = extractRoomCode(roomIdentifier).toLowerCase();
  const targetName = roomIdentifier.toLowerCase();

  return all.filter((issue) => {
    if (issue.status === "resolved") return false;
    const issueCode = issue.roomCode.toLowerCase();
    const issueName = issue.roomName.toLowerCase();
    return (
      issueCode === targetCode ||
      issueName === targetName ||
      issueName.includes(targetCode) ||
      targetName.includes(issueCode)
    );
  });
}

export function getActiveIssueCount(issues?: RoomIssue[]): number {
  const all = issues || loadRoomwareIssues();
  return all.filter((i) => i.status !== "resolved").length;
}

export function subscribeToRoomwareChanges(callback: RoomwareListener): () => void {
  listeners.add(callback);

  const handleCustom = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      callback(detail);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  window.addEventListener("roomware-updated", handleCustom);
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("roomware-updated", handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}
