"use client";

import { useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { mediaUrl } from "@/lib/api";
import { fmtDuration } from "@/lib/track";
import type { Track } from "@/lib/types";
import { TrackTitleLink } from "@/components/TrackTitleLink";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import queueStyles from "@/components/PlayerBar/PlayerQueue.module.scss";

function QueueRow({
  track,
  index,
  active,
  playing,
  catalog,
  onPlay,
}: {
  track: Track;
  index: number | null;
  active: boolean;
  playing: boolean;
  catalog: Track[];
  onPlay: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`${queueStyles.row} ${active ? queueStyles.rowActive : ""}`}
        onClick={onPlay}
      >
        <span className={queueStyles.index}>
          {active && playing ? (
            <span className={queueStyles.eq} aria-hidden>
              <span />
              <span />
              <span />
            </span>
          ) : index !== null ? (
            index
          ) : (
            ""
          )}
        </span>
        <div className={queueStyles.cover}>
          {track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(track.coverUrl)} alt="" />
          )}
        </div>
        <div className={queueStyles.meta}>
          <TrackTitleLink track={track} catalog={catalog} className={queueStyles.trackTitle} />
          <TrackArtistLinks track={track} className={queueStyles.artists} />
        </div>
        <span className={queueStyles.dur}>{fmtDuration(track.durationSec)}</span>
      </button>
    </li>
  );
}

export function QueueContent() {
  const { queue, currentTrack, playFromQueue, isPlaying, radioFromIndex } = usePlayer();

  const musicQueue = useMemo(() => queue.filter((t) => !t.isAd), [queue]);

  const { nowPlaying, nextUser, nextRadio } = useMemo(() => {
    const curIdx = currentTrack
      ? musicQueue.findIndex((t) => t.id === currentTrack.id)
      : -1;
    const radioStart = radioFromIndex ?? musicQueue.length;
    const upcoming = curIdx >= 0 ? musicQueue.slice(curIdx + 1) : musicQueue;

    const userUpcoming: Track[] = [];
    const radioUpcoming: Track[] = [];
    for (let i = 0; i < upcoming.length; i++) {
      const globalIdx = curIdx >= 0 ? curIdx + 1 + i : i;
      if (globalIdx >= radioStart) radioUpcoming.push(upcoming[i]!);
      else userUpcoming.push(upcoming[i]!);
    }

    return {
      nowPlaying: curIdx >= 0 ? musicQueue[curIdx]! : null,
      nextUser: userUpcoming,
      nextRadio: radioUpcoming,
    };
  }, [musicQueue, currentTrack, radioFromIndex]);

  if (musicQueue.length === 0) {
    return <p className={queueStyles.empty}>Очередь пуста</p>;
  }

  return (
    <div className={queueStyles.body}>
      {nowPlaying && (
        <section className={queueStyles.section}>
          <h3 className={queueStyles.sectionTitle}>Сейчас играет</h3>
          <ul className={queueStyles.list}>
            <QueueRow
              track={nowPlaying}
              index={null}
              active
              playing={isPlaying}
              catalog={musicQueue}
              onPlay={() => playFromQueue(nowPlaying.id)}
            />
          </ul>
        </section>
      )}

      {nextUser.length > 0 && (
        <section className={queueStyles.section}>
          <h3 className={queueStyles.sectionTitle}>Далее</h3>
          <ul className={queueStyles.list}>
            {nextUser.map((track, i) => (
              <QueueRow
                key={track.id}
                track={track}
                index={i + 1}
                active={currentTrack?.id === track.id}
                playing={currentTrack?.id === track.id && isPlaying}
                catalog={musicQueue}
                onPlay={() => playFromQueue(track.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {(nextRadio.length > 0 ||
        radioFromIndex !== null ||
        (nowPlaying && nextUser.length === 0)) && (
        <section className={queueStyles.section}>
          <h3 className={queueStyles.sectionTitle}>Рекомендации</h3>
          {nextRadio.length === 0 ? (
            <p className={queueStyles.hint}>Подбираем похожие треки…</p>
          ) : (
            <ul className={queueStyles.list}>
              {nextRadio.map((track, i) => (
                <QueueRow
                  key={track.id}
                  track={track}
                  index={nextUser.length + i + 1}
                  active={currentTrack?.id === track.id}
                  playing={currentTrack?.id === track.id && isPlaying}
                  catalog={musicQueue}
                  onPlay={() => playFromQueue(track.id)}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
