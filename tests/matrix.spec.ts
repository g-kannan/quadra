import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

async function addTask(
  page: Page,
  title: string,
  quadrant = "Do first",
  space = "Personal",
) {
  await page.getByRole("button", { name: /^Add task/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Task name").fill(title);
  await dialog.getByRole("radio", { name: new RegExp(quadrant) }).check();
  await dialog
    .getByLabel("Space", { exact: true })
    .selectOption(space.toLowerCase());
  await dialog.getByRole("button", { name: "Add task" }).click();
  await expect(dialog).not.toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("create, edit, move, persist, complete, undo, and delete a task", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await addTask(page, "Write a thoughtful plan", "Schedule");
  const schedule = page.getByRole("region", { name: "Schedule", exact: true });
  await expect(
    schedule.getByRole("button", {
      name: "Write a thoughtful plan",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Write a thoughtful plan", exact: true })
    .click();
  await page.getByLabel("Notes optional").fill("Make the next step clear.");
  await page.getByLabel("Due date optional").fill("2027-01-15");
  await page.getByRole("button", { name: "Save changes" }).click();
  const card = page.locator("article").filter({
    has: page.getByRole("button", {
      name: "Write a thoughtful plan",
      exact: true,
    }),
  });
  await expect(card.getByText("Notes")).toBeVisible();
  await card
    .getByRole("button", { name: "Options for Write a thoughtful plan" })
    .click();
  await card.getByRole("button", { name: "Do first", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Do first", exact: true })
      .getByRole("button", { name: "Write a thoughtful plan", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Write a thoughtful plan", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Complete Write a thoughtful plan",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Write a thoughtful plan", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Write a thoughtful plan", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Complete Write a thoughtful plan",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /^Completed/ }).click();
  await expect(
    page.getByRole("button", { name: "Write a thoughtful plan", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Reopen Write a thoughtful plan",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /^My matrix/ }).click();
  await page
    .getByRole("button", { name: "Write a thoughtful plan", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Write a thoughtful plan", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Write a thoughtful plan", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("personal and work stay separate, including creation and reassignment", async ({
  page,
}) => {
  await addTask(page, "Private garden plans", "Let go");
  await page.getByRole("button", { name: "Work", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Private garden plans", exact: true }),
  ).toHaveCount(0);
  await addTask(page, "Team roadmap", "Schedule", "Work");
  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Team roadmap", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Private garden plans", exact: true })
    .click();
  await page.getByLabel("Space", { exact: true }).selectOption("work");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("button", { name: "Private garden plans", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Work", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Private garden plans", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Work", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Team roadmap", exact: true }),
  ).toBeVisible();
});

test("drag and drop moves the task between quadrants", async ({ page }) => {
  const task = page.getByRole("button", {
    name: "Renew car insurance",
    exact: true,
  });
  // Drop on the visible header so Playwright does not scroll before the drag gesture starts.
  await task.dragTo(
    page
      .getByRole("region", { name: "Schedule", exact: true })
      .locator(".quadrant-heading"),
  );
  await expect(
    page
      .getByRole("region", { name: "Schedule", exact: true })
      .getByRole("button", { name: "Renew car insurance", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Schedule", exact: true })
      .getByRole("button", { name: "Renew car insurance", exact: true }),
  ).toBeVisible();
});

test("search covers notes, list sorting works, and keyboard shortcuts open the editor", async ({
  page,
}) => {
  await page.keyboard.press("n");
  await page.getByLabel("Task name").fill("Zebra task");
  await page.getByLabel("Notes optional").fill("Unique search phrase");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add task" })
    .click();
  await page.getByRole("button", { name: /^All tasks/ }).click();
  await page
    .getByLabel("Search tasks", { exact: true })
    .fill("Unique search phrase");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Zebra task", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByLabel("Sort tasks", { exact: true }).selectOption("title");
  await expect(page.locator("article").first()).toContainText(
    "Book your annual checkup",
  );
  await expect(page.locator("article").last()).toContainText("Zebra task");
  await page.getByLabel("Search tasks", { exact: true }).fill("does not exist");
  await expect(page.getByText("Nothing by that name.")).toBeVisible();
});

test("backup export, invalid import, confirmation, and restoration", async ({
  page,
}) => {
  await addTask(page, "Keep this task");
  await page.getByRole("button", { name: "Workspace settings" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export a backup/ }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  await page.getByLabel("Import backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"tasks":[{"bad":true}]}'),
  });
  await expect(page.getByRole("alert")).toContainText(
    "isn’t a valid Quadra backup",
  );
  await page.getByLabel("Import backup").setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"tasks":[]}'),
  });
  await expect(page.getByText("Restore 0 tasks?")).toBeVisible();
  await page.getByRole("button", { name: "Replace and restore" }).click();
  await expect(page.locator("article")).toHaveCount(0);
  await page.getByRole("button", { name: "Workspace settings" }).click();
  await page.getByLabel("Import backup").setInputFiles(backupPath!);
  await page.getByRole("button", { name: "Replace and restore" }).click();
  await expect(
    page.getByRole("button", { name: "Keep this task", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Keep this task", exact: true }),
  ).toBeVisible();
});

test("mobile layout has no overflow and supports the move menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Make time for what matters." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Options for Book your annual checkup" })
    .click();
  await page
    .locator(".task-menu")
    .getByRole("button", { name: "Let go", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Let go", exact: true })
      .getByRole("button", { name: "Book your annual checkup", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Add task/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("storage failure is visible and exporting remains available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage full", "QuotaExceededError");
    };
  });
  await page.reload();
  await addTask(page, "Unsaved task");
  await expect(page.getByRole("alert")).toContainText("only in memory");
  await expect(
    page.getByRole("button", { name: "Unsaved task", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export backup", exact: true }),
  ).toBeVisible();
});

test("board, dialogs, and mobile pass automated accessibility checks", async ({
  page,
}) => {
  async function check() {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
  await check();
  await page.getByRole("button", { name: /^Add task/ }).click();
  await check();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Workspace settings" }).click();
  await check();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await check();
  await page.getByRole("button", { name: "Workspace settings" }).click();
  await expect(
    page.getByRole("button", { name: /Export a backup/ }),
  ).toBeVisible();
  await check();
});
