import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Tag,
  Building,
  GraduationCap,
  Users,
  CalendarDays,
  X,
  Layers,
  ListFilter,
  Check,
  ExternalLink,
  ShieldCheck,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  loadAllEvents,
  saveAllEvents,
  addAcademicEvent,
  deleteAcademicEvent,
  subscribeToAcademicEvents,
  getEventsForDate,
  type AcademicEvent,
  type EventCategory
} from "@/lib/academicEventsStore";

interface AcademicCalendarPanelProps {
  onNavigateToView?: (view: "student" | "faculty" | "floor-plan" | "roomware", param?: string) => void;
}

const CATEGORY_META: Record<
  EventCategory,
  { label: string; dotColor: string; badgeBg: string; badgeText: string; borderColor: string; icon: string }
> = {
  exam: {
    label: "Exams & Tests",
    dotColor: "bg-[#cf3d2c]",
    badgeBg: "bg-[#fdf2f0]",
    badgeText: "text-[#be2817]",
    borderColor: "border-[#f7c2bc]",
    icon: "📝"
  },
  hackathon: {
    label: "Fests & Hackathons",
    dotColor: "bg-[#e3a62f]",
    badgeBg: "bg-[#fdf8ed]",
    badgeText: "text-[#b27c12]",
    borderColor: "border-[#f5dfad]",
    icon: "🚀"
  },
  workshop: {
    label: "Workshops & Seminars",
    dotColor: "bg-[#2c8c87]",
    badgeBg: "bg-[#edf8f7]",
    badgeText: "text-[#1d6b67]",
    borderColor: "border-[#bde3e1]",
    icon: "💡"
  },
  holiday: {
    label: "Holidays & Recess",
    dotColor: "bg-[#2d8a5e]",
    badgeBg: "bg-[#edf7f1]",
    badgeText: "text-[#1e6a45]",
    borderColor: "border-[#bde4cf]",
    icon: "🏖️"
  },
  academic: {
    label: "Academic Deadlines",
    dotColor: "bg-[#7c3aed]",
    badgeBg: "bg-[#f5f0fd]",
    badgeText: "text-[#6223cf]",
    borderColor: "border-[#d8c3fb]",
    icon: "📌"
  }
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AcademicCalendarPanel({ onNavigateToView }: AcademicCalendarPanelProps) {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<AcademicEvent[]>(() => loadAllEvents());

  // Current calendar viewing month and year
  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(() => new Date(2026, 9, 1)); // October 2026 baseline
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => "2026-10-14");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [calendarView, setCalendarView] = useState<"month" | "agenda">("month");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>("exam");
  const [newEventDate, setNewEventDate] = useState("2026-10-15");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("09:30 AM");
  const [newEventEndTime, setNewEventEndTime] = useState("12:30 PM");
  const [newEventVenue, setNewEventVenue] = useState("Classroom 215A");
  const [newEventRoomCode, setNewEventRoomCode] = useState("215A");
  const [newEventDepartment, setNewEventDepartment] = useState("Computer Science & Engineering");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventAffectsTimetable, setNewEventAffectsTimetable] = useState(true);
  const [newEventTimetableNote, setNewEventTimetableNote] = useState("Regular theory classes suspended during exam session.");

  useEffect(() => {
    const unsub = subscribeToAcademicEvents((updated) => {
      setEvents(updated);
    });
    return unsub;
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Prev / Next month handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const pad = (n: number) => String(n).padStart(2, "0");
    setSelectedDateStr(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter((e) => e.category === selectedCategory);
  }, [events, selectedCategory]);

  // Calendar Days calculation for the monthly grid
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const pad = (n: number) => String(n).padStart(2, "0");
      days.push({
        dateStr: `${prevYear}-${pad(prevMonth + 1)}-${pad(dayNum)}`,
        dayNum,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Days of current month
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr || dateStr === "2026-10-09"
      });
    }

    // Trailing days for next month to complete rows of 7
    const remaining = 42 - days.length; // 6 rows * 7 days = 42 cells
    for (let n = 1; n <= remaining; n++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        dateStr: `${nextYear}-${pad(nextMonth + 1)}-${pad(n)}`,
        dayNum: n,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  }, [currentYear, currentMonth, today]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDateStr, filteredEvents);
  }, [selectedDateStr, filteredEvents]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    (Object.keys(CATEGORY_META) as EventCategory[]).forEach((cat) => {
      counts[cat] = events.filter((e) => e.category === cat).length;
    });
    return counts;
  }, [events]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error("Please provide an event title");
      return;
    }

    const created = addAcademicEvent({
      title: newEventTitle.trim(),
      category: newEventCategory,
      date: newEventDate,
      endDate: newEventEndDate.trim() || undefined,
      startTime: newEventStartTime.trim() || "09:30 AM",
      endTime: newEventEndTime.trim() || "04:30 PM",
      venue: newEventVenue.trim() || "Classroom 215A",
      roomCode: newEventRoomCode.trim() || undefined,
      department: newEventDepartment.trim() || "Computer Science & Engineering",
      description: newEventDescription.trim() || "Official scheduled university academic activity.",
      organizer: user?.name || "Academic Administration",
      affectsTimetable: newEventAffectsTimetable,
      timetableNote: newEventTimetableNote.trim() || undefined
    });

    toast.success(`Event created: ${created.title}`, {
      description: `Added to ${created.date} · Timetable status updated.`
    });

    setSelectedDateStr(newEventDate);
    setIsAddModalOpen(false);
    setNewEventTitle("");
    setNewEventDescription("");
  };

  const handleDeleteEvent = (id: string, title: string) => {
    const ok = deleteAcademicEvent(id);
    if (ok) {
      toast.success("Event deleted", { description: `"${title}" removed from academic calendar.` });
    }
  };

  return (
    <div className="academic-calendar-container bg-[#fffdf7] border border-[#ded9cc] border-t-4 border-t-[#252b67] rounded-lg shadow-xl overflow-hidden mb-12">
      {/* Top Banner & Header */}
      <div className="p-5 border-b border-[#e5e1d5] bg-[#faf8f2]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#858286] uppercase mb-1">
              <CalendarDays size={14} className="text-[#33409a]" />
              INSTITUTIONAL SCHEDULE · AUTUMN SEMESTER 2026
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#262a68] font-normal tracking-tight m-0">
              Academic <em className="text-[#e3a62f] not-italic font-serif">Calendar & Events</em>
            </h2>
            <p className="text-xs text-[#716e75] mt-1">
              Synchronized with the <strong>University Timetable Engine</strong>. Tracks examination sittings, hackathons, guest lectures, and timetable suspension circulars.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Switcher: Month vs Agenda */}
            <div className="flex items-center gap-1 p-1 bg-[#ede9dd] rounded-md border border-[#dbd6c9]">
              <button
                type="button"
                onClick={() => setCalendarView("month")}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                  calendarView === "month"
                    ? "bg-[#252b67] text-white shadow-xs"
                    : "text-[#58555e] hover:text-[#252b67]"
                }`}
              >
                <Layers size={13} />
                <span>Monthly Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarView("agenda")}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                  calendarView === "agenda"
                    ? "bg-[#252b67] text-white shadow-xs"
                    : "text-[#58555e] hover:text-[#252b67]"
                }`}
              >
                <ListFilter size={13} />
                <span>Agenda ({events.length})</span>
              </button>
            </div>

            {/* Add Event Button (for Admin & Faculty) */}
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-3.5 bg-[#e3a62f] hover:bg-[#cf9424] text-[#252b67] font-bold text-xs gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Add Event</span>
            </Button>
          </div>
        </div>

        {/* Month Navigator Toolbar & Filter Pills */}
        <div className="mt-5 pt-4 border-t border-[#e8e4da] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Month & Year Navigator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[#d8d3c5] rounded-md bg-white shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-[#f6f2e6] text-[#4d4a51] transition"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3.5 py-1 text-sm font-serif font-bold text-[#262a68] select-none min-w-[140px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-[#f6f2e6] text-[#4d4a51] transition"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleJumpToToday}
              className="h-8 text-xs font-semibold bg-white border-[#d8d3c5] text-[#252b67] hover:bg-[#faf8f2]"
            >
              Jump to Today
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                selectedCategory === "all"
                  ? "bg-[#252b67] text-white border-[#252b67] shadow-xs"
                  : "bg-white border-[#ded9cb] text-[#555259] hover:bg-[#f6f2e6]"
              }`}
            >
              All Events ({categoryCounts.all})
            </button>

            {(Object.keys(CATEGORY_META) as EventCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition border ${
                    isSelected
                      ? "bg-[#252b67] text-white border-[#252b67] shadow-xs"
                      : "bg-white border-[#ded9cb] text-[#555259] hover:bg-[#f6f2e6]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  <span>{meta.label}</span>
                  <span className="text-[10px] opacity-75">({categoryCounts[cat] || 0})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {calendarView === "month" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#e8e4da]">
          {/* Monthly Grid (8 cols on lg) */}
          <div className="lg:col-span-8 p-4 sm:p-5">
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                {/* Weekday Header */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {WEEKDAY_NAMES.map((w, idx) => (
                    <div
                      key={w}
                      className={`text-center py-2 text-[11px] font-bold uppercase tracking-wider ${
                        idx === 0 || idx === 6 ? "text-[#a39f99]" : "text-[#5e5a61]"
                      }`}
                    >
                      {w}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarGrid.map((day) => {
                    const dayEvents = getEventsForDate(day.dateStr, filteredEvents);
                    const isSelected = selectedDateStr === day.dateStr;

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => setSelectedDateStr(day.dateStr)}
                        className={`min-h-[96px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                          !day.isCurrentMonth
                            ? "bg-[#fbf9f4]/40 border-transparent text-[#a6a29b]"
                            : isSelected
                            ? "bg-[#fffdf7] border-[#33409a] ring-2 ring-[#33409a]/20 shadow-sm"
                            : "bg-white border-[#e8e4da] hover:border-[#c5bfaf] hover:shadow-2xs text-[#28272d]"
                        }`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                              day.isToday
                                ? "bg-[#e3a62f] text-[#252b67] font-bold"
                                : isSelected
                                ? "text-[#33409a] font-bold"
                                : ""
                            }`}
                          >
                            {day.dayNum}
                          </span>

                          {dayEvents.length > 0 && (
                            <span className="text-[9px] font-bold text-[#8c8892]">
                              {dayEvents.length} {dayEvents.length === 1 ? "evt" : "evts"}
                            </span>
                          )}
                        </div>

                        {/* Event Pills inside Day Cell */}
                        <div className="space-y-1 overflow-hidden flex-1">
                          {dayEvents.slice(0, 2).map((evt) => {
                            const meta = CATEGORY_META[evt.category];
                            return (
                              <div
                                key={evt.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate border font-medium ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`}
                                title={`${evt.title} (${evt.startTime} @ ${evt.venue})`}
                              >
                                <span>{meta.icon} </span>
                                <span>{evt.title}</span>
                              </div>
                            );
                          })}

                          {dayEvents.length > 2 && (
                            <span className="text-[9px] text-[#33409a] font-semibold pl-1 block">
                              +{dayEvents.length - 2} more...
                            </span>
                          )}
                        </div>

                        {/* Multi-category indicator dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-black/5">
                            {dayEvents.map((evt) => (
                              <span
                                key={evt.id}
                                className={`w-1.5 h-1.5 rounded-full ${CATEGORY_META[evt.category].dotColor}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Event Inspector Side Panel (4 cols on lg) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-[#faf8f2]/60 flex flex-col justify-between">
            <div>
              {/* Selected Date Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e8e4da]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#88848a] block">
                    Selected Date Schedule
                  </span>
                  <h3 className="font-serif text-lg text-[#262a68] font-bold m-0 mt-0.5">
                    {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </h3>
                </div>

                <Badge variant="outline" className="text-xs bg-white border-[#ded9cb] text-[#252b67]">
                  {selectedDateEvents.length} {selectedDateEvents.length === 1 ? "Event" : "Events"}
                </Badge>
              </div>

              {/* Event Cards */}
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((evt) => {
                    const meta = CATEGORY_META[evt.category];

                    return (
                      <div
                        key={evt.id}
                        className={`p-3.5 rounded-lg border bg-white shadow-2xs space-y-2.5 transition hover:shadow-sm ${meta.borderColor}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${meta.badgeBg} ${meta.badgeText}`}
                            >
                              <span>{meta.icon}</span>
                              <span>{meta.label}</span>
                            </span>
                            <h4 className="font-semibold text-xs sm:text-sm text-[#27262c] leading-snug">
                              {evt.title}
                            </h4>
                          </div>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt.id, evt.title)}
                              className="text-[#a8a4ad] hover:text-[#cf3d2c] p-1 transition"
                              title="Delete event"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Timing and Venue */}
                        <div className="space-y-1 text-xs text-[#555259]">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-[#e3a62f] shrink-0" />
                            <span>
                              {evt.startTime} – {evt.endTime}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin size={12} className="text-[#33409a] shrink-0" />
                              <span className="font-medium text-[#252b67] truncate">{evt.venue}</span>
                            </div>

                            {evt.roomCode && onNavigateToView && (
                              <button
                                type="button"
                                onClick={() => onNavigateToView("floor-plan", evt.roomCode)}
                                className="text-[10px] font-bold text-[#33409a] hover:underline flex items-center gap-0.5 shrink-0"
                              >
                                <span>Campus Map</span>
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {evt.description && (
                          <p className="text-[11px] text-[#6d6972] leading-relaxed pt-1 border-t border-black/5 m-0">
                            {evt.description}
                          </p>
                        )}

                        {/* Timetable Impact Alert */}
                        {evt.affectsTimetable ? (
                          <div className="p-2 rounded bg-[#fdf8ed] border border-[#f5dfad] flex items-start gap-1.5 text-[10px] text-[#93650a]">
                            <AlertTriangle size={12} className="text-[#e3a62f] shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-[#7a5408]">Timetable Adjusted:</strong>
                              <span>{evt.timetableNote || "Regular lectures suspended/modified for this event."}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-[#2d8a5e]">
                            <CheckCircle2 size={11} />
                            <span>Regular Class Timetable Unaffected</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg border border-dashed border-[#ded9cb] bg-white/70 space-y-2 my-4">
                  <div className="w-10 h-10 rounded-full bg-[#f6f2e6] grid place-items-center mx-auto text-[#88848a]">
                    <CalendarIcon size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-[#2d2c32] m-0">No Special Events Scheduled</h4>
                  <p className="text-[11px] text-[#78757d] max-w-xs mx-auto">
                    Regular academic lectures and scheduled laboratory sessions follow the normal university timetable on this day.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewEventDate(selectedDateStr);
                      setIsAddModalOpen(true);
                    }}
                    className="text-xs font-semibold text-[#33409a] border-[#33409a]/30 hover:bg-[#eef0fb] mt-1"
                  >
                    + Schedule Event on this Day
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom Legend */}
            <div className="mt-4 pt-3 border-t border-[#e8e4da] text-[10px] text-[#8c8892] flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#e3a62f]" />
                <span>Today Indicator</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#33409a]" />
                <span>Selected Ring</span>
              </span>
              <span>Click any date to inspect</span>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda View (Chronological List) */
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#e8e4da]">
            <h3 className="font-serif text-lg text-[#262a68] font-bold m-0">
              Chronological Academic Schedule ({filteredEvents.length} Events)
            </h3>
            <span className="text-xs text-[#78757c]">Ordered by date</span>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const meta = CATEGORY_META[evt.category];
              const dateObj = new Date(evt.date + "T00:00:00");

              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl border bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition ${meta.borderColor}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="text-center px-3 py-2 bg-[#faf8f2] border border-[#ded9cb] rounded-lg shrink-0 min-w-[72px]">
                      <span className="block text-[10px] font-bold text-[#e3a62f] uppercase tracking-wider">
                        {dateObj.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <strong className="block text-xl font-serif text-[#252b67] leading-none my-0.5">
                        {dateObj.getDate()}
                      </strong>
                      <span className="block text-[9px] text-[#8e8a93]">
                        {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${meta.badgeBg} ${meta.badgeText}`}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                        {evt.endDate && (
                          <span className="text-[10px] text-[#7a767e]">
                            Until {new Date(evt.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-base sm:text-lg font-bold text-[#27262c] m-0">
                        {evt.title}
                      </h4>

                      <p className="text-xs text-[#6a666e] max-w-2xl leading-relaxed m-0">
                        {evt.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#555259]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-[#e3a62f]" />
                          <span>{evt.startTime} – {evt.endTime}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium text-[#252b67]">
                          <MapPin size={12} className="text-[#33409a]" />
                          <span>{evt.venue}</span>
                        </span>
                        {evt.department && (
                          <>
                            <span>·</span>
                            <span className="text-[#7a767e]">{evt.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    {evt.roomCode && onNavigateToView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateToView("floor-plan", evt.roomCode)}
                        className="text-xs text-[#33409a] border-[#33409a]/30 hover:bg-[#eef0fb] gap-1"
                      >
                        <MapPin size={12} />
                        <span>Locate Venue</span>
                      </Button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="text-[#a8a4ad] hover:text-[#cf3d2c] p-2 transition"
                        title="Delete event"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Dialog Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#fffdf7] border border-[#ded9cb] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden my-8">
            <div className="p-4 sm:p-5 bg-[#252b67] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-[#e3a62f]" />
                <h3 className="font-serif text-lg font-normal m-0 text-white">
                  Add Academic Event / Circular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                  Event Title
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Mid-Term Examination, AI Hackathon, Guest Lecture"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="text-xs bg-white border-[#ded9cb]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                    Event Category
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as EventCategory)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-[#ded9cb] rounded-md outline-none"
                  >
                    <option value="exam">📝 Exams & Tests</option>
                    <option value="hackathon">🚀 Fests & Hackathons</option>
                    <option value="workshop">💡 Workshops & Seminars</option>
                    <option value="holiday">🏖️ Holidays & Recess</option>
                    <option value="academic">📌 Academic Deadlines</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                    Date (YYYY-MM-DD)
                  </label>
                  <Input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="text-xs bg-white border-[#ded9cb]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    className="text-xs bg-white border-[#ded9cb]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 01:00 PM"
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    className="text-xs bg-white border-[#ded9cb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                    Venue / Classroom
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Classroom 215A, Seminar Hall 1"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="text-xs bg-white border-[#ded9cb]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                    Room Code (for Map Navigation)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 215A, LAB-2, SEMINAR-1"
                    value={newEventRoomCode}
                    onChange={(e) => setNewEventRoomCode(e.target.value)}
                    className="text-xs bg-white border-[#ded9cb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                  Department / Organizing Body
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={newEventDepartment}
                  onChange={(e) => setNewEventDepartment(e.target.value)}
                  className="text-xs bg-white border-[#ded9cb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555259] uppercase tracking-wider mb-1">
                  Description & Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="Details regarding attendance, syllabus, or instructions..."
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-[#ded9cb] rounded-md outline-none"
                />
              </div>

              {/* Timetable suspension checkbox */}
              <div className="p-3 bg-[#faf8f2] rounded-md border border-[#e5e1d5] space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#252b67] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEventAffectsTimetable}
                    onChange={(e) => setNewEventAffectsTimetable(e.target.checked)}
                    className="rounded text-[#33409a]"
                  />
                  <span>Affects College Timetable (Classes Suspended / Modified)</span>
                </label>

                {newEventAffectsTimetable && (
                  <Input
                    type="text"
                    placeholder="e.g. P1–P4 theory lectures replaced by Exam sitting"
                    value={newEventTimetableNote}
                    onChange={(e) => setNewEventTimetableNote(e.target.value)}
                    className="text-xs bg-white border-[#ded9cb]"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e8e4da]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-[#252b67] hover:bg-[#1b2052] text-white font-bold"
                >
                  Publish to Academic Calendar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
