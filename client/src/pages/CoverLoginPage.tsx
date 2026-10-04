import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { loadAllFaculty } from "@/data/facultyAuthData";
import {
  GraduationCap,
  UsersRound,
  ShieldCheck,
  Phone,
  KeyRound,
  Lock,
  ArrowRight,
  AlertCircle,
  Zap,
  MapPin,
  Lightbulb,
  Target,
  Eye,
  EyeOff,
  Compass,
  CalendarCheck2,
  Map,
  Clock3,
  CheckCircle2,
  Sparkles,
  User
} from "lucide-react";

type RoleTab = "student" | "faculty" | "admin";

export default function CoverLoginPage() {
  const { user, isAuthenticated, loginStudent, loginFaculty, loginAdmin, loginGuest } = useAuth();
  const [, setLocation] = useLocation();

  const [activeRole, setActiveRole] = useState<RoleTab>("student");

  // Student inputs - empty by default (no autofill)
  const [studentPhone, setStudentPhone] = useState("");
  const [studentUsn, setStudentUsn] = useState("");

  // Faculty inputs - empty by default (no autofill)
  const [facultyPhone, setFacultyPhone] = useState("");
  const [facultyCode, setFacultyCode] = useState("");

  // Admin inputs - empty by default (no autofill)
  const [adminId, setAdminId] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = loginStudent(studentPhone, studentUsn);
      if (res.success) {
        toast.success(`Welcome, ${res.user?.name || "Student"}!`, {
          description: `Logged in to B.Tech Timetable · USN: ${res.user?.username || studentUsn}`
        });
        window.location.hash = "batch-timetable";
        setLocation("/timetable");
      } else {
        setErrorMsg(res.error || "Authentication failed. Please verify your phone number and Name/USN.");
      }
    }, 200);
  };

  const handleFacultySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = loginFaculty(facultyPhone, facultyCode);
      if (res.success) {
        toast.success(`Welcome, ${res.user?.name || "Professor"}!`, {
          description: "Attendance marking & faculty timetable unlocked."
        });
        window.location.hash = "faculty-timetable";
        setLocation("/timetable");
      } else {
        setErrorMsg(res.error || "Authentication failed. Verify faculty code (e.g. JGI-FAC-6353) and phone number.");
      }
    }, 200);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = loginAdmin(adminId, adminPass);
      if (res.success) {
        toast.success("Administrator Access Granted", {
          description: "Welcome to Master Admin Studio & Scheduling Engine."
        });
        setLocation("/admin");
      } else {
        setErrorMsg(res.error || "Access Denied: Invalid Master Administrator credentials.");
      }
    }, 200);
  };

  const handleGuestEntry = () => {
    loginGuest();
    toast.info("Entering in Public Read-Only Mode", {
      description: "Browsing class schedules and campus roomware as guest student."
    });
    window.location.hash = "batch-timetable";
    setLocation("/timetable");
  };

  const FEATURE_PORTALS = [
    {
      title: "Semester Timetables",
      subtitle: "6 & 8-Period Bell Times",
      icon: CalendarCheck2,
      iconBg: "bg-blue-50/90 border-blue-100 text-[#1e3a8a]",
      action: handleGuestEntry
    },
    {
      title: "CAD Floor Navigation",
      subtitle: "Floors 0-4 Room Locator",
      icon: Map,
      iconBg: "bg-amber-50/90 border-amber-100 text-[#b45309]",
      action: () => setLocation("/floors")
    },
    {
      title: "Live Class Tracker",
      subtitle: 'Pulsing "Happening Now"',
      icon: Clock3,
      iconBg: "bg-emerald-50/90 border-emerald-100 text-[#059669]",
      action: handleGuestEntry
    },
    {
      title: "Attendance & CSV",
      subtitle: "1-Click Attendance Print",
      icon: Sparkles,
      iconBg: "bg-purple-50/90 border-purple-100 text-[#7c3aed]",
      action: handleGuestEntry
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between font-sans select-none text-slate-800 relative bg-slate-50 overflow-x-hidden lg:h-screen lg:max-h-screen lg:overflow-hidden">
      {/* 1. Photorealistic Campus Background (Jain College of Engineering & Research) */}
      <div
        className="fixed lg:absolute inset-0 bg-cover bg-center sm:bg-[center_top] bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/campus-clean-bg.jpg')" }}
      />

      {/* Subtle lighting overlay matching reference design */}
      <div className="fixed lg:absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70 lg:to-transparent pointer-events-none" />
      <div className="fixed lg:absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-white/80 pointer-events-none" />

      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="relative z-20 px-3 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2.5 sm:py-3.5 flex items-center justify-between shrink-0 max-w-[1720px] w-full mx-auto">
        {/* Brand: JGI Badge + Divider + JAINEXA Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Circular JGI Navy Badge */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0a1e3a] border-2 border-[#16335d] flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="font-['Montserrat',sans-serif] font-black text-[11px] sm:text-xs tracking-tighter text-white">
              JGI
            </span>
          </div>

          <div className="h-6 sm:h-7 w-[1.5px] bg-slate-300 mx-0.5 sm:mx-1" />

          <div>
            <h1 className="font-['Cinzel',serif] font-bold text-lg sm:text-xl lg:text-2xl tracking-normal text-[#0a1e3a] leading-none">
              JAINEXA
            </h1>
            <p className="font-sans font-semibold text-[7px] sm:text-[8px] lg:text-[9.5px] tracking-wider sm:tracking-widest text-[#425977] uppercase mt-0.5 sm:mt-1 leading-none">
              JAIN COLLEGE OF ENGINEERING & RESEARCH
            </p>
          </div>
        </div>

        {/* Right Section: Public Timetables Explorer Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleGuestEntry}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/95 hover:bg-white text-[11px] sm:text-xs font-bold text-slate-800 border border-amber-300/80 shadow-xs backdrop-blur-sm transition-all hover:shadow cursor-pointer"
          >
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-amber-500/60 flex items-center justify-center">
              <Compass className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#c88612]" />
            </div>
            <span className="hidden xs:inline sm:inline">Public Timetables</span>
            <span className="xs:hidden inline">Timetables</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#c88612]" />
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT AREA (HERO ON LEFT, LOGIN CARD ON RIGHT) ================= */}
      <main className="relative z-20 px-3 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex-1 min-h-0 flex flex-col justify-center max-w-[1720px] w-full mx-auto py-3 lg:py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 xl:gap-12 2xl:gap-16 items-center w-full lg:h-full">
          
          {/* ================= LEFT COLUMN: HERO HEADLINE & FEATURE CARDS ================= */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-7 flex flex-col justify-center pr-0 lg:pr-4 xl:pr-8">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-amber-50/80 border border-amber-300/90 text-[#78350f] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-2.5 sm:mb-3 shadow-2xs w-fit">
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#b45309]" />
              <span>AY 2026–27 · AUTONOMOUS TIMETABLE & ATTENDANCE SYSTEM</span>
            </div>

            {/* Main Headline */}
            <div className="mb-2.5 sm:mb-3">
              <h2 className="font-['Playfair_Display',serif] font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-[#0a1e3a] leading-[1.08] tracking-tight">
                Welcome to
              </h2>
              <div className="mt-0.5 sm:mt-1">
                <span className="font-['Playfair_Display',serif] italic font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-[#c88612] tracking-wide leading-[1.08] inline-block">
                  JAINEXA
                </span>
                <div className="w-24 sm:w-32 lg:w-36 h-1.5 sm:h-2 bg-[#c88612] rounded-full mt-1.5 sm:mt-2" />
              </div>
            </div>

            {/* Subtitle Description */}
            <p className="text-xs sm:text-sm text-slate-700 max-w-xl xl:max-w-2xl font-medium leading-relaxed mb-3 sm:mb-5">
              Your official academic gateway to real-time class timetables, faculty attendance, interactive CAD blueprints, and autonomous campus operations at JAIN.
            </p>

            {/* Already authenticated banner / quick enter button */}
            {isAuthenticated && user && (
              <div className="mb-3 p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 max-w-lg xl:max-w-xl shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0a1e3a] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user.avatarInitials || "JGI"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0a1e3a] leading-none">
                      Active: {user.name}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1 leading-none">
                      Logged in as <strong className="text-amber-800 font-semibold">{user.role}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLocation(user.role === "Admin" ? "/admin" : "/timetable")}
                  className="px-3 py-1.5 rounded-lg bg-[#0a1e3a] hover:bg-[#142e54] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#e5a00d]" />
                </button>
              </div>
            )}

            {/* 4 Feature Highlights Cards (Desktop 2x2 Grid) */}
            <div className="hidden lg:grid grid-cols-2 gap-3.5 max-w-2xl xl:max-w-3xl w-full">
              {FEATURE_PORTALS.map((portal) => (
                <div
                  key={portal.title}
                  onClick={portal.action}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${portal.iconBg}`}>
                      <portal.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-[13px] font-bold text-[#0a1e3a] leading-tight">{portal.title}</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">{portal.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#c88612] group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LOGIN CARD ================= */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-5 flex flex-col justify-center items-center lg:items-end w-full">
            <div className="w-full max-w-[440px] xl:max-w-[460px] 2xl:max-w-[480px]">
              
              {/* Handwritten Script "More Than Just College" */}
              <div className="flex justify-center lg:justify-end mb-2 pr-0 lg:pr-1 select-none">
                <div className="font-['Caveat',cursive] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-center lg:text-right transform -rotate-1 lg:-rotate-2">
                  <span className="text-[#0a1e3a]">More Than Just </span>
                  <span className="text-[#eab308]">College</span>
                </div>
              </div>

              {/* ================= FLOATING LOGIN CARD ================= */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(10,25,50,0.12)] border border-white/80 p-4 sm:p-6 w-full">
                
                {/* Clean Role Switcher Bar */}
                <div className="flex items-center bg-slate-100/90 rounded-full p-1 text-xs font-semibold mb-3 sm:mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole("student");
                      setErrorMsg("");
                    }}
                    className={`flex-1 py-1.5 rounded-full cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      activeRole === "student"
                        ? "bg-[#0a1e3a] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole("faculty");
                      setErrorMsg("");
                    }}
                    className={`flex-1 py-1.5 rounded-full cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      activeRole === "faculty"
                        ? "bg-[#0a1e3a] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UsersRound className="w-3.5 h-3.5" />
                    <span>Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole("admin");
                      setErrorMsg("");
                    }}
                    className={`flex-1 py-1.5 rounded-full cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      activeRole === "admin"
                        ? "bg-[#0a1e3a] text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                </div>

                {/* Card Title */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[#0a1e3a] shrink-0">
                      {activeRole === "student" && <GraduationCap className="w-4 h-4 text-[#0a1e3a]" />}
                      {activeRole === "faculty" && <UsersRound className="w-4 h-4 text-[#0a1e3a]" />}
                      {activeRole === "admin" && <ShieldCheck className="w-4 h-4 text-[#0a1e3a]" />}
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-sm text-[#0a1e3a] leading-tight">
                        {activeRole === "student" && "Student Login"}
                        {activeRole === "faculty" && "Teacher Login"}
                        {activeRole === "admin" && "Admin Login"}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        {activeRole === "student" && "Enter phone and University USN"}
                        {activeRole === "faculty" && "Enter phone and faculty verification code"}
                        {activeRole === "admin" && "Enter administrator credentials"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="mb-2 p-1.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[10.5px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 1. Student Form */}
                {activeRole === "student" && (
                  <form onSubmit={handleStudentSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registered Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          type="text"
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          required
                          className="pl-9 text-xs sm:text-sm h-10 rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white focus:border-[#0a1e3a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        University USN / Registered Student Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          type="text"
                          value={studentUsn}
                          onChange={(e) => setStudentUsn(e.target.value.toUpperCase())}
                          placeholder="Enter University USN"
                          required
                          className="pl-9 text-xs sm:text-sm h-10 rounded-xl bg-slate-50/70 border-slate-200 uppercase font-mono tracking-wider focus:bg-white focus:border-[#0a1e3a]"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 text-sm font-bold bg-[#0a1e3a] hover:bg-[#12284c] text-white rounded-xl shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span>Verifying Student Credentials...</span>
                      ) : (
                        <>
                          <span>Enter B.Tech Timetable</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* 2. Faculty Form */}
                {activeRole === "faculty" && (
                  <form onSubmit={handleFacultySubmit} className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                        Faculty Registered Phone
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          type="text"
                          value={facultyPhone}
                          onChange={(e) => setFacultyPhone(e.target.value)}
                          placeholder="Enter registered mobile number"
                          required
                          className="pl-8 text-xs h-8 bg-slate-50 border-slate-200 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                        Faculty Verification Code / Passcode
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          type="text"
                          value={facultyCode}
                          onChange={(e) => setFacultyCode(e.target.value)}
                          placeholder="Enter faculty verification code"
                          required
                          className="pl-8 text-xs h-8 bg-slate-50 border-slate-200 font-mono tracking-wider focus:bg-white"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-8 text-xs font-bold bg-[#d97706] hover:bg-[#b45309] text-white shadow-sm mt-1 cursor-pointer"
                    >
                      {isLoading ? (
                        <span>Verifying Faculty Profile...</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <span>Authenticate & Open Attendance</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}

                {/* 3. Admin Form */}
                {activeRole === "admin" && (
                  <form onSubmit={handleAdminSubmit} className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                        Administrator ID
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          type="text"
                          value={adminId}
                          onChange={(e) => setAdminId(e.target.value)}
                          placeholder="Enter administrator ID"
                          required
                          className="pl-8 text-xs h-8 bg-slate-50 border-slate-200 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          type={showAdminPass ? "text" : "password"}
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          placeholder="Enter password"
                          required
                          className="pl-8 pr-8 text-xs h-8 bg-slate-50 border-slate-200 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPass(!showAdminPass)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          {showAdminPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-8 text-xs font-bold bg-[#0a1e3a] hover:bg-[#142e54] text-white shadow-sm mt-1 cursor-pointer"
                    >
                      {isLoading ? (
                        <span>Validating Master Access...</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <span>Enter Administration Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}

                {/* 1-Click Fast Login Pills */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 text-left">
                    QUICK ONE-CLICK SIGN-IN
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const res = loginStudent("9845010001", "25BTRGA001");
                        if (res.success) {
                          toast.success("Logged in as Student");
                          setLocation("/timetable");
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50/80 text-slate-800 border border-slate-200/90 text-center transition-all shadow-2xs cursor-pointer flex flex-col items-center justify-center"
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0a1e3a]">
                        <Zap className="w-3 h-3 text-blue-600 fill-blue-600" />
                        <span>Student</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = loginFaculty("6353572133", facultyCode || "JGI-FAC-6353");
                        if (res.success) {
                          toast.success("Logged in as Faculty");
                          setLocation("/timetable");
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50/80 text-slate-800 border border-slate-200/90 text-center transition-all shadow-2xs cursor-pointer flex flex-col items-center justify-center"
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0a1e3a]">
                        <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                        <span>Teacher</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = loginAdmin("admin", "112146");
                        if (res.success) {
                          toast.success("Logged in as Master Administrator");
                          setLocation("/admin");
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50/80 text-slate-800 border border-slate-200/90 text-center transition-all shadow-2xs cursor-pointer flex flex-col items-center justify-center"
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0a1e3a]">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Master Admin</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Feature Cards on Mobile Viewports (< lg) */}
              <div className="lg:hidden w-full mt-4 mb-2">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c88612]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0a1e3a]">Campus Features & Quick Portals</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  {FEATURE_PORTALS.map((portal) => (
                    <div
                      key={portal.title}
                      onClick={portal.action}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${portal.iconBg}`}>
                          <portal.icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0a1e3a] leading-tight">{portal.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{portal.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#c88612] group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= BOTTOM DARK NAVY FOOTER ================= */}
      <footer className="relative z-30 shrink-0 bg-[#0a1e3a] text-white px-3 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2.5 sm:py-3 border-t border-[#132d54] mt-auto">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Location Pin & Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 font-sans tracking-wider text-[11px] sm:text-xs uppercase text-slate-300 shrink-0">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e5a00d] shrink-0" />
            <span className="font-bold text-white">JAIN</span>
            <div className="w-5 sm:w-6 h-[1.5px] bg-[#e5a00d]" />
            <span className="font-semibold text-slate-200">BENGALURU</span>
          </div>

          {/* Right: 4 Institutional Feature Pillars */}
          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6 divide-x divide-slate-700/60 overflow-x-auto max-w-full scrollbar-hide py-0.5">
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-4 first:pl-0 shrink-0">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e5a00d] shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-200 whitespace-nowrap">
                Academic Excellence
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 pl-2.5 sm:pl-4 shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e5a00d] shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-200 whitespace-nowrap">
                Vibrant Campus Life
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 pl-2.5 sm:pl-4 shrink-0">
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e5a00d] shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-200 whitespace-nowrap">
                Innovation & Research
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 sm:gap-2 pl-2.5 sm:pl-4 shrink-0">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e5a00d] shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-200 whitespace-nowrap">
                Career Opportunities
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
