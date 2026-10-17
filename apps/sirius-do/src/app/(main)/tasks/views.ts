export const TASK_VIEWS = ["all", "today", "upcoming", "overdue", "done"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export function isTaskView(value: unknown): value is TaskView {
  return typeof value === "string" && (TASK_VIEWS as readonly string[]).includes(value);
}
