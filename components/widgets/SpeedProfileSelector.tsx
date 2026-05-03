"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useService } from "@/components/ros";
import type { SetSpeedProfileRequest, SetSpeedProfileResponse, SpeedProfile } from "@/lib/types";
import { savePreferences, type SpeedProfile as PrefSpeedProfile } from "@/lib/preferences";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpeedProfileSelectorProps {
  initial?: SpeedProfile;
  onChange?: (profile: SpeedProfile) => void;
}

const PROFILES: { id: SpeedProfile; label: string; hint: string }[] = [
  { id: "beginner", label: "Beginner", hint: "0.2 m/s" },
  { id: "normal", label: "Normal", hint: "0.6 m/s" },
  { id: "insane", label: "Insane", hint: "1.5 m/s" },
];

export function SpeedProfileSelector({ initial = "normal", onChange }: SpeedProfileSelectorProps) {
  const [active, setActive] = useState<SpeedProfile>(initial);
  const { call, loading, error } = useService<SetSpeedProfileRequest, SetSpeedProfileResponse>(
    "/teleop/set_speed_profile",
    "openbrain_msgs/srv/SetSpeedProfile",
  );

  const select = async (profile: SpeedProfile) => {
    setActive(profile);
    savePreferences({ speedProfile: profile as PrefSpeedProfile });
    onChange?.(profile);
    await call({ profile });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-1.5">
        {PROFILES.map((p) => (
          <Button
            key={p.id}
            variant={p.id === active ? "default" : "outline"}
            disabled={loading}
            onClick={() => void select(p.id)}
            className={cn(
              "flex min-h-11 w-full flex-col gap-0.5 py-2.5 sm:h-auto sm:py-2",
              p.id === active && "ring-ring ring-2",
            )}
          >
            <span className="text-xs font-semibold">{p.label}</span>
            <span className="text-[10px] opacity-70">{p.hint}</span>
          </Button>
        ))}
      </div>
      {loading && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" /> applying…
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
