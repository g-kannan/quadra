# Quadra

Time management, made simple and private. A responsive Eisenhower matrix for your personal life and work.

- Move tasks between **Do first**, **Schedule**, **Delegate**, and **Let go** by dragging or using a task’s **•••** menu.
- Keep separate **Personal** and **Work** spaces. Change a task’s space in its editor.
- Add tasks with notes and optional due dates; search titles and notes or sort by date/name.
- Complete tasks, review completed tasks, reopen them, and undo completion or deletion.
- Export and restore both spaces from **Workspace settings** (the profile icon). Restoring asks before replacing existing tasks.
- Keyboard shortcuts: **N** to add, **/** to search, **Esc** to close dialogs. All task actions are also available by keyboard and touch.

A few editable example tasks are included on the first visit. **Delegate** is a planning category; it does not send or assign tasks to someone else. Due dates are organizational labels, not reminders or notifications.

## Develop

Requires Node.js **22.12+** (Node **24** recommended) and npm. No API keys, accounts, database, or backend services are required.

```sh
npm ci
npm run dev
```

In a cloud sandbox whose home directory is read-only, use a writable npm cache:

```sh
npm ci --cache /workspace/.npm-cache
```

```sh
npm run build        # TypeScript check and production build in dist/
npm run preview      # Serve the production build locally
npm run format:check # Check source formatting
```

Deploy `dist/` to any static web host after building. Assets and fonts are bundled locally; the app does not use external font services or analytics.

## Browser tests

Tests cover task creation/editing, moving, workspace separation, saving across reloads, completion/undo, search/sorting, backup restoration, storage errors, responsive layout, and accessibility.

```sh
npx playwright install chromium
npm test
```

If Chromium is already installed, use it without downloading another browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Playwright starts a development server automatically if needed. Tests use isolated browser storage and do not change your actual tasks.

## Data and privacy

Tasks are stored as a versioned JSON document in this browser’s `localStorage` under `quadra.tasks.v1`. Both spaces are included in exports. No task content is sent to a server. There is no account, cloud synchronization, or cross-device storage.

Data is specific to the browser profile and site origin. Clearing site data removes tasks. Private browsing may discard them when the window closes. Anyone with access to the same browser profile can view them. Keep exported backups when switching devices or clearing browser data; browser storage is not encrypted or a backup service. If saving fails, a visible message explains that changes are only in memory and offers export.
