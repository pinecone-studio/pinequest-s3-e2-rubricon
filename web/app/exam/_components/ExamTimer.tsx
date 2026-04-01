import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock } from "lucide-react";

const getStoredEndsAtMs = (storageKey: string) => {
  if (typeof window === "undefined") return null;

  const savedEndsAt = localStorage.getItem(storageKey);
  const parsedEndsAt = savedEndsAt ? Number(savedEndsAt) : NaN;

  return Number.isFinite(parsedEndsAt) ? parsedEndsAt : null;
};

const getEffectiveEndsAtMs = (
  durationSeconds: number,
  storageKey: string,
  scheduledEndsAtMs?: number | null,
) => {
  if (
    typeof scheduledEndsAtMs === "number" &&
    Number.isFinite(scheduledEndsAtMs)
  ) {
    return scheduledEndsAtMs;
  }

  const storedEndsAtMs = getStoredEndsAtMs(storageKey);
  if (storedEndsAtMs !== null) return storedEndsAtMs;

  if (typeof window === "undefined") return null;

  return Date.now() + durationSeconds * 1000;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const ExamTimer = ({
  durationSeconds = 4500,
  storageKey,
  scheduledEndsAtMs,
  onTimeUp,
}: {
  durationSeconds?: number;
  storageKey: string;
  scheduledEndsAtMs?: number | null;
  onTimeUp?: () => void;
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const firedRef = useRef(false);

  const effectiveEndsAtMs = useMemo(
    () => getEffectiveEndsAtMs(durationSeconds, storageKey, scheduledEndsAtMs),
    [durationSeconds, scheduledEndsAtMs, storageKey],
  );

  const timeLeft =
    effectiveEndsAtMs === null
      ? durationSeconds
      : Math.max(0, Math.ceil((effectiveEndsAtMs - nowMs) / 1000));

  useEffect(() => {
    if (
      typeof scheduledEndsAtMs === "number" &&
      Number.isFinite(scheduledEndsAtMs)
    ) {
      if (getStoredEndsAtMs(storageKey) !== scheduledEndsAtMs) {
        localStorage.setItem(storageKey, scheduledEndsAtMs.toString());
      }
      return;
    }

    const storedEndsAtMs = getStoredEndsAtMs(storageKey);
    if (storedEndsAtMs === null && effectiveEndsAtMs !== null) {
      localStorage.setItem(storageKey, effectiveEndsAtMs.toString());
    }
  }, [effectiveEndsAtMs, scheduledEndsAtMs, storageKey]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Auto submit trigger
  useEffect(() => {
    if (timeLeft > 0) return;
    if (firedRef.current) return;
    firedRef.current = true;
    onTimeUp?.();
  }, [timeLeft, onTimeUp]);

  return (
    <div className="border-none">
      <Card className="flex flex-col gap-2.5 rounded-xl py-4 mb-6 justify-center w-full">
        <CardHeader className="flex gap-2 justify-center items-center">
          <Clock size={16} />
          <p>Үлдсэн цаг</p>
        </CardHeader>
        <CardContent className="justify-center font-mono">
          <p
            className={`text-3xl font-mono font-medium tracking-tight text-center ${
              timeLeft < 300 ? "text-red-500" : "text-gray-800"
            }`}
          >
            {formatTime(timeLeft)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamTimer;
