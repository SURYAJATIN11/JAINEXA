import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  UsersRound,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
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
  const { user, switchRole, quickLogin } = useAuth();

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
          <div className="text-[11px] font-bold text-[#88848d] uppercase tracking-wider mb-2">
            Switch to an Authorized Account to Gain Access:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              onClick={() => switchRole("faculty")}
              className="h-10 text-xs bg-[#e3a62f] hover:bg-[#cf8e18] text-[#252b67] font-bold gap-2 shadow-sm border border-[#cf921d]"
            >
              <UsersRound size={15} />
              <span>Login as Faculty</span>
            </Button>

            <Button
              onClick={() => switchRole("admin")}
              className="h-10 text-xs bg-[#252b67] hover:bg-[#323985] text-white font-bold gap-2 shadow-sm"
            >
              <ShieldCheck size={15} className="text-[#e3a62f]" />
              <span>Login as Admin</span>
            </Button>
          </div>

          {onOpenLoginModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLoginModal}
              className="w-full text-xs h-9 border-[#d8d3c5] text-[#555259] gap-1.5 mt-2"
            >
              <KeyRound size={13} />
              <span>Sign in with other Faculty / Admin ID</span>
            </Button>
          )}

          {onBackToTimetable && (
            <div className="pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToTimetable}
                className="text-xs text-[#757279] hover:text-[#252b67] gap-1.5"
              >
                <ArrowLeft size={13} />
                <span>Return to Batch Timetable</span>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
