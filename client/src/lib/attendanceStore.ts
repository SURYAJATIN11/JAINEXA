import { CSE_GEN_SECTION_F_STUDENTS, Student, getStudentsForBatch } from "@/data/studentsData";

export type AttendanceStatus = "P" | "A" | "L" | "OD"; // Present, Absent, Late, On-Duty/Excused

export interface StudentAttendanceEntry {
  usn: string;
  name: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSubmission {
  id: string;
  program: string;
  semester: string;
  section: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  room: string;
  date: string; // YYYY-MM-DD
  period: string; // e.g. "P1 · 8:45–9:35"
  type: "Lecture" | "Lab";
  students: StudentAttendanceEntry[];
  totalCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  submittedAt: string;
  remarks?: string;
}

export interface StudentCumulativeStats {
  usn: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number;
  status: "Good" | "Warning" | "Critical"; // >= 85% Good, 75-84% Warning, < 75% Critical (Defaulter)
}

const STORAGE_KEY = "campus_ledger_attendance_records_v3";
const SYNC_EVENT = "campus_ledger_attendance_updated";
const CHANNEL_NAME = "campus_ledger_attendance_channel";

// Initial baseline sessions for CSE-GEN Section F (Semester 3)
function createInitialSubmissions(): AttendanceSubmission[] {
  const students = CSE_GEN_SECTION_F_STUDENTS;
  const total = students.length;

  // Session 1: Dr. Vidya Shree R - Discrete Mathematics and Graph Theory (M31)
  const s1Students: StudentAttendanceEntry[] = students.map((s, idx) => ({
    usn: s.usn,
    name: s.name,
    status: [3, 11, 24, 40].includes(idx) ? "A" : [8, 29].includes(idx) ? "L" : "P"
  }));
  const s1Present = s1Students.filter((s) => s.status === "P" || s.status === "L" || s.status === "OD").length;

  // Session 2: Dr. Ravindra Raman Cholla - Operating Systems (M3)
  const s2Students: StudentAttendanceEntry[] = students.map((s, idx) => ({
    usn: s.usn,
    name: s.name,
    status: [11, 18, 40, 52].includes(idx) ? "A" : [24, 33].includes(idx) ? "OD" : "P"
  }));
  const s2Present = s2Students.filter((s) => s.status === "P" || s.status === "L" || s.status === "OD").length;

  // Session 3: Ms. Harpreet Kaur - Computer Organization and Architecture (M2)
  const s3Students: StudentAttendanceEntry[] = students.map((s, idx) => ({
    usn: s.usn,
    name: s.name,
    status: [5, 11, 24, 40, 48].includes(idx) ? "A" : "P"
  }));
  const s3Present = s3Students.filter((s) => s.status === "P" || s.status === "L" || s.status === "OD").length;

  return [
    {
      id: "att-cse-gen-3-f-001",
      program: "CSE-GEN",
      semester: "3",
      section: "F",
      subject: "Discrete Mathematics and Graph Theory",
      subjectCode: "M31",
      faculty: "Dr. Vidya Shree R - Assistant Professor",
      room: "202 [AC] Room",
      date: "2026-09-01",
      period: "P6 · 1:20–2:10",
      type: "Lecture",
      students: s1Students,
      totalCount: total,
      presentCount: s1Present,
      absentCount: total - s1Present,
      lateCount: 2,
      excusedCount: 0,
      attendancePercentage: Math.round((s1Present / total) * 100),
      submittedAt: "2026-09-01T14:15:00.000Z",
      remarks: "Graph isomorphism and Hamiltonian cycles covered."
    },
    {
      id: "att-cse-gen-3-f-002",
      program: "CSE-GEN",
      semester: "3",
      section: "F",
      subject: "Operating Systems",
      subjectCode: "M3",
      faculty: "Dr. Ravindra Raman Cholla - Assistant Professor",
      room: "215B [AC] Room",
      date: "2026-09-02",
      period: "P5 · 12:25–1:15",
      type: "Lecture",
      students: s2Students,
      totalCount: total,
      presentCount: s2Present,
      absentCount: total - s2Present,
      lateCount: 0,
      excusedCount: 2,
      attendancePercentage: Math.round((s2Present / total) * 100),
      submittedAt: "2026-09-02T13:20:00.000Z",
      remarks: "Process synchronization & semaphores discussed."
    },
    {
      id: "att-cse-gen-3-f-003",
      program: "CSE-GEN",
      semester: "3",
      section: "F",
      subject: "Computer Organization and Architecture",
      subjectCode: "M2",
      faculty: "Ms. Harpreet Kaur - Assistant Professor",
      room: "215B [AC] Room",
      date: "2026-09-03",
      period: "P2 · 9:40–10:30",
      type: "Lecture",
      students: s3Students,
      totalCount: total,
      presentCount: s3Present,
      absentCount: total - s3Present,
      lateCount: 0,
      excusedCount: 0,
      attendancePercentage: Math.round((s3Present / total) * 100),
      submittedAt: "2026-09-03T10:35:00.000Z",
      remarks: "Pipelining hazards and cache memory hierarchy."
    }
  ];
}

export function loadAllAttendanceSubmissions(): AttendanceSubmission[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // Ignore
    }
  }
  const initial = createInitialSubmissions();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveAttendanceSubmission(submission: AttendanceSubmission): AttendanceSubmission[] {
  const current = loadAllAttendanceSubmissions();
  // Prepend new submission so newest appears first
  const updated = [submission, ...current.filter((s) => s.id !== submission.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Notify listeners
  notifyAttendanceSync();
  return updated;
}

export function getAttendanceSubmissionsForClass(
  program: string,
  semester: string,
  section: string
): AttendanceSubmission[] {
  const all = loadAllAttendanceSubmissions();
  return all.filter(
    (s) => s.program === program && s.semester === semester && s.section === section
  );
}

export function getStudentAttendanceSummary(
  program: string,
  semester: string,
  section: string
): StudentCumulativeStats[] {
  const submissions = getAttendanceSubmissionsForClass(program, semester, section);
  const students = getStudentsForBatch(program, semester, section);

  const totalClasses = submissions.length;
  if (totalClasses === 0) {
    return students.map((s) => ({
      usn: s.usn,
      name: s.name,
      totalClasses: 0,
      attendedClasses: 0,
      absentClasses: 0,
      percentage: 100,
      status: "Good"
    }));
  }

  return students.map((student) => {
    let attended = 0;
    submissions.forEach((sub) => {
      const match = sub.students.find((rec) => rec.usn === student.usn);
      if (match && (match.status === "P" || match.status === "L" || match.status === "OD")) {
        attended++;
      }
    });

    const percentage = Math.round((attended / totalClasses) * 100);
    let status: "Good" | "Warning" | "Critical" = "Good";
    if (percentage < 75) {
      status = "Critical"; // AICTE / University Defaulter Threshold (< 75%)
    } else if (percentage < 85) {
      status = "Warning";
    }

    return {
      usn: student.usn,
      name: student.name,
      totalClasses,
      attendedClasses: attended,
      absentClasses: totalClasses - attended,
      percentage,
      status
    };
  });
}

function notifyAttendanceSync() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ timestamp: Date.now() });
      channel.close();
    }
  } catch {
    // Ignore
  }
}

export function subscribeToAttendance(callback: () => void): () => void {
  const handleEvent = () => callback();
  window.addEventListener(SYNC_EVENT, handleEvent);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) callback();
  });

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = () => callback();
    }
  } catch {
    // Ignore
  }

  return () => {
    window.removeEventListener(SYNC_EVENT, handleEvent);
    if (channel) channel.close();
  };
}

/**
 * Escapes a field value for CSV compliance (RFC 4180).
 */
function escapeCSV(val: string | number | null | undefined): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates official institutional CSV content for an hourly class session attendance.
 */
export function generateHourlyAttendanceCSV(sub: AttendanceSubmission): string {
  const lines: string[] = [
    "================================================================================",
    "JAIN UNIVERSITY · SCHOOL OF ENGINEERING & TECHNOLOGY",
    "OFFICIAL CLASS ATTENDANCE REPORT (HOURLY SESSION RECORD)",
    "================================================================================",
    "",
    "--- SESSION DOSSIER METADATA ---",
    `Course Name,${escapeCSV(sub.subject)}`,
    `Course Code,${escapeCSV(sub.subjectCode)}`,
    `Session Type,${escapeCSV(sub.type)}`,
    `Faculty In-Charge,${escapeCSV(sub.faculty)}`,
    `Academic Batch,${escapeCSV(`${sub.program} · Semester ${sub.semester} · Section ${sub.section}`)}`,
    `Classroom / Venue,${escapeCSV(sub.room)}`,
    `Session Date,${escapeCSV(sub.date)}`,
    `Period / Hour,${escapeCSV(sub.period)}`,
    `Submitted Timestamp,${escapeCSV(sub.submittedAt || new Date().toISOString())}`,
    `Total Enrolled,${sub.totalCount}`,
    `Total Present,${sub.presentCount}`,
    `Total Absent,${sub.absentCount}`,
    `Total Late,${sub.lateCount}`,
    `Total On-Duty / Excused,${sub.excusedCount}`,
    `Attendance Percentage,${escapeCSV(`${sub.attendancePercentage}%`)}`,
    `Session Remarks / Topic Covered,${escapeCSV(sub.remarks || "Regular curriculum session conducted.")}`,
    "",
    "--- STUDENT ATTENDANCE ROSTER ---",
    "S.No,USN,Student Name,Status Code,Status Description,Notes"
  ];

  sub.students.forEach((st, idx) => {
    const desc =
      st.status === "P"
        ? "Present"
        : st.status === "A"
        ? "Absent"
        : st.status === "L"
        ? "Late"
        : "On-Duty / Excused";

    lines.push(
      [
        idx + 1,
        escapeCSV(st.usn),
        escapeCSV(st.name),
        escapeCSV(st.status),
        escapeCSV(desc),
        escapeCSV(st.notes || "")
      ].join(",")
    );
  });

  lines.push("");
  lines.push("--- VERIFICATION & SIGN-OFF ---");
  lines.push(`Faculty Signature,${escapeCSV(sub.faculty)}`);
  lines.push("Head of Department (HOD) Signature,");
  lines.push("Academic Dean Signature,");

  return lines.join("\r\n");
}

/**
 * Downloads a CSV file for a single hour's attendance submission.
 */
export function downloadHourlyAttendanceCSV(sub: AttendanceSubmission): void {
  const csvData = generateHourlyAttendanceCSV(sub);
  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  const blob = new Blob(["\uFEFF" + csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  // Clean filename: Attendance_M31_P6_2026-09-25_CSE-GEN_S3_F.csv
  const cleanPeriod = (sub.period.split(" · ")[0] || "P").replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanCode = (sub.subjectCode || "Class").replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanDate = (sub.date || new Date().toISOString().split("T")[0]).replace(/[^a-zA-Z0-9_-]/g, "-");
  const filename = `Attendance_${cleanCode}_${cleanPeriod}_${cleanDate}_${sub.program}_S${sub.semester}_${sub.section}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print-ready window with institutional header, session stats, and student roster.
 */
export function printHourlyAttendanceSheet(sub: AttendanceSubmission): void {
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    downloadHourlyAttendanceCSV(sub);
    return;
  }

  const rowsHtml = sub.students
    .map(
      (st, idx) => `
    <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#fbf9f5"};">
      <td style="padding: 6px 10px; border: 1px solid #d5d0c2; text-align: center; font-family: monospace; font-size: 11px;">${idx + 1}</td>
      <td style="padding: 6px 10px; border: 1px solid #d5d0c2; font-family: monospace; font-weight: bold; font-size: 11px;">${st.usn}</td>
      <td style="padding: 6px 10px; border: 1px solid #d5d0c2; font-size: 12px;">${st.name}</td>
      <td style="padding: 6px 10px; border: 1px solid #d5d0c2; text-align: center; font-weight: bold; font-size: 11px; color: ${
        st.status === "P" ? "#15803d" : st.status === "A" ? "#b91c1c" : st.status === "L" ? "#b45309" : "#4338ca"
      };">
        ${st.status === "P" ? "✓ Present" : st.status === "A" ? "✗ Absent" : st.status === "L" ? "⏰ Late" : "🛡️ Excused"}
      </td>
      <td style="padding: 6px 10px; border: 1px solid #d5d0c2; font-size: 11px; color: #555;">${st.notes || "—"}</td>
    </tr>
  `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Attendance Report · ${sub.subjectCode} · ${sub.period} (${sub.date})</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #222; margin: 0; padding: 20px; font-size: 12px; }
          .header-box { border-bottom: 2px solid #252b67; padding-bottom: 12px; margin-bottom: 16px; text-align: center; }
          .inst-name { font-size: 18px; font-weight: 800; color: #252b67; letter-spacing: 0.5px; margin: 0; text-transform: uppercase; }
          .doc-title { font-size: 13px; font-weight: 600; color: #777; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11.5px; }
          .meta-table td { padding: 4px 8px; border: 1px solid #e2ded3; }
          .meta-label { font-weight: bold; background: #faf7ef; width: 18%; color: #444; }
          .roster-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .roster-table th { background: #252b67; color: #fff; padding: 7px 10px; border: 1px solid #252b67; text-align: left; font-size: 11px; }
          .stats-bar { display: flex; gap: 12px; margin-bottom: 16px; }
          .stat-pill { flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #e0dbce; text-align: center; background: #fffdf7; }
          .stat-val { font-size: 16px; font-weight: bold; color: #252b67; }
          .stat-lbl { font-size: 10px; text-transform: uppercase; color: #666; }
          .sign-box { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sign-slot { width: 28%; text-align: center; border-top: 1px solid #666; padding-top: 6px; font-size: 11px; font-weight: 600; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; padding: 10px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #3730a3;">📄 Official Hourly Attendance Sheet — Print Preview</span>
          <div>
            <button onclick="window.print()" style="padding: 6px 14px; background: #252b67; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-right: 8px;">🖨️ Print Now</button>
            <button onclick="window.close()" style="padding: 6px 12px; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Close</button>
          </div>
        </div>

        <div class="header-box">
          <h1 class="inst-name">JAIN UNIVERSITY · SCHOOL OF ENGINEERING & TECHNOLOGY</h1>
          <div class="doc-title">Official Class Attendance Report · Hourly Session Record</div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">Course Title:</td>
            <td><strong>${sub.subject} (${sub.subjectCode})</strong></td>
            <td class="meta-label">Session Type:</td>
            <td>${sub.type}</td>
          </tr>
          <tr>
            <td class="meta-label">Faculty:</td>
            <td>${sub.faculty}</td>
            <td class="meta-label">Class / Batch:</td>
            <td><strong>${sub.program} · Sem ${sub.semester} (${sub.section})</strong></td>
          </tr>
          <tr>
            <td class="meta-label">Period / Hour:</td>
            <td><strong>${sub.period}</strong></td>
            <td class="meta-label">Date & Room:</td>
            <td>${sub.date} · Room: ${sub.room}</td>
          </tr>
          ${sub.remarks ? `<tr><td class="meta-label">Remarks:</td><td colspan="3"><em>${sub.remarks}</em></td></tr>` : ""}
        </table>

        <div class="stats-bar">
          <div class="stat-pill"><div class="stat-val">${sub.totalCount}</div><div class="stat-lbl">Enrolled</div></div>
          <div class="stat-pill" style="border-color: #86efac; background: #f0fdf4;"><div class="stat-val" style="color: #166534;">${sub.presentCount}</div><div class="stat-lbl">Present</div></div>
          <div class="stat-pill" style="border-color: #fca5a5; background: #fef2f2;"><div class="stat-val" style="color: #991b1b;">${sub.absentCount}</div><div class="stat-lbl">Absent</div></div>
          <div class="stat-pill"><div class="stat-val">${sub.lateCount}</div><div class="stat-lbl">Late</div></div>
          <div class="stat-pill" style="border-color: #fde047; background: #fefce8;"><div class="stat-val" style="color: #854d0e;">${sub.attendancePercentage}%</div><div class="stat-lbl">Turnout Rate</div></div>
        </div>

        <table class="roster-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th style="width: 120px;">USN</th>
              <th>Student Full Name</th>
              <th style="width: 100px; text-align: center;">Attendance</th>
              <th style="width: 130px;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-box">
          <div class="sign-slot">Faculty In-Charge<br><span style="font-weight: normal; font-size: 10px; color: #555;">(${sub.faculty.split(" - ")[0]})</span></div>
          <div class="sign-slot">Class Teacher / Mentor<br><span style="font-weight: normal; font-size: 10px; color: #555;">(Verification)</span></div>
          <div class="sign-slot">Head of Department (HOD)<br><span style="font-weight: normal; font-size: 10px; color: #555;">(School of Computer Science)</span></div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Retrieves attendance submissions recorded by or matching a specific faculty name.
 */
export function getFacultyAttendanceSubmissions(facultyName: string): AttendanceSubmission[] {
  const all = loadAllAttendanceSubmissions();
  if (!facultyName) return all;
  const clean = facultyName.split(" - ")[0].toLowerCase().trim();
  return all.filter((s) => s.faculty.toLowerCase().includes(clean));
}
