import React, { useState, useEffect } from "react";
import { Clock, Play, Pause, RotateCcw, Timer } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CampusTimerProps {
  className?: string;
}

export function CampusTimer({ className = "" }: CampusTimerProps) {
  // Live current real time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Lecture Stopwatch mode
  const [timerMode, setTimerMode] = useState<"clock" | "stopwatch">("clock");
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  // Update live clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update stopwatch
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isStopwatchRunning && stopwatchSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning, stopwatchSeconds]);

  // Determine active period based on hour & minute
  const getActivePeriodLabel = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes >= 8 * 60 + 30 && totalMinutes < 9 * 60 + 30) return "Period 1 · 08:30 – 09:30";
    if (totalMinutes >= 9 * 60 + 30 && totalMinutes < 10 * 60 + 30) return "Period 2 · 09:30 – 10:30";
    if (totalMinutes >= 10 * 60 + 30 && totalMinutes < 10 * 60 + 45) return "Morning Recess Break";
    if (totalMinutes >= 10 * 60 + 45 && totalMinutes < 11 * 60 + 45) return "Period 3 · 10:45 – 11:45";
    if (totalMinutes >= 11 * 60 + 45 && totalMinutes < 12 * 60 + 45) return "Period 4 · 11:45 – 12:45";
    if (totalMinutes >= 12 * 60 + 45 && totalMinutes < 13 * 60 + 30) return "Institutional Lunch Recess";
    if (totalMinutes >= 13 * 60 + 30 && totalMinutes < 14 * 60 + 30) return "Period 5 · 01:30 – 02:30";
    if (totalMinutes >= 14 * 60 + 30 && totalMinutes < 15 * 60 + 30) return "Period 6 · 02:30 – 03:30";
    if (totalMinutes >= 15 * 60 + 30 && totalMinutes < 16 * 60 + 30) return "Period 7 · 03:30 – 04:30";
    if (totalMinutes >= 16 * 60 + 30 && totalMinutes < 17 * 60 + 30) return "Period 8 · 04:30 – 05:30";
    return "Campus Off-Hours";
  };

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const hoursStr = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  // split time string: e.g. "08:56:01 PM"
  const [timeDigits, ampm] = hoursStr.split(" ");

  const dayString = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const activePeriod = getActivePeriodLabel(currentTime);
  const isClassHours = activePeriod.startsWith("Period");

  return (
    <div
      className={`inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#fffdf7] border border-[#d5d0c2] shadow-sm text-[#252b67] select-none transition hover:border-[#e3a62f] hover:shadow-md ${className}`}
      title="Live Academic Session Clock & Lecture Timer"
    >
      {timerMode === "clock" ? (
        <>
          {/* Pulsing indicator */}
          <div className="flex flex-col items-center justify-center pl-0.5">
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isClassHours ? "bg-[#34a853]" : "bg-[#e3a62f]"
                } animate-pulse`}
              />
              <span
                className={`absolute w-4 h-4 rounded-full ${
                  isClassHours ? "bg-[#34a853]/25" : "bg-[#e3a62f]/25"
                } animate-ping`}
              />
            </div>
          </div>

          {/* Big, Neat Time Display */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#252b67] leading-none">
                {timeDigits}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#252b67] text-[#e3a62f] font-mono leading-none tracking-wider uppercase">
                {ampm}
              </span>
              <span className="text-[11px] font-medium text-[#747079] uppercase font-mono hidden sm:inline ml-1">
                {dayString}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold">
              <span className="text-[#8e8a93] uppercase tracking-wider text-[9px]">STATUS:</span>
              <span className={isClassHours ? "text-[#2e7d32] font-bold" : "text-[#b27914] font-medium"}>
                {activePeriod}
              </span>
            </div>
          </div>

          {/* Toggle to stopwatch button */}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setTimerMode("stopwatch")}
                className="ml-1 p-1.5 rounded-lg hover:bg-[#f0ede4] text-[#8a858e] hover:text-[#252b67] transition cursor-pointer border border-transparent hover:border-[#d5d0c2]"
                aria-label="Switch to lecture timer / stopwatch"
              >
                <Timer size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px] py-1 px-2">
              Switch to Lecture Timer / Stopwatch
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <>
          <div className="relative flex items-center justify-center pl-0.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isStopwatchRunning ? "bg-[#e3a62f] animate-pulse" : "bg-[#8a858e]"
              }`}
            />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#252b67] leading-none">
                {formatStopwatch(stopwatchSeconds)}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e3a62f] text-[#252b67] font-mono leading-none uppercase">
                {isStopwatchRunning ? "RUNNING" : "PAUSED"}
              </span>
            </div>
            <div className="text-[10px] text-[#8a858e] font-medium mt-1 uppercase tracking-wider font-mono">
              LECTURE STOPWATCH
            </div>
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => setIsStopwatchRunning((prev) => !prev)}
              className="p-1.5 rounded-md bg-[#252b67] text-white hover:bg-[#333b80] transition cursor-pointer"
              title={isStopwatchRunning ? "Pause" : "Start"}
            >
              {isStopwatchRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsStopwatchRunning(false);
                setStopwatchSeconds(0);
              }}
              className="p-1.5 rounded-md hover:bg-[#f0ede4] text-[#8a858e] hover:text-[#252b67] transition cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={12} />
            </button>
            <button
              type="button"
              onClick={() => setTimerMode("clock")}
              className="p-1.5 rounded-md hover:bg-[#f0ede4] text-[#8a858e] hover:text-[#252b67] transition cursor-pointer"
              title="Back to Live Clock"
            >
              <Clock size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
