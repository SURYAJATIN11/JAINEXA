import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "faculty" | "student";

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  roleType: UserRole;
  department: string;
  avatarInitials: string;
  badgeTone: "indigo" | "amber" | "emerald" | "blue";
}

export const DEMO_USERS: User[] = [
  // Admin Accounts (Can access Admin Studio & Attendance Portal)
  {
    id: "coord",
    username: "coordinator",
    name: "Prof. Priya Raman",
    role: "Academic Coordinator",
    roleType: "admin",
    department: "Institutional Scheduling Office",
    avatarInitials: "PR",
    badgeTone: "indigo"
  },
  {
    id: "admin",
    username: "admin",
    name: "Institutional Administrator",
    role: "College Scheduler & Registrar",
    roleType: "admin",
    department: "Office of Academic Administration",
    avatarInitials: "AD",
    badgeTone: "indigo"
  },
  {
    id: "dean",
    username: "dean",
    name: "Dr. Meera Nair",
    role: "Dean of Academic Affairs",
    roleType: "admin",
    department: "Office of the Dean",
    avatarInitials: "MN",
    badgeTone: "emerald"
  },
  {
    id: "hod_cse",
    username: "hod_cse",
    name: "Dr. Kamlesh Tiwari",
    role: "Professor & HOD CSE",
    roleType: "admin",
    department: "Department of Computer Science",
    avatarInitials: "KT",
    badgeTone: "amber"
  },

  // Faculty Accounts (Can access Faculty Timetable, Take Attendance & Attendance Portal. CANNOT access Admin Studio)
  {
    id: "prof_vidhya_sre",
    username: "6353572133",
    name: "Prof. Vidhya Sre",
    role: "Assistant Professor",
    roleType: "faculty",
    department: "Computer Science & Engineering",
    avatarInitials: "VS",
    badgeTone: "amber"
  },
  {
    id: "dr_punyasamudran",
    username: "dr_punyasamudran",
    name: "Dr. Punyasamudran Srinivasulu",
    role: "Assistant Professor & Class Teacher (CSE-GEN-F)",
    roleType: "faculty",
    department: "Department of Chemistry & Basic Sciences",
    avatarInitials: "PS",
    badgeTone: "amber"
  },
  {
    id: "dr_saravanakumar",
    username: "dr_saravanakumar",
    name: "Dr. S Saravanakumar",
    role: "Associate Professor",
    roleType: "faculty",
    department: "Computer Science & Engineering",
    avatarInitials: "SK",
    badgeTone: "amber"
  },
  {
    id: "dr_aishwarya",
    username: "dr_aishwarya",
    name: "Dr. Aishwarya",
    role: "Assistant Professor",
    roleType: "faculty",
    department: "Department of Mathematics",
    avatarInitials: "AI",
    badgeTone: "amber"
  },
  {
    id: "prof_chaluvaraju",
    username: "prof_chaluvaraju",
    name: "Prof. Chaluvaraju P P",
    role: "Assistant Professor",
    roleType: "faculty",
    department: "Electrical & Electronics Engineering",
    avatarInitials: "CP",
    badgeTone: "amber"
  },
  {
    id: "dr_sancharini",
    username: "dr_sancharini",
    name: "Dr. Sancharini Mitra",
    role: "Assistant Professor",
    roleType: "faculty",
    department: "Humanities & Social Sciences",
    avatarInitials: "SM",
    badgeTone: "amber"
  },
  {
    id: "dr_athira",
    username: "dr_athira",
    name: "Dr. Athira",
    role: "Assistant Professor",
    roleType: "faculty",
    department: "Department of Epistemology & Science",
    avatarInitials: "AT",
    badgeTone: "amber"
  },
  {
    id: "dr_ravindra",
    username: "ravindra",
    name: "Dr. Ravindra Raman Cholla - Assistant Professor",
    role: "Assistant Professor (OS Faculty · CSE-GEN 3F)",
    roleType: "faculty",
    department: "Computer Science & Engineering",
    avatarInitials: "RC",
    badgeTone: "amber"
  },
  {
    id: "ms_harpreet",
    username: "harpreet",
    name: "Ms. Harpreet Kaur - Assistant Professor",
    role: "Assistant Professor (COA Faculty · CSE-GEN 3F)",
    roleType: "faculty",
    department: "Computer Science & Engineering",
    avatarInitials: "HK",
    badgeTone: "amber"
  },
  {
    id: "dr_balajee",
    username: "balajee",
    name: "Dr. Balajee Alphonse - Assistant Professor",
    role: "Assistant Professor & Class Teacher (CSE-GEN-F S3)",
    roleType: "faculty",
    department: "Computer Science & Engineering",
    avatarInitials: "BA",
    badgeTone: "amber"
  },

  // Student Accounts (Can view Batch Timetable & Rooms. CANNOT access Attendance Portal. CANNOT access Admin Studio)
  {
    id: "student_f",
    username: "student_f",
    name: "Krushna D. Fadadu",
    role: "Student (USN: 25BTRGA000 · CSE-GEN S3 F)",
    roleType: "student",
    department: "B.Tech CSE-GEN · Section F (3rd Sem)",
    avatarInitials: "KF",
    badgeTone: "blue"
  },
  {
    id: "student_guest",
    username: "student",
    name: "Guest Student",
    role: "B.Tech Undergraduate",
    roleType: "student",
    department: "Undergraduate Programs",
    avatarInitials: "ST",
    badgeTone: "blue"
  }
];

const CREDENTIALS_MAP: Record<string, { pass: string; user: User }> = {
  // Admin credentials
  jatin2007: { pass: "11042007", user: DEMO_USERS[1] },
  coordinator: { pass: "11042007", user: DEMO_USERS[0] },
  admin: { pass: "11042007", user: DEMO_USERS[1] },
  dean: { pass: "11042007", user: DEMO_USERS[2] },
  hod_cse: { pass: "11042007", user: DEMO_USERS[3] },

  // Faculty credentials
  dr_punyasamudran: { pass: "faculty123", user: DEMO_USERS[5] },
  faculty: { pass: "faculty123", user: DEMO_USERS[4] },
  vidhya: { pass: "faculty123", user: DEMO_USERS[4] },
  "6353572133": { pass: "faculty123", user: DEMO_USERS[4] },
  dr_saravanakumar: { pass: "faculty123", user: DEMO_USERS[5] },
  dr_aishwarya: { pass: "faculty123", user: DEMO_USERS[6] },
  prof_chaluvaraju: { pass: "faculty123", user: DEMO_USERS[7] },
  dr_sancharini: { pass: "faculty123", user: DEMO_USERS[8] },
  dr_athira: { pass: "faculty123", user: DEMO_USERS[9] },
  ravindra: { pass: "faculty123", user: DEMO_USERS[10] },
  dr_ravindra: { pass: "faculty123", user: DEMO_USERS[10] },
  harpreet: { pass: "faculty123", user: DEMO_USERS[11] },
  ms_harpreet: { pass: "faculty123", user: DEMO_USERS[11] },
  balajee: { pass: "faculty123", user: DEMO_USERS[12] },
  dr_balajee: { pass: "faculty123", user: DEMO_USERS[12] },

  // Student credentials
  student_f: { pass: "student123", user: DEMO_USERS[13] },
  student: { pass: "student123", user: DEMO_USERS[14] }
};

import { findStudentByCredentials, findStudentByUsn } from "@/data/studentsData";
import { findFacultyByCredentials, REGISTERED_FACULTY } from "@/data/facultyAuthData";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  canAccessAttendance: boolean; // Accessible ONLY to admin and faculties
  canAccessAdminStudio: boolean; // Accessible ONLY to admin
  login: (identifier: string, passOrCode: string) => { success: boolean; error?: string };
  loginStudent: (usnOrPhone: string, maybeUsn?: string) => { success: boolean; error?: string; user?: User };
  loginFaculty: (phone: string, specialCode: string) => { success: boolean; error?: string; user?: User };
  loginAdmin: (identifier: string, pass: string) => { success: boolean; error?: string; user?: User };
  loginGuest: () => void;
  quickLogin: (userId: string) => void;
  switchRole: (roleType: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "campus_ledger_role_auth_user_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  // Student Login: ONLY their USN is required!
  const loginStudent = (usnOrPhone: string, maybeUsn?: string): { success: boolean; error?: string; user?: User } => {
    const trimmedInput = (maybeUsn || usnOrPhone || "").trim();

    if (!trimmedInput) {
      return { success: false, error: "Please enter your University USN." };
    }

    const res = findStudentByUsn(trimmedInput);
    if (!res.success || !res.student) {
      return {
        success: false,
        error: res.error || "Authentication failed. No student record found for this USN."
      };
    }

    const matched = res.student;
    const studentUser: User = {
      id: `student_${matched.usn}`,
      username: matched.usn,
      name: matched.name,
      role: `Student (${matched.usn})`,
      roleType: "student",
      department: `B.Tech ${matched.program} · Section ${matched.section}`,
      avatarInitials: matched.name.split(" ").map((w) => w[0]).slice(0, 2).join(""),
      badgeTone: "blue"
    };

    setUser(studentUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentUser));
    return { success: true, user: studentUser };
  };

  // Faculty Login: ONLY through Phone Number + Special University Faculty Code
  const loginFaculty = (phone: string, specialCode: string): { success: boolean; error?: string; user?: User } => {
    const trimmedPhone = phone.trim();
    const trimmedCode = specialCode.trim();

    if (!trimmedPhone || !trimmedCode) {
      return { success: false, error: "Please enter your registered Phone Number and Special University Faculty Code." };
    }

    const matched = findFacultyByCredentials(trimmedPhone, trimmedCode);
    if (!matched) {
      return {
        success: false,
        error: "Invalid faculty credentials. Verify your phone number and special university faculty code (e.g. JGI-FAC-4421)."
      };
    }

    const facultyUser: User = {
      id: matched.id,
      username: matched.phone,
      name: matched.name,
      role: matched.designation,
      roleType: "faculty",
      department: matched.department,
      avatarInitials: matched.avatarInitials,
      badgeTone: "amber"
    };

    setUser(facultyUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(facultyUser));
    return { success: true, user: facultyUser };
  };

  // Master Admin Login: ONLY for the Master Administrator (Students & Teachers strictly barred)
  const loginAdmin = (identifier: string, pass: string): { success: boolean; error?: string; user?: User } => {
    const id = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Check Master Admin credentials (ID: JATIN2007, PWD: 11042007)
    const validAdminIdentifiers = ["jatin2007", "jatin", "admin", "9999999999", "coordinator", "master", "nitin"];
    const validAdminPasswords = ["11042007", "112146", "admin123", "admin@jain2026", "master2026"];

    if (validAdminIdentifiers.includes(id) && validAdminPasswords.includes(cleanPass)) {
      const adminUser: User = {
        id: "master_admin",
        username: "JATIN2007",
        name: "Master Administrator",
        role: "Master Administrator & Timetable Architect",
        roleType: "admin",
        department: "Office of Academic Administration",
        avatarInitials: "JA",
        badgeTone: "indigo"
      };

      setUser(adminUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }

    return {
      success: false,
      error: "Access Denied: Admin Studio is strictly reserved for Master Administrator (JATIN2007). Faculty and students cannot access this window."
    };
  };

  // Unified router
  const login = (identifier: string, passOrCode: string): { success: boolean; error?: string } => {
    // 1. Try student
    const studentRes = loginStudent(identifier, passOrCode);
    if (studentRes.success) return { success: true };

    // 2. Try faculty
    const facultyRes = loginFaculty(identifier, passOrCode);
    if (facultyRes.success) return { success: true };

    // 3. Try admin
    const adminRes = loginAdmin(identifier, passOrCode);
    if (adminRes.success) return { success: true };

    // 4. Fallback for legacy demo usernames
    const trimmed = identifier.trim().toLowerCase();
    const entry = CREDENTIALS_MAP[trimmed];
    if (entry && entry.pass === passOrCode) {
      setUser(entry.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(entry.user));
      return { success: true };
    }

    return {
      success: false,
      error: "Authentication failed. Students must use Phone + USN. Teachers must use Phone + Special Faculty Code. Admin must use Master Admin credentials."
    };
  };

  const quickLogin = (userId: string) => {
    const matched = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
    setUser(matched);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matched));
  };

  const switchRole = (roleType: UserRole) => {
    if (roleType === "admin") {
      quickLogin("admin");
    } else if (roleType === "faculty") {
      quickLogin("dr_punyasamudran");
    } else {
      quickLogin("student_f");
    }
  };

  const loginGuest = () => {
    const guest = DEMO_USERS[11];
    setUser(guest);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guest));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const roleType = user?.roleType || "student";
  const isAdmin = roleType === "admin";
  const isFaculty = roleType === "faculty";
  const isStudent = roleType === "student";

  // Strict permission gates
  const canAccessAttendance = isAdmin || isFaculty; // Attendance accessible ONLY to admin and faculties
  const canAccessAdminStudio = isAdmin; // Admin Studio ONLY accessible to admin

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isFaculty,
        isStudent,
        canAccessAttendance,
        canAccessAdminStudio,
        login,
        loginStudent,
        loginFaculty,
        loginAdmin,
        loginGuest,
        quickLogin,
        switchRole,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
