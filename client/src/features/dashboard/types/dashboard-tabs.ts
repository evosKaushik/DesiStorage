export type DashboardTab =
  | "home"
  | "my-drive"
  | "shared"
  | "recent"
  | "starred"
  | "links"
  | "trash";

export const VALID_TABS = new Set<DashboardTab>([
  "home",
  "my-drive",
  "shared",
  "recent",
  "starred",
  "links",
  "trash",
]);

export const isDashboardTab = (value: string | null): value is DashboardTab =>
  value !== null && VALID_TABS.has(value as DashboardTab);