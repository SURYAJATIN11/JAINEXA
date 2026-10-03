import { User, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Lock,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

interface AdminAccessRestrictedProps {
  user?: User | null;
  onSwitchToAdmin?: () => void;
  onOpenLoginModal?: () => void;
}

export default function AdminAccessRestricted({
  user,
  onSwitchToAdmin,
  onOpenLoginModal
}: AdminAccessRestrictedProps) {
  const { switchRole } = useAuth();

  const handleAdminSwitch = () => {
    if (onSwitchToAdmin) onSwitchToAdmin();
    else switchRole("admin");
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] flex flex-col justify-center items-center p-4 relative font-sans">
      <div
        className="fixed inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-cover"
        style={{ backgroundImage: "url('/manus-storage/campus-ledger-texture_15d6d0cc.png')" }}
      />

      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs text-[#524f56] hover:text-[#252b67] gap-1.5">
            <ArrowLeft size={14} /> Back to Live Timetable
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-lg relative z-10 my-8">
        <Card className="bg-[#fffdf7] border border-[#ded9cc] border-t-4 border-t-[#cf3d2c] shadow-2xl p-8 rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-[#fdf2f0] border border-[#f5c6c2] text-[#cf3d2c] flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock size={30} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf2f0] text-[#cf3d2c] text-[11px] font-bold tracking-wider uppercase mb-3 border border-[#f5c6c2]">
            <ShieldAlert size={14} />
            ADMIN STUDIO · ADMINISTRATORS ONLY
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#262a68] mb-2 font-normal">
            Access Restricted
          </h1>

          <p className="text-xs sm:text-sm text-[#66636a] max-w-md mx-auto leading-relaxed mb-6">
            The Timetable Administration Studio is strictly restricted to <strong>Academic Administrators, Institutional Coordinators, and Deans</strong>. Faculty members and students are not authorized to update, remove, or publish college schedules.
          </p>

          {user && (
            <div className="p-3.5 bg-[#f5f1e6] rounded-md border border-[#e5dfd2] text-xs text-[#5e5a63] mb-6 max-w-md mx-auto text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#88848d] block">Current Authenticated User</span>
                <strong className="text-[#25242a] text-sm block">{user.name}</strong>
                <span className="text-[11px] text-[#6b6770] block">Role: {user.role} ({user.roleType.toUpperCase()})</span>
              </div>
              <Badge className="bg-[#cf3d2c] text-white border-0 text-[10px] px-2 py-0.5">
                Unauthorized Role
              </Badge>
            </div>
          )}

          <div className="space-y-3 max-w-sm mx-auto">
            <Button
              onClick={handleAdminSwitch}
              className="w-full h-10 text-xs bg-[#252b67] hover:bg-[#343b7e] text-white font-bold gap-2 shadow-md"
            >
              <ShieldCheck size={16} className="text-[#e3a62f]" />
              <span>Authenticate with Administrator Account</span>
            </Button>

            {onOpenLoginModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenLoginModal}
                className="w-full text-xs h-9 border-[#d8d3c5] text-[#555259] gap-1.5"
              >
                <KeyRound size={13} />
                <span>Enter Admin Username & Password</span>
              </Button>
            )}

            <div className="pt-2">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-[#757279] hover:text-[#252b67] gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Return to Timetable View</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
