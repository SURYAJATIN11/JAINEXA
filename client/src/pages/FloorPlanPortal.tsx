import React from "react";
import BuildingFloorPlanPanel from "@/components/BuildingFloorPlanPanel";
import {
  Building2,
  CalendarDays,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Printer,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloorPlanPortal() {
  const handlePrint = () => {
    window.print();
  };

  const handleOpenTimetable = () => {
    window.location.href = "/";
  };

  const handleOpenAdmin = () => {
    window.open("/admin", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#25252c] font-sans antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#252b67] text-white border-b border-[#1f255b] px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenTimetable}
              className="h-8 text-white/80 hover:text-white hover:bg-white/10 text-xs gap-1.5 px-2"
            >
              <ArrowLeft size={14} /> Back to Timetable
            </Button>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded bg-[#e3a62f] flex items-center justify-center text-[#252b67] font-bold text-xs shrink-0">
                FP
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap">
                  Campus Building & Floor Plan Studio
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/20 text-white font-normal hidden lg:inline">
                    Standalone Window
                  </span>
                </h1>
                <div className="text-[10px] text-white/70 truncate">
                  CSE Complex · Level 0 to Level 4 CAD Architectural Layouts
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 hidden sm:flex"
            >
              <Printer size={13} /> Print Blueprint
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdmin}
              className="h-8 text-xs bg-[#e3a62f] hover:bg-[#cf9424] text-[#252b67] font-bold gap-1.5 shadow-sm"
            >
              <ShieldCheck size={14} /> Admin Studio
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-[1680px] mx-auto p-3 sm:p-6 lg:p-8">
        <BuildingFloorPlanPanel
          isStandalone={true}
          onNavigateTimetable={(roomCode) => {
            window.location.href = `/#batch-timetable?query=${encodeURIComponent(roomCode)}`;
          }}
        />
      </main>

      {/* Footer */}
      <footer className="max-w-[1680px] mx-auto px-4 sm:px-8 py-6 border-t border-[#e2ded2] text-xs text-[#88848a] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          © 2026 Campus Ledger Timetable System · Department of Computer Science & Engineering
        </div>
        <div className="flex items-center gap-4">
          <span>Architectural Blueprints Verified by Campus Infrastructure</span>
          <span className="text-[#33409a] font-semibold">Live CAD Engine v2.4</span>
        </div>
      </footer>
    </div>
  );
}
