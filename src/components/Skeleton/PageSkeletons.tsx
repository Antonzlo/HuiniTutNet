import { Skeleton } from "./Skeleton";
import ps from "./PageSkeletons.module.scss";

type TrackListProps = {
  rows?: number;
  variant?: "playlist" | "artist" | "default";
};

export function TrackListSkeleton({ rows = 8, variant = "playlist" }: TrackListProps) {
  const compact = variant === "playlist" || variant === "artist";
  return (
    <div className={ps.trackList} aria-busy="true" aria-label="Загрузка треков">
      <Skeleton className={ps.trackHead} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={ps.trackRow}>
          <Skeleton className={ps.trackIndex} style={{ animationDelay: `${i * 0.05}s` }} />
          {compact && <Skeleton className={ps.trackCover} style={{ animationDelay: `${i * 0.05}s` }} />}
          <div className={ps.trackBody}>
            <Skeleton className={ps.trackTitle} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton className={ps.trackSub} style={{ animationDelay: `${i * 0.05 + 0.03}s` }} />
          </div>
          <Skeleton className={ps.trackTail} style={{ animationDelay: `${i * 0.05}s` }} />
        </div>
      ))}
    </div>
  );
}

type CollectionProps = {
  variant?: "artist" | "square";
  trackRows?: number;
};

export function CollectionPageSkeleton({ variant = "square", trackRows = 8 }: CollectionProps) {
  const isArtist = variant === "artist";
  return (
    <div className={ps.collectionPage} aria-busy="true" aria-label="Загрузка страницы">
      <div className={`${ps.collectionHero} ${isArtist ? ps.collectionHeroArtist : ""}`}>
        <Skeleton
          className={`${ps.collectionCover} ${isArtist ? "" : ps.collectionCoverSquare}`}
          round={isArtist}
        />
        <div className={ps.collectionMeta}>
          <Skeleton style={{ width: 72, height: 14 }} pill />
          <Skeleton style={{ width: "min(420px, 70%)", height: isArtist ? 56 : 44 }} />
          <Skeleton style={{ width: 180, height: 14 }} />
        </div>
      </div>
      <div className={ps.collectionToolbar}>
        <Skeleton round style={{ width: 56, height: 56 }} />
        <Skeleton round style={{ width: 36, height: 36 }} />
        {isArtist && <Skeleton pill style={{ width: 140, height: 36, marginLeft: "auto" }} />}
      </div>
      {isArtist ? (
        <>
          <div className={ps.artistMain}>
            <div>
              <Skeleton className={ps.shelfTitle} style={{ width: 200, height: 28, marginBottom: 12 }} />
              <TrackListSkeleton rows={5} variant="playlist" />
            </div>
            <div className={ps.artistSidebar}>
              <Skeleton className={ps.sidebarCard} />
              <Skeleton className={ps.sidebarCard} style={{ height: 96 }} />
            </div>
          </div>
          <ArtistShelfSkeleton />
        </>
      ) : (
        <TrackListSkeleton rows={trackRows} variant="playlist" />
      )}
    </div>
  );
}

function ArtistShelfSkeleton() {
  return (
    <div className={ps.shelfSection}>
      <Skeleton className={ps.shelfTitle} style={{ width: 120, height: 28 }} />
      <div className={ps.shelfRow}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={ps.shelfCard}>
            <Skeleton className={ps.shelfCover} style={{ animationDelay: `${i * 0.06}s` }} />
            <Skeleton style={{ width: "90%", height: 14, animationDelay: `${i * 0.06}s` }} />
            <Skeleton style={{ width: "70%", height: 12, animationDelay: `${i * 0.06}s` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className={ps.home} aria-busy="true" aria-label="Загрузка главной">
      <Skeleton className={ps.homeGreeting} />
      <div className={ps.homeQuick}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className={ps.homeQuickCard} style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, s) => (
        <div key={s}>
          <Skeleton className={ps.homeShelfHead} style={{ animationDelay: `${s * 0.1}s` }} />
          <div className={ps.homeShelfItems}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={ps.homeShelfItem}>
                <Skeleton
                  className={ps.shelfCover}
                  style={{ animationDelay: `${s * 0.1 + i * 0.05}s` }}
                />
                <Skeleton
                  style={{ width: "100%", height: 14, marginTop: 10, animationDelay: `${i * 0.05}s` }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WhatsNewSkeleton() {
  return (
    <div className={ps.whatsNew} aria-busy="true" aria-label="Загрузка ленты">
      <div className={ps.whatsNewHero}>
        <Skeleton className={ps.whatsNewTitle} />
        <Skeleton className={ps.whatsNewDesc} />
      </div>
      {Array.from({ length: 2 }, (_, s) => (
        <div key={s} className={ps.whatsNewSection}>
          <Skeleton className={ps.whatsNewSectionTitle} />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={ps.libraryRow}>
              <Skeleton className={ps.libraryCover} style={{ animationDelay: `${i * 0.05}s` }} />
              <div className={ps.libraryText}>
                <Skeleton style={{ width: "70%", height: 16, animationDelay: `${i * 0.05}s` }} />
                <Skeleton style={{ width: "45%", height: 12, animationDelay: `${i * 0.05}s` }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function LibraryListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={ps.libraryList} aria-busy="true" aria-label="Загрузка медиатеки">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={ps.libraryRow}>
          <Skeleton className={ps.libraryCover} style={{ animationDelay: `${i * 0.04}s` }} />
          <div className={ps.libraryText}>
            <Skeleton style={{ width: "65%", height: 15, animationDelay: `${i * 0.04}s` }} />
            <Skeleton style={{ width: "40%", height: 12, animationDelay: `${i * 0.04}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className={ps.formPage} aria-busy="true" aria-label="Загрузка формы">
      <div className={ps.formHero}>
        <Skeleton style={{ width: 280, height: 36 }} />
        <Skeleton style={{ width: 200, height: 16 }} />
      </div>
      <Skeleton className={ps.formCard} />
    </div>
  );
}

export function ListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={ps.listPage} aria-busy="true" aria-label="Загрузка списка">
      <div className={ps.listHero}>
        <Skeleton style={{ width: 200, height: 36 }} />
        <Skeleton style={{ width: 320, height: 16 }} />
      </div>
      <Skeleton className={ps.formCard} style={{ height: 160, marginBottom: 24 }} />
      <div className={ps.listRows}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={ps.listRow}>
            <Skeleton className={`${ps.listAvatar} ${ps.libraryCover}`} round />
            <div className={ps.libraryText}>
              <Skeleton style={{ width: "50%", height: 16, animationDelay: `${i * 0.05}s` }} />
              <Skeleton style={{ width: "35%", height: 12, animationDelay: `${i * 0.05}s` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthGateSkeleton() {
  return (
    <div className={ps.authGate} aria-busy="true" aria-label="Загрузка приложения">
      <Skeleton round style={{ width: 64, height: 64 }} />
      <div className={ps.authBlocks}>
        <Skeleton style={{ width: "100%", height: 18 }} />
        <Skeleton style={{ width: "70%", height: 14 }} />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Поиск">
      <Skeleton style={{ width: 240, height: 32, marginBottom: 20 }} />
      <TrackListSkeleton rows={10} />
    </div>
  );
}

export function RedirectSkeleton() {
  return (
    <div className={ps.redirect} aria-busy="true" aria-label="Перенаправление">
      <Skeleton style={{ width: "80%", height: 20, marginBottom: 12 }} />
      <Skeleton style={{ width: "55%", height: 14 }} />
    </div>
  );
}
