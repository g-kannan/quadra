import type { KeyboardEvent, ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { dateOffset, quadrants } from "./model";
import type { Task } from "./model";
import {
  addDays,
  addMonths,
  calendarDate,
  monthDays,
  monthStart,
} from "./calendar";

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
function fullDate(key: string): string {
  return calendarDate(key).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CalendarView({
  tasks,
  selectedDate,
  selectDate,
  edit,
  add,
  renderTask,
  query,
}: {
  tasks: Task[];
  selectedDate: string;
  selectDate: (date: string) => void;
  edit: (task: Task) => void;
  add: (date: string) => void;
  renderTask: (task: Task) => ReactNode;
  query: string;
}) {
  const month = monthStart(selectedDate);
  const days = monthDays(month);
  const today = dateOffset();
  const monthLabel = calendarDate(month).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const selectedTasks = tasks.filter((task) => task.due === selectedDate);
  const unscheduled = tasks.filter((task) => !task.due);
  const byDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.due) continue;
    const datedTasks = byDate.get(task.due) ?? [];
    datedTasks.push(task);
    byDate.set(task.due, datedTasks);
  }
  function select(key: string, focus = false) {
    selectDate(key);
    if (focus)
      requestAnimationFrame(() =>
        document.getElementById(`calendar-day-${key}`)?.focus(),
      );
  }
  function navigate(amount: number) {
    select(addMonths(month, amount));
  }
  function keyboard(event: KeyboardEvent, key: string) {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[
      event.key
    ];
    let destination: string | undefined;
    if (offset !== undefined) destination = addDays(key, offset);
    if (event.key === "Home")
      destination = addDays(key, -((calendarDate(key).getDay() + 6) % 7));
    if (event.key === "End")
      destination = addDays(key, 6 - ((calendarDate(key).getDay() + 6) % 7));
    if (event.key === "PageUp") destination = addMonths(key, -1);
    if (event.key === "PageDown") destination = addMonths(key, 1);
    if (destination) {
      event.preventDefault();
      select(destination, true);
    }
  }
  return (
    <div className="calendar-view">
      <div className="calendar-layout">
        <section className="calendar-month" aria-label="Monthly calendar">
          <div className="calendar-toolbar">
            <h3 aria-live="polite">{monthLabel}</h3>
            <div className="calendar-navigation">
              <button className="calendar-today" onClick={() => select(today)}>
                Today
              </button>
              <button
                className="icon-button"
                aria-label="Previous month"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Next month"
                onClick={() => navigate(1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <div
            className="calendar-grid"
            role="grid"
            aria-label={`${monthLabel} calendar`}
          >
            <div className="calendar-weekdays" role="row">
              {weekdays.map((day) => (
                <span key={day} role="columnheader" aria-label={day}>
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, week) => (
              <div className="calendar-week" role="row" key={week}>
                {days.slice(week * 7, week * 7 + 7).map((key) => {
                  const dailyTasks = byDate.get(key) ?? [];
                  const inMonth = monthStart(key) === month;
                  const selected = key === selectedDate;
                  return (
                    <div
                      key={key}
                      role="gridcell"
                      aria-selected={selected}
                      className={`calendar-cell ${inMonth ? "" : "outside-month"} ${selected ? "selected-day" : ""} ${key === today ? "is-today" : ""}`}
                    >
                      <button
                        id={`calendar-day-${key}`}
                        className="calendar-day"
                        tabIndex={selected ? 0 : -1}
                        aria-label={`${fullDate(key)}, ${dailyTasks.length} ${dailyTasks.length === 1 ? "task" : "tasks"}`}
                        aria-current={key === today ? "date" : undefined}
                        onClick={() => select(key)}
                        onKeyDown={(event) => keyboard(event, key)}
                      >
                        <span>{calendarDate(key).getDate()}</span>
                        <span className="calendar-day-count" aria-hidden="true">
                          {dailyTasks.length || ""}
                        </span>
                      </button>
                      <div className="calendar-chips">
                        {dailyTasks.slice(0, 2).map((task) => (
                          <button
                            key={task.id}
                            className={`calendar-task ${task.quadrant}`}
                            aria-label={`Edit ${task.title}`}
                            title={task.title}
                            onClick={() => edit(task)}
                          >
                            <span className={`color-dot ${task.quadrant}`} />
                            <span>{task.title}</span>
                          </button>
                        ))}
                        {dailyTasks.length > 2 && (
                          <button
                            className="calendar-more"
                            onClick={() => select(key)}
                            aria-label={`Show all ${dailyTasks.length} tasks on ${fullDate(key)}`}
                          >
                            +{dailyTasks.length - 2} more
                          </button>
                        )}
                      </div>
                      <div className="calendar-mobile-dots" aria-hidden="true">
                        {dailyTasks.slice(0, 3).map((task) => (
                          <span
                            key={task.id}
                            className={`color-dot ${task.quadrant}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="calendar-legend">
            {quadrants.map((q) => (
              <span key={q.id}>
                <span className={`color-dot ${q.id}`} />
                {q.title}
              </span>
            ))}
          </div>
        </section>
        <section className="calendar-agenda" aria-label="Selected day tasks">
          <div className="agenda-heading">
            <span className="agenda-eyebrow">
              {selectedDate === today ? "TODAY’S PLAN" : "YOUR DAY"}
            </span>
            <h3>
              {calendarDate(selectedDate).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <p>
              {selectedTasks.length}{" "}
              {selectedTasks.length === 1 ? "task" : "tasks"}
              {query ? " matching your search" : " on your agenda"}
            </p>
          </div>
          <div className="agenda-tasks">
            {selectedTasks.map(renderTask)}
            {!selectedTasks.length && (
              <div className="agenda-empty">
                <CalendarDays size={26} strokeWidth={1.4} />
                <strong>
                  {query
                    ? "No matching tasks today."
                    : "A little breathing room."}
                </strong>
                <p>
                  {query
                    ? "Choose another day or try a different search."
                    : "Choose one thing to make time for."}
                </p>
              </div>
            )}
          </div>
          <button
            className="button secondary calendar-add"
            onClick={() => add(selectedDate)}
          >
            <Plus size={15} />
            Add task for this day
          </button>
        </section>
      </div>
      <details className="calendar-unscheduled" open>
        <summary>
          No due date <span>{unscheduled.length}</span>
        </summary>
        <p>
          {query
            ? "Matching tasks without a due date."
            : "These tasks are still in your matrix. Open one to add a date."}
        </p>
        <div className="unscheduled-tasks">
          {unscheduled.map(renderTask)}
          {!unscheduled.length && (
            <span className="unscheduled-empty">
              {query
                ? "No matching undated tasks."
                : "Every task has a date. A little clarity, all around."}
            </span>
          )}
        </div>
      </details>
    </div>
  );
}
