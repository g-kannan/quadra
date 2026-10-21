export type Space = "personal" | "work";
export type Quadrant = "do" | "schedule" | "delegate" | "eliminate";
export type View = "matrix" | "all" | "completed";
export interface Task {
  id: string;
  title: string;
  notes: string;
  quadrant: Quadrant;
  space: Space;
  due: string;
  completed: boolean;
  createdAt: number;
}
export const STORAGE_KEY = "quadra.tasks.v1";
export const quadrants = [
  {
    id: "do",
    title: "Do first",
    subtitle: "Important & urgent",
    guidance: "Give these your attention today.",
    number: "01",
  },
  {
    id: "schedule",
    title: "Schedule",
    subtitle: "Important, not urgent",
    guidance: "Make time for what moves you forward.",
    number: "02",
  },
  {
    id: "delegate",
    title: "Delegate",
    subtitle: "Urgent, less important",
    guidance: "Share the load. Protect your focus.",
    number: "03",
  },
  {
    id: "eliminate",
    title: "Let go",
    subtitle: "Less important, not urgent",
    guidance: "Do less of what doesn’t add value.",
    number: "04",
  },
] as const;
export function dateOffset(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dueLabel(due: string): string {
  if (due === dateOffset()) return "Today";
  if (due === dateOffset(1)) return "Tomorrow";
  return new Date(`${due}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
export function seedTasks(): Task[] {
  const samples: [string, Quadrant, Space, number | null][] = [
    ["Book your annual checkup", "do", "personal", 0],
    ["Renew car insurance", "do", "personal", 1],
    ["Make time for a little movement", "schedule", "personal", 1],
    ["Plan a weekend away", "schedule", "personal", null],
    ["Read 20 pages", "schedule", "personal", 0],
    ["Return that delivery", "delegate", "personal", 0],
    ["Tidy up your photo library", "eliminate", "personal", null],
    ["Send the project proposal", "do", "work", 0],
    ["Prepare for the client meeting", "do", "work", 1],
    ["Map out next month’s goals", "schedule", "work", null],
    ["Learn something new", "schedule", "work", null],
    ["Hand off the weekly report", "delegate", "work", 1],
    ["Reconsider recurring meetings", "eliminate", "work", null],
  ];
  return samples.map(([title, quadrant, space, days], i) => ({
    id: `welcome-${i}`,
    title,
    quadrant,
    space,
    notes: "",
    due: days === null ? "" : dateOffset(days),
    completed: false,
    createdAt: Date.now() + i,
  }));
}
function validDate(value: unknown): value is string {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function parseBackup(raw: string): Task[] {
  const data = JSON.parse(raw);
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.tasks) ||
    data.tasks.length > 10000
  )
    throw new Error("Invalid backup");
  const ids = new Set<string>();
  return data.tasks.map((t: Task) => {
    if (
      !t ||
      typeof t.id !== "string" ||
      !t.id ||
      ids.has(t.id) ||
      typeof t.title !== "string" ||
      !t.title.trim() ||
      t.title.length > 200 ||
      typeof t.notes !== "string" ||
      t.notes.length > 10000 ||
      !quadrants.some((q) => q.id === t.quadrant) ||
      !["personal", "work"].includes(t.space) ||
      !validDate(t.due) ||
      typeof t.completed !== "boolean" ||
      !Number.isFinite(t.createdAt)
    )
      throw new Error("Invalid task");
    ids.add(t.id);
    return {
      id: t.id,
      title: t.title,
      notes: t.notes,
      quadrant: t.quadrant,
      space: t.space,
      due: t.due,
      completed: t.completed,
      createdAt: t.createdAt,
    };
  });
}
export function serialize(tasks: Task[]): string {
  return JSON.stringify({ version: 1, tasks }, null, 2);
}
export function loadTasks(): { tasks: Task[]; error: string } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return {
      tasks: stored === null ? seedTasks() : parseBackup(stored),
      error: "",
    };
  } catch {
    return {
      tasks: [],
      error:
        "Saved tasks could not be loaded. Your existing data has not been changed. Check browser storage or restore a backup before adding tasks.",
    };
  }
}
