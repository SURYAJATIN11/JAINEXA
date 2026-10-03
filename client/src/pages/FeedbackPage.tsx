import React, { useState } from "react";
import {
  ExternalLink,
  ArrowLeft,
  MessageSquareHeart,
  ShieldCheck,
  Send,
  AlertTriangle,
  Clock,
  Building,
  HelpCircle,
  CheckCircle2,
  PhoneCall,
  Mail,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GOOGLE_FORM_URL = "https://forms.gle/JDDeoFAmFvgGSdN78";

export default function FeedbackPage() {
  const [concernCategory, setConcernCategory] = useState("conflict");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [usnOrEmail, setUsnOrEmail] = useState("");

  const handleOpenGoogleForm = () => {
    window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
    toast.success("Opening Google Form", {
      description: "Redirecting to official 24x7 Timetable Feedback Form."
    });
  };

  const handleSubmitAndOpen = (e: React.FormEvent) => {
    e.preventDefault();
    if (details.trim()) {
      try {
        const records = JSON.parse(localStorage.getItem("campus_ledger_concerns_v1") || "[]");
        records.unshift({
          id: "concern_" + Date.now(),
          category: concernCategory,
          name: name || "Anonymous",
          contact: usnOrEmail,
          details,
          date: new Date().toISOString()
        });
        localStorage.setItem("campus_ledger_concerns_v1", JSON.stringify(records));
      } catch {
        // ignore
      }
      toast.info("Logging concern details...", {
        description: "Launching official Google Form for administrative review."
      });
    }
    setTimeout(() => {
      window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#25252c] font-sans antialiased flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#252b67] text-white border-b border-[#1f255b] px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/")}
              className="h-8 text-white/80 hover:text-white hover:bg-white/10 text-xs gap-1.5 px-2"
            >
              <ArrowLeft size={14} /> Back to Timetable
            </Button>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#e3a62f] text-[#252b67] flex items-center justify-center font-bold text-sm">
                <MessageSquareHeart size={18} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                  24x7 Academic Feedback & Grievance Desk
                  <span className="text-[10px] px-2 py-0.2 rounded font-mono bg-white/20 text-white font-normal hidden md:inline">
                    Standalone Window
                  </span>
                </h1>
                <div className="text-[10px] text-white/70">
                  Direct Pipeline to Academic Administration & Timetable Coordination
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenGoogleForm}
              className="h-8 text-xs bg-[#e3a62f] hover:bg-[#cf9424] text-[#252b67] font-bold gap-1.5 shadow-sm"
            >
              <span>Launch Google Form</span>
              <ExternalLink size={13} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-8 flex-1">
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="bg-[#fffdf7] border border-[#d5d0c2] border-t-4 border-t-[#e3a62f] rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#fdf4dc] text-[#a07412] text-xs font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#e3a62f] animate-pulse" />
                  OFFICIAL INSTITUTIONAL INTAKE
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#252b67]">
                  Have a Timetable Conflict or Concern?
                </h2>
                <p className="text-xs sm:text-sm text-[#66636a] max-w-xl leading-relaxed">
                  We maintain zero-conflict academic schedules across all departments. If you experience lecture overlap, laboratory room shortages, or faculty schedule clashes, report it directly through our official Google Form.
                </p>
              </div>

              <div className="shrink-0 flex flex-col gap-2">
                <Button
                  onClick={handleOpenGoogleForm}
                  className="h-12 px-6 text-sm font-bold bg-[#e3a62f] hover:bg-[#cf9424] text-[#252b67] gap-2 shadow-md transition transform hover:-translate-y-0.5"
                >
                  <span>Open Google Forms Portal</span>
                  <ExternalLink size={16} />
                </Button>
                <div className="text-[11px] text-center text-[#88848a] font-mono">
                  URL: forms.gle/JDDeoFAmFvgGSdN78
                </div>
              </div>
            </div>
          </div>

          {/* Quick Concern Pre-Submission Form */}
          <div className="bg-[#fffdf7] border border-[#d5d0c2] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#252b67] font-serif mb-1 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#33409a]" />
              Quick Concern Dispatcher
            </h3>
            <p className="text-xs text-[#66636a] mb-5">
              Fill out your details below to log the issue, and you will be transferred straight to the Google Form to complete submission.
            </p>

            <form onSubmit={handleSubmitAndOpen} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1.5">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Kabir Shah or Rahul Sharma"
                    className="w-full text-xs p-2.5 rounded-md bg-[#faf8f2] border border-[#ded9cb] text-[#25252c] focus:outline-none focus:border-[#33409a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1.5">
                    USN / Faculty ID / Email
                  </label>
                  <input
                    type="text"
                    value={usnOrEmail}
                    onChange={(e) => setUsnOrEmail(e.target.value)}
                    placeholder="e.g. 25BTRGA001 or faculty@university.edu"
                    className="w-full text-xs p-2.5 rounded-md bg-[#faf8f2] border border-[#ded9cb] text-[#25252c] focus:outline-none focus:border-[#33409a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1.5">
                  Concern Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "conflict", label: "Schedule Clash", icon: AlertTriangle, color: "#c84232" },
                    { id: "room", label: "Room / Lab Issue", icon: Building, color: "#33409a" },
                    { id: "timing", label: "Timing / Breaks", icon: Clock, color: "#e3a62f" },
                    { id: "suggestion", label: "General Feedback", icon: HelpCircle, color: "#2c8c87" }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSel = concernCategory === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setConcernCategory(cat.id)}
                        className={`p-2.5 rounded-md border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                          isSel
                            ? "bg-[#eef1fb] border-[#33409a] text-[#252b67] font-bold shadow-xs"
                            : "bg-[#faf8f2] border-[#ded9cb] text-[#555259] hover:bg-white"
                        }`}
                      >
                        <Icon size={14} style={{ color: cat.color }} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-1.5">
                  Brief Description of the Conflict / Concern
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide batch, semester, period (P1-P8), day, faculty name, or classroom number involved..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-md bg-[#faf8f2] border border-[#ded9cb] text-[#25252c] focus:outline-none focus:border-[#33409a] resize-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#88848a] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#2c8a63]" />
                  Submissions are reviewed daily by the Academic Coordinator
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenGoogleForm}
                    className="h-9 text-xs border-[#d5d0c2] text-[#252b67]"
                  >
                    Direct Google Form <ExternalLink size={13} className="ml-1" />
                  </Button>
                  <Button
                    type="submit"
                    className="h-9 px-4 text-xs font-bold bg-[#252b67] hover:bg-[#33409a] text-white gap-2 shadow-xs"
                  >
                    <Send size={13} />
                    <span>Proceed to Google Form</span>
                    <ArrowUpRight size={13} />
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Contact Support Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#fffdf7] border border-[#d5d0c2] rounded-lg p-4 flex items-start gap-3">
              <div className="p-2 rounded-md bg-[#eef1fb] text-[#33409a]">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#252b67]">Timetable Office Email</div>
                <div className="text-xs text-[#555259] mt-0.5">timetable-support@university.edu</div>
                <div className="text-[10px] text-[#88848a] mt-1">Direct inquiries & escalations</div>
              </div>
            </div>

            <div className="bg-[#fffdf7] border border-[#d5d0c2] rounded-lg p-4 flex items-start gap-3">
              <div className="p-2 rounded-md bg-[#fdf4dc] text-[#a07412]">
                <PhoneCall size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#252b67]">Academic Helpdesk</div>
                <div className="text-xs text-[#555259] mt-0.5">Extension: 4421 / Room 006 (Level 0)</div>
                <div className="text-[10px] text-[#88848a] mt-1">Available 8:30 AM – 5:00 PM Mon–Sat</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-5 border-t border-[#e2ded2] text-xs text-[#88848a] flex flex-col sm:flex-row items-center justify-between gap-3 mt-8">
        <div>
          © 2026 Campus Ledger Timetable System · Department of Computer Science & Engineering
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#33409a] font-semibold">24x7 Grievance Response Protocol</span>
        </div>
      </footer>
    </div>
  );
}
