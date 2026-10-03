import { getBatch, getSubjectByCode, collegeBatches } from "@/data/collegeData";

export interface Session {
  id: string;
  day: string;
  slot: number; // 0 to 7 (Periods P1 to P8)
  subject: string;
  code: string;
  faculty: string;
  room: string;
  batch: string;
  type: "Lecture" | "Lab" | "Tutorial" | "Seminar";
  color: string;
  note?: string;
  conflict?: boolean;
}

export interface TimetableMetadata {
  version: number;
  publishedAt: string;
  publishedBy: string;
  publishNote?: string;
  lastDraftModifiedAt?: string;
}

export interface ClassScheduleState {
  published: Session[];
  draft: Session[];
  hasDraftChanges: boolean;
  metadata: TimetableMetadata;
}

const STORAGE_KEY_PREFIX = "campus_ledger_timetable_v2_";
const CHANNEL_NAME = "campus_ledger_sync_channel";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const SLOTS = ["1", "2", "3", "4", "5", "6", "7", "8"];
export const SLOT_LABELS = [
  "P1 · 8:45–9:35",
  "P2 · 9:40–10:30",
  "P3 · 10:35–11:25",
  "P4 · 11:30–12:20",
  "P5 · 12:25–1:15",
  "P6 · 1:20–2:10",
  "P7 · 2:15–3:05",
  "P8 · 3:10–4:00"
];

// Official 6-period bell times for CSE-GEN 3rd Semester Section F (Room 215A)
export const SECTION_F_SLOT_LABELS = [
  "P1 · 8:45–9:45",
  "P2 · 9:45–10:45",
  "P3 · 11:00–12:00",
  "P4 · 12:00–1:00",
  "P5 · 1:50–2:50",
  "P6 · 2:50–3:50"
];

export const PALETTE = {
  indigo: "#33409A",
  orange: "#E3A62F",
  teal: "#2C8C87",
  red: "#CC5A4B",
  blue: "#4D78B8",
  plum: "#8A5A88",
  emerald: "#2D8A5E",
};

export const OFFICIAL_CSE_GEN_3_F_SESSIONS: Session[] = [
  // Monday
  {
    id: "CSE-GEN-3-F-Mon-0",
    day: "Monday",
    slot: 0,
    subject: "Operating Systems",
    code: "OS",
    faculty: "Dr. Ravindra Raman Cholla",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.plum,
    note: "P1 (8:45–9:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Mon-1",
    day: "Monday",
    slot: 1,
    subject: "Python Programming",
    code: "PP",
    faculty: "Prof. Lanke Ravi Kumar",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.teal,
    note: "P2 (9:45–10:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Mon-2",
    day: "Monday",
    slot: 2,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. Rajasimha A Makaram",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P3 (11:00 AM–12:00 PM) · Practical Studio in Room 215A (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Mon-3",
    day: "Monday",
    slot: 3,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. Rajasimha A Makaram",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P4 (12:00–1:00 PM) · Practical Studio in Room 215A (Part 2)."
  },
  {
    id: "CSE-GEN-3-F-Mon-4",
    day: "Monday",
    slot: 4,
    subject: "Placement Training",
    code: "PL01",
    faculty: "Trainer",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P5 (1:50–2:50 PM) · Aptitude & Coding Prep in Room 215A (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Mon-5",
    day: "Monday",
    slot: 5,
    subject: "Placement Training",
    code: "PL01",
    faculty: "Trainer",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P6 (2:50–3:50 PM) · Aptitude & Coding Prep in Room 215A (Part 2)."
  },

  // Tuesday
  {
    id: "CSE-GEN-3-F-Tue-0",
    day: "Tuesday",
    slot: 0,
    subject: "Discrete Mathematics and Graph Theory",
    code: "DMGT",
    faculty: "Dr. Vidya Shree",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P1 (8:45–9:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Tue-1",
    day: "Tuesday",
    slot: 1,
    subject: "Computer Organization and Architecture",
    code: "COA",
    faculty: "Prof. Harpreet Kaur",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P2 (9:45–10:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Tue-2",
    day: "Tuesday",
    slot: 2,
    subject: "Operating Systems Lab",
    code: "OS",
    faculty: "Dr. Ravindra Raman Cholla",
    room: "125 B",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P3 (11:00 AM–12:00 PM) · OS Lab Session in Room 125 B (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Tue-3",
    day: "Tuesday",
    slot: 3,
    subject: "Operating Systems Lab",
    code: "OS",
    faculty: "Dr. Ravindra Raman Cholla",
    room: "125 B",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P4 (12:00–1:00 PM) · OS Lab Session in Room 125 B (Part 2)."
  },
  {
    id: "CSE-GEN-3-F-Tue-4",
    day: "Tuesday",
    slot: 4,
    subject: "Placement Training",
    code: "PL01",
    faculty: "Trainer",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P5 (1:50–2:50 PM) · Technical Interview & Coding Prep in Room 215A (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Tue-5",
    day: "Tuesday",
    slot: 5,
    subject: "Placement Training",
    code: "PL01",
    faculty: "Trainer",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P6 (2:50–3:50 PM) · Technical Interview & Coding Prep in Room 215A (Part 2)."
  },

  // Wednesday
  {
    id: "CSE-GEN-3-F-Wed-0",
    day: "Wednesday",
    slot: 0,
    subject: "Computer Organization and Architecture",
    code: "COA",
    faculty: "Prof. Harpreet Kaur",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P1 (8:45–9:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Wed-1",
    day: "Wednesday",
    slot: 1,
    subject: "Discrete Mathematics and Graph Theory",
    code: "DMGT",
    faculty: "Dr. Vidya Shree",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P2 (9:45–10:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Wed-2",
    day: "Wednesday",
    slot: 2,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. Rajasimha A Makaram",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P3 (11:00 AM–12:00 PM) · Studio Ideation in Room 215A (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Wed-3",
    day: "Wednesday",
    slot: 3,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. Rajasimha A Makaram",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P4 (12:00–1:00 PM) · Studio Ideation in Room 215A (Part 2)."
  },
  {
    id: "CSE-GEN-3-F-Wed-4",
    day: "Wednesday",
    slot: 4,
    subject: "Biology for Engineers",
    code: "BE",
    faculty: "NF1",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P5 (1:50–2:50 PM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Wed-5",
    day: "Wednesday",
    slot: 5,
    subject: "Operating Systems",
    code: "OS",
    faculty: "Dr. Ravindra Raman Cholla",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.plum,
    note: "P6 (2:50–3:50 PM) · Classroom 215A."
  },

  // Thursday
  {
    id: "CSE-GEN-3-F-Thu-0",
    day: "Thursday",
    slot: 0,
    subject: "Python Programming",
    code: "PP",
    faculty: "Prof. Lanke Ravi Kumar",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.teal,
    note: "P1 (8:45–9:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Thu-1",
    day: "Thursday",
    slot: 1,
    subject: "Computer Organization and Architecture",
    code: "COA",
    faculty: "Prof. Harpreet Kaur",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P2 (9:45–10:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Thu-2",
    day: "Thursday",
    slot: 2,
    subject: "Placement Training",
    code: "PL01",
    faculty: "Trainer",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P3 (11:00 AM–12:00 PM) · Quantitative Aptitude in Room 215A (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Thu-3",
    day: "Thursday",
    slot: 3,
    subject: "Placement Training",
    code: "PL01",
    faculty: "Trainer",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P4 (12:00–1:00 PM) · Quantitative Aptitude in Room 215A (Part 2)."
  },
  {
    id: "CSE-GEN-3-F-Thu-4",
    day: "Thursday",
    slot: 4,
    subject: "Sports and Yoga",
    code: "SY",
    faculty: "Mr. Kiran N",
    room: "212",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.emerald,
    note: "P5 (1:50–2:50 PM) · Wellness & Yoga in Room 212 (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Thu-5",
    day: "Thursday",
    slot: 5,
    subject: "Sports and Yoga",
    code: "SY",
    faculty: "Mr. Kiran N",
    room: "212",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.emerald,
    note: "P6 (2:50–3:50 PM) · Wellness & Yoga in Room 212 (Part 2)."
  },

  // Friday
  {
    id: "CSE-GEN-3-F-Fri-0",
    day: "Friday",
    slot: 0,
    subject: "Biology for Engineers",
    code: "BE",
    faculty: "NF1",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P1 (8:45–9:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Fri-1",
    day: "Friday",
    slot: 1,
    subject: "Discrete Mathematics and Graph Theory",
    code: "DMGT",
    faculty: "Dr. Vidya Shree",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P2 (9:45–10:45 AM) · Classroom 215A."
  },
  {
    id: "CSE-GEN-3-F-Fri-2",
    day: "Friday",
    slot: 2,
    subject: "Python Programming Lab",
    code: "PP",
    faculty: "Prof. Lanke Ravi Kumar",
    room: "221B",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P3 (11:00 AM–12:00 PM) · Practical Lab in Room 221B (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Fri-3",
    day: "Friday",
    slot: 3,
    subject: "Python Programming Lab",
    code: "PP",
    faculty: "Prof. Lanke Ravi Kumar",
    room: "221B",
    batch: "CSE-GEN · S3 · F",
    type: "Lab",
    color: PALETTE.red,
    note: "P4 (12:00–1:00 PM) · Practical Lab in Room 221B (Part 2)."
  },
  {
    id: "CSE-GEN-3-F-Fri-4",
    day: "Friday",
    slot: 4,
    subject: "Library / Self-Study",
    code: "LIB",
    faculty: "Library In-Charge",
    room: "Central Library",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P5 (1:50–2:50 PM) · Central Library Reference Block."
  },
  {
    id: "CSE-GEN-3-F-Fri-5",
    day: "Friday",
    slot: 5,
    subject: "E-Learning & Digital Lab",
    code: "E-LEARN",
    faculty: "Course Coordinator",
    room: "Digital Lab",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P6 (2:50–3:50 PM) · Online Certifications & Digital Coursework."
  },

  // Saturday
  {
    id: "CSE-GEN-3-F-Sat-0",
    day: "Saturday",
    slot: 0,
    subject: "Foundation of Mathematics - 1",
    code: "FoM-1",
    faculty: "Mr. Vishwanatha S",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P1 (8:45–9:45 AM) · Classroom 215A (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Sat-1",
    day: "Saturday",
    slot: 1,
    subject: "Foundation of Mathematics - 1",
    code: "FoM-1",
    faculty: "Mr. Vishwanatha S",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P2 (9:45–10:45 AM) · Classroom 215A (Part 2)."
  },
  {
    id: "CSE-GEN-3-F-Sat-2",
    day: "Saturday",
    slot: 2,
    subject: "Remedial Class",
    code: "REMEDIAL",
    faculty: "Faculty Mentors",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.teal,
    note: "P3 (11:00 AM–12:00 PM) · Doubt Clearing & Tutorial Support in 215A (Part 1)."
  },
  {
    id: "CSE-GEN-3-F-Sat-3",
    day: "Saturday",
    slot: 3,
    subject: "Remedial Class",
    code: "REMEDIAL",
    faculty: "Faculty Mentors",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.teal,
    note: "P4 (12:00–1:00 PM) · Doubt Clearing & Tutorial Support in 215A (Part 2)."
  },
  {
    id: "CSE-GEN-3-F-Sat-4",
    day: "Saturday",
    slot: 4,
    subject: "Mentor & Mentee",
    code: "MM",
    faculty: "Dr. Suriya Prakash J",
    room: "215A",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.plum,
    note: "P5 (1:50–2:50 PM) · Class Teacher Mentorship with Dr. Suriya Prakash J in 215A."
  },
  {
    id: "CSE-GEN-3-F-Sat-5",
    day: "Saturday",
    slot: 5,
    subject: "Club Activity",
    code: "CA",
    faculty: "Activity Coordinator",
    room: "Activity Center",
    batch: "CSE-GEN · S3 · F",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P6 (2:50–3:50 PM) · Co-curricular Club Activities at Student Activity Center."
  }
];

export const OFFICIAL_DS_3_A_SESSIONS: Session[] = [
  // Monday
  {
    id: "DS-3-A-Mon-0",
    day: "Monday",
    slot: 0,
    subject: "Computer Organization and Architecture",
    code: "COA",
    faculty: "Dr. S Annamalai",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P1 (8:45–9:45 AM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Mon-1",
    day: "Monday",
    slot: 1,
    subject: "Discrete Mathematics and Graph Theory",
    code: "DMGT",
    faculty: "Mr. Manohar Kumar K",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P2 (9:45–10:45 AM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Mon-2",
    day: "Monday",
    slot: 2,
    subject: "Placement Training",
    code: "PLAC",
    faculty: "Trainer 6",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P3 (11:00 AM–12:00 PM) · Placement Training in Room 214B (Part 1)."
  },
  {
    id: "DS-3-A-Mon-3",
    day: "Monday",
    slot: 3,
    subject: "Placement Training",
    code: "PLAC",
    faculty: "Trainer 6",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P4 (12:00–1:00 PM) · Placement Training in Room 214B (Part 2)."
  },
  {
    id: "DS-3-A-Mon-4",
    day: "Monday",
    slot: 4,
    subject: "Operating Systems Lab",
    code: "OS",
    faculty: "Mr. Rajesh Pandian N",
    room: "221A",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P5 (1:50–2:50 PM) · OS Lab Session in Room 221A (Part 1)."
  },
  {
    id: "DS-3-A-Mon-5",
    day: "Monday",
    slot: 5,
    subject: "Operating Systems Lab",
    code: "OS",
    faculty: "Mr. Rajesh Pandian N",
    room: "221A",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P6 (2:50–3:50 PM) · OS Lab Session in Room 221A (Part 2)."
  },

  // Tuesday
  {
    id: "DS-3-A-Tue-0",
    day: "Tuesday",
    slot: 0,
    subject: "Operating Systems",
    code: "OS",
    faculty: "Mr. Rajesh Pandian N",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.plum,
    note: "P1 (8:45–9:45 AM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Tue-1",
    day: "Tuesday",
    slot: 1,
    subject: "Python Programming",
    code: "PP",
    faculty: "Dr. I Ambika",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.teal,
    note: "P2 (9:45–10:45 AM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Tue-2",
    day: "Tuesday",
    slot: 2,
    subject: "Placement Training",
    code: "PLAC",
    faculty: "Trainer 6",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P3 (11:00 AM–12:00 PM) · Technical & Coding Prep in Room 214B (Part 1)."
  },
  {
    id: "DS-3-A-Tue-3",
    day: "Tuesday",
    slot: 3,
    subject: "Placement Training",
    code: "PLAC",
    faculty: "Trainer 6",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P4 (12:00–1:00 PM) · Technical & Coding Prep in Room 214B (Part 2)."
  },
  {
    id: "DS-3-A-Tue-4",
    day: "Tuesday",
    slot: 4,
    subject: "Python Programming",
    code: "PP",
    faculty: "Dr. I Ambika",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.teal,
    note: "P5 (1:50–2:50 PM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Tue-5",
    day: "Tuesday",
    slot: 5,
    subject: "Computer Organization and Architecture",
    code: "COA",
    faculty: "Dr. S Annamalai",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P6 (2:50–3:50 PM) · Classroom 214B."
  },

  // Wednesday
  {
    id: "DS-3-A-Wed-0",
    day: "Wednesday",
    slot: 0,
    subject: "Python Programming Lab",
    code: "PP",
    faculty: "Dr. I Ambika",
    room: "125B",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P1 (8:45–9:45 AM) · Python Practical Session in Room 125B (Part 1)."
  },
  {
    id: "DS-3-A-Wed-1",
    day: "Wednesday",
    slot: 1,
    subject: "Python Programming Lab",
    code: "PP",
    faculty: "Dr. I Ambika",
    room: "125B",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P2 (9:45–10:45 AM) · Python Practical Session in Room 125B (Part 2)."
  },
  {
    id: "DS-3-A-Wed-2",
    day: "Wednesday",
    slot: 2,
    subject: "Mentoring",
    code: "MM",
    faculty: "Prof. Rajesh Pandian N",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.plum,
    note: "P3 (11:00 AM–12:00 PM) · Class Teacher Mentorship with Prof. Rajesh Pandian N in 214B."
  },
  {
    id: "DS-3-A-Wed-3",
    day: "Wednesday",
    slot: 3,
    subject: "Discrete Mathematics and Graph Theory",
    code: "DMGT",
    faculty: "Mr. Manohar Kumar K",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P4 (12:00–1:00 PM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Wed-4",
    day: "Wednesday",
    slot: 4,
    subject: "Biology for Engineers",
    code: "BE",
    faculty: "Dr. Rohini",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P5 (1:50–2:50 PM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Wed-5",
    day: "Wednesday",
    slot: 5,
    subject: "Library / Self-Study",
    code: "LIB",
    faculty: "Library In-Charge",
    room: "Central Library",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P6 (2:50–3:50 PM) · Central Library Reference Block."
  },

  // Thursday
  {
    id: "DS-3-A-Thu-0",
    day: "Thursday",
    slot: 0,
    subject: "Operating Systems",
    code: "OS",
    faculty: "Mr. Rajesh Pandian N",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.plum,
    note: "P1 (8:45–9:45 AM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Thu-1",
    day: "Thursday",
    slot: 1,
    subject: "Computer Organization and Architecture",
    code: "COA",
    faculty: "Dr. S Annamalai",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.blue,
    note: "P2 (9:45–10:45 AM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Thu-2",
    day: "Thursday",
    slot: 2,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. John Basha",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P3 (11:00 AM–12:00 PM) · Design Thinking Studio in Room 214B (Part 1)."
  },
  {
    id: "DS-3-A-Thu-3",
    day: "Thursday",
    slot: 3,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. John Basha",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P4 (12:00–1:00 PM) · Design Thinking Studio in Room 214B (Part 2)."
  },
  {
    id: "DS-3-A-Thu-4",
    day: "Thursday",
    slot: 4,
    subject: "Placement Training",
    code: "PLAC",
    faculty: "Trainer 6",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P5 (1:50–2:50 PM) · Quantitative Aptitude & Soft Skills in Room 214B (Part 1)."
  },
  {
    id: "DS-3-A-Thu-5",
    day: "Thursday",
    slot: 5,
    subject: "Placement Training",
    code: "PLAC",
    faculty: "Trainer 6",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P6 (2:50–3:50 PM) · Quantitative Aptitude & Soft Skills in Room 214B (Part 2)."
  },

  // Friday
  {
    id: "DS-3-A-Fri-0",
    day: "Friday",
    slot: 0,
    subject: "Discrete Mathematics and Graph Theory",
    code: "DMGT",
    faculty: "Mr. Manohar Kumar K",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P1 (8:45–9:45 AM) · Classroom 214B."
  },
  {
    id: "DS-3-A-Fri-1",
    day: "Friday",
    slot: 1,
    subject: "Mentoring",
    code: "MM",
    faculty: "Prof. Rajesh Pandian N",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.plum,
    note: "P2 (9:45–10:45 AM) · Class Teacher Mentorship with Prof. Rajesh Pandian N in 214B."
  },
  {
    id: "DS-3-A-Fri-2",
    day: "Friday",
    slot: 2,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. John Basha",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P3 (11:00 AM–12:00 PM) · Project Ideation in Room 214B (Part 1)."
  },
  {
    id: "DS-3-A-Fri-3",
    day: "Friday",
    slot: 3,
    subject: "Design Thinking",
    code: "DT",
    faculty: "Dr. John Basha",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lab",
    color: PALETTE.red,
    note: "P4 (12:00–1:00 PM) · Project Ideation in Room 214B (Part 2)."
  },
  {
    id: "DS-3-A-Fri-4",
    day: "Friday",
    slot: 4,
    subject: "E-Learning & Digital Coursework",
    code: "E-LEARN",
    faculty: "Course Coordinator",
    room: "Digital Lab",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.indigo,
    note: "P5 (1:50–2:50 PM) · Online Certifications & Digital Coursework in Digital Lab."
  },
  {
    id: "DS-3-A-Fri-5",
    day: "Friday",
    slot: 5,
    subject: "Biology for Engineers",
    code: "BE",
    faculty: "Dr. Rohini",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P6 (2:50–3:50 PM) · Classroom 214B."
  },

  // Saturday
  {
    id: "DS-3-A-Sat-0",
    day: "Saturday",
    slot: 0,
    subject: "Foundation of Mathematics - 1",
    code: "FOM",
    faculty: "Mr. Vishwanatha S",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P1 (8:45–9:45 AM) · Classroom 214B (Part 1)."
  },
  {
    id: "DS-3-A-Sat-1",
    day: "Saturday",
    slot: 1,
    subject: "Foundation of Mathematics - 1",
    code: "FOM",
    faculty: "Mr. Vishwanatha S",
    room: "214B",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.orange,
    note: "P2 (9:45–10:45 AM) · Classroom 214B (Part 2)."
  },
  {
    id: "DS-3-A-Sat-2",
    day: "Saturday",
    slot: 2,
    subject: "Club Activities",
    code: "CA",
    faculty: "Activity Coordinator",
    room: "Activity Center",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P3 (11:00 AM–12:00 PM) · Co-curricular Club Activities in Activity Center (Part 1)."
  },
  {
    id: "DS-3-A-Sat-3",
    day: "Saturday",
    slot: 3,
    subject: "Club Activities",
    code: "CA",
    faculty: "Activity Coordinator",
    room: "Activity Center",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P4 (12:00–1:00 PM) · Co-curricular Club Activities in Activity Center (Part 2)."
  },
  {
    id: "DS-3-A-Sat-4",
    day: "Saturday",
    slot: 4,
    subject: "Club Activities",
    code: "CA",
    faculty: "Activity Coordinator",
    room: "Activity Center",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P5 (1:50–2:50 PM) · Co-curricular Club Activities in Activity Center (Part 3)."
  },
  {
    id: "DS-3-A-Sat-5",
    day: "Saturday",
    slot: 5,
    subject: "Club Activities",
    code: "CA",
    faculty: "Activity Coordinator",
    room: "Activity Center",
    batch: "CSE-DS · S3 · A",
    type: "Lecture",
    color: PALETTE.emerald,
    note: "P6 (2:50–3:50 PM) · Co-curricular Club Activities in Activity Center (Part 4)."
  }
];

const DEFAULT_SEEDS: Session[] = [
  { id: "m1", day: "Monday", slot: 0, subject: "Discrete Mathematics", code: "MAT204", faculty: "Dr. Meera Nair", room: "A-204", batch: "CSE · A", type: "Lecture", color: PALETTE.indigo, note: "Allocated slot P1." },
  { id: "m2", day: "Monday", slot: 2, subject: "Data Structures", code: "CSE201", faculty: "Prof. Anil Rao", room: "A-204", batch: "CSE · A", type: "Lecture", color: PALETTE.orange, note: "Core prerequisite sequence." },
  { id: "m3", day: "Monday", slot: 4, subject: "Database Systems", code: "CSE305", faculty: "Dr. Kabir Shah", room: "B-112", batch: "CSE · A", type: "Lecture", color: PALETTE.teal, note: "Room capacity verified." },
  { id: "t1", day: "Tuesday", slot: 0, subject: "Operating Systems", code: "CSE303", faculty: "Dr. Ritu Thomas", room: "A-204", batch: "CSE · A", type: "Lecture", color: PALETTE.plum, note: "Placed in morning slot." },
  { id: "t2", day: "Tuesday", slot: 1, subject: "Algorithms", code: "CSE302", faculty: "Prof. Anil Rao", room: "A-204", batch: "CSE · A", type: "Lecture", color: PALETTE.orange, note: "Consecutive theory class." },
  { id: "t3", day: "Tuesday", slot: 4, subject: "Networks Lab", code: "CSE307L", faculty: "Ms. Nidhi Menon", room: "LAB-2", batch: "CSE · A", type: "Lab", color: PALETTE.red, note: "Laboratory block allocation." },
  { id: "w1", day: "Wednesday", slot: 1, subject: "Database Systems", code: "CSE305", faculty: "Dr. Kabir Shah", room: "B-112", batch: "CSE · A", type: "Lecture", color: PALETTE.teal, note: "Mid-week lecture." },
  { id: "w2", day: "Wednesday", slot: 3, subject: "Communication Skills", code: "HUM201", faculty: "Ms. Leela Iyer", room: "C-101", batch: "CSE · A", type: "Lecture", color: PALETTE.blue, note: "Shared elective session." },
  { id: "w3", day: "Wednesday", slot: 5, subject: "Algorithms", code: "CSE302", faculty: "Prof. Anil Rao", room: "A-204", batch: "CSE · A", type: "Lecture", color: PALETTE.orange, note: "Problem solving session." },
  { id: "th1", day: "Thursday", slot: 0, subject: "Discrete Mathematics", code: "MAT204", faculty: "Dr. Meera Nair", room: "A-204", batch: "CSE · A", type: "Lecture", color: PALETTE.indigo, note: "Weekly contact-hour allocation." },
  { id: "th2", day: "Thursday", slot: 2, subject: "Networks Lab", code: "CSE307L", faculty: "Ms. Nidhi Menon", room: "LAB-2", batch: "CSE · A", type: "Lab", color: PALETTE.red, note: "Specialized lab room." },
  { id: "f1", day: "Friday", slot: 0, subject: "Operating Systems", code: "CSE303", faculty: "Dr. Ritu Thomas", room: "A-204", batch: "CSE · A", type: "Lecture", color: PALETTE.plum, note: "Lecture wrap-up." },
  { id: "f2", day: "Friday", slot: 2, subject: "Project Studio", code: "CSE399", faculty: "Dr. Kabir Shah", room: "Innovation Hub", batch: "CSE · A", type: "Lab", color: PALETTE.blue, note: "Hands-on project block." }
];

export function getDefaultSessionsFromBatch(program: string, semester: string, section: string): Session[] {
  // Official circular timetable for CSE-GEN 3rd Semester Section F
  if (
    (program === "CSE-GEN" || program === "CSE_GEN" || program === "CSE") &&
    (semester === "3" || semester === "3RD") &&
    (section === "F" || section === "SEC F")
  ) {
    return OFFICIAL_CSE_GEN_3_F_SESSIONS;
  }

  // Official circular timetable for DS / CSE-DS 3rd Semester Section A
  if (
    (program === "DS" || program === "CSE-DS" || program === "CSE_DS") &&
    (semester === "3" || semester === "3RD") &&
    (section === "A" || section === "SEC A")
  ) {
    return OFFICIAL_DS_3_A_SESSIONS;
  }

  const batch = getBatch(program, semester, section);
  if (!batch) return DEFAULT_SEEDS;

  const dayMap: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
  };

  const colors = [PALETTE.indigo, PALETTE.orange, PALETTE.teal, PALETTE.plum, PALETTE.blue, PALETTE.red];

  return batch.days.flatMap((day: string) =>
    batch.periods.flatMap((period: string, index: number) => {
      const cell = (batch.grid as Record<string, Record<string, { text: string; type: string; colspan: number }>>)[day]?.[period];
      if (!cell?.text || cell.type === "lunch" || cell.type === "free" || cell.type === "lab-continue") {
        return [];
      }
      const [codePart, ...roomParts] = cell.text.split(" in ");
      const code = codePart.replace(/\(L\)/i, "").trim();
      const room = roomParts.join(" in ").trim() || "Classroom";
      const subject = getSubjectByCode(code, program, semester, section);
      const isLab = cell.type === "lab" || /\(L\)/i.test(cell.text);

      return [{
        id: `${program}-${semester}-${section}-${day}-${index}`,
        day: dayMap[day] || day,
        slot: index,
        subject: subject?.name || code,
        code,
        faculty: subject?.faculty || batch.classTeacher || "Faculty In-Charge",
        room,
        batch: `${program} · S${semester} · ${section}`,
        type: isLab ? "Lab" : "Lecture",
        color: isLab ? PALETTE.red : colors[index % colors.length],
        note: `Allocated via College Schedule Pipeline for ${program} Semester ${semester} Section ${section}.`
      } as Session];
    })
  );
}

export function getClassKey(program: string, semester: string, section: string): string {
  return `${program}|${semester}|${section}`;
}

export function getAcademicYearFromSemester(semester: string): string {
  const semNum = parseInt(semester, 10);
  if (semNum === 1 || semNum === 2) return "1st Year (Freshmen)";
  if (semNum === 3 || semNum === 4) return "2nd Year (Sophomore)";
  if (semNum === 5 || semNum === 6) return "3rd Year (Junior)";
  if (semNum === 7 || semNum === 8) return "4th Year (Senior)";
  return "Academic Year";
}

// Read state from localStorage
export function loadClassSchedule(program: string, semester: string, section: string): ClassScheduleState {
  const key = getClassKey(program, semester, section);
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);

  if (raw) {
    try {
      const parsed: ClassScheduleState = JSON.parse(raw);
      // For Section F or DS Section A, ensure we have the updated 36-session v2 schedule
      const isOfficialV2Class = key === "CSE-GEN|3|F" || key === "DS|3|A" || key === "CSE-DS|3|A";
      if (isOfficialV2Class && ((parsed.metadata?.version ?? 0) < 2 || parsed.published?.length !== 36)) {
        // Upgrade to fresh circular
      } else {
        return parsed;
      }
    } catch {
      // Fallback if malformed
    }
  }

  // Generate initial state from default batch data
  const defaultSessions = getDefaultSessionsFromBatch(program, semester, section);
  const initialState: ClassScheduleState = {
    published: defaultSessions,
    draft: JSON.parse(JSON.stringify(defaultSessions)),
    hasDraftChanges: false,
    metadata: {
      version: 2,
      publishedAt: new Date().toISOString(),
      publishedBy: "Academic Office Official Circular",
      publishNote: `Official 6-period timetable for ${program} Sem ${semester} Sec ${section}`
    }
  };

  saveClassSchedule(program, semester, section, initialState, false);
  return initialState;
}

export function saveClassSchedule(
  program: string,
  semester: string,
  section: string,
  state: ClassScheduleState,
  broadcast = true
): void {
  const key = getClassKey(program, semester, section);
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(state));

  if (broadcast) {
    notifySync(key);
  }
}

// Save a session to the draft schedule (Add or Update)
export function saveDraftSession(
  program: string,
  semester: string,
  section: string,
  session: Session
): ClassScheduleState {
  const current = loadClassSchedule(program, semester, section);
  
  // Check if slot or ID already exists in draft
  const filtered = current.draft.filter(
    (s) => s.id !== session.id && !(s.day === session.day && s.slot === session.slot)
  );

  const updatedDraft = [...filtered, session].sort((a, b) => {
    if (a.day !== b.day) return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    return a.slot - b.slot;
  });

  const updatedState: ClassScheduleState = {
    ...current,
    draft: updatedDraft,
    hasDraftChanges: true,
    metadata: {
      ...current.metadata,
      lastDraftModifiedAt: new Date().toISOString()
    }
  };

  saveClassSchedule(program, semester, section, updatedState);
  return updatedState;
}

// Remove a session from the draft schedule
export function removeDraftSession(
  program: string,
  semester: string,
  section: string,
  sessionIdOrSlot: { id?: string; day?: string; slot?: number }
): ClassScheduleState {
  const current = loadClassSchedule(program, semester, section);

  const updatedDraft = current.draft.filter((s) => {
    if (sessionIdOrSlot.id && s.id === sessionIdOrSlot.id) return false;
    if (sessionIdOrSlot.day && sessionIdOrSlot.slot !== undefined) {
      if (s.day === sessionIdOrSlot.day && s.slot === sessionIdOrSlot.slot) return false;
    }
    return true;
  });

  const updatedState: ClassScheduleState = {
    ...current,
    draft: updatedDraft,
    hasDraftChanges: true,
    metadata: {
      ...current.metadata,
      lastDraftModifiedAt: new Date().toISOString()
    }
  };

  saveClassSchedule(program, semester, section, updatedState);
  return updatedState;
}

// Publish the draft schedule to make it live for students and faculty
export function publishClassSchedule(
  program: string,
  semester: string,
  section: string,
  publisherName: string,
  note?: string
): ClassScheduleState {
  const current = loadClassSchedule(program, semester, section);

  const updatedState: ClassScheduleState = {
    ...current,
    published: JSON.parse(JSON.stringify(current.draft)),
    hasDraftChanges: false,
    metadata: {
      version: current.metadata.version + 1,
      publishedAt: new Date().toISOString(),
      publishedBy: publisherName || "Academic Coordinator",
      publishNote: note || "Published revised timetable."
    }
  };

  saveClassSchedule(program, semester, section, updatedState);
  return updatedState;
}

// Revert draft changes back to current published state
export function revertDraftToPublished(
  program: string,
  semester: string,
  section: string
): ClassScheduleState {
  const current = loadClassSchedule(program, semester, section);

  const updatedState: ClassScheduleState = {
    ...current,
    draft: JSON.parse(JSON.stringify(current.published)),
    hasDraftChanges: false
  };

  saveClassSchedule(program, semester, section, updatedState);
  return updatedState;
}

// Reset schedule completely back to default college baseline
export function resetClassScheduleToDefault(
  program: string,
  semester: string,
  section: string,
  resetBy: string
): ClassScheduleState {
  const defaults = getDefaultSessionsFromBatch(program, semester, section);

  const updatedState: ClassScheduleState = {
    published: defaults,
    draft: JSON.parse(JSON.stringify(defaults)),
    hasDraftChanges: false,
    metadata: {
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedBy: resetBy || "System Administrator",
      publishNote: "Restored official baseline schedule"
    }
  };

  saveClassSchedule(program, semester, section, updatedState);
  return updatedState;
}

// Cross-window and local event bus
function notifySync(classKey: string) {
  const eventData = { classKey, timestamp: Date.now() };

  // Dispatch window event for same tab
  window.dispatchEvent(new CustomEvent("campus_ledger_timetable_updated", { detail: eventData }));

  // BroadcastChannel for cross-tab/cross-window
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(eventData);
      channel.close();
    }
  } catch {
    // Ignore BroadcastChannel errors in restrictive environments
  }
}

export function subscribeToTimetableChanges(callback: (classKey: string) => void): () => void {
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ classKey: string }>;
    if (custom?.detail?.classKey) {
      callback(custom.detail.classKey);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key && e.key.startsWith(STORAGE_KEY_PREFIX)) {
      const classKey = e.key.replace(STORAGE_KEY_PREFIX, "");
      callback(classKey);
    }
  };

  window.addEventListener("campus_ledger_timetable_updated", handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (msg) => {
        if (msg.data?.classKey) {
          callback(msg.data.classKey);
        }
      };
    }
  } catch {
    // Ignore
  }

  return () => {
    window.removeEventListener("campus_ledger_timetable_updated", handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (channel) {
      channel.close();
    }
  };
}
