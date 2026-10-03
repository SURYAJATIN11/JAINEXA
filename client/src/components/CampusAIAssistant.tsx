import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  ChevronRight,
  BookOpen,
  Building,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  processCampusQuery,
  AssistantResponse,
  resolveStudentBatch,
  resolveFacultyKey,
  getEffectiveDayName
} from "@/lib/aiAssistantEngine";

interface CampusAIAssistantProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigateToView?: (view: "student" | "faculty" | "floor-plan" | "roomware", param?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  text: string;
  actionData?: AssistantResponse["actionData"];
}

export function CampusAIAssistant({
  isOpen: controlledIsOpen,
  onOpenChange,
  onNavigateToView
}: CampusAIAssistantProps) {
  const { user, isFaculty, isStudent } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const studentBatch = resolveStudentBatch(user);
  const facultyKey = resolveFacultyKey(user);
  const todayName = getEffectiveDayName();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome-1",
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: isFaculty
          ? `Hello **${user?.name || "Professor"}**! I am your **Campus Timetable AI Copilot**.\n\nAsk me about your lectures today, free periods, room locations, or teaching workload.`
          : `Hello **${user?.name || "Student"}**! I am your **Campus Timetable AI Copilot**.\n\nAsk me about your class schedule today, where your next class is, room locations, or who teaches your subjects.`,
      },
    ];
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate slight realistic processing latency (300ms)
      await new Promise((r) => setTimeout(r, 250));
      const res = await processCampusQuery(textToSend, user);

      const assistantMsg: ChatMessage = {
        id: res.id,
        sender: "assistant",
        timestamp: res.timestamp,
        text: res.text,
        actionData: res.actionData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: "I encountered an issue processing your query. Please try asking again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: "Conversation cleared. How can I help you next?",
      },
    ]);
  };

  const quickPrompts = isFaculty
    ? [
        "What are my lectures today?",
        "Am I free in Period 4?",
        "What is my total weekly load?",
        "Where is Room 204 located?",
        "Next lecture location",
      ]
    : [
        "What is my schedule today?",
        "Where is my next class?",
        "Who teaches Operating Systems?",
        "Where is Room 215B?",
        "When are our lab sessions?",
        "Who is our class teacher?",
      ];

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#33409A] hover:bg-[#273277] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 border border-white/20 active:scale-95 group"
        title="Open AI Timetable Copilot (Ctrl + K)"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3A62F] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E3A62F]"></span>
        </span>
        <Sparkles className="w-4 h-4 text-[#E3A62F] group-hover:rotate-12 transition-transform" />
        <span className="font-medium text-sm tracking-wide">Campus AI Copilot</span>
        <kbd className="hidden sm:inline-block bg-white/20 text-white/90 text-[10px] px-1.5 py-0.5 rounded font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* Slide-over Drawer / Assistant Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full sm:w-[480px] h-full bg-[#FAF9F6] text-[#1E293B] shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#33409A] text-[#E3A62F] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-[#1E293B]">Campus AI Copilot</h3>
                    <Badge variant="outline" className="text-[10px] bg-[#FAF9F6] text-[#33409A] border-[#33409A]/30">
                      Phase 1
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    {isFaculty ? (
                      <>
                        <GraduationCap className="w-3 h-3 text-[#E3A62F]" />
                        <span>Faculty Mode · {user?.name || "Professor"}</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3 h-3 text-[#33409A]" />
                        <span>Student Mode · {studentBatch.program} Sec {studentBatch.section}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  title="Clear chat"
                  className="h-8 w-8 text-slate-400 hover:text-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-4 py-2 bg-[#F1F5F9]/70 border-b border-[#E2E8F0] overflow-x-auto no-scrollbar flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium text-slate-400 shrink-0">Ask:</span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#33409A] hover:text-white text-slate-700 border border-slate-200 transition-colors shadow-2xs text-[11px]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <span>{m.sender === "user" ? "You" : "AI Copilot"}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[92%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                      m.sender === "user"
                        ? "bg-[#33409A] text-white rounded-tr-xs"
                        : "bg-white text-[#1E293B] border border-[#E2E8F0] rounded-tl-xs"
                    }`}
                  >
                    {/* Render text with basic markdown formatting */}
                    <div className="whitespace-pre-line space-y-2">
                      {m.text.split("\n\n").map((para, i) => (
                        <p key={i}>
                          {para.split("**").map((chunk, j) =>
                            j % 2 === 1 ? (
                              <strong key={j} className="font-semibold">
                                {chunk}
                              </strong>
                            ) : (
                              chunk
                            )
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Action Cards: Sessions List */}
                    {m.actionData?.sessions && m.actionData.sessions.length > 0 && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                        {m.actionData.title && (
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            {m.actionData.title}
                          </div>
                        )}
                        {m.actionData.sessions.map((sess, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                              sess.isNext
                                ? "bg-amber-50/70 border-amber-200 text-amber-950"
                                : "bg-slate-50 border-slate-200/80 text-slate-800 hover:bg-slate-100/80"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] font-mono px-1.5 py-0 ${
                                    sess.type === "Lab"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-indigo-100 text-indigo-700"
                                  }`}
                                >
                                  {sess.period}
                                </Badge>
                                <span className="font-semibold">{sess.subject}</span>
                              </div>
                              {sess.isNext && (
                                <Badge className="text-[9px] bg-[#E3A62F] text-slate-900 border-none font-bold">
                                  UPCOMING NEXT
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {sess.timeLabel.split("·")[1]?.trim() || sess.timeLabel}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <button
                                  onClick={() => onNavigateToView && onNavigateToView("floor-plan", sess.room)}
                                  className="text-[#33409A] hover:underline font-medium"
                                  title="View room in Floor Plan"
                                >
                                  {sess.room}
                                </button>
                              </span>
                            </div>

                            {sess.faculty && sess.faculty !== "Department Faculty" && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <UserIcon className="w-3 h-3 text-slate-400" />
                                {sess.faculty}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Cards: Room Location Card */}
                    {m.actionData?.room && (
                      <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#33409A] flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5" />
                            {m.actionData.room.name}
                          </span>
                          <Badge className="bg-[#33409A] text-white text-[10px]">
                            Floor {m.actionData.room.floor}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {m.actionData.room.description}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-indigo-200/50">
                          <span className="text-[11px] text-slate-500">
                            Capacity: <strong>{m.actionData.room.capacity} seats</strong>
                          </span>
                          {onNavigateToView && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigateToView("floor-plan", String(m.actionData?.room?.floor ?? 0))}
                              className="h-6 text-[10px] border-[#33409A] text-[#33409A] hover:bg-[#33409A] hover:text-white px-2"
                            >
                              Open Floor Plan
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Cards: Free Slots */}
                    {m.actionData?.freeSlots && m.actionData.freeSlots.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                        {m.actionData.freeSlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-emerald-50/70 border border-emerald-200/70 text-emerald-900 text-xs flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div>
                              <div className="font-bold">{slot.period}</div>
                              <div className="text-[10px] text-emerald-700">{slot.timeLabel.split("·")[1]?.trim()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3A62F] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E3A62F]"></span>
                  </span>
                  <span>AI Copilot is resolving schedule data...</span>
                </div>
              )}
            </div>

            {/* Footer Input */}
            <div className="p-3 bg-white border-t border-[#E2E8F0]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isFaculty
                      ? "Ask about your lectures, rooms, free periods..."
                      : "Ask about your classes, next lecture, teacher, rooms..."
                  }
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#33409A] focus:bg-white transition-colors"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="bg-[#33409A] hover:bg-[#273277] text-white px-3.5 h-9"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="text-[10px] text-slate-400 text-center mt-1.5">
                Campus Timetable AI • Instant timetable, room & faculty search
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
