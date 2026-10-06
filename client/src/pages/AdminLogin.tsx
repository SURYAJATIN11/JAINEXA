import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ShieldCheck,
  KeyRound,
  GraduationCap,
  UsersRound,
  Lock,
  Phone,
  Key,
  BadgeAlert,
  ArrowRight,
  ArrowLeft,
  Info
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

interface AdminLoginProps {
  onSuccess?: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const { loginStudent, loginFaculty, loginAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<"admin" | "faculty" | "student">("admin");

  // Student inputs
  const [studentPhone, setStudentPhone] = useState("");
  const [studentUsn, setStudentUsn] = useState("");

  // Faculty inputs
  const [facultyPhone, setFacultyPhone] = useState("");
  const [facultyCode, setFacultyCode] = useState("");

  // Admin inputs
  const [adminId, setAdminId] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = loginStudent(studentPhone, studentUsn);
      if (res.success) {
        toast.info("Logged in as Student", {
          description: "Admin Studio is restricted to Master Admin. Redirecting to Student Timetable."
        });
        setLocation("/#batch-timetable");
      } else {
        setError(res.error || "Authentication failed.");
      }
    }, 300);
  };

  const handleFacultySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = loginFaculty(facultyPhone, facultyCode);
      if (res.success) {
        toast.info("Logged in as Faculty", {
          description: "Admin Studio is restricted to Master Admin. Redirecting to Faculty Timetable & Attendance Portal."
        });
        setLocation("/#faculty-timetable");
      } else {
        setError(res.error || "Invalid faculty credentials.");
      }
    }, 300);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = loginAdmin(adminId, adminPass);
      if (res.success) {
        toast.success("Master Admin Access Verified", {
          description: "Welcome Administrator! Admin Studio unlocked."
        });
        if (onSuccess) {
          onSuccess();
        } else {
          setLocation("/admin");
        }
      } else {
        setError(res.error || "Access Denied: Admin Studio is strictly restricted to the Master Administrator.");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Texture background overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-cover"
        style={{ backgroundImage: "url('/manus-storage/campus-ledger-texture_15d6d0cc.png')" }}
      />

      {/* Navigation back to public portal */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs text-[#524f56] hover:text-[#252b67] gap-1.5">
            <ArrowLeft size={14} /> Back to Student & Faculty Timetable
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        {/* Header Branding with JAIN Logo */}
        <div className="text-center mb-6">
          <div className="bg-white rounded-xl p-3 px-4 shadow-sm inline-block mb-3 border border-[#ded9cb]">
            <img
              src="/images/jain-university-logo.png"
              alt="JAIN (Deemed-To-Be University)"
              className="h-9 w-auto max-w-[200px] object-contain block mx-auto"
            />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-[#262a68] font-normal tracking-tight m-0">
            University Authentication <em className="text-[#e3a62f] not-italic font-serif">Studio</em>
          </h1>
          <p className="text-xs text-[#757278] mt-1.5 max-w-xs mx-auto">
            Role-based login for Students, Faculty, and the Master Administrator.
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-[#fffdf7] border border-[#ded9cc] border-t-4 border-t-[#33409a] shadow-xl overflow-hidden rounded-lg">
          {/* Tabs */}
          <div className="flex border-b border-[#ded9cb] bg-[#ece8dc]">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setError("");
              }}
              className={`flex-1 py-3 px-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "admin"
                  ? "bg-[#fffdf7] text-[#252b67] border-[#252b67]"
                  : "text-[#66636a] border-transparent hover:bg-[#f6f4ee]"
              }`}
            >
              <ShieldCheck size={14} className="text-[#252b67]" />
              <span>Master Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("faculty");
                setError("");
              }}
              className={`flex-1 py-3 px-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "faculty"
                  ? "bg-[#fffdf7] text-[#252b67] border-[#e3a62f]"
                  : "text-[#66636a] border-transparent hover:bg-[#f6f4ee]"
              }`}
            >
              <UsersRound size={14} className="text-[#e3a62f]" />
              <span>Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("student");
                setError("");
              }}
              className={`flex-1 py-3 px-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "student"
                  ? "bg-[#fffdf7] text-[#252b67] border-[#33409a]"
                  : "text-[#66636a] border-transparent hover:bg-[#f6f4ee]"
              }`}
            >
              <GraduationCap size={14} className="text-[#33409a]" />
              <span>Student</span>
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded bg-[#fce8e6] border border-[#f3b2ac] text-[#c84232] text-xs flex items-start gap-2">
                <BadgeAlert size={15} className="shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* TAB: MASTER ADMIN */}
            {activeTab === "admin" && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="p-2.5 bg-[#eef1fb] border border-[#c5ceee] rounded-md text-xs text-[#252b67] flex items-start gap-2">
                  <Lock size={15} className="text-[#33409a] shrink-0 mt-0.5" />
                  <div>
                    <strong>Master Administrator Only:</strong> The Admin Studio (/admin) is reserved exclusively for the Master Admin. Students and teachers cannot access it.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e5a61] uppercase tracking-wider mb-1.5">
                    Admin Username / ID
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter Admin ID"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      className="text-xs bg-[#faf8f2] border-[#ded9cc]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e5a61] uppercase tracking-wider mb-1.5">
                    Master Admin Security Key
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter Master Password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="text-xs bg-[#faf8f2] border-[#ded9cc]"
                    required
                  />
                </div>



                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-[#252b67] hover:bg-[#1b2052] text-white font-bold text-xs gap-2 shadow-sm mt-3"
                >
                  <ShieldCheck size={15} className="text-[#e3a62f]" />
                  <span>{isLoading ? "Verifying..." : "Access Admin Studio"}</span>
                  <ArrowRight size={14} />
                </Button>
              </form>
            )}

            {/* TAB: FACULTY */}
            {activeTab === "faculty" && (
              <form onSubmit={handleFacultySubmit} className="space-y-4">
                <div className="p-2.5 bg-[#fdfaf2] border border-[#f1e6cc] rounded-md text-xs text-[#755913] flex items-start gap-2">
                  <Info size={15} className="text-[#e3a62f] shrink-0 mt-0.5" />
                  <div>
                    <strong>Teacher Login:</strong> Teachers log in using their <strong>Phone Number</strong> and the <strong>Special Code given to them at the university</strong>.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e5a61] uppercase tracking-wider mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3 text-[#88848a]" />
                    <Input
                      type="tel"
                      placeholder="e.g. 9845011001"
                      value={facultyPhone}
                      onChange={(e) => setFacultyPhone(e.target.value)}
                      className="pl-9 text-xs bg-[#faf8f2] border-[#ded9cc]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e5a61] uppercase tracking-wider mb-1.5">
                    Special University Faculty Code
                  </label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3 top-3 text-[#88848a]" />
                    <Input
                      type="text"
                      placeholder="e.g. JGI-FAC-4421"
                      value={facultyCode}
                      onChange={(e) => setFacultyCode(e.target.value.toUpperCase())}
                      className="pl-9 text-xs font-mono font-bold uppercase bg-[#faf8f2] border-[#ded9cc]"
                      required
                    />
                  </div>
                </div>



                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-[#e3a62f] hover:bg-[#cf9424] text-[#252b67] font-bold text-xs gap-2 shadow-sm mt-3"
                >
                  <UsersRound size={15} />
                  <span>{isLoading ? "Verifying..." : "Log in as Faculty"}</span>
                  <ArrowRight size={14} />
                </Button>
              </form>
            )}

            {/* TAB: STUDENT */}
            {activeTab === "student" && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div className="p-2.5 bg-[#fbf9f4] border border-[#e5e1d5] rounded-md text-xs text-[#66636a] flex items-start gap-2">
                  <Info size={15} className="text-[#33409a] shrink-0 mt-0.5" />
                  <div>
                    <strong>Student Login:</strong> Students log in using their <strong>Phone Number</strong> and university <strong>USN</strong>.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e5a61] uppercase tracking-wider mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3 text-[#88848a]" />
                    <Input
                      type="tel"
                      placeholder="e.g. 9845010001"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className="pl-9 text-xs bg-[#faf8f2] border-[#ded9cb]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e5a61] uppercase tracking-wider mb-1.5">
                    Registered Student Name or USN
                  </label>
                  <div className="relative">
                    <GraduationCap size={14} className="absolute left-3 top-3 text-[#88848a]" />
                    <Input
                      type="text"
                      placeholder="e.g. ABHIN ANTONY or 25BTRGA001"
                      value={studentUsn}
                      onChange={(e) => setStudentUsn(e.target.value)}
                      className="pl-9 text-xs bg-[#faf8f2] border-[#ded9cb]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-[#78757c] mt-1 block">
                    Security Rule: You can only log in using your own registered phone number.
                  </span>
                </div>



                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-[#33409a] hover:bg-[#252b67] text-white font-bold text-xs gap-2 shadow-sm mt-3"
                >
                  <GraduationCap size={15} />
                  <span>{isLoading ? "Verifying..." : "Log in as Student"}</span>
                  <ArrowRight size={14} />
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
