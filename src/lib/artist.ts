export function artistImageUrl(artist: {
  avatarUrl?: string | null;
  imageUrl?: string | null;
}): string | null {
  return artist.imageUrl ?? artist.avatarUrl ?? null;
}
