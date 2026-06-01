export function fundChangeLabel(changeType: string | null): string {
  if (!changeType) return "";
  const map: Record<string, string> = {
    new: "New",
    add: "Added",
    reduce: "Reduced",
    sell: "Sold",
    unchanged: "Unchanged",
  };
  return map[changeType] ?? changeType;
}

export function fundChangeBadgeClass(changeType: string | null): string {
  if (!changeType) return "fund-change-badge";
  return `fund-change-badge fund-change-badge--${changeType}`;
}
