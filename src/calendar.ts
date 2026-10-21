/** Local calendar dates use noon to avoid UTC and daylight-saving day shifts. */
export function calendarDate(key: string): Date {
  return new Date(`${key}T12:00:00`);
}
export function dateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function monthStart(key: string): string {
  return `${key.slice(0, 7)}-01`;
}
export function addDays(key: string, amount: number): string {
  const date = calendarDate(key);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}
export function addMonths(key: string, amount: number): string {
  const date = calendarDate(monthStart(key));
  date.setMonth(date.getMonth() + amount);
  return dateKey(date);
}
export function monthDays(month: string): string[] {
  const first = monthStart(month);
  const mondayOffset = (calendarDate(first).getDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
