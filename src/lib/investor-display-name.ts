export function investorDisplayName(name: string, sheetName: string): string {
  const dash = name.indexOf(" – ");
  if (dash > 0) return name.slice(0, dash).trim();
  return sheetName.trim() || name;
}
