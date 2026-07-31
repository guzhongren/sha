export function avatarInitial(siteName: string, authorName: string) {
  return [...(siteName.trim() || authorName.trim() || "B")][0]?.toUpperCase() ?? "B";
}
