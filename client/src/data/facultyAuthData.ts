export interface FacultyAuthRecord {
  id: string;
  name: string;
  phone: string;
  specialCode: string;
  codeAliases?: string[];
  department: string;
  designation: string;
  avatarInitials: string;
  canMarkAttendance: boolean;
}

export const REGISTERED_FACULTY: FacultyAuthRecord[] = [
  {
    id: "prof_vidhya_sre",
    name: "Prof. Vidhya Sre",
    phone: "6353572133",
    specialCode: "JGI-FAC-6353",
    codeAliases: ["VIDHYA", "VIDHYA SRE", "VIDHYASRE", "VIDHYA123", "FACULTY123", "6353", "JGI-6353", "JGI-FAC-2026", "TEACHER123"],
    department: "Computer Science & Engineering",
    designation: "Assistant Professor",
    avatarInitials: "VS",
    canMarkAttendance: true
  },
  {
    id: "dr_punyasamudran",
    name: "Dr. Punyasamudran Srinivasulu",
    phone: "9845011001",
    specialCode: "JGI-FAC-4421",
    department: "Department of Chemistry & Basic Sciences",
    designation: "Assistant Professor & Class Teacher (CSE-GEN-F)",
    avatarInitials: "PS",
    canMarkAttendance: true
  },
  {
    id: "dr_saravanakumar",
    name: "Dr. S Saravanakumar",
    phone: "9845011002",
    specialCode: "JGI-FAC-1022",
    department: "Computer Science & Engineering",
    designation: "Associate Professor",
    avatarInitials: "SK",
    canMarkAttendance: true
  },
  {
    id: "dr_aishwarya",
    name: "Dr. Aishwarya",
    phone: "9845011003",
    specialCode: "JGI-FAC-3033",
    department: "Department of Mathematics",
    designation: "Assistant Professor",
    avatarInitials: "AI",
    canMarkAttendance: true
  },
  {
    id: "prof_chaluvaraju",
    name: "Prof. Chaluvaraju P P",
    phone: "9845011004",
    specialCode: "JGI-FAC-5044",
    department: "Electrical & Electronics Engineering",
    designation: "Assistant Professor",
    avatarInitials: "CP",
    canMarkAttendance: true
  },
  {
    id: "dr_sancharini",
    name: "Dr. Sancharini Mitra",
    phone: "9845011005",
    specialCode: "JGI-FAC-6055",
    department: "Humanities & Social Sciences",
    designation: "Assistant Professor",
    avatarInitials: "SM",
    canMarkAttendance: true
  },
  {
    id: "dr_athira",
    name: "Dr. Athira",
    phone: "9845011006",
    specialCode: "JGI-FAC-7066",
    department: "Department of Epistemology & Science",
    designation: "Assistant Professor",
    avatarInitials: "AT",
    canMarkAttendance: true
  },
  {
    id: "prof_anil_rao",
    name: "Prof. Anil Rao",
    phone: "9845011007",
    specialCode: "JGI-FAC-8077",
    department: "Computer Science & Engineering",
    designation: "Professor",
    avatarInitials: "AR",
    canMarkAttendance: true
  },
  {
    id: "dr_kabir_shah",
    name: "Dr. Kabir Shah",
    phone: "9845011008",
    specialCode: "JGI-FAC-9088",
    department: "Computer Science & Engineering",
    designation: "Associate Professor",
    avatarInitials: "KS",
    canMarkAttendance: true
  },
  {
    id: "dr_ravindra",
    name: "Dr. Ravindra Raman Cholla - Assistant Professor",
    phone: "9845011010",
    specialCode: "JGI-FAC-1010",
    codeAliases: ["RAVINDRA", "RAVINDRA123", "FACULTY123"],
    department: "Computer Science & Engineering",
    designation: "Assistant Professor (OS Faculty)",
    avatarInitials: "RC",
    canMarkAttendance: true
  },
  {
    id: "ms_harpreet",
    name: "Ms. Harpreet Kaur - Assistant Professor",
    phone: "9845011011",
    specialCode: "JGI-FAC-1011",
    codeAliases: ["HARPREET", "HARPREET123", "FACULTY123"],
    department: "Computer Science & Engineering",
    designation: "Assistant Professor (COA Faculty)",
    avatarInitials: "HK",
    canMarkAttendance: true
  },
  {
    id: "dr_balajee",
    name: "Dr. Balajee Alphonse - Assistant Professor",
    phone: "9845011012",
    specialCode: "JGI-FAC-1012",
    codeAliases: ["BALAJEE", "BALAJEE123", "FACULTY123"],
    department: "Computer Science & Engineering",
    designation: "Assistant Professor & Class Teacher (CSE-GEN-F S3)",
    avatarInitials: "BA",
    canMarkAttendance: true
  },
  {
    id: "mr_ravi_kumar",
    name: "Mr. Lanke Ravi Kumar - Assistant Professor",
    phone: "9845011013",
    specialCode: "JGI-FAC-1013",
    codeAliases: ["RAVI", "RAVI123", "FACULTY123"],
    department: "Computer Science & Engineering",
    designation: "Assistant Professor (Python Faculty)",
    avatarInitials: "RK",
    canMarkAttendance: true
  },
  {
    id: "mr_vishwanatha",
    name: "Mr. Vishwanatha S - Assistant Professor",
    phone: "9845011014",
    specialCode: "JGI-FAC-1014",
    codeAliases: ["VISHWANATHA", "MATHS123", "FACULTY123"],
    department: "Department of Mathematics",
    designation: "Assistant Professor (Mathematics Faculty)",
    avatarInitials: "VS",
    canMarkAttendance: true
  },
  {
    id: "dr_rajasimha",
    name: "Dr. Rajasimha A Makaram - Professor",
    phone: "9845011015",
    specialCode: "JGI-FAC-1015",
    codeAliases: ["RAJASIMHA", "DESIGN123", "FACULTY123"],
    department: "Department of Design & Innovation",
    designation: "Professor (Design Thinking Faculty)",
    avatarInitials: "RM",
    canMarkAttendance: true
  }
];

const FACULTY_STORAGE_KEY = "campus_ledger_registered_faculty_v2";

export function loadAllFaculty(): FacultyAuthRecord[] {
  try {
    const raw = localStorage.getItem(FACULTY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load faculty from localStorage", e);
  }
  return REGISTERED_FACULTY;
}

export function saveAllFaculty(faculty: FacultyAuthRecord[]): void {
  try {
    localStorage.setItem(FACULTY_STORAGE_KEY, JSON.stringify(faculty));
    window.dispatchEvent(new CustomEvent("campus_ledger_faculty_updated", { detail: faculty }));
  } catch (e) {
    console.error("Failed to save faculty to localStorage", e);
  }
}

export function subscribeToFacultyChanges(callback: (faculty: FacultyAuthRecord[]) => void): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<FacultyAuthRecord[]>;
    callback(custom.detail || loadAllFaculty());
  };
  window.addEventListener("campus_ledger_faculty_updated", handler);

  const storageHandler = (e: StorageEvent) => {
    if (e.key === FACULTY_STORAGE_KEY) {
      callback(loadAllFaculty());
    }
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener("campus_ledger_faculty_updated", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export function addFacultyRecord(newFaculty: FacultyAuthRecord): { success: boolean; faculty: FacultyAuthRecord; error?: string } {
  const current = loadAllFaculty();
  const normPhone = newFaculty.phone.replace(/[^0-9]/g, "").slice(-10);
  const normName = newFaculty.name.trim().toUpperCase();

  const existing = current.find((f) => {
    const fPhone = f.phone.replace(/[^0-9]/g, "").slice(-10);
    return fPhone === normPhone || f.name.trim().toUpperCase() === normName;
  });

  if (existing) {
    return {
      success: false,
      faculty: existing,
      error: `Faculty with name "${newFaculty.name}" or phone ending in ...${normPhone.slice(-4)} already exists.`
    };
  }

  const cleanFaculty: FacultyAuthRecord = {
    ...newFaculty,
    phone: normPhone,
    specialCode: newFaculty.specialCode.trim().toUpperCase(),
    avatarInitials: newFaculty.avatarInitials || newFaculty.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  };

  const updated = [cleanFaculty, ...current];
  saveAllFaculty(updated);
  return { success: true, faculty: cleanFaculty };
}

export function removeFacultyRecord(identifier: string): { success: boolean; removedFaculty?: FacultyAuthRecord; error?: string } {
  const current = loadAllFaculty();
  const norm = identifier.trim().toUpperCase();
  const normPhone = identifier.replace(/[^0-9]/g, "").slice(-10);

  const target = current.find((f) => {
    if (f.id.toUpperCase() === norm) return true;
    if (f.name.toUpperCase().includes(norm)) return true;
    if (normPhone && f.phone.includes(normPhone)) return true;
    return false;
  });

  if (!target) {
    return { success: false, error: `No registered faculty found matching "${identifier}".` };
  }

  const updated = current.filter((f) => f.id !== target.id);
  saveAllFaculty(updated);
  return { success: true, removedFaculty: target };
}

export function assignFacultySpecialCode(
  identifier: string,
  newCode: string
): { success: boolean; faculty?: FacultyAuthRecord; previousCode?: string; error?: string } {
  const current = loadAllFaculty();
  const norm = identifier.trim().toUpperCase();
  const normPhone = identifier.replace(/[^0-9]/g, "").slice(-10);
  const cleanNewCode = newCode.trim().toUpperCase();

  if (!cleanNewCode) {
    return { success: false, error: "New special code cannot be empty." };
  }

  const targetIndex = current.findIndex((f) => {
    if (f.id.toUpperCase() === norm) return true;
    if (f.name.toUpperCase().includes(norm)) return true;
    if (normPhone && f.phone.includes(normPhone)) return true;
    return false;
  });

  if (targetIndex === -1) {
    return { success: false, error: `No registered teacher found matching "${identifier}".` };
  }

  const target = current[targetIndex];
  const previousCode = target.specialCode;

  // Strict enforcement: set new code and CLEAR codeAliases so that this teacher can ONLY login with the new code
  const updatedFaculty: FacultyAuthRecord = {
    ...target,
    specialCode: cleanNewCode,
    codeAliases: [] // Cleared completely so teacher cannot log in with previous alias bypasses
  };

  current[targetIndex] = updatedFaculty;
  saveAllFaculty(current);

  return {
    success: true,
    faculty: updatedFaculty,
    previousCode
  };
}

export function findFacultyByCredentials(phone: string, specialCode: string): FacultyAuthRecord | null {
  const normPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const normCode = specialCode.trim().toUpperCase();

  const allFaculty = loadAllFaculty();

  return (
    allFaculty.find((f) => {
      const fPhone = f.phone.replace(/[^0-9]/g, "").slice(-10);
      const fCode = f.specialCode.trim().toUpperCase();
      if (fPhone === normPhone) {
        if (!normCode) return false;
        // Strict match with assigned special code
        if (fCode === normCode) return true;
        // Match alias only if codeAliases is present and non-empty
        if (f.codeAliases && f.codeAliases.length > 0 && f.codeAliases.some((a) => a.toUpperCase() === normCode)) return true;
      }
      return false;
    }) || null
  );
}
