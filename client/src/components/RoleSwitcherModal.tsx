import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  X,
  ShieldCheck,
  GraduationCap,
  UsersRound,
  CheckCircle2,
  Lock,
  Phone,
  Key,
  BadgeAlert,
  ArrowRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CSE_GEN_SECTION_F_STUDENTS, getStudentRegisteredPhone } from "@/data/studentsData";
import { REGISTERED_FACULTY } from "@/data/facultyAuthData";

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSwitcherModal({ isOpen, onClose }: RoleSwitcherModalProps) {
  const { user, loginStudent, loginFaculty, loginAdmin, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"student" | "faculty" | "admin">("student");

  // Student form state
  const [studentPhone, setStudentPhone] = useState("9845010001");
  const [studentUsn, setStudentUsn] = useState("25BTRGA001");

  // Faculty form state
  const [facultyPhone, setFacultyPhone] = useState("6353572133");
  const [facultyCode, setFacultyCode] = useState("JGI-FAC-6353");

  // Admin form state
  const [adminId, setAdminId] = useState("admin");
  const [adminPass, setAdminPass] = useState("112146");

  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const res = loginStudent(studentUsn);
    if (res.success) {
      toast.success("Student Authenticated", {
        description: `Welcome ${res.user?.name}! You are logged in as a student.`
      });
      onClose();
    } else {
      setErrorMsg(res.error || "Authentication failed. Please check your USN.");
    }
  };

  const handleFacultyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const res = loginFaculty(facultyPhone, facultyCode);
    if (res.success) {
      toast.success("Faculty Authenticated", {
        description: `Welcome ${res.user?.name}! Attendance permissions unlocked.`
      });
      onClose();
    } else {
      setErrorMsg(res.error || "Authentication failed.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const res = loginAdmin(adminId, adminPass);
    if (res.success) {
      toast.success("Master Admin Access Granted", {
        description: "Welcome Administrator! Admin Studio and full publishing controls unlocked."
      });
      onClose();
    } else {
      setErrorMsg(res.error || "Admin access denied.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#fffdf7] border border-[#d5d0c2] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-[#252b67] text-white p-5 flex items-start justify-between border-b border-[#1f255b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e3a62f] text-[#252b67] flex items-center justify-center font-bold text-base shadow-sm">
              JGi
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#e3a62f] uppercase tracking-wider font-mono">
                JAIN (DEEMED-TO-BE UNIVERSITY) · SECURE AUTH
              </div>
              <h2 className="text-xl font-bold font-serif text-white mt-0.5">
                Role Authentication Portal
              </h2>
              <p className="text-xs text-white/80">
                Log in to authenticate as a Student, Faculty Member, or Master Admin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Active User Pill */}
        <div className="px-5 py-2.5 bg-[#f4f1e8] border-b border-[#e5e1d5] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#88848a]">Active Session:</span>
            <strong className="text-[#252b67]">{user?.name}</strong>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#33409a] text-white">
              {user?.roleType === "admin" ? "Master Admin" : user?.roleType === "faculty" ? "Faculty" : "Student"}
            </span>
          </div>

          <button
            onClick={() => {
              logout();
              toast.info("Logged out", { description: "Reverted to Guest Student session." });
            }}
            className="text-[11px] text-[#c84232] hover:underline font-semibold cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-[#ded9cb] bg-[#ece8dc]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setErrorMsg("");
            }}
            className={`flex-1 py-3 px-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "student"
                ? "bg-[#fffdf7] text-[#252b67] border-[#33409a]"
                : "text-[#66636a] border-transparent hover:bg-[#f6f4ee]"
            }`}
          >
            <GraduationCap size={16} className="text-[#33409a]" />
            <span>Student Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("faculty");
              setErrorMsg("");
            }}
            className={`flex-1 py-3 px-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "faculty"
                ? "bg-[#fffdf7] text-[#252b67] border-[#e3a62f]"
                : "text-[#66636a] border-transparent hover:bg-[#f6f4ee]"
            }`}
          >
            <UsersRound size={16} className="text-[#e3a62f]" />
            <span>Teacher Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setErrorMsg("");
            }}
            className={`flex-1 py-3 px-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "admin"
                ? "bg-[#fffdf7] text-[#252b67] border-[#252b67]"
                : "text-[#66636a] border-transparent hover:bg-[#f6f4ee]"
            }`}
          >
            <ShieldCheck size={16} className="text-[#252b67]" />
            <span>Master Admin</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-[#fce8e6] border border-[#f3b2ac] text-[#c84232] text-xs flex items-start gap-2">
              <BadgeAlert size={16} className="shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* TAB 1: STUDENT LOGIN (USN only) */}
          {activeTab === "student" && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="p-3 bg-[#fbf9f4] border border-[#e5e1d5] rounded-lg text-xs text-[#66636a] flex items-start gap-2">
                <Info size={16} className="text-[#33409a] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#252b67]">Student Access:</strong> Enter your official <strong>University USN</strong> (e.g. 25BTRGA001) to open your personalized academic timetable and live schedule.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1">
                  University USN
                </label>
                <div className="relative">
                  <GraduationCap size={15} className="absolute left-3 top-3 text-[#88848a]" />
                  <Input
                    type="text"
                    value={studentUsn}
                    onChange={(e) => setStudentUsn(e.target.value.toUpperCase())}
                    placeholder="Enter University USN (e.g. 25BTRGA001)"
                    className="pl-9 text-xs font-semibold bg-[#faf8f2] border-[#ded9cb] uppercase font-mono tracking-wider"
                    required
                  />
                </div>
              </div>

              {/* Quick autofill chips for Section F students */}
              <div>
                <span className="text-[10px] font-bold text-[#88848a] uppercase tracking-wider block mb-1.5">
                  Quick Demo Student Logins (Section F):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CSE_GEN_SECTION_F_STUDENTS.slice(0, 4).map((st) => (
                    <button
                      type="button"
                      key={st.usn}
                      onClick={() => {
                        setStudentUsn(st.usn);
                        setStudentPhone(getStudentRegisteredPhone(st.usn));
                        setErrorMsg("");
                      }}
                      className="px-2 py-1 rounded bg-[#f0ede4] hover:bg-[#e4dfd2] text-[11px] font-medium text-[#252b67] border border-[#ded9cb] transition"
                    >
                      {st.usn} ({st.name.split(" ")[0]})
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-[#33409a] hover:bg-[#252b67] text-white font-bold text-xs gap-2 shadow-sm mt-2"
              >
                <span>Log in as Student</span>
                <ArrowRight size={14} />
              </Button>
            </form>
          )}

          {/* TAB 2: TEACHER LOGIN (Phone Number + Special University Code) */}
          {activeTab === "faculty" && (
            <form onSubmit={handleFacultyLogin} className="space-y-4">
              <div className="p-3 bg-[#fdfaf2] border border-[#f1e6cc] rounded-lg text-xs text-[#755913] flex items-start gap-2">
                <Info size={16} className="text-[#e3a62f] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#a07412]">Teacher Rule:</strong> Teachers log in exclusively using their <strong>registered Phone Number</strong> and the <strong>Special Code given to them at the university</strong>.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1">
                  Registered Faculty Mobile Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-3 text-[#88848a]" />
                  <Input
                    type="tel"
                    value={facultyPhone}
                    onChange={(e) => setFacultyPhone(e.target.value)}
                    placeholder="10-digit mobile number (e.g. 9845011001)"
                    className="pl-9 text-xs bg-[#faf8f2] border-[#ded9cb]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1">
                  Special University Faculty Code
                </label>
                <div className="relative">
                  <Key size={15} className="absolute left-3 top-3 text-[#88848a]" />
                  <Input
                    type="text"
                    value={facultyCode}
                    onChange={(e) => setFacultyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. JGI-FAC-4421"
                    className="pl-9 text-xs font-mono font-bold bg-[#faf8f2] border-[#ded9cb] uppercase"
                    required
                  />
                </div>
              </div>

              {/* Quick autofill chips for Registered Faculty */}
              <div>
                <span className="text-[10px] font-bold text-[#88848a] uppercase tracking-wider block mb-1.5">
                  Registered University Faculty:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REGISTERED_FACULTY.slice(0, 4).map((fac) => (
                    <button
                      type="button"
                      key={fac.id}
                      onClick={() => {
                        setFacultyPhone(fac.phone);
                        setFacultyCode(fac.specialCode);
                        setErrorMsg("");
                      }}
                      className="px-2 py-1 rounded bg-[#fdf5df] hover:bg-[#f6e9c6] text-[11px] font-medium text-[#7d5c0e] border border-[#f0deae] transition"
                    >
                      {fac.name.split(" ")[1] || fac.name} ({fac.specialCode})
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-[#e3a62f] hover:bg-[#cf9424] text-[#252b67] font-bold text-xs gap-2 shadow-sm mt-2"
              >
                <span>Log in as Faculty</span>
                <ArrowRight size={14} />
              </Button>
            </form>
          )}

          {/* TAB 3: MASTER ADMIN LOGIN (Exclusive to Nitin / Master Admin) */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-[#eef1fb] border border-[#c5ceee] rounded-lg text-xs text-[#252b67] flex items-start gap-2">
                <Lock size={16} className="text-[#33409a] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#33409a]">Master Admin Rule:</strong> You are the only Master Administrator. The <strong>Admin Studio (/admin)</strong> is strictly for you and not accessible to students or teachers.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1">
                  Master Admin ID / Phone Number
                </label>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-3 top-3 text-[#88848a]" />
                  <Input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="admin or registered mobile number"
                    className="pl-9 text-xs bg-[#faf8f2] border-[#ded9cb]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1">
                  Master Admin Secret Security Key
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-3 text-[#88848a]" />
                  <Input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Master password (112146)"
                    className="pl-9 text-xs bg-[#faf8f2] border-[#ded9cb]"
                    required
                  />
                </div>
              </div>

              {/* Master Admin Autofill */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAdminId("admin");
                    setAdminPass("112146");
                    setErrorMsg("");
                  }}
                  className="text-[11px] text-[#33409a] font-semibold hover:underline cursor-pointer"
                >
                  Autofill Master Admin Credentials (admin / 112146)
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-[#252b67] hover:bg-[#1b2052] text-white font-bold text-xs gap-2 shadow-sm mt-2"
              >
                <ShieldCheck size={15} className="text-[#e3a62f]" />
                <span>Log in as Master Administrator</span>
                <ArrowRight size={14} />
              </Button>
            </form>
          )}
        </div>

        {/* Footer Permission Legend */}
        <div className="p-3.5 bg-[#f6f4ed] border-t border-[#ded9cb] text-[11px] text-[#78757c] flex flex-wrap items-center justify-between gap-2">
          <span>Student: Phone + USN</span>
          <span>·</span>
          <span>Teacher: Phone + Special Code</span>
          <span>·</span>
          <span className="font-semibold text-[#252b67]">Admin Studio: Master Admin Only</span>
        </div>
      </div>
    </div>
  );
}
