import { getClock } from "@workspace/sirius-core/lib/auth";
import { TasksBoard } from "@/app/(main)/tasks/_components/TasksBoard";
import { getCategories, getDoneTasks, getOpenTasks } from "@/lib/tasks";

export default async function TasksPage() {
  const [{ profile, today }, open, done, categories] = await Promise.all([
    getClock(),
    getOpenTasks(),
    getDoneTasks(),
    getCategories(),
  ]);

  return (
    <TasksBoard
      today={today}
      timezone={profile?.timezone ?? "Asia/Ulaanbaatar"}
      open={open}
      done={done}
      categories={categories}
    />
  );
}
