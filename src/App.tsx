import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  CircleCheck,
  CircleHelp,
  Download,
  Ellipsis,
  Feather,
  GripVertical,
  LayoutGrid,
  ListTodo,
  LockKeyhole,
  MoveRight,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import {
  dateOffset,
  dueLabel,
  loadTasks,
  parseBackup,
  quadrants,
  serialize,
  STORAGE_KEY,
} from "./model";
import type { Quadrant, Space, Task, View } from "./model";

type Editor = { task?: Task; quadrant: Quadrant };
type Toast = { message: string; undo?: () => void };
const quadrantIcons = {
  do: Zap,
  schedule: CalendarDays,
  delegate: ArrowUpRight,
  eliminate: Feather,
};
const viewLabels = {
  matrix: "My matrix",
  all: "All tasks",
  completed: "Completed",
};

function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close();
        }
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function TaskEditor({
  editor,
  space,
  save,
  close,
  remove,
}: {
  editor: Editor;
  space: Space;
  save: (task: Task) => void;
  close: () => void;
  remove: (task: Task) => void;
}) {
  const task = editor.task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [due, setDue] = useState(task?.due ?? "");
  const [quadrant, setQuadrant] = useState<Quadrant>(
    task?.quadrant ?? editor.quadrant,
  );
  const [taskSpace, setTaskSpace] = useState<Space>(task?.space ?? space);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    save({
      id: task?.id ?? crypto.randomUUID(),
      title: title.trim(),
      notes: notes.trim(),
      due,
      quadrant,
      space: taskSpace,
      completed: task?.completed ?? false,
      createdAt: task?.createdAt ?? Date.now(),
    });
  }
  return (
    <Modal
      title={task ? "A little more clarity" : "Make room for a task"}
      close={close}
    >
      <p className="modal-description">
        Capture it, place it, and take it one step at a time.
      </p>
      <form onSubmit={submit} className="task-form">
        <label>
          Task name
          <input
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What’s on your mind?"
          />
        </label>
        <label>
          Notes <span className="optional">optional</span>
          <textarea
            maxLength={10000}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="A few details, a link, or your next step…"
          />
        </label>
        <fieldset>
          <legend>Where does it belong?</legend>
          <div className="quadrant-options">
            {quadrants.map((q) => {
              const Icon = quadrantIcons[q.id];
              return (
                <label
                  key={q.id}
                  className={`quadrant-option ${q.id} ${quadrant === q.id ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="quadrant"
                    value={q.id}
                    checked={quadrant === q.id}
                    onChange={() => setQuadrant(q.id)}
                  />
                  <Icon size={17} />
                  <span>
                    {q.title}
                    <small>{q.subtitle}</small>
                  </span>
                  {quadrant === q.id && <Check size={15} />}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="form-row">
          <label>
            Due date <span className="optional">optional</span>
            <input
              type="date"
              min="0001-01-01"
              max="9999-12-31"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <label>
            Space
            <select
              aria-label="Space"
              value={taskSpace}
              onChange={(e) => setTaskSpace(e.target.value as Space)}
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
            </select>
          </label>
        </div>
        <div className="modal-actions">
          {task && (
            <button
              type="button"
              className="delete-button"
              onClick={() => remove(task)}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
          <div className="action-right">
            <button type="button" className="button secondary" onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={!title.trim()}
            >
              {task ? "Save changes" : "Add task"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function TaskCard({
  task,
  edit,
  complete,
  move,
  remove,
  dragging,
  setDragging,
  showQuadrant = false,
}: {
  task: Task;
  edit: (task: Task) => void;
  complete: (task: Task) => void;
  move: (task: Task, q: Quadrant) => void;
  remove: (task: Task) => void;
  dragging: string | null;
  setDragging: (id: string | null) => void;
  showQuadrant?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    function outside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(false);
    }
    document.addEventListener("click", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [menu]);
  const priorityIndex = quadrants.findIndex((q) => q.id === task.quadrant);
  const higherPriority = quadrants[priorityIndex - 1];
  const lowerPriority = quadrants[priorityIndex + 1];
  function changePriority(direction: "promote" | "lower") {
    const destination =
      direction === "promote" ? higherPriority : lowerPriority;
    if (!destination || task.completed) return;
    setMenu(false);
    move(task, destination.id);
    // A move remounts the card in another quadrant. Keep keyboard focus on it.
    requestAnimationFrame(() => {
      const card = document.getElementById(`task-${task.id}`);
      const button = card?.querySelector<HTMLButtonElement>(
        `[data-priority-direction="${direction}"]`,
      );
      if (button && !button.disabled) button.focus({ preventScroll: true });
      else
        card
          ?.querySelector<HTMLButtonElement>(".task-menu-trigger")
          ?.focus({ preventScroll: true });
    });
  }
  const isOverdue = task.due && task.due < dateOffset() && !task.completed;
  return (
    <article
      id={`task-${task.id}`}
      className={`task-card ${task.completed ? "is-completed" : ""} ${dragging === task.id ? "dragging" : ""}`}
      draggable={!task.completed}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        setDragging(task.id);
      }}
      onDragEnd={() => setDragging(null)}
      data-testid={`task-${task.id}`}
    >
      <div className="task-main">
        <button
          className="complete-button"
          aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
          onClick={() => complete(task)}
        >
          {task.completed && <Check size={12} />}
        </button>
        <button
          draggable={!task.completed}
          className="task-title"
          onClick={() => edit(task)}
        >
          {task.title}
        </button>
        <div className="task-actions" ref={menuRef}>
          {!task.completed && (
            <>
              <button
                className="icon-button task-quick-action"
                data-priority-direction="promote"
                aria-label={`Promote ${task.title}${higherPriority ? ` to ${higherPriority.title}` : ""}`}
                title={
                  higherPriority
                    ? `Promote to ${higherPriority.title}`
                    : "Already in Do first"
                }
                disabled={!higherPriority}
                onClick={() => changePriority("promote")}
              >
                <ArrowUp size={15} />
              </button>
              <button
                className="icon-button task-quick-action"
                data-priority-direction="lower"
                aria-label={`Lower ${task.title}${lowerPriority ? ` to ${lowerPriority.title}` : ""}`}
                title={
                  lowerPriority
                    ? `Lower to ${lowerPriority.title}`
                    : "Already in Let go"
                }
                disabled={!lowerPriority}
                onClick={() => changePriority("lower")}
              >
                <ArrowDown size={15} />
              </button>
            </>
          )}
          <button
            className="icon-button task-quick-action task-delete"
            aria-label={`Delete ${task.title}`}
            title="Delete task (undo available)"
            onClick={() => {
              setMenu(false);
              remove(task);
            }}
          >
            <Trash2 size={14} />
          </button>
          <button
            className={`icon-button task-menu-trigger ${menu ? "is-open" : ""}`}
            aria-label={`Options for ${task.title}`}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <Ellipsis size={18} />
          </button>
          {menu && (
            <div className="task-menu">
              <button
                onClick={() => {
                  setMenu(false);
                  edit(task);
                }}
              >
                <Settings2 size={14} />
                Edit task
              </button>
              <div className="menu-label">Move to</div>
              {quadrants.map((q) => (
                <button
                  key={q.id}
                  disabled={task.quadrant === q.id}
                  onClick={() => {
                    setMenu(false);
                    move(task, q.id);
                  }}
                >
                  <span className={`color-dot ${q.id}`} />
                  {q.title}
                  {task.quadrant === q.id && <Check size={13} />}
                </button>
              ))}
              <button
                className="danger"
                onClick={() => {
                  setMenu(false);
                  remove(task);
                }}
              >
                <Trash2 size={14} />
                Delete task
              </button>
            </div>
          )}
        </div>
      </div>
      {(task.due || task.notes || showQuadrant) && (
        <div className="task-meta">
          {task.due && (
            <span
              className={`due-date ${isOverdue ? "overdue" : ""} ${task.due === dateOffset() ? "today" : ""}`}
            >
              <CalendarDays size={12} />
              {dueLabel(task.due)}
              {isOverdue ? " · overdue" : ""}
            </span>
          )}
          {task.notes && (
            <span className="notes-indicator" title={task.notes}>
              <ListTodo size={12} />
              Notes
            </span>
          )}
          {showQuadrant && (
            <span className={`quadrant-tag ${task.quadrant}`}>
              <span className={`color-dot ${task.quadrant}`} />
              {quadrants.find((q) => q.id === task.quadrant)?.title}
            </span>
          )}
        </div>
      )}
      <GripVertical className="drag-handle" size={13} aria-hidden="true" />
    </article>
  );
}

export default function App() {
  const [initial] = useState(loadTasks);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const tasksRef = useRef(tasks);
  const [saveError, setSaveError] = useState(initial.error);
  const [space, setSpace] = useState<Space>("personal");
  const [view, setView] = useState<View>("matrix");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("manual");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [settings, setSettings] = useState(false);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Quadrant | null>(null);
  const [importError, setImportError] = useState("");
  const [pendingImport, setPendingImport] = useState<Task[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const scoped = tasks.filter((task) => task.space === space);
  const active = scoped.filter((task) => !task.completed);
  const completed = scoped.filter((task) => task.completed);
  const progress = scoped.length
    ? Math.round((completed.length / scoped.length) * 100)
    : 0;
  const visible = scoped
    .filter(
      (task) =>
        (view === "completed" ? task.completed : !task.completed) &&
        `${task.title} ${task.notes}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "due"
        ? (a.due || "9999").localeCompare(b.due || "9999") ||
          a.createdAt - b.createdAt
        : sort === "title"
          ? a.title.localeCompare(b.title)
          : a.createdAt - b.createdAt,
    );

  function persist(next: Task[]) {
    tasksRef.current = next;
    setTasks(next);
    try {
      localStorage.setItem(STORAGE_KEY, serialize(next));
      setSaveError("");
    } catch {
      setSaveError(
        "Your latest changes are only in memory because browser storage is unavailable or full. Export a backup before leaving this page.",
      );
    }
  }
  useEffect(() => {
    // Seed only a new workspace. Never overwrite data that failed validation.
    if (initial.error) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === null) persist(initial.tasks);
    } catch {
      setSaveError(
        "Browser storage is unavailable. Export a backup before leaving this page.",
      );
    }
  }, [initial]);

  function update(task: Task) {
    persist(tasks.map((t) => (t.id === task.id ? task : t)));
  }
  function newTask(quadrant: Quadrant = "do") {
    setEditor({ quadrant });
  }
  function notify(message: string, undo?: () => void) {
    setToast({ message, undo });
  }
  function move(task: Task, quadrant: Quadrant) {
    if (task.quadrant === quadrant) return;
    update({ ...task, quadrant });
    notify(
      `Moved to ${quadrants.find((q) => q.id === quadrant)?.title.toLowerCase()}.`,
    );
  }
  function complete(task: Task) {
    const next = { ...task, completed: !task.completed };
    update(next);
    notify(
      task.completed
        ? "Task moved back to your matrix."
        : "One less thing on your mind. Nicely done.",
      () => {
        persist(
          tasksRef.current.map((t) =>
            t.id === task.id ? { ...t, completed: task.completed } : t,
          ),
        );
      },
    );
  }
  function remove(task: Task) {
    persist(tasks.filter((t) => t.id !== task.id));
    setEditor(null);
    notify("Task deleted.", () => {
      if (!tasksRef.current.some((t) => t.id === task.id)) {
        persist([...tasksRef.current, task]);
      }
    });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      if (document.activeElement !== undoRef.current) setToast(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function shortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        target.closest("input, textarea, select, button, [contenteditable]") ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        editor ||
        settings ||
        help
      )
        return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        newTask();
      }
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", shortcuts);
    return () => document.removeEventListener("keydown", shortcuts);
  }, [editor, settings, help]);
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([serialize(tasks)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `quadra-backup-${dateOffset()}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Backup exported. Keep it somewhere safe.");
  }
  const cardProps = {
    edit: (task: Task) => setEditor({ task, quadrant: task.quadrant }),
    complete,
    move,
    remove,
    dragging,
    setDragging,
  };
  const date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("matrix");
            setQuery("");
          }}
          aria-label="Quadra home"
        >
          <span className="brand-symbol">
            <i />
            <i />
            <i />
            <i />
          </span>
          quadra<span className="brand-period">.</span>
        </a>
        <div className="sidebar-label">YOUR WORKSPACE</div>
        <nav>
          {(
            [
              { id: "matrix", icon: LayoutGrid },
              { id: "all", icon: ListTodo },
              { id: "completed", icon: CircleCheck },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => {
                setView(item.id);
                setQuery("");
              }}
              aria-label={`${viewLabels[item.id]} (${item.id === "completed" ? completed.length : active.length})`}
              aria-current={view === item.id ? "page" : undefined}
            >
              <item.icon size={18} />
              <span>{viewLabels[item.id]}</span>
              <span className="nav-count">
                {item.id === "completed" ? completed.length : active.length}
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-insight">
          <div className="insight-icon">
            <Sparkles size={18} />
          </div>
          <p>
            Busy isn’t the goal.
            <br />
            <strong>Meaningful is.</strong>
          </p>
          <span>A little intention goes a long way.</span>
        </div>
        <div className="sidebar-bottom">
          <button className="privacy-nav" onClick={() => setSettings(true)}>
            <ShieldCheck size={17} />
            <span>
              Private by design<small>Just you and your browser.</small>
            </span>
          </button>
          <div className="sidebar-footer">
            <span>Less noise. More purpose.</span>
            <button
              className="icon-button"
              aria-label="Help and shortcuts"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <LayoutGrid size={16} />
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{viewLabels[view]}</strong>
          </div>
          <div className="topbar-right">
            <div
              className="space-switch"
              role="group"
              aria-label="Choose workspace"
            >
              <button
                className={space === "personal" ? "selected" : ""}
                onClick={() => {
                  setSpace("personal");
                  setQuery("");
                }}
                aria-pressed={space === "personal"}
              >
                <UserRound size={15} />
                Personal
              </button>
              <button
                className={space === "work" ? "selected" : ""}
                onClick={() => {
                  setSpace("work");
                  setQuery("");
                }}
                aria-pressed={space === "work"}
              >
                <BriefcaseBusiness size={15} />
                Work
              </button>
            </div>
            <span className="header-divider" />
            <button
              className="avatar"
              onClick={() => setSettings(true)}
              aria-label="Workspace settings"
            >
              {space === "personal" ? (
                <UserRound size={19} />
              ) : (
                <BriefcaseBusiness size={19} />
              )}
            </button>
          </div>
        </header>
        <main>
          {saveError && (
            <div className="storage-warning" role="alert">
              <ShieldCheck size={18} />
              <span>{saveError}</span>
              <button onClick={exportBackup}>Export backup</button>
            </div>
          )}
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <Sun size={15} />
                {date}
              </div>
              <h1>
                {view === "matrix"
                  ? "Make time for what matters."
                  : view === "all"
                    ? "A little clarity. All in one place."
                    : "Look at you, making progress."}
              </h1>
              <p>
                {view === "matrix"
                  ? "A clear mind starts with a little perspective. Find yours below."
                  : view === "all"
                    ? "Everything on your mind, with a place and a purpose."
                    : "Every small step counts. Here’s what you’ve made room for."}
              </p>
            </div>
            <button
              className="button primary add-task-button"
              onClick={() => newTask()}
            >
              <Plus size={18} />
              Add task<span className="key-hint">N</span>
            </button>
          </section>
          <section className="summary-bar" aria-label="Workspace summary">
            <div className="summary-context">
              <span className="context-icon">
                {space === "personal" ? (
                  <UserRound size={17} />
                ) : (
                  <BriefcaseBusiness size={17} />
                )}
              </span>
              <strong>
                {space === "personal"
                  ? "A little space for you"
                  : "A little space for your best work"}
              </strong>
              <span className="context-badge">
                {space === "personal" ? "Personal" : "Work"}
              </span>
            </div>
            <div className="summary-stats">
              <span>
                <strong>{active.length}</strong> to do
              </span>
              <span className="stat-divider" />
              <span>
                <CircleCheck size={14} />
                <strong>{completed.length}</strong> done
              </span>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Tasks completed"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>
          <section className="board-toolbar" aria-label="Task controls">
            <div className="view-title">
              <h2>
                {view === "matrix"
                  ? "Your time matrix"
                  : view === "all"
                    ? "Your tasks"
                    : "Completed tasks"}
              </h2>
              <span>
                {view === "matrix"
                  ? "Four quadrants. One clearer day."
                  : `${visible.length} ${visible.length === 1 ? "task" : "tasks"}${query ? " found" : ""}`}
              </span>
            </div>
            <div className="toolbar-actions">
              <div className="search-box">
                <Search size={15} />
                <input
                  ref={searchRef}
                  aria-label="Search tasks"
                  placeholder="Find a task…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query ? (
                  <button
                    className="clear-search"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd>/</kbd>
                )}
              </div>
              <label className="sort-control">
                <ArrowDownUp size={15} />
                <span className="sr-only">Sort tasks</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort tasks"
                >
                  <option value="manual">Added order</option>
                  <option value="due">Due date</option>
                  <option value="title">Task name</option>
                </select>
                <ChevronDown size={13} />
              </label>
            </div>
          </section>
          {view === "matrix" ? (
            <>
              <div className="matrix-axis">
                <span>
                  <span className="axis-dot" />
                  Urgent
                </span>
                <span>
                  <span className="axis-dot" />
                  Not urgent
                </span>
              </div>
              <div className="matrix-grid">
                {quadrants.map((q) => {
                  const Icon = quadrantIcons[q.id];
                  const quadrantTasks = visible.filter(
                    (task) => task.quadrant === q.id,
                  );
                  return (
                    <section
                      key={q.id}
                      className={`quadrant ${q.id} ${dropTarget === q.id ? "drop-target" : ""}`}
                      aria-label={q.title}
                      onDragOver={(e) => {
                        if (dragging) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDropTarget(q.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node))
                          setDropTarget(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/plain");
                        const task = tasks.find(
                          (t) =>
                            t.id === id && t.space === space && !t.completed,
                        );
                        if (task && dragging === id) move(task, q.id);
                        setDragging(null);
                        setDropTarget(null);
                      }}
                    >
                      <header className="quadrant-heading">
                        <div className="quadrant-icon">
                          <Icon size={19} strokeWidth={1.7} />
                        </div>
                        <div className="quadrant-title">
                          <h3>
                            {q.title}
                            <span className="task-count">
                              {quadrantTasks.length}
                            </span>
                          </h3>
                          <p>{q.subtitle}</p>
                        </div>
                        <span className="quadrant-number" aria-hidden="true">
                          {q.number}
                        </span>
                      </header>
                      <p className="quadrant-guidance">{q.guidance}</p>
                      <div className="quadrant-tasks">
                        {quadrantTasks.map((task) => (
                          <TaskCard key={task.id} task={task} {...cardProps} />
                        ))}
                        {!quadrantTasks.length && (
                          <div className="empty-quadrant">
                            <Icon size={23} strokeWidth={1.3} />
                            <span>
                              {query
                                ? "No matching tasks here."
                                : "A little breathing room."}
                            </span>
                            <small>
                              {query
                                ? "Try another search."
                                : "Add a task or drop one here."}
                            </small>
                          </div>
                        )}
                      </div>
                      <button
                        className="quadrant-add"
                        onClick={() => newTask(q.id)}
                      >
                        <Plus size={15} />
                        Add a task
                      </button>
                    </section>
                  );
                })}
              </div>
              <div className="board-footnote">
                <span>
                  <GripVertical size={14} />
                  Use ↑ / ↓ to change priority, or drag between quadrants.
                </span>
                <button onClick={() => setHelp(true)}>
                  How the matrix works
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </>
          ) : (
            <div className="task-list">
              {visible.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  {...cardProps}
                  showQuadrant
                />
              ))}
              {!visible.length && (
                <div className="list-empty">
                  {view === "completed" ? (
                    <CheckCheck size={36} strokeWidth={1.3} />
                  ) : (
                    <Search size={32} strokeWidth={1.3} />
                  )}
                  <h3>
                    {query
                      ? "Nothing by that name."
                      : view === "completed"
                        ? "Good things take one small step."
                        : "A fresh start."}
                  </h3>
                  <p>
                    {query
                      ? "Try a different word or clear your search."
                      : view === "completed"
                        ? "Complete a task and it will find its home here."
                        : "Add your first task and make a little room in your mind."}
                  </p>
                  {query ? (
                    <button
                      className="button secondary"
                      onClick={() => setQuery("")}
                    >
                      Clear search
                    </button>
                  ) : (
                    view !== "completed" && (
                      <button
                        className="button primary"
                        onClick={() => newTask()}
                      >
                        <Plus size={16} />
                        Add a task
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
          <footer className="main-footer">
            <span className="little-logo">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>A little structure. A lot more headspace.</span>
            <span className="local-status">
              <span />
              {saveError ? "Not saved" : "Stored on this device"}
            </span>
          </footer>
        </main>
      </div>
      {editor && (
        <TaskEditor
          key={editor.task?.id ?? "new"}
          editor={editor}
          space={space}
          close={() => setEditor(null)}
          remove={remove}
          save={(task) => {
            const exists = tasks.some((t) => t.id === task.id);
            persist(
              exists
                ? tasks.map((t) => (t.id === task.id ? task : t))
                : [...tasks, task],
            );
            setEditor(null);
            if (task.space !== space)
              notify(`Task saved in your ${task.space} space.`);
            else {
              setQuery("");
              if (view === "completed" && !task.completed) setView("matrix");
              notify(
                exists
                  ? "A little clarity, saved."
                  : "Task added. You’ve got this.",
              );
            }
          }}
        />
      )}
      {help && (
        <Modal
          title="A place for every priority"
          close={() => setHelp(false)}
          wide
        >
          <p className="modal-description">
            The Eisenhower matrix helps you choose what deserves your time. Ask:
            is it important, and is it urgent?
          </p>
          <div className="help-quadrants">
            {quadrants.map((q) => {
              const Icon = quadrantIcons[q.id];
              return (
                <div className={`help-quadrant ${q.id}`} key={q.id}>
                  <Icon size={20} />
                  <h3>{q.title}</h3>
                  <span>{q.subtitle}</span>
                  <p>
                    {q.id === "do"
                      ? "Deadlines, pressing problems, and things that need your attention now."
                      : q.id === "schedule"
                        ? "Your goals, health, learning, and relationships. Put time aside for these."
                        : q.id === "delegate"
                          ? "Time-sensitive things someone else can help with. Moving here helps you plan a handoff; it won’t send or assign the task."
                          : "Distractions and low-value tasks. Keep them here to reconsider, or delete them when you’re ready."}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="help-tip">
            <MoveRight size={18} />
            <p>
              Use a task’s <strong>↑ / ↓</strong> buttons to promote or lower it
              through Do first → Schedule → Delegate → Let go. You can also drag
              it or choose any quadrant from its <strong>•••</strong> menu.
              Click a task’s name to edit. Personal and Work each have their own
              matrix.
            </p>
          </div>
          <div className="shortcut-row">
            <span>
              <kbd>N</kbd> New task
            </span>
            <span>
              <kbd>/</kbd> Search
            </span>
            <span>
              <kbd>esc</kbd> Close dialog
            </span>
          </div>
          <button
            className="button primary full-width"
            onClick={() => setHelp(false)}
          >
            A little clearer
            <Check size={16} />
          </button>
        </Modal>
      )}
      {settings && (
        <Modal
          title="Your space. Just yours."
          close={() => {
            setSettings(false);
            setPendingImport(null);
            setImportError("");
          }}
        >
          <div className="privacy-illustration">
            <LockKeyhole size={30} strokeWidth={1.4} />
          </div>
          <p className="privacy-text">
            Your tasks stay in this browser, on this device. No account, no
            tracking, no cloud sync.
          </p>
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <p>
              Browser storage isn’t a backup. Export your tasks before clearing
              browser data or switching devices. Anyone using this browser
              profile can see them.
            </p>
          </div>
          <div className="backup-actions">
            <button onClick={exportBackup}>
              <Download size={20} />
              <span>
                <strong>Export a backup</strong>
                <small>Save both Personal and Work as a JSON file.</small>
              </span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => fileRef.current?.click()}>
              <Upload size={20} />
              <span>
                <strong>Restore a backup</strong>
                <small>Bring your tasks to this browser.</small>
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
          <input
            hidden
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            aria-label="Import backup"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setImportError("");
              setPendingImport(null);
              if (file.size > 5 * 1024 * 1024) {
                setImportError(
                  "This file is too large. Choose a Quadra backup under 5 MB.",
                );
                return;
              }
              try {
                setPendingImport(parseBackup(await file.text()));
              } catch {
                setImportError(
                  "This file isn’t a valid Quadra backup. Your current tasks haven’t changed.",
                );
              }
            }}
          />
          {importError && (
            <p className="import-error" role="alert">
              {importError}
            </p>
          )}
          {pendingImport && (
            <div className="import-confirm">
              <strong>Restore {pendingImport.length} tasks?</strong>
              <p>
                This replaces all current tasks in both spaces. Export a backup
                first if you want to keep them.
              </p>
              <div>
                <button
                  className="button secondary"
                  onClick={() => setPendingImport(null)}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    persist(pendingImport);
                    setPendingImport(null);
                    setSettings(false);
                    setQuery("");
                    notify("Backup restored. Welcome back.");
                  }}
                >
                  Replace and restore
                </button>
              </div>
            </div>
          )}
          <p className="settings-signoff">
            Built for a calmer kind of productivity.
          </p>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span className="toast-check">
            <Check size={14} />
          </span>
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              ref={undoRef}
              className="undo-button"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
          <button
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
