import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addDays, addMonths, monthDays } from "../src/calendar";

// A fixed local day keeps month boundaries and the example due dates deterministic.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-21T12:00:00"));
  await page.goto("/");
});

test("Work is the default on opening and reload, while Personal stays available", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Work", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", {
      name: "Send the project proposal",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Add task/ }).click();
  await expect(page.getByLabel("Space", { exact: true })).toHaveValue("work");
  await page.getByLabel("Task name").fill("Default work task");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add task", exact: true })
    .click();
  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Default work task", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Book your annual checkup", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Work", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Default work task", exact: true }),
  ).toBeVisible();
});

test("calendar creates on the selected day, follows a date edit, and shares completion with the matrix", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^Calendar/ }).click();
  await page.locator("#calendar-day-2026-10-23").click();
  await page
    .getByRole("button", { name: "Add task for this day", exact: true })
    .click();
  await expect(page.getByLabel("Due date optional")).toHaveValue("2026-10-23");
  await expect(page.getByRole("radio", { name: /Schedule/ })).toBeChecked();
  await expect(page.getByLabel("Space", { exact: true })).toHaveValue("work");
  await page.getByLabel("Task name").fill("Plan launch day");
  await page.getByLabel("Notes optional").fill("Keep the launch small.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add task", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Selected day tasks" })
      .getByRole("button", { name: "Plan launch day", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Plan launch day", exact: true })
    .click();
  await page.getByLabel("Due date optional").fill("2026-11-05");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "November 2026", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("#calendar-day-2026-11-05").locator(".."),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("region", { name: "Selected day tasks" }).getByText("Notes"),
  ).toBeVisible();
  await page.getByRole("button", { name: /^My matrix/ }).click();
  await expect(
    page
      .getByRole("region", { name: "Schedule", exact: true })
      .getByRole("button", { name: "Plan launch day", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Calendar/ }).click();
  await page
    .getByRole("button", { name: "Complete Plan launch day", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit Plan launch day", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Plan launch day", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /^Calendar/ }).click();
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await page.locator("#calendar-day-2026-11-05").click();
  await expect(
    page
      .getByRole("region", { name: "Selected day tasks" })
      .getByRole("button", { name: "Plan launch day", exact: true }),
  ).toBeVisible();
});

test("month controls, keyboard navigation, and Today work across month and year boundaries", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^Calendar/ }).click();
  await expect(page.getByRole("gridcell")).toHaveCount(42);
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "September 2026", exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "January 2027", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "October 2026", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#calendar-day-2026-10-21")).toHaveAttribute(
    "aria-current",
    "date",
  );
  await page.locator("#calendar-day-2026-10-31").click();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "November 2026", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#calendar-day-2026-11-01")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("#calendar-day-2026-10-25")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator("#calendar-day-2026-10-19")).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator("#calendar-day-2026-10-25")).toBeFocused();
});

test("calendar search, undated scheduling, workspace separation, and direct deletion work together", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^Calendar/ }).click();
  await expect(
    page
      .getByRole("region", { name: "Selected day tasks" })
      .getByRole("button", { name: "Send the project proposal", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".calendar-unscheduled")
      .getByRole("button", { name: "Learn something new", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Search tasks", { exact: true })
    .fill("Learn something");
  await expect(page.locator("article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Learn something new", exact: true })
    .click();
  await page.getByLabel("Due date optional").fill("2026-10-22");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page
      .locator(".calendar-unscheduled")
      .getByRole("button", { name: "Learn something new", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("region", { name: "Selected day tasks" })
      .getByRole("button", { name: "Learn something new", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Learn something new", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Work", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Learn something new", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit Learn something new", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Learn something new", exact: true }),
  ).toBeVisible();
});

test("calendar is accessible on desktop and usable without overflow on a narrow phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /^Calendar/ }).click();
  async function checkAccessibility() {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
  await checkAccessibility();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await checkAccessibility();
  await page.locator("#calendar-day-2026-10-22").click();
  await expect(
    page
      .getByRole("region", { name: "Selected day tasks" })
      .getByRole("button", { name: "Hand off the weekly report", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /^Add task/ })
    .first()
    .click();
  await expect(page.getByLabel("Due date optional")).toHaveValue("2026-10-22");
  await page.keyboard.press("Escape");
});

test("local date helpers include leap days and cross year boundaries correctly", () => {
  expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(addMonths("2026-12-31", 1)).toBe("2027-01-01");
  expect(addMonths("2027-01-31", -1)).toBe("2026-12-01");
  const days = monthDays("2028-02-01");
  expect(days).toHaveLength(42);
  expect(days.filter((day) => day.startsWith("2028-02"))).toHaveLength(29);
  expect(days).toContain("2028-02-29");
});
