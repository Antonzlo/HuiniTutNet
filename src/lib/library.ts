export type LibraryItemType = "playlist" | "album" | "artist";
export type LibraryFilter = "all" | "playlist" | "album" | "artist";
export type LibrarySort = "recent" | "added" | "name" | "creator";
export type LibraryView = "list" | "compact" | "grid" | "grid-lg";

export type LibraryItem = {
  id: string;
  type: LibraryItemType;
  title: string;
  subtitle: string;
  href: string;
  imageUrl?: string | null;
  addedAt: string;
  round: boolean;
  liked?: boolean;
  pinned?: boolean;
  sortKey: string;
  creatorKey: string;
};

export function mapLibraryDto(
  rows: Array<{
    id: string;
    type: LibraryItemType;
    title: string;
    subtitle: string;
    href: string;
    imageUrl: string | null;
    addedAt: string;
    pinned?: boolean;
  }>
): LibraryItem[] {
  return rows.map((r) => ({
    ...r,
    round: r.type === "artist",
    liked: r.id === "favorites",
    sortKey: r.title.toLowerCase(),
    creatorKey: r.subtitle.split("•").pop()?.trim().toLowerCase() ?? "",
  }));
}

export function filterLibraryItems(items: LibraryItem[], filter: LibraryFilter): LibraryItem[] {
  if (filter === "all") return items;
  if (filter === "playlist") return items.filter((i) => i.type === "playlist");
  if (filter === "album") return items.filter((i) => i.type === "album");
  return items.filter((i) => i.type === "artist");
}

export function searchLibraryItems(items: LibraryItem[], q: string): LibraryItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (i) => i.title.toLowerCase().includes(needle) || i.subtitle.toLowerCase().includes(needle)
  );
}

export function sortLibraryItems(items: LibraryItem[], sort: LibrarySort): LibraryItem[] {
  const pinned = items.filter((i) => i.pinned);
  const rest = items.filter((i) => !i.pinned);
  const list = [...rest];
  const cmp = (a: LibraryItem, b: LibraryItem) => {
    if (sort === "name") return a.sortKey.localeCompare(b.sortKey, "ru");
    if (sort === "creator") return a.creatorKey.localeCompare(b.creatorKey, "ru");
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  };
  list.sort(cmp);
  return [...pinned, ...list];
}

export function fmtAddedAt(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин. назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ${h === 1 ? "час" : h < 5 ? "часа" : "часов"} назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? "день" : d < 5 ? "дня" : "дней"} назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function isLibraryItemActive(item: LibraryItem, pathname: string): boolean {
  return pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
}

export function isLibraryItemPlaying(item: LibraryItem, queueContextId: string | null): boolean {
  return queueContextId === `library:${item.id}`;
}

export const SORT_LABELS: Record<LibrarySort, string> = {
  recent: "Недавние",
  added: "По дате добавления",
  name: "По алфавиту",
  creator: "Автор",
};
