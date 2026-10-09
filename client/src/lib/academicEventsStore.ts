/**
 * academicEventsStore.ts
 *
 * Persistent store and sync bus for the Interactive Academic Calendar & Campus Events.
 * Connects directly with the College Timetable System to track:
 *  - Examinations (Mid-terms, Semester Finals, Practical Vivas)
 *  - Hackathons, Tech Fests & Symposia
 *  - Faculty Workshops & Guest Lectures
 *  - University Holidays & Semester Recesses
 *  - Timetable Impact (Class Suspensions & Special Venue Re-allocations)
 */

export type EventCategory = "exam" | "hackathon" | "workshop" | "holiday" | "academic";

export interface AcademicEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  endDate?: string; // Optional end date for multi-day events
  startTime: string; // e.g. "09:30 AM"
  endTime: string;   // e.g. "04:30 PM"
  venue: string;     // e.g. "Classroom 215A", "Seminar Hall 1", "LAB-2"
  roomCode?: string; // Optional room code for Floor Plan linking (e.g. "215A", "LAB-2")
  department: string;// e.g. "Computer Science & Engineering"
  description: string;
  organizer?: string;
  affectsTimetable: boolean; // Indicates if regular timetable classes are paused or rescheduled
  timetableNote?: string;    // e.g. "Regular theory classes suspended; Examination schedule applies"
  createdAt: string;
}

const STORAGE_KEY = "campus_ledger_academic_events_v1";

export const INITIAL_ACADEMIC_EVENTS: AcademicEvent[] = [
  {
    id: "evt-oct-1",
    title: "Odd Semester Mid-Term Theory Examinations",
    category: "exam",
    date: "2026-10-14",
    endDate: "2026-10-16",
    startTime: "09:30 AM",
    endTime: "12:30 PM",
    venue: "Classroom 215A & 214B",
    roomCode: "215A",
    department: "Office of the Controller of Examinations",
    description: "Centralized internal assessment mid-term examinations for B.Tech Semester 3 batches. Operating Systems, Python Programming, and Mathematics.",
    organizer: "Examination Cell",
    affectsTimetable: true,
    timetableNote: "Morning lecture periods P1–P4 replaced by Examination Sitting.",
    createdAt: "2026-10-01T09:00:00.000Z"
  },
  {
    id: "evt-oct-2",
    title: "24-Hour AI & Algorithmic Hackathon (AetherHack)",
    category: "hackathon",
    date: "2026-10-24",
    endDate: "2026-10-25",
    startTime: "09:00 AM",
    endTime: "09:00 AM",
    venue: "Seminar Hall 1 & Innovation Hub",
    roomCode: "SEMINAR-1",
    department: "Department of Computer Science & Engineering",
    description: "Annual university flagship 24-hour hackathon on Autonomous AI Agents, Machine Learning, and Automated Optimization Systems. Cash prizes and industry mentorship.",
    organizer: "ACM Student Chapter & Dept. of CSE",
    affectsTimetable: true,
    timetableNote: "Saturday club and laboratory activities moved to Innovation Hub.",
    createdAt: "2026-10-02T10:00:00.000Z"
  },
  {
    id: "evt-oct-3",
    title: "Guest Lecture: Advanced Operating Systems & Cloud Kernels",
    category: "workshop",
    date: "2026-10-19",
    startTime: "01:20 PM",
    endTime: "03:50 PM",
    venue: "Classroom 215A",
    roomCode: "215A",
    department: "Computer Science & Engineering",
    description: "Distinguished industry lecture by Dr. S. K. Ramanathan on Linux Kernel Optimization, eBPF Tracing, and Distributed Virtualization architectures.",
    organizer: "Dr. Ravindra Raman Cholla",
    affectsTimetable: true,
    timetableNote: "Afternoon P5–P7 sessions consolidated into Extended Guest Masterclass.",
    createdAt: "2026-10-03T11:00:00.000Z"
  },
  {
    id: "evt-oct-4",
    title: "Deepavali Festival Recess & Holiday",
    category: "holiday",
    date: "2026-10-28",
    endDate: "2026-10-31",
    startTime: "Full Day",
    endTime: "Full Day",
    venue: "Campus Wide",
    department: "University Administration",
    description: "National festival holiday for Deepavali celebration. Campus academic blocks, lecture halls, and administrative offices remain closed.",
    organizer: "Registrar Office",
    affectsTimetable: true,
    timetableNote: "All scheduled lecture and practical lab sessions suspended.",
    createdAt: "2026-10-01T08:00:00.000Z"
  },
  {
    id: "evt-oct-5",
    title: "Lab Practical Viva: Data Structures & Python Studio",
    category: "exam",
    date: "2026-10-22",
    startTime: "11:00 AM",
    endTime: "03:50 PM",
    venue: "Digital Lab & LAB-2",
    roomCode: "LAB-2",
    department: "Computer Science & Engineering",
    description: "Hands-on continuous evaluation practical viva for Python Programming and Data Structures. External evaluation and code execution audit.",
    organizer: "Prof. Lanke Ravi Kumar & Dept. Lab Coordinators",
    affectsTimetable: true,
    timetableNote: "LAB-2 reserved exclusively for Section F practical evaluation.",
    createdAt: "2026-10-04T12:00:00.000Z"
  },
  {
    id: "evt-oct-6",
    title: "Student Project Milestone-2 Submission Deadline",
    category: "academic",
    date: "2026-10-08",
    startTime: "11:59 PM",
    endTime: "11:59 PM",
    venue: "Online Portal / Classroom 215A",
    roomCode: "215A",
    department: "Department of Design Thinking & Innovation",
    description: "Submission deadline for 3rd semester project blueprints, architecture flowcharts, and system requirement specifications.",
    organizer: "Dr. Rajasimha A Makaram",
    affectsTimetable: false,
    timetableNote: "Regular timetable unaffected; submissions via portal.",
    createdAt: "2026-10-01T14:00:00.000Z"
  },
  {
    id: "evt-oct-7",
    title: "Industry Workshop: Generative AI & Vector Search Architecture",
    category: "workshop",
    date: "2026-10-12",
    startTime: "10:35 AM",
    endTime: "01:15 PM",
    venue: "Seminar Hall 2",
    roomCode: "SEMINAR-2",
    department: "Artificial Intelligence & Data Engineering (AIDE)",
    description: "Hands-on engineering workshop on RAG pipelines, Vector Embeddings with Milvus/Pinecone, and LLM Orchestration frameworks.",
    organizer: "AIDE Department & IEEE Computer Society",
    affectsTimetable: false,
    timetableNote: "Optional co-curricular attendance for registered students.",
    createdAt: "2026-10-05T09:30:00.000Z"
  }
];

export function loadAllEvents(): AcademicEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load academic events from storage", e);
  }
  return INITIAL_ACADEMIC_EVENTS;
}

export function saveAllEvents(events: AcademicEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent("campus_ledger_events_updated", { detail: events }));
  } catch (e) {
    console.error("Failed to save academic events to storage", e);
  }
}

export function addAcademicEvent(eventInput: Omit<AcademicEvent, "id" | "createdAt">): AcademicEvent {
  const current = loadAllEvents();
  const newEvent: AcademicEvent = {
    ...eventInput,
    id: `evt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString()
  };

  const updated = [...current, newEvent].sort((a, b) => a.date.localeCompare(b.date));
  saveAllEvents(updated);
  return newEvent;
}

export function deleteAcademicEvent(id: string): boolean {
  const current = loadAllEvents();
  const filtered = current.filter((e) => e.id !== id);
  if (filtered.length !== current.length) {
    saveAllEvents(filtered);
    return true;
  }
  return false;
}

export function subscribeToAcademicEvents(callback: (events: AcademicEvent[]) => void): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AcademicEvent[]>;
    callback(custom.detail || loadAllEvents());
  };
  window.addEventListener("campus_ledger_events_updated", handler);

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(loadAllEvents());
    }
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener("campus_ledger_events_updated", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export function getEventsForDate(dateStr: string, events: AcademicEvent[]): AcademicEvent[] {
  return events.filter((e) => {
    if (e.date === dateStr) return true;
    if (e.endDate && dateStr >= e.date && dateStr <= e.endDate) return true;
    return false;
  });
}
