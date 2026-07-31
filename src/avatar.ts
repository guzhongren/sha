export function avatarInitial(siteName: string, authorName: string) {
  return [...(siteName.trim() || authorName.trim() || "B")][0]?.toUpperCase() ?? "B";
}

export function avatarIconDataUri(initial: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#111827"/><text x="48" y="58" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="42" font-weight="700" fill="#e5e7eb">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
