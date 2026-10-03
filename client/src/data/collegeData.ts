// College source adapter: all records come from the verified college timetable site export.
import batchData from "./batch-data.json";
import facultyData from "./faculty-data.json";
import subjectData from "./subject-data.json";
import roomData from "./room-data.json";

export type CollegeBatch = (typeof batchData.batches)[keyof typeof batchData.batches];
type SubjectWithOffering = CollegeSubject & { faculty?: string; ltpe?: string; };
export type CollegeRoom = (typeof roomData.rooms)[number];
export type CollegeSubject = (typeof subjectData.subjects)[number];

export const collegePrograms = batchData.programs;
const batchIndex = batchData.index as Record<string, Record<string, string[]>>;
export const collegeBatches = batchData.batches as Record<string, CollegeBatch>;
export const collegeFacultyNames = facultyData.names;
export const collegeFaculty = facultyData.faculty;
export const collegeSubjects = subjectData.subjects;
export const collegeOfferings = subjectData.offerings as Record<string, Array<{ faculty: string; program: string; semester: string; section: string; ltpe: string; batch: string; codes: string[] }>>;
export const collegeRooms = roomData.rooms;
export const collegeFreeRooms = roomData.freeRooms;
export const collegeRoomData = roomData.roomData;
export const collegeFacultyAssignments = (facultyData as any).assignments as Record<
  string,
  Array<{ code: string; name: string; ltpe: string; program: string; semester: string; section: string }>
>;
export const collegeFacultyPrograms = (facultyData as any).programs as Array<{ code: string; name: string }>;

export interface ClassTeacherRecord {
  key: string;
  program: string;
  semester: string;
  section: string;
  classTeacher: string;
  title: string;
}

export function getAllClassTeachers(): ClassTeacherRecord[] {
  const result: ClassTeacherRecord[] = [];
  for (const [key, batch] of Object.entries(collegeBatches)) {
    if (batch.classTeacher) {
      const [program, semester, section] = key.split("|");
      result.push({
        key,
        program: program || "",
        semester: semester || "",
        section: section || "",
        classTeacher: batch.classTeacher,
        title: batch.title || key,
      });
    }
  }
  return result;
}

export function getFacultyTimetable(facultyName: string) {
  return collegeFaculty[facultyName as keyof typeof collegeFaculty];
}

export function getFacultyAssignments(facultyName: string) {
  return collegeFacultyAssignments[facultyName] || [];
}

export function semestersFor(program: string) {
  return Object.keys(batchIndex[program] || {});
}

export function sectionsFor(program: string, semester: string) {
  return batchIndex[program]?.[semester] || [];
}

export function getBatch(program: string, semester: string, section: string) {
  return collegeBatches[`${program}|${semester}|${section}`];
}

export function getSubjectByCode(code: string, program?: string, semester?: string, section?: string): SubjectWithOffering | undefined {
  const normalized = code.replace(/\(L\)$/i, "").trim();
  const baseCode = normalized.replace(/[A-Z]+$/i, "").trim();

  // First check batch subjects if program/sem/sec is given
  if (program && semester && section) {
    const batch = collegeBatches[`${program}|${semester}|${section}`];
    if (batch?.subjects) {
      const batchSub = (batch.subjects as any[]).find(
        (s) =>
          s.code.toUpperCase() === normalized.toUpperCase() ||
          s.code.toUpperCase() === baseCode.toUpperCase()
      );
      if (batchSub) {
        return {
          code: batchSub.code,
          name: batchSub.name,
          key: batchSub.code,
          codes: [batchSub.code, normalized],
          faculty: batchSub.faculty,
          ltpe: batchSub.ltpe
        } as SubjectWithOffering;
      }
    }
  }

  // Also check CSE-GEN S3 F directly if normalized ends with F
  if (normalized.endsWith("F") || normalized.endsWith("f")) {
    const batchF = collegeBatches["CSE-GEN|3|F"];
    if (batchF?.subjects) {
      const batchSub = (batchF.subjects as any[]).find(
        (s) =>
          s.code.toUpperCase() === normalized.toUpperCase() ||
          s.code.toUpperCase() === baseCode.toUpperCase()
      );
      if (batchSub) {
        return {
          code: batchSub.code,
          name: batchSub.name,
          key: batchSub.code,
          codes: [batchSub.code, normalized],
          faculty: batchSub.faculty,
          ltpe: batchSub.ltpe
        } as SubjectWithOffering;
      }
    }
  }

  let match = collegeSubjects.find((subject) => subject.codes.includes(normalized));
  if (!match && baseCode) {
    match = collegeSubjects.find((subject) => subject.codes.includes(baseCode));
  }
  if (!match) return undefined;
  const offerings = collegeOfferings[match.key] || [];
  const offering = offerings.find((item: { program: string; semester: string; section: string }) => item.program === program && item.semester === semester && item.section === section) || offerings[0];
  return offering ? { ...match, ...offering } : (match as SubjectWithOffering);
}

export function parseBatchCell(text: string, program: string, semester: string, section: string) {
  const [codePart, ...roomParts] = text.split(" in ");
  const code = codePart.replace(/\(L\)$/i, "").trim();
  const lab = /\(L\)/i.test(codePart) || /lab/i.test(text);
  const room = roomParts.join(" in ").trim();
  const subject = getSubjectByCode(code, program, semester, section);
  return { code, room, lab, subjectName: subject?.name || code, faculty: subject?.faculty || "Faculty allocation", ltpe: subject?.ltpe || "—" };
}

export function searchFaculty(query: string) {
  const value = query.toLowerCase().trim();
  return collegeFacultyNames.filter((name) => name.toLowerCase().includes(value)).slice(0, 12);
}

export function searchSubjects(query: string) {
  const value = query.toLowerCase().trim();
  return collegeSubjects.filter((subject) => `${subject.name} ${subject.code}`.toLowerCase().includes(value)).slice(0, 12);
}

export function searchRooms(query: string, type?: string) {
  const value = query.toLowerCase().trim();
  return collegeRooms.filter((room) => (!type || type === "All" || room.type === type) && room.name.toLowerCase().includes(value)).slice(0, 20);
}
