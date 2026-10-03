import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Send,
  Wind,
  MonitorPlay,
  Mic,
  Zap,
  Armchair,
  PenTool,
  Sparkles,
  Wrench,
  CheckCircle2,
  Building2,
  User,
  GraduationCap,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { collegeRooms } from "@/data/collegeData";
import {
  reportRoomIssue,
  IssueCategory,
  IssueSeverity,
  CATEGORY_METADATA
} from "@/lib/roomwareStore";
import { useAuth } from "@/contexts/AuthContext";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomName?: string;
  onIssueReported?: (roomName: string) => void;
}

const CATEGORY_ICONS: Record<IssueCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  ac: Wind,
  projector: MonitorPlay,
  audio: Mic,
  electrical: Zap,
  furniture: Armchair,
  smartboard: PenTool,
  cleanliness: Sparkles,
  other: Wrench
};

export function ReportIssueModal({
  isOpen,
  onClose,
  defaultRoomName,
  onIssueReported
}: ReportIssueModalProps) {
  const { user, isStudent, isFaculty } = useAuth();

  const [roomName, setRoomName] = useState<string>(defaultRoomName || collegeRooms[0]?.name || "105 Room");
  const [category, setCategory] = useState<IssueCategory>("projector");
  const [severity, setSeverity] = useState<IssueSeverity>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState(user?.name || "");
  const [batch, setBatch] = useState(isStudent ? "CSE-GEN 3 F" : isFaculty ? "Faculty · Dept of CSE" : "Student");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Specific class time & hour verification fields
  const [classDay, setClassDay] = useState<string>("Monday");
  const [classHour, setClassHour] = useState<string>("P1 · 8:45–9:45 AM");
  const [classBatch, setClassBatch] = useState<string>("CSE-GEN 3 F");
  const [classSubject, setClassSubject] = useState<string>("Operating Systems (OS)");
  const [isTimeVerified, setIsTimeVerified] = useState<boolean>(true);

  useEffect(() => {
    if (defaultRoomName) {
      setRoomName(defaultRoomName);
    }
  }, [defaultRoomName]);

  useEffect(() => {
    if (user?.name && !reporterName) {
      setReporterName(user.name);
    }
  }, [user, reporterName]);

  // Auto-detect current active day, hour and class
  const handleAutoDetectCurrentClass = () => {
    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[now.getDay()];
    const activeDay = currentDay === "Sunday" ? "Monday" : currentDay;
    setClassDay(activeDay);

    const hours = now.getHours();
    const mins = now.getMinutes();
    const timeVal = hours * 60 + mins;

    let detectedHour = "P1 · 8:45–9:45 AM";
    let detectedSubject = "Operating Systems (OS)";

    if (timeVal >= 8 * 60 + 45 && timeVal < 9 * 60 + 45) {
      detectedHour = "P1 · 8:45–9:45 AM";
      detectedSubject = "Operating Systems (OS)";
    } else if (timeVal >= 9 * 60 + 45 && timeVal < 10 * 60 + 45) {
      detectedHour = "P2 · 9:45–10:45 AM";
      detectedSubject = "Python Programming (PP)";
    } else if (timeVal >= 11 * 60 && timeVal < 12 * 60) {
      detectedHour = "P3 · 11:00–12:00 PM";
      detectedSubject = "Mathematics for Computing";
    } else if (timeVal >= 12 * 60 && timeVal < 13 * 60) {
      detectedHour = "P4 · 12:00–1:00 PM";
      detectedSubject = "Database Management Systems (DBMS)";
    } else if (timeVal >= 13 * 60 + 50 && timeVal < 14 * 60 + 50) {
      detectedHour = "P5 · 1:50–2:50 PM";
      detectedSubject = "Cloud Computing & DevOps";
    } else if (timeVal >= 14 * 60 + 50 && timeVal < 15 * 60 + 50) {
      detectedHour = "P6 · 2:50–3:50 PM";
      detectedSubject = "Computer Networks Lab";
    } else {
      // Default to standard class period
      detectedHour = "P1 · 8:45–9:45 AM";
      detectedSubject = "Operating Systems (OS)";
    }

    setClassHour(detectedHour);
    setClassSubject(detectedSubject);
    setIsTimeVerified(true);
    toast.success("Active Class Hour Detected", {
      description: `Locked to ${activeDay} · ${detectedHour} (${detectedSubject}).`
    });
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict requirement: An issue can only be raised for a verified class time & hour
    if (!classHour || !classSubject || !classDay) {
      toast.error("Class Session Verification Required", {
        description: "An issue can only be raised for a specific class time and hour during a lecture or lab session. Please specify the class day, hour, and subject."
      });
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a short title for the problem.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a description of the wear-and-tear or issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = reportRoomIssue({
        roomName,
        category,
        title,
        description,
        severity,
        reportedBy: isAnonymous ? "Anonymous Student" : reporterName.trim() || "Anonymous Student",
        reporterRole: isAnonymous ? "Anonymous" : isFaculty ? "Faculty" : "Student",
        batch: isAnonymous ? "Anonymous" : classBatch || batch,
        classDay,
        classHour,
        classSubject,
        classBatch
      });

      toast.success(`Issue logged for ${roomName}!`, {
        description: `Logged during ${classDay} ${classHour} (${classSubject}). Published to maintenance tracker.`,
        duration: 5000
      });

      if (onIssueReported) {
        onIssueReported(roomName);
      }

      // Reset form
      setTitle("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#fffdf7] border border-[#d5d0c2] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#252b67] text-[#faf8ef] p-4 px-6 flex items-center justify-between border-b border-[#3c4488] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e3a62f]/20 border border-[#e3a62f]/40 flex items-center justify-center text-[#e3a62f]">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Report Room Issue & Wear-and-Tear
              </h3>
              <p className="text-xs text-[#cbd0ed] mt-0.5">
                Notify college maintenance, faculty & students about broken equipment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[#faf8ef] flex items-center justify-center transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1 text-[#252b67]">
          {/* Target Room Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#555259] mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} className="text-[#33409a]" /> Affected Room / Venue
            </label>
            <select
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm font-semibold bg-[#faf8f1] border border-[#d5d0c2] rounded-lg text-[#252b67] outline-none focus:border-[#e3a62f] focus:ring-1 focus:ring-[#e3a62f]"
            >
              {collegeRooms.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.type}) — Seating: {r.seating || "N/A"}
                </option>
              ))}
            </select>
          </div>

          {/* Mandatory Class Time & Hour Verification */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Clock size={14} className="text-[#b45309]" />
                <span>Class Session Verification (Time & Hour) *</span>
              </div>
              <button
                type="button"
                onClick={handleAutoDetectCurrentClass}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold shadow-2xs transition cursor-pointer"
              >
                <Zap size={11} className="fill-white" />
                <span>Auto-Detect Current Class Hour</span>
              </button>
            </div>

            <p className="text-[11px] text-amber-800 leading-snug">
              An issue can only be raised for a specific, verified class time and hour during an ongoing lecture or lab session.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Day */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Day of Week *
                </label>
                <select
                  value={classDay}
                  onChange={(e) => setClassDay(e.target.value)}
                  className="w-full h-8 px-2 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-slate-800 outline-none focus:border-amber-500"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Class Hour / Slot */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Class Hour / Period *
                </label>
                <select
                  value={classHour}
                  onChange={(e) => setClassHour(e.target.value)}
                  className="w-full h-8 px-2 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-slate-800 outline-none focus:border-amber-500"
                >
                  <option value="P1 · 8:45–9:45 AM">P1 · 8:45–9:45 AM</option>
                  <option value="P2 · 9:45–10:45 AM">P2 · 9:45–10:45 AM</option>
                  <option value="P3 · 11:00–12:00 PM">P3 · 11:00–12:00 PM</option>
                  <option value="P4 · 12:00–1:00 PM">P4 · 12:00–1:00 PM</option>
                  <option value="P5 · 1:50–2:50 PM">P5 · 1:50–2:50 PM</option>
                  <option value="P6 · 2:50–3:50 PM">P6 · 2:50–3:50 PM</option>
                  <option value="P7 · 3:55–4:45 PM">P7 · 3:55–4:45 PM</option>
                  <option value="P8 · 4:45–5:35 PM">P8 · 4:45–5:35 PM</option>
                </select>
              </div>

              {/* Class Batch */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Class / Section *
                </label>
                <select
                  value={classBatch}
                  onChange={(e) => setClassBatch(e.target.value)}
                  className="w-full h-8 px-2 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-slate-800 outline-none focus:border-amber-500"
                >
                  <option value="CSE-GEN 3 F">CSE-GEN 3 F (Room 215A)</option>
                  <option value="CSE-DS 3 A">CSE-DS 3 A (Room 105)</option>
                  <option value="CSE-AIML 3 A">CSE-AIML 3 A (Room 102)</option>
                  <option value="ISE 3 A">ISE 3 A (Room 204)</option>
                  <option value="CSE 1 A">CSE 1 A (Room 114B)</option>
                </select>
              </div>
            </div>

            {/* Subject in Session during that hour */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Subject in Session during this Class Hour *
              </label>
              <input
                type="text"
                value={classSubject}
                onChange={(e) => setClassSubject(e.target.value)}
                placeholder="e.g. Operating Systems (OS) or Python Programming"
                className="w-full h-8 px-2.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>Verified Session: <strong>{classDay} · {classHour}</strong> — {classSubject} ({classBatch})</span>
            </div>
          </div>

          {/* Issue Category Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#555259] mb-1.5">
              Select Problem Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CATEGORY_METADATA) as IssueCategory[]).map((catKey) => {
                const meta = CATEGORY_METADATA[catKey];
                const Icon = CATEGORY_ICONS[catKey];
                const isSelected = category === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setCategory(catKey);
                      setSeverity(meta.defaultSeverity);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#252b67] bg-[#252b67] text-white shadow-md font-semibold"
                        : "border-[#e2d8c3] bg-[#faf8f1] hover:bg-white text-[#252b67]"
                    }`}
                  >
                    <Icon size={18} className={isSelected ? "text-[#e3a62f]" : "text-[#555259]"} />
                    <span className="text-[11px] mt-1.5 leading-tight line-clamp-2">
                      {meta.label.split("/")[0]?.trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#555259] mb-1.5">
              Impact / Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "low", label: "Low", desc: "Minor nuisance", color: "border-[#16a34a] text-[#16a34a]" },
                { key: "medium", label: "Medium", desc: "Affects lectures", color: "border-[#ca8a04] text-[#ca8a04]" },
                { key: "high", label: "High / Urgent", desc: "Class disrupted", color: "border-[#dc2626] text-[#dc2626]" }
              ].map((sev) => {
                const isSelected = severity === sev.key;
                return (
                  <button
                    key={sev.key}
                    type="button"
                    onClick={() => setSeverity(sev.key as IssueSeverity)}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-[#fffdf4] border-2 shadow-xs " + sev.color
                        : "border-[#d5d0c2] bg-[#faf8f1] text-[#77747b]"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      {sev.label}
                      {isSelected && <CheckCircle2 size={13} />}
                    </div>
                    <div className="text-[10px] opacity-80">{sev.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#555259] mb-1.5">
              Issue Title / Headline *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Front projector HDMI port loose / no display"
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-[#d5d0c2] rounded-lg text-[#252b67] placeholder:text-[#a09c96] outline-none focus:border-[#e3a62f] focus:ring-1 focus:ring-[#e3a62f]"
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#555259] mb-1.5">
              Detailed Description of Wear & Tear *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is broken, which row/equipment is affected, and when it occurred so maintenance can bring the right replacement parts..."
              className="w-full p-3 text-xs bg-white border border-[#d5d0c2] rounded-lg text-[#252b67] placeholder:text-[#a09c96] outline-none focus:border-[#e3a62f] focus:ring-1 focus:ring-[#e3a62f] resize-none"
              required
            />
          </div>

          {/* Reporter Details */}
          <div className="p-3 bg-[#f6f2e6] rounded-xl border border-[#e5decb] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#252b67] flex items-center gap-1.5">
                <User size={13} className="text-[#33409a]" /> Reporter Information
              </span>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none text-[#555259]">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-[#252b67] focus:ring-[#e3a62f]"
                />
                <span>Submit Anonymously</span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Your Name (e.g. Rahul Sharma)"
                    className="w-full h-8 px-2.5 text-xs bg-white border border-[#d5d0c2] rounded text-[#252b67] outline-none focus:border-[#e3a62f]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="Batch / Role (e.g. CSE S1 A)"
                    className="w-full h-8 px-2.5 text-xs bg-white border border-[#d5d0c2] rounded text-[#252b67] outline-none focus:border-[#e3a62f]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#e2d8c3]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs border-[#d5d0c2] text-[#555259] hover:bg-[#ece7d8]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs font-semibold bg-[#252b67] text-white hover:bg-[#33409a] gap-1.5 shadow-sm px-4 h-9"
            >
              <Send size={13} className="text-[#e3a62f]" />
              {isSubmitting ? "Submitting..." : "Submit Room Issue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
