import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ArrowLeft,
  Lock
} from "lucide-react";

interface AttendanceAccessRestrictedProps {
  onBackToTimetable?: () => void;
  onOpenLoginModal?: () => void;
}

export default function AttendanceAccessRestricted({
  onBackToTimetable,
  onOpenLoginModal
}: AttendanceAccessRestrictedProps) {
  const { user } = useAuth();

  return (
    <div className="py-12 px-4 max-w-2xl mx-auto text-center">
      <Card className="bg-[#fffdf7] border border-[#e2ddd1] border-t-4 border-t-[#cf3d2c] p-8 shadow-xl rounded-xl">
        <div className="w-14 h-14 rounded-full bg-[#fdf2f0] border border-[#f5c6c2] text-[#cf3d2c] flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Lock size={26} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf2f0] text-[#cf3d2c] text-[11px] font-bold tracking-wider uppercase mb-3 border border-[#f5c6c2]">
          <ShieldAlert size={13} />
          ACCESS RESTRICTED · FACULTY & ADMIN ONLY
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl text-[#262a68] mb-2 font-normal">
          Attendance Portal is Locked
        </h2>

        <p className="text-xs sm:text-sm text-[#66636a] max-w-md mx-auto leading-relaxed mb-6">
          Institutional student registers, session capture, and AICTE compliance tracking (<strong className="text-[#cf3d2c]">threshold &lt; 75%</strong>) are restricted exclusively to <strong>Faculty Members</strong> and <strong>Academic Administrators</strong>. Students are not authorized to view or edit attendance registers.
        </p>

        {user && (
          <div className="p-3 bg-[#f5f1e6] rounded-md border border-[#e5dfd2] text-xs text-[#5e5a63] mb-6 max-w-md mx-auto text-left flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#88848d] block">Current Active Account</span>
              <strong className="text-[#25242a]">{user.name}</strong>
              <span className="text-[11px] text-[#6b6770] block">Role: {user.role} ({user.roleType.toUpperCase()})</span>
            </div>
            <Badge className="bg-[#5e5a63] text-white border-0 text-[10px]">
              Student View
            </Badge>
          </div>
        )}

        <div className="space-y-3 max-w-md mx-auto">
          {onBackToTimetable && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToTimetable}
                className="w-full text-xs h-10 bg-[#252b67] text-white hover:bg-[#323985] gap-2 font-semibold shadow-sm"
              >
                <ArrowLeft size={14} />
                <span>Return to Batch Timetable</span>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
