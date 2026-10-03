import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DAYS,
  SLOT_LABELS,
  PALETTE,
  Session,
} from "@/lib/timetableStore";
import {
  collegeFacultyNames,
  collegeRooms,
  collegeSubjects,
  collegeOfferings
} from "@/data/collegeData";
import { AlertCircle, Check, Trash2, Sparkles, Clock, MapPin, User as UserIcon, BookOpen } from "lucide-react";

interface SessionEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit: Session | null;
  targetDay: string;
  targetSlot: number;
  program: string;
  semester: string;
  section: string;
  currentDraftSessions: Session[];
  onSave: (session: Session) => void;
  onDelete: (sessionId: string, day: string, slot: number) => void;
}

export function SessionEditorDialog({
  isOpen,
  onClose,
  sessionToEdit,
  targetDay,
  targetSlot,
  program,
  semester,
  section,
  currentDraftSessions,
  onSave,
  onDelete,
}: SessionEditorDialogProps) {
  const isEditing = !!sessionToEdit;

  // Form states
  const [day, setDay] = useState(targetDay);
  const [slot, setSlot] = useState(targetSlot);
  const [subjectMode, setSubjectMode] = useState<"catalog" | "custom">("catalog");
  const [selectedSubjectKey, setSelectedSubjectKey] = useState("");
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [customSubjectCode, setCustomSubjectCode] = useState("");
  const [faculty, setFaculty] = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [room, setRoom] = useState("");
  const [type, setType] = useState<"Lecture" | "Lab" | "Tutorial" | "Seminar">("Lecture");
  const [batchGroup, setBatchGroup] = useState("Entire Class");
  const [note, setNote] = useState("");
  const [color, setColor] = useState(PALETTE.indigo);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Available subjects for this program & semester
  const availableProgramSubjects = useMemo(() => {
    const list = collegeSubjects.filter((subj) => {
      const offerings = collegeOfferings[subj.key] || [];
      return offerings.some((item) => item.program === program && item.semester === semester);
    });
    return list.length > 0 ? list : collegeSubjects.slice(0, 15);
  }, [program, semester]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (sessionToEdit) {
        setDay(sessionToEdit.day);
        setSlot(sessionToEdit.slot);
        setCustomSubjectName(sessionToEdit.subject);
        setCustomSubjectCode(sessionToEdit.code);
        setFaculty(sessionToEdit.faculty);
        setRoom(sessionToEdit.room);
        setType(sessionToEdit.type || "Lecture");
        setBatchGroup(sessionToEdit.batch || "Entire Class");
        setNote(sessionToEdit.note || "");
        setColor(sessionToEdit.color || PALETTE.indigo);

        // Check if subject exists in catalog
        const match = collegeSubjects.find((s) => s.codes.includes(sessionToEdit.code) || s.name === sessionToEdit.subject);
        if (match) {
          setSubjectMode("catalog");
          setSelectedSubjectKey(match.key);
        } else {
          setSubjectMode("custom");
          setSelectedSubjectKey("");
        }
      } else {
        setDay(targetDay || DAYS[0]);
        setSlot(targetSlot ?? 0);
        setType("Lecture");
        setBatchGroup(`${program} · S${semester} · ${section}`);
        setNote("");
        setColor(PALETTE.indigo);

        if (availableProgramSubjects.length > 0) {
          const first = availableProgramSubjects[0];
          setSelectedSubjectKey(first.key);
          setSubjectMode("catalog");
          setCustomSubjectName(first.name);
          setCustomSubjectCode(first.code);

          // Pre-fill faculty if assigned in offering
          const offerings = collegeOfferings[first.key] || [];
          const offering = offerings.find(
            (o) => o.program === program && o.semester === semester && o.section === section
          ) || offerings[0];
          setFaculty(offering?.faculty || collegeFacultyNames[0] || "Faculty In-Charge");
          setRoom(offering?.faculty ? "Room A-204" : "A-204");
        } else {
          setSubjectMode("custom");
          setCustomSubjectName("");
          setCustomSubjectCode("");
          setFaculty(collegeFacultyNames[0] || "");
          setRoom("A-204");
        }
      }
    }
  }, [isOpen, sessionToEdit, targetDay, targetSlot, program, semester, section, availableProgramSubjects]);

  // Handle catalog subject selection
  const handleSelectCatalogSubject = (key: string) => {
    setSelectedSubjectKey(key);
    const subj = collegeSubjects.find((s) => s.key === key);
    if (subj) {
      setCustomSubjectName(subj.name);
      setCustomSubjectCode(subj.code);
      const offerings = collegeOfferings[subj.key] || [];
      const offering = offerings.find(
        (o) => o.program === program && o.semester === semester && o.section === section
      ) || offerings[0];
      if (offering?.faculty) {
        setFaculty(offering.faculty);
      }
      if (subj.code.includes("L") || /lab/i.test(subj.name)) {
        setType("Lab");
        setColor(PALETTE.red);
        setRoom("Lab Room 204");
      }
    }
  };

  // Conflict detection
  const conflictWarnings = useMemo(() => {
    const warnings: string[] = [];
    const otherSessions = currentDraftSessions.filter(
      (s) => !(isEditing && s.id === sessionToEdit?.id)
    );

    // Slot collision within current class
    const sameSlot = otherSessions.find((s) => s.day === day && s.slot === slot);
    if (sameSlot) {
      warnings.push(`Replacing existing slot: "${sameSlot.subject}" (${sameSlot.code}) is currently scheduled here.`);
    }

    return warnings;
  }, [day, slot, isEditing, sessionToEdit, currentDraftSessions]);

  const handleSave = () => {
    const finalSubject = subjectMode === "catalog"
      ? (collegeSubjects.find((s) => s.key === selectedSubjectKey)?.name || customSubjectName || "Untitled Subject")
      : (customSubjectName || "Untitled Subject");

    const finalCode = subjectMode === "catalog"
      ? (collegeSubjects.find((s) => s.key === selectedSubjectKey)?.code || customSubjectCode || "SUB101")
      : (customSubjectCode || "SUB101");

    const sessionColor = type === "Lab" ? PALETTE.red : color;

    const newSession: Session = {
      id: sessionToEdit?.id || `custom-${program}-${semester}-${section}-${Date.now()}`,
      day,
      slot: Number(slot),
      subject: finalSubject,
      code: finalCode,
      faculty: faculty || "Faculty In-Charge",
      room: room || "Classroom",
      batch: batchGroup || `${program} · S${semester} · ${section}`,
      type,
      color: sessionColor,
      note: note || `Updated via Timetable Studio for ${program} Semester ${semester} Section ${section}.`
    };

    onSave(newSession);
    onClose();
  };

  const handleDelete = () => {
    if (sessionToEdit) {
      onDelete(sessionToEdit.id, sessionToEdit.day, sessionToEdit.slot);
    } else {
      onDelete("", day, slot);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#fffdf7] border-[#d8d3c5] text-[#25252c] shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#858286] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#e3a62f]" />
            TIMETABLE STUDIO · {program} S{semester} ({section})
          </div>
          <DialogTitle className="font-serif text-2xl text-[#262a68] mt-1">
            {isEditing ? "Update Scheduled Session" : "Schedule New Class Session"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77747a]">
            {isEditing
              ? "Modify details, reallocate instructor or room, or remove this class slot."
              : "Assign an academic subject, instructor, and classroom to this timetable period."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Day and Slot row */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#f5f2e8] rounded-md border border-[#e5e1d4]">
            <div>
              <Label className="text-[11px] font-semibold text-[#666368] flex items-center gap-1.5 mb-1.5">
                <Clock size={13} className="text-[#33409a]" /> Day of the Week
              </Label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#d8d4c7] rounded focus:outline-none focus:border-[#33409a]"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-[#666368] flex items-center gap-1.5 mb-1.5">
                <Clock size={13} className="text-[#33409a]" /> Time Period (P1–P8)
              </Label>
              <select
                value={slot}
                onChange={(e) => setSlot(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-white border border-[#d8d4c7] rounded focus:outline-none focus:border-[#33409a]"
              >
                {SLOT_LABELS.map((lbl, idx) => (
                  <option key={lbl} value={idx}>{lbl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Mode Switcher */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] font-semibold text-[#666368] flex items-center gap-1.5">
                <BookOpen size={13} className="text-[#33409a]" /> Course Subject
              </Label>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSubjectMode("catalog")}
                  className={`px-2 py-0.5 rounded transition ${subjectMode === "catalog"
                      ? "bg-[#33409a] text-white font-medium"
                      : "bg-[#ece9df] text-[#666368] hover:bg-[#e0dcd1]"
                    }`}
                >
                  Year Catalog ({availableProgramSubjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectMode("custom")}
                  className={`px-2 py-0.5 rounded transition ${subjectMode === "custom"
                      ? "bg-[#33409a] text-white font-medium"
                      : "bg-[#ece9df] text-[#666368] hover:bg-[#e0dcd1]"
                    }`}
                >
                  Custom Entry
                </button>
              </div>
            </div>

            {subjectMode === "catalog" ? (
              <select
                value={selectedSubjectKey}
                onChange={(e) => handleSelectCatalogSubject(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#d8d4c7] rounded focus:outline-none focus:border-[#33409a]"
              >
                {availableProgramSubjects.map((subj) => (
                  <option key={subj.key} value={subj.key}>
                    {subj.code} — {subj.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Code (e.g. CSE301)"
                  value={customSubjectCode}
                  onChange={(e) => setCustomSubjectCode(e.target.value.toUpperCase())}
                  className="h-9 text-xs bg-white border-[#d8d4c7]"
                />
                <Input
                  placeholder="Subject Title (e.g. Distributed Computing)"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="col-span-2 h-9 text-xs bg-white border-[#d8d4c7]"
                />
              </div>
            )}
          </div>

          {/* Faculty Assignment & Classroom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-[#666368] flex items-center gap-1.5 mb-1.5">
                <UserIcon size={13} className="text-[#33409a]" /> Faculty In-Charge
              </Label>
              <Input
                list="faculty-options"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="Search or enter faculty name..."
                className="h-9 text-xs bg-white border-[#d8d4c7]"
              />
              <datalist id="faculty-options">
                {collegeFacultyNames.slice(0, 30).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-[#666368] flex items-center gap-1.5 mb-1.5">
                <MapPin size={13} className="text-[#33409a]" /> Room / Laboratory
              </Label>
              <Input
                list="room-options"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Room number or lab..."
                className="h-9 text-xs bg-white border-[#d8d4c7]"
              />
              <datalist id="room-options">
                {collegeRooms.slice(0, 35).map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.type} · Seating: {r.seating}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Session Type and Batch group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-[#666368] mb-1.5 block">
                Session Type
              </Label>
              <div className="grid grid-cols-3 gap-1">
                {(["Lecture", "Lab", "Tutorial"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      if (t === "Lab") setColor(PALETTE.red);
                      else if (t === "Tutorial") setColor(PALETTE.teal);
                      else setColor(PALETTE.indigo);
                    }}
                    className={`h-8 text-xs font-medium rounded border transition ${type === t
                        ? "bg-[#252b67] text-white border-[#252b67]"
                        : "bg-white border-[#d8d4c7] text-[#4d4a51] hover:bg-[#f6f4ee]"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-[#666368] mb-1.5 block">
                Target Batch / Sub-Group
              </Label>
              <Input
                value={batchGroup}
                onChange={(e) => setBatchGroup(e.target.value)}
                placeholder="e.g. CSE · S3 · A (or Batch 1)"
                className="h-8 text-xs bg-white border-[#d8d4c7]"
              />
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <Label className="text-[11px] font-semibold text-[#666368] mb-1.5 block">
              Administrative Rationale / Note (Optional)
            </Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Shifted from P4 to accommodate AICTE curriculum revision..."
              className="h-8 text-xs bg-white border-[#d8d4c7]"
            />
          </div>

          {/* Conflict warnings if any */}
          {conflictWarnings.length > 0 && (
            <div className="p-3 bg-[#fff8e7] border border-[#ecdab1] rounded text-[#8c6014] text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#cf8e18]" />
              <div>
                <strong>Notice:</strong>
                {conflictWarnings.map((w, idx) => (
                  <p key={idx} className="mt-0.5 text-[11px]">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Delete Confirmation prompt - if needed */}
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-[#e8e4da] pt-4 mt-2">
          <div>
            {isEditing && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs bg-[#c93b2b] hover:bg-[#b02e20] text-white gap-1 px-2.5 shadow-sm"
                    onClick={handleDelete}
                  >
                    <Trash2 size={12} />
                    Confirm Remove Slot
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-[#716e75] hover:bg-[#f1ede3]"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#eac3bf] text-[#c93b2b] hover:bg-[#fdf0ee] hover:text-[#a82718] text-xs gap-1.5 h-8 px-2.5"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={13} />
                  Remove Class
                </Button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 border-[#d8d4c7] text-[#555258]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#33409a] hover:bg-[#252b67] text-white text-xs h-9 gap-1.5 px-4 shadow-sm"
            >
              <Check size={14} />
              {isEditing ? "Save Changes" : "Add to Timetable"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
