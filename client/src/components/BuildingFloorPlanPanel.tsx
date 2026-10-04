import React, { useState, useMemo, useRef } from "react";
import { CAMPUS_FLOORS, BuildingRoom, RoomCategory, CATEGORY_CONFIG, findBuildingRoomByCodeOrName } from "@/data/floorPlanData";
import { RoomDetailModal } from "@/components/RoomDetailModal";
import {
  Building2,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Users,
  Compass,
  GraduationCap,
  FlaskConical,
  Briefcase,
  Shield,
  CheckCircle2,
  ArrowUpRight,
  Eye,
  LayoutGrid,
  MapPin,
  Sparkles,
  Move,
  Hand,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  loadRoomwareIssues,
  subscribeToRoomwareChanges,
  RoomIssue,
  extractRoomCode
} from "@/lib/roomwareStore";

interface BuildingFloorPlanPanelProps {
  isStandalone?: boolean;
  onNavigateTimetable?: (roomCode: string) => void;
  targetRoomCode?: string | null;
  targetFloorNumber?: number | null;
  onClearTarget?: () => void;
}

export default function BuildingFloorPlanPanel({
  isStandalone = false,
  onNavigateTimetable,
  targetRoomCode = null,
  targetFloorNumber = null,
  onClearTarget
}: BuildingFloorPlanPanelProps) {
  const [selectedFloorNum, setSelectedFloorNum] = useState<number>(() => {
    return targetFloorNumber !== null && targetFloorNumber !== undefined ? targetFloorNumber : 0;
  });
  const [viewMode, setViewMode] = useState<"cad" | "cards">("cad");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | "all">("all");
  const [selectedBlock, setSelectedBlock] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFitToScreen, setIsFitToScreen] = useState<boolean>(true); // Default to TRUE so full picture is always visible!
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<BuildingRoom | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<BuildingRoom | null>(null);
  const [roomwareIssues, setRoomwareIssues] = useState<RoomIssue[]>(() => loadRoomwareIssues());

  // Interactive Drag & Pan state
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const unsub = subscribeToRoomwareChanges((issues) => {
      setRoomwareIssues(issues);
    });
    return unsub;
  }, []);

  // Sync targetFloorNumber when passed
  React.useEffect(() => {
    if (targetFloorNumber !== undefined && targetFloorNumber !== null) {
      setSelectedFloorNum(targetFloorNumber);
      setViewMode("cad");
    }
  }, [targetFloorNumber]);

  // Locate and focus on target room when targetRoomCode is passed
  React.useEffect(() => {
    if (targetRoomCode) {
      setViewMode("cad");
      let matched: BuildingRoom | undefined;
      let matchedFloor = targetFloorNumber !== null && targetFloorNumber !== undefined ? targetFloorNumber : selectedFloorNum;

      const resolved = findBuildingRoomByCodeOrName(targetRoomCode);
      if (resolved) {
        matched = resolved.room;
        matchedFloor = resolved.floorNumber;
      } else {
        for (const floor of CAMPUS_FLOORS) {
          const found = floor.rooms.find(
            (r) =>
              r.code.toUpperCase() === targetRoomCode.toUpperCase() ||
              targetRoomCode.toUpperCase().includes(r.code.toUpperCase().replace(/[-\s]/g, "")) ||
              r.code.toUpperCase().replace(/[-\s]/g, "") === targetRoomCode.toUpperCase().replace(/[-\s]/g, "") ||
              r.name.toUpperCase().includes(targetRoomCode.toUpperCase())
          );
          if (found) {
            matched = found;
            matchedFloor = floor.floorNumber;
            break;
          }
        }
      }

      if (matched) {
        setSelectedFloorNum(matchedFloor);
        setSelectedRoom(matched);
        setHoveredRoom(matched);
        // Center pan offset towards hotspot if available
        if (matched.hotspot) {
          const offsetX = (50 - matched.hotspot.x) * 4;
          const offsetY = (50 - matched.hotspot.y) * 4;
          setPanOffset({ x: Math.max(-140, Math.min(140, offsetX)), y: Math.max(-140, Math.min(140, offsetY)) });
        }
      }
    }
  }, [targetRoomCode, targetFloorNumber]);

  const activeFloor = CAMPUS_FLOORS.find((f) => f.floorNumber === selectedFloorNum) || CAMPUS_FLOORS[0];

  // Available blocks on this floor
  const availableBlocks = useMemo(() => {
    const set = new Set<string>();
    activeFloor.rooms.forEach((r) => set.add(r.block));
    return Array.from(set);
  }, [activeFloor]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return activeFloor.rooms.filter((room) => {
      const matchesSearch =
        searchQuery === "" ||
        room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.facilities.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "all" || room.category === selectedCategory;
      const matchesBlock = selectedBlock === "all" || room.block === selectedBlock;

      return matchesSearch && matchesCat && matchesBlock;
    });
  }, [activeFloor, searchQuery, selectedCategory, selectedBlock]);

  const handleZoom = (delta: number) => {
    setIsFitToScreen(false);
    setZoomLevel((prev) => Math.min(260, Math.max(30, prev + delta)));
  };

  const handleResetZoom = () => {
    setIsFitToScreen(false);
    setZoomLevel(100);
  };

  const handleFitToScreen = () => {
    setIsFitToScreen(true);
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = Math.abs(e.clientX - (dragStartRef.current.x + panOffset.x));
    const dy = Math.abs(e.clientY - (dragStartRef.current.y + panOffset.y));
    if (dx > 3 || dy > 3) {
      hasMovedRef.current = true;
    }
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      hasMovedRef.current = false;
      dragStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    hasMovedRef.current = true;
    setPanOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Directional Pan buttons
  const handlePan = (dx: number, dy: number) => {
    setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleResetPan = () => {
    setPanOffset({ x: 0, y: 0 });
    setIsFitToScreen(true);
    setZoomLevel(100);
  };

  const openStandaloneWindow = () => {
    window.open("/floor-plan", "_blank");
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in-50 duration-300">
      {/* Top Banner & Title Bar */}
      <div className="bg-[#fffdf7] border border-[#d5d0c2] border-t-3 border-t-[#33409a] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-[#88848a] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#e3a62f] animate-pulse" />
              <span>Campus Infrastructure & CAD Blueprint System</span>
              <span className="text-[#33409a] font-mono">· JAIN (DEEMED-TO-BE UNIVERSITY)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#252b67] tracking-tight flex items-center gap-2.5">
              <Building2 size={26} className="text-[#33409a]" />
              Architectural Building & Floor Plan
            </h1>
            <p className="text-xs sm:text-sm text-[#66636a] mt-1 max-w-2xl">
              High-resolution CAD architectural layouts, classroom assignments, laboratory facilities, and real-time room occupancy synced with the university timetable engine.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isStandalone && (
              <Button
                variant="outline"
                size="sm"
                onClick={openStandaloneWindow}
                className="h-9 gap-1.5 text-xs font-semibold bg-[#fbf9f4] border-[#d5d0c2] text-[#252b67] hover:bg-[#fffdf7] shadow-xs"
                title="Open interactive floor plan in a dedicated full-screen window"
              >
                <ExternalLink size={13} className="text-[#e3a62f]" />
                Open in Separate Window
                <ArrowUpRight size={13} />
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#ece8dd] p-1 rounded-md border border-[#ded9cb]">
              <button
                onClick={() => setViewMode("cad")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                  viewMode === "cad"
                    ? "bg-[#252b67] text-white shadow-xs"
                    : "text-[#66636a] hover:text-[#252b67]"
                }`}
              >
                <Layers size={13} />
                Blueprint CAD View
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-[#252b67] text-white shadow-xs"
                    : "text-[#66636a] hover:text-[#252b67]"
                }`}
              >
                <LayoutGrid size={13} />
                Room Grid ({activeFloor.rooms.length})
              </button>
            </div>
          </div>
        </div>

        {/* Floor Level Selector Ribbon */}
        <div className="mt-5 pt-4 border-t border-[#e8e4d8] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#77747b] uppercase tracking-wider mr-1 flex items-center gap-1">
              <Compass size={14} className="text-[#33409a]" /> Floor Levels:
            </span>
            {CAMPUS_FLOORS.map((floor) => {
              const isActive = floor.floorNumber === selectedFloorNum;
              return (
                <button
                  key={floor.floorNumber}
                  onClick={() => {
                    setSelectedFloorNum(floor.floorNumber);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? "bg-[#33409a] text-white border-[#252b67] shadow-sm"
                      : "bg-[#faf8f2] text-[#48454c] border-[#d8d3c5] hover:bg-[#fffdf7] hover:border-[#b8b3a5]"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-[#e3a62f]" : "bg-[#a8a49c]"
                    }`}
                  />
                  <span>{floor.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-[#ebe7dc] text-[#6b6770]"
                    }`}
                  >
                    Level {floor.floorNumber}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Level Specs */}
          <div className="flex items-center gap-3 text-xs text-[#77747b]">
            <span className="font-semibold text-[#252b67]">
              {activeFloor.totalAreaSqm.toLocaleString()} SQM
            </span>
            <span>·</span>
            <span>{activeFloor.totalRooms} Rooms Documented</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#fffdf7] border border-[#d5d0c2] rounded-lg p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#969298]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room (e.g. 204, LAB-2, 316, Chemistry, Seminar)..."
              className="h-8 pl-8 text-xs bg-[#faf8f2] border-[#ded9cc]"
            />
          </div>

          {/* Block Selector */}
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="h-8 px-2.5 text-xs font-semibold bg-[#faf8f2] border border-[#ded9cc] rounded-md text-[#252b67] outline-none"
          >
            <option value="all">All Wings & Blocks</option>
            {availableBlocks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer border ${
                selectedCategory === "all"
                  ? "bg-[#252b67] text-white border-[#252b67]"
                  : "bg-[#faf8f2] text-[#66636a] border-[#ded9cc] hover:bg-[#fffdf7]"
              }`}
            >
              All ({activeFloor.rooms.length})
            </button>
            {(["lecture", "lab", "faculty", "admin", "amenity"] as RoomCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const count = activeFloor.rooms.filter((r) => r.category === cat).length;
              if (count === 0) return null;
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                    isSel
                      ? "text-white border-transparent"
                      : "bg-[#faf8f2] text-[#4d4a51] border-[#ded9cc] hover:bg-[#fffdf7]"
                  }`}
                  style={{
                    backgroundColor: isSel ? cfg.color : undefined,
                    borderColor: isSel ? cfg.color : undefined
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSel ? "#fff" : cfg.color }}
                  />
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* CAD Zoom & View Controls (if CAD view active) */}
        {viewMode === "cad" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Fit Whole Picture Button */}
            <button
              onClick={handleFitToScreen}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                isFitToScreen
                  ? "bg-[#252b67] text-[#e3a62f] border-[#252b67] shadow-xs"
                  : "bg-[#fffdf7] text-[#4d4a51] border-[#ded9cc] hover:bg-[#faf8f2]"
              }`}
              title="Fit the entire blueprint in view so the full picture is visible without scrolling"
            >
              <Eye size={13} className={isFitToScreen ? "text-[#e3a62f]" : "text-[#33409a]"} />
              <span>Fit Whole Picture</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#f6f4ee] p-1 rounded-md border border-[#e5e1d5]">
              <button
                onClick={() => handleZoom(-15)}
                className="p-1 rounded hover:bg-[#e8e4d8] text-[#555259] transition cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[11px] font-mono font-bold text-[#252b67] px-1.5 min-w-[42px] text-center">
                {isFitToScreen ? "FIT" : `${zoomLevel}%`}
              </span>
              <button
                onClick={() => handleZoom(15)}
                className="p-1 rounded hover:bg-[#e8e4d8] text-[#555259] transition cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 rounded hover:bg-[#e8e4d8] text-[#555259] transition cursor-pointer ml-0.5"
                title="Reset zoom to 100%"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Fullscreen Mode Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 rounded transition cursor-pointer border ${
                isFullscreen
                  ? "bg-[#e3a62f] text-[#252b67] border-[#e3a62f]"
                  : "bg-[#fffdf7] text-[#555259] border-[#ded9cc] hover:bg-[#faf8f2]"
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Blueprint View"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        )}
      </div>

      {/* Main Content: CAD View OR Cards Grid */}
      {viewMode === "cad" ? (
        <div className="relative bg-[#fffdf7] border border-[#d5d0c2] rounded-lg shadow-sm overflow-hidden">
          {/* Floor Header Bar */}
          <div className="p-3 px-4 bg-[#f8f6ee] border-b border-[#e5e1d5] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#252b67] font-serif text-sm">
                {activeFloor.levelTitle}
              </span>
              <span className="text-[#88848a]">·</span>
              <span className="text-[#66636a]">{activeFloor.subtitle}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#77747b]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#33409a]" /> Click room hotspot pins to inspect full room timetable
              </span>
            </div>
          </div>

          {/* Target Room Focus Banner (from Timetable 1-Click Navigation) */}
          {targetRoomCode && (
            <div className="p-3 px-4 bg-gradient-to-r from-[#fef3c7] via-[#fffbeb] to-[#fffdf7] border-b-2 border-[#e3a62f] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#e3a62f] text-[#252b67] flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <MapPin size={18} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400e] font-mono">1-Click Timetable Room Locator</span>
                    <Badge className="bg-[#e3a62f] text-[#252b67] text-[9px] font-black hover:bg-[#d97706]">TARGET CLASS</Badge>
                  </div>
                  <strong className="text-sm text-[#252b67] font-semibold block truncate">
                    Focused on {selectedRoom?.code || targetRoomCode} · {selectedRoom?.name || "Classroom"} (Floor {selectedFloorNum})
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onNavigateTimetable && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigateTimetable(targetRoomCode)}
                    className="h-8 text-xs border-[#252b67] text-[#252b67] hover:bg-[#252b67] hover:text-white font-medium"
                  >
                    View Timetable
                  </Button>
                )}
                {onClearTarget && (
                  <Button
                    size="sm"
                    onClick={onClearTarget}
                    className="h-8 text-xs bg-[#252b67] text-white hover:bg-[#1b204e] font-medium"
                  >
                    Clear Focus
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* CAD Blueprint Viewport with Hotspots & Real-Time Drag-to-Pan */}
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative w-full overflow-hidden bg-[#faf8f2] flex items-center justify-center p-2 sm:p-4 select-none transition-all ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${
              isFullscreen
                ? "fixed inset-0 z-50 p-6 bg-[#0c1024]/95 backdrop-blur-md"
                : "min-h-[640px]"
            }`}
            style={{
              containerType: "size",
              height: isFullscreen ? "100vh" : isFitToScreen ? "clamp(680px, 84vh, 1050px)" : "clamp(720px, 88vh, 1150px)",
              minHeight: isFullscreen ? "100vh" : "640px"
            }}
          >
            {/* Fullscreen Exit Floating Button */}
            {isFullscreen && (
              <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-[#e3a62f] text-[#252b67] hover:bg-[#cf9424] font-bold text-xs gap-1.5 shadow-xl"
                >
                  <Minimize2 size={15} /> Exit Fullscreen
                </Button>
              </div>
            )}

            {/* Floating Navigation D-Pad & Drag Controller */}
            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-[#fffdf7]/95 backdrop-blur-md p-1.5 rounded-lg border border-[#d5d0c2] shadow-md pointer-events-auto">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePan(80, 0);
                  }}
                  className="p-1 rounded hover:bg-[#ece7d8] text-[#252b67] transition cursor-pointer"
                  title="Pan Left (or drag blueprint)"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePan(0, 80);
                    }}
                    className="p-1 rounded hover:bg-[#ece7d8] text-[#252b67] transition cursor-pointer"
                    title="Pan Up (or drag blueprint)"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePan(0, -80);
                    }}
                    className="p-1 rounded hover:bg-[#ece7d8] text-[#252b67] transition cursor-pointer"
                    title="Pan Down (or drag blueprint)"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePan(-80, 0);
                  }}
                  className="p-1 rounded hover:bg-[#ece7d8] text-[#252b67] transition cursor-pointer"
                  title="Pan Right (or drag blueprint)"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="h-5 w-px bg-[#d5d0c2]" />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetPan();
                }}
                className="px-2 py-1 rounded hover:bg-[#ece7d8] text-[#252b67] text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                title="Center and fit blueprint"
              >
                <RotateCcw size={12} className="text-[#e3a62f]" />
                <span>Center</span>
              </button>

              <div className="h-5 w-px bg-[#d5d0c2]" />

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#555259] px-1 font-medium">
                <Hand size={13} className="text-[#33409a]" />
                <span>Drag anywhere to explore</span>
              </div>
            </div>

            {/* Transform Canvas with Smooth Drag Panning */}
            <div
              className="relative select-none shadow-xl border border-[#ded9cb] rounded-lg bg-white transition-transform duration-75 ease-out flex items-center justify-center overflow-hidden"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${isFitToScreen ? 1 : zoomLevel / 100})`,
                width: "min(calc(100cqw - 24px), calc((100cqh - 24px) * 1.024))",
                height: "min(calc(100cqh - 24px), calc((100cqw - 24px) / 1.024))",
                maxWidth: "100%",
                maxHeight: "100%",
                aspectRatio: "1024 / 1000",
                transformOrigin: "center center"
              }}
            >
              {/* Architectural CAD Blueprint Image */}
              <img
                src={activeFloor.cadImage}
                alt={`${activeFloor.levelTitle} Blueprint CAD Layout`}
                className="w-full h-full object-contain pointer-events-none block select-none"
                loading="eager"
                draggable={false}
              />

              {/* Interactive Clickable Hotspot Pins Overlay */}
              {activeFloor.rooms.map((room) => {
                if (!room.hotspot) return null;
                const isHovered = hoveredRoom?.id === room.id;
                const isMatch = filteredRooms.some((r) => r.id === room.id);
                const cfg = CATEGORY_CONFIG[room.category];
                const targetDigits = targetRoomCode?.match(/\d{3}/)?.[0];
                const isTarget = Boolean(
                  (selectedRoom && selectedRoom.id === room.id) ||
                  (targetRoomCode && (
                    room.code.toUpperCase() === targetRoomCode.toUpperCase() ||
                    room.id.toUpperCase() === targetRoomCode.toUpperCase() ||
                    (targetDigits && (room.code.includes(targetDigits) || room.id.includes(targetDigits))) ||
                    targetRoomCode.toUpperCase().includes(room.code.toUpperCase().replace(/[-\s]/g, "")) ||
                    room.code.toUpperCase().replace(/[-\s]/g, "") === targetRoomCode.toUpperCase().replace(/[-\s]/g, "") ||
                    room.name.toUpperCase().includes(targetRoomCode.toUpperCase())
                  ))
                );

                return (
                  <div
                    key={room.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasMovedRef.current) {
                        setSelectedRoom(room);
                      }
                    }}
                    onMouseEnter={() => setHoveredRoom(room)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    className={`absolute cursor-pointer transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2 group z-10 ${
                      isTarget ? "z-30 opacity-100" : !isMatch ? "opacity-25 hover:opacity-100" : "opacity-100"
                    }`}
                    style={{
                      left: `${room.hotspot.x}%`,
                      top: `${room.hotspot.y}%`
                    }}
                  >
                    {/* Concentric Radar Beacon Rings for Target Class Room */}
                    {isTarget && (
                      <>
                        <div className="absolute -inset-4 rounded-full border-2 border-[#e3a62f] bg-[#e3a62f]/30 animate-ping pointer-events-none" />
                        <div className="absolute -inset-7 rounded-full border border-[#e3a62f]/60 animate-pulse pointer-events-none" />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#e3a62f] text-[#252b67] font-black text-[8.5px] tracking-wide whitespace-nowrap shadow-xl flex items-center gap-1 z-30 animate-bounce pointer-events-none">
                          <MapPin size={9} className="fill-[#252b67]" /> TARGET ROOM
                        </div>
                      </>
                    )}

                    {/* Glowing Pin Marker */}
                    <div
                      className={`relative flex items-center gap-1 px-1.5 py-0.5 rounded shadow-md font-mono text-[10px] font-bold border transition-transform ${
                        isTarget
                          ? "scale-125 -translate-y-1.5 ring-4 ring-[#e3a62f] shadow-[0_0_20px_rgba(227,166,47,0.8)]"
                          : isHovered
                          ? "scale-115 -translate-y-1 ring-2 ring-[#e3a62f]"
                          : "hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: isTarget ? "#e3a62f" : cfg.color,
                        color: isTarget ? "#252b67" : "#ffffff",
                        borderColor: isTarget ? "#252b67" : "#ffffff"
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isTarget ? "bg-[#252b67] animate-ping" : "bg-white animate-pulse"}`} />
                      <span>{room.code}</span>
                    </div>

                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-md bg-[#252b67] text-white text-[11px] shadow-xl z-30 pointer-events-none animate-in fade-in zoom-in-95">
                        <div className="font-bold font-sans text-xs text-[#e3a62f]">{room.code}</div>
                        <div className="font-medium truncate">{room.name}</div>
                        <div className="text-[9px] text-[#bfc4e2] mt-0.5">
                          {cfg.label} · {room.capacity} Seats
                        </div>
                        <div className="text-[9px] text-[#2c8a63] font-semibold mt-1 flex items-center gap-1">
                          Click to view timetable schedule
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Legend Bar */}
          <div className="p-3 px-4 bg-[#f8f6ee] border-t border-[#e5e1d5] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#77747b] uppercase tracking-wider text-[10px]">
                Blueprint Legend:
              </span>
              {(["lecture", "lab", "faculty", "admin", "amenity"] as RoomCategory[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <span key={cat} className="flex items-center gap-1.5 text-[11px] text-[#4a4750]">
                    <span
                      className="w-2.5 h-2.5 rounded-xs"
                      style={{ backgroundColor: cfg.color }}
                    />
                    {cfg.label}
                  </span>
                );
              })}
            </div>

            <div className="text-[11px] text-[#88848a]">
              Showing {filteredRooms.length} of {activeFloor.rooms.length} rooms on this floor
            </div>
          </div>
        </div>
      ) : (
        /* Room Directory Grid View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRooms.map((room) => {
              const cfg = CATEGORY_CONFIG[room.category];
              const roomCode = extractRoomCode(room.code).toLowerCase();
              const roomIssue = roomwareIssues.find(
                (iss) =>
                  iss.status !== "resolved" &&
                  (iss.roomCode.toLowerCase() === roomCode ||
                    room.code.toLowerCase().includes(iss.roomCode.toLowerCase()) ||
                    room.name.toLowerCase().includes(iss.roomCode.toLowerCase()))
              );

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`bg-[#fffdf7] border rounded-lg p-4 shadow-xs hover:shadow-md transition-all duration-180 cursor-pointer flex flex-col justify-between group ${
                    roomIssue
                      ? "border-[#f87171] hover:border-[#dc2626] bg-[#fffaf9]"
                      : "border-[#d5d0c2] hover:border-[#33409a]"
                  }`}
                >
                  <div>
                    {/* Header: Code & Category */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2.5 py-1 rounded text-xs font-bold font-mono text-white shadow-xs"
                          style={{ backgroundColor: cfg.color }}
                        >
                          {room.code}
                        </span>
                        <span className="text-xs font-semibold text-[#88848a]">
                          {room.block}
                        </span>
                        {roomIssue && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#dc2626] flex items-center gap-1 animate-pulse">
                            ⚠️ {roomIssue.category.toUpperCase()} ISSUE
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Room Title */}
                    <h3 className="text-base font-bold text-[#25252c] group-hover:text-[#33409a] transition">
                      {room.name}
                    </h3>
                    <p className="text-xs text-[#66636a] mt-1.5 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Facilities Preview */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {room.facilities.slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#f3f0e6] text-[#555259] border border-[#e2ddd0]"
                        >
                          {f}
                        </span>
                      ))}
                      {room.facilities.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded text-[#88848a]">
                          +{room.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats & Action */}
                  <div className="mt-4 pt-3 border-t border-[#e8e4d8] flex items-center justify-between text-xs text-[#77747b]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Users size={13} className="text-[#33409a]" /> {room.capacity} seats
                      </span>
                      <span>·</span>
                      <span>{room.areaSqm} SQM</span>
                    </div>

                    <span className="text-xs font-bold text-[#33409a] flex items-center gap-0.5 group-hover:underline">
                      View Schedule <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRooms.length === 0 && (
            <div className="bg-[#fffdf7] border border-[#d5d0c2] rounded-lg p-10 text-center text-[#88848a]">
              <Building2 size={36} className="mx-auto text-[#b8b4a8] mb-2" />
              <h3 className="text-base font-bold text-[#25252c]">No rooms match your filter</h3>
              <p className="text-xs text-[#66636a] mt-1">
                Try clearing your search query or selecting "All Wings & Blocks".
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedBlock("all");
                }}
                className="mt-3 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Floor Highlights Card */}
      <div className="bg-[#f7f5ee] border border-[#ded9cb] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#33409a] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#e3a62f]" /> Level Highlights:
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#444248]">
            {activeFloor.highlights.map((hl, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#2c8a63]" /> {hl}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onNavigateTimetable) onNavigateTimetable("A-204");
            }}
            className="h-8 text-xs bg-white text-[#252b67] border-[#ded9cb] hover:bg-[#faf8f2]"
          >
            Find Classroom in Timetable
          </Button>
        </div>
      </div>

      {/* Room Detail Modal Inspector */}
      <RoomDetailModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onSelectTimetable={onNavigateTimetable}
      />
    </div>
  );
}
