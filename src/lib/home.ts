export type MixCoverData = {
  type: "mix";
  barColor: string;
  bgImageUrl: string | null;
  label: string;
};

export type RadioCoverData = {
  type: "radio";
  barColor: string;
  artistName: string;
  avatarUrls: string[];
};

export type HomeCard = {
  id: string;
  kind: "quick" | "release" | "artist" | "playlist" | "mix" | "radio";
  title: string;
  subtitle: string;
  href: string;
  imageUrl?: string | null;
  shape: "square" | "circle" | "wide";
  cover?: MixCoverData | RadioCoverData;
  trackIds?: string[];
};

export type HomeSection = {
  id: string;
  title: string;
  subtitle?: string;
  showAllHref?: string;
  layout: "quick" | "shelf";
  items: HomeCard[];
};

export type HomeFeed = {
  greeting: string;
  sections: HomeSection[];
};

export type MixPageData = {
  id: string;
  title: string;
  subtitle: string;
  cover: MixCoverData | RadioCoverData;
  coverImageUrl?: string | null;
  trackIds: string[];
  tracks: import("@/lib/types").Track[];
};
