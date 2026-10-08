import type { Day } from "@workspace/sirius-core/lib/date";

export type TaskStatus = "todo" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: Day | null;
  due_time: string | null;
  duration_minutes: number | null;
  completed_at: string | null;
}
