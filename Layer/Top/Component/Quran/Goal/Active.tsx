import { Flame, Trophy, Clock, Calendar, Target, Trash2, MapPin, Plus } from "lucide-react";
import { cn } from "@/Middle/Library/utils";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { Progress_Ring } from "./Progress";
import type { Goal_Progress } from "./Types";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Active_Props {
  activeGoal: any;
  weekProgress: any[];
  totalMinutesRead: number;
  todayMinutes: number;
  todaySeconds?: number;
  todayPercentage: number;
  dayProgress: Goal_Progress | null;
  overallProgress: number;
  versesRead: number;
  totalVerses: number;
  currentSurah: any;
  currentAyah: number;
  currentJuz: number;
  currentPage: number;
  onDeleteGoal: () => void;
  onCreateNewGoal: () => void;
}

function StatPanel({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string | number;
  label: string;
}) {
  return (
    <Container className="!p-3 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-foreground/80" />
      <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[10px] mt-1 uppercase tracking-wider text-muted-foreground">{label}</p>
    </Container>
  );
}

export function Active({
  activeGoal,
  weekProgress,
  totalMinutesRead,
  todayMinutes,
  todaySeconds = 0,
  todayPercentage,
  dayProgress,
  overallProgress,
  versesRead,
  totalVerses,
  currentSurah,
  currentAyah,
  currentJuz,
  currentPage,
  onDeleteGoal,
  onCreateNewGoal,
}: Active_Props) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const endDate = activeGoal?.end_date ? new Date(activeGoal.end_date) : null;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000))
    : null;
  const dailyTarget = activeGoal?.daily_target || 0;
  const completedDays = weekProgress?.filter((p) => p.completed).length || 0;

  const totalTodaySeconds = todayMinutes * 60 + todaySeconds;
  const targetSeconds = dailyTarget * 60;
  const remainingSeconds = Math.max(0, targetSeconds - totalTodaySeconds);

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "0m";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  const isGoalCompleted = totalTodaySeconds >= targetSeconds && targetSeconds > 0;
  const ringValue =
    activeGoal?.goal_type === "time_based"
      ? todayPercentage
      : activeGoal?.goal_type === "khatm"
      ? overallProgress
      : dayProgress?.todayPercent || 0;
  const ringLabel =
    activeGoal?.goal_type === "time_based"
      ? !isGoalCompleted
        ? formatTimeRemaining(remainingSeconds)
        : "Done"
      : `${ringValue}%`;
  const ringSublabel =
    activeGoal?.goal_type === "time_based"
      ? "Left today"
      : dayProgress
      ? `Day ${dayProgress.dayNumber}`
      : "Overall";

  const subtitle =
    activeGoal?.goal_type === "time_based"
      ? `${dailyTarget} min / day`
      : activeGoal?.goal_type === "khatm"
      ? `Khatm${daysRemaining !== null ? ` · ${daysRemaining}d left` : ""}`
      : "Custom";

  if (!activeGoal) return null;

  return (
    <div className="container py-6 sm:py-8 max-w-4xl mx-auto px-4 space-y-4">
      {/* Title in thin Container */}
      <div className="flex items-center justify-between gap-3">
        <Container className="!py-1 !px-4 inline-flex w-auto">
          <span className="text-sm font-medium">Active Goal</span>
        </Container>
        <Button
          onClick={onDeleteGoal}
          size="icon"
          variant="ghost"
          className="w-9 h-9 p-0 text-destructive/80 hover:text-destructive"
          title="Delete Goal"
          aria-label="Delete Goal"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Hero ring + stats */}
      <Container className="!p-5 sm:!p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold leading-tight">Active Mission</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <Progress_Ring
            value={ringValue}
            size={150}
            strokeWidth={6}
            label={ringLabel}
            sublabel={ringSublabel}
            variant="segmented"
            segments={60}
          />
          <div className="grid grid-cols-2 gap-2.5 flex-1 w-full">
            <StatPanel icon={Flame} value={activeGoal.current_streak || 0} label="Streak" />
            <StatPanel icon={Trophy} value={activeGoal.longest_streak || 0} label="Best" />
            <StatPanel icon={Clock} value={totalMinutesRead} label="Total min" />
            <StatPanel icon={Calendar} value={`${completedDays}/7`} label="This week" />
          </div>
        </div>
      </Container>

      {/* Today (time-based) */}
      {activeGoal.goal_type === "time_based" && dailyTarget > 0 && (
        <Container className="!p-4 sm:!p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold">
              {todayMinutes}:{String(todaySeconds).padStart(2, "0")} / {dailyTarget}m
            </span>
            <span className="text-xs text-muted-foreground">
              {isGoalCompleted ? "✓ Complete" : `${Math.min(todayPercentage, 100)}%`}
            </span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => {
              const filled = i < Math.round((Math.min(todayPercentage, 100) / 100) * 20);
              return (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-sm transition-colors duration-500",
                    filled ? "bg-foreground" : "bg-muted"
                  )}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isGoalCompleted ? "Goal complete" : `${formatTimeRemaining(remainingSeconds)} remaining`}
          </p>
        </Container>
      )}

      {/* Khatm day */}
      {activeGoal.goal_type === "khatm" && dayProgress && (
        <Container className="!p-4 sm:!p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold">
              Day {dayProgress.dayNumber} / {dayProgress.totalDays}
            </span>
            <span className="text-xs font-bold">{dayProgress.todayPercent}%</span>
          </div>
          <div className="flex gap-0.5 mb-3">
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < Math.round((dayProgress.todayPercent / 100) * 10);
              return (
                <div
                  key={i}
                  className={cn(
                    "h-2.5 flex-1 rounded-sm transition-colors duration-500",
                    filled ? "bg-foreground" : "bg-muted"
                  )}
                />
              );
            })}
          </div>
          <div className="flex gap-2 items-stretch">
            <Container className="!p-2.5 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
              <p className="text-xs truncate font-medium">
                {dayProgress.startPos?.surahName || "Start"}
              </p>
            </Container>
            <div className="flex items-center text-muted-foreground">→</div>
            <Container className="!p-2.5 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To</p>
              <p className="text-xs truncate font-medium">
                {dayProgress.endPos?.surahName || "End"}
                {dayProgress.endPos?.ayah ? ` (${dayProgress.endPos.ayah})` : ""}
              </p>
            </Container>
          </div>
        </Container>
      )}

      {/* Current position */}
      <Container className="!p-4 sm:!p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Current Position</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Surah", value: currentSurah?.englishName || "Al-Fatihah" },
            { label: "Ayah", value: currentAyah || 1 },
            { label: "Juz", value: currentJuz || 1 },
            { label: "Page", value: currentPage || 1 },
          ].map((it) => (
            <Container key={it.label} className="!p-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{it.label}</p>
              <p className="font-semibold text-xs truncate mt-0.5">{it.value}</p>
            </Container>
          ))}
        </div>

        {activeGoal.goal_type === "khatm" && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Overall Progress</span>
              <span className="text-xs font-bold tabular-nums">{overallProgress}%</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 20 }).map((_, i) => {
                const filled = i < Math.round((overallProgress / 100) * 20);
                return (
                  <div
                    key={i}
                    className={cn("h-1.5 flex-1 rounded-sm", filled ? "bg-foreground" : "bg-muted")}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {versesRead.toLocaleString()} / {totalVerses.toLocaleString()} verses
            </p>
          </div>
        )}
      </Container>

      {/* Week */}
      <Container className="!p-4 sm:!p-5">
        <p className="text-sm font-semibold mb-3">This Week</p>
        <div className="flex items-center justify-between">
          {DAYS_OF_WEEK.map((day, index) => {
            const progressForDay = weekProgress?.find(
              (p) => new Date(p.date).getDay() === index
            );
            const isToday = index === dayOfWeek;
            const isCompleted = progressForDay?.completed;
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{day}</span>
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-bold",
                    isCompleted
                      ? "bg-foreground text-background"
                      : isToday
                      ? "border-2 border-foreground text-foreground"
                      : "border border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? "✓" : isToday ? "·" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      {/* New goal CTA */}
      <Button onClick={onCreateNewGoal} variant="secondary" fullWidth className="h-12">
        <Plus className="h-4 w-4" />
        New Goal
      </Button>
    </div>
  );
}
