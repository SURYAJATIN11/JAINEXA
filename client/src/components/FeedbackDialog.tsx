import React, { useState } from "react";
import {
  ExternalLink,
  X,
  MessageSquareHeart,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOOGLE_FORM_URL = "https://forms.gle/JDDeoFAmFvgGSdN78";

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const [selectedConcern, setSelectedConcern] = useState<string>("conflict");
  const [concernText, setConcernText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const concernCategories = [
    {
      id: "conflict",
      title: "Schedule Conflict / Clashes",
      desc: "Faculty overlap, room double-booking, or consecutive heavy labs.",
      icon: AlertTriangle,
      color: "#c84232"
    },
    {
      id: "room",
      title: "Room & Lab Allocation",
      desc: "Capacity shortfall, missing projector/smart board, lab machine issue.",
      icon: Building,
      color: "#33409a"
    },
    {
      id: "timing",
      title: "Timing & Contact Hours",
      desc: "Period duration, lunch break spacing, or contact hour adjustments.",
      icon: Clock,
      color: "#e3a62f"
    },
    {
      id: "general",
      title: "General Suggestion / Feedback",
      desc: "Feedback on timetable rhythm, curriculum load, or academic portal.",
      icon: HelpCircle,
      color: "#2c8c87"
    }
  ];

  const handleOpenGoogleForm = () => {
    window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
    toast.success("Opening Google Form", {
      description: "Redirecting to official 24x7 Timetable Feedback Form in a new window."
    });
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernText.trim()) {
      handleOpenGoogleForm();
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem("campus_ledger_concerns_v1") || "[]");
      existing.unshift({
        id: "concern_" + Date.now(),
        category: selectedConcern,
        text: concernText,
        submittedAt: new Date().toISOString(),
        status: "logged"
      });
      localStorage.setItem("campus_ledger_concerns_v1", JSON.stringify(existing));
    } catch {
      // fallback
    }

    setIsSubmitted(true);
    toast.success("Concern logged locally", {
      description: "Opening the official Google Form so your submission is recorded by the administration."
    });

    setTimeout(() => {
      window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#fffdf7] border border-[#d5d0c2] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#252b67] to-[#3a448c] p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e3a62f] text-[#252b67] flex items-center justify-center font-bold shadow-md shrink-0">
              <MessageSquareHeart size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 font-mono">
                  24x7 Feedback Desk
                </span>
                <span className="text-[11px] text-[#e3a62f] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e3a62f] animate-pulse" />
                  Official Google Form
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif text-white mt-1">
                Report Timetable Concerns
              </h2>
              <p className="text-xs text-white/80">
                Directly connected to the Academic Administration & Timetable Cell.
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

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Primary Callout to Google Form */}
          <div className="p-4 bg-[#fbf9f2] border border-[#e5dfce] border-l-4 border-l-[#e3a62f] rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#252b67] flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-[#e3a62f]" />
                  Official Feedback & Grievance Portal
                </h4>
                <p className="text-xs text-[#66636a] mt-1 leading-relaxed">
                  Submit issues directly to the official college feedback form. All reports are routed to the Academic Coordinator and Dean.
                </p>
              </div>

              <Button
                onClick={handleOpenGoogleForm}
                className="h-10 px-4 text-xs font-bold bg-[#e3a62f] hover:bg-[#cf9424] text-[#252b67] gap-2 shadow-sm shrink-0"
              >
                <span>Open Google Form</span>
                <ExternalLink size={15} />
              </Button>
            </div>
          </div>

          {/* Quick Concern Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b] mb-2">
              Select Concern Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {concernCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedConcern === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedConcern(cat.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-[#eef1fb] border-[#33409a] shadow-xs"
                        : "bg-[#faf8f2] border-[#e2ddd0] hover:bg-[#fffdf7]"
                    }`}
                  >
                    <div
                      className="p-1.5 rounded-md mt-0.5"
                      style={{ backgroundColor: isSelected ? "#33409a" : "#eae6da", color: isSelected ? "#fff" : cat.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#25252c]">{cat.title}</div>
                      <div className="text-[10px] text-[#77747b] leading-tight mt-0.5">{cat.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Note Input */}
          <form onSubmit={handleQuickSubmit} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#77747b]">
              Describe Your Concern or Suggestion (Optional Preview)
            </label>
            <textarea
              value={concernText}
              onChange={(e) => setConcernText(e.target.value)}
              placeholder="e.g. CSE-GEN Section F has overlapping slots on Wednesday P3, or Room A-204 needs additional seating..."
              rows={3}
              className="w-full text-xs p-3 rounded-md bg-[#faf8f2] border border-[#ded9cb] text-[#25252c] placeholder:text-[#99959c] focus:outline-none focus:border-[#33409a] resize-none"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#88848a]">
                Short link: <strong className="text-[#33409a] font-mono">forms.gle/JDDeoFAmFvgGSdN78</strong>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 text-xs border-[#d5d0c2]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs bg-[#252b67] text-white hover:bg-[#33409a] gap-1.5"
                >
                  <Send size={13} />
                  Proceed to Google Form
                  <ArrowUpRight size={13} />
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-[#f6f4ed] border-t border-[#ded9cb] text-[11px] text-[#78757c] flex items-center justify-between">
          <span>Academic Timetable Oversight Cell · CSE Dept</span>
          <span className="text-[#2c8a63] font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Response SLA: &lt; 24 Hours
          </span>
        </div>
      </div>
    </div>
  );
}
