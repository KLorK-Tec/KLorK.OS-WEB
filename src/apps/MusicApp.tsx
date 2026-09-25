import { useEffect, useRef, useState } from "react";
import {
  Heart,
  Music,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { defineApp } from "../os/AppRegistry";
import type { KlorkAppProps } from "../types/os";
import { cn } from "../utils/cn";

interface Track {
  id: number;
  name: string;
  artist: string;
  duration: number;
  genre: string;
}

const TRACKS: Track[] = [
  { id: 1, name: "Midnight Drive", artist: "Neon Horizon", duration: 215, genre: "Synthwave" },
  { id: 2, name: "Digital Rain", artist: "Circuit Breaker", duration: 183, genre: "Electronica" },
  { id: 3, name: "Chrome Sunset", artist: "Velvet Wire", duration: 242, genre: "Ambient" },
  { id: 4, name: "Static Bloom", artist: "Grid Echo", duration: 197, genre: "IDM" },
  { id: 5, name: "Neon Tides", artist: "Phantom Circuit", duration: 226, genre: "Synthwave" },
  { id: 6, name: "Pulse Width", artist: "Data Stream", duration: 178, genre: "Techno" },
  { id: 7, name: "Ghost Frequency", artist: "Void Sync", duration: 204, genre: "Darkwave" },
  { id: 8, name: "Binary Star", artist: "Hex Dreams", duration: 231, genre: "Ambient" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicApp({ api }: KlorkAppProps) {
  const accent = api.theme.current.accent;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(72);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shuffleRef = useRef(shuffle);
  const currentIndexRef = useRef(currentIndex);

  shuffleRef.current = shuffle;
  currentIndexRef.current = currentIndex;

  const track = TRACKS[currentIndex];
  const progress = track.duration > 0 ? (currentTime / track.duration) * 100 : 0;

  const handleNext = () => {
    setIsPlaying(true);
    setCurrentTime(0);
    if (shuffleRef.current) {
      let next = Math.floor(Math.random() * TRACKS.length);
      while (next === currentIndexRef.current)
        next = Math.floor(Math.random() * TRACKS.length);
      setCurrentIndex(next);
    } else {
      setCurrentIndex((i) => (i >= TRACKS.length - 1 ? 0 : i + 1));
    }
  };

  const handlePlayPause = () => setIsPlaying((p) => !p);

  const handlePrev = () => {
    setIsPlaying(true);
    setCurrentTime(0);
    setCurrentIndex((i) => (i <= 0 ? TRACKS.length - 1 : i - 1));
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= track.duration - 1) {
            if (repeat) {
              setCurrentTime(0);
              return 0;
            }
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentIndex, repeat]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.floor(pct * track.duration));
  };

  const handleTrackClick = (index: number) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    api.windows.notify("Klork Music", `Now playing: ${track.name} — ${track.artist}`);
  }, [currentIndex]);

  return (
    <div className="flex h-full flex-col bg-black/40">
      <div className="flex flex-1 overflow-hidden">
        {/* playlist */}
        <div className="flex w-[44%] flex-col border-r border-white/[0.05] bg-white/[0.015]">
          <div className="px-3.5 pt-3 pb-2">
            <p className="font-mono text-[9px] tracking-[0.18em] text-white/25 uppercase">
              playlist
            </p>
            <p className="mt-0.5 font-mono text-[9.5px] text-white/35">
              {TRACKS.length} tracks · {formatTime(TRACKS.reduce((a, t) => a + t.duration, 0))}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {TRACKS.map((t, i) => {
              const isActive = i === currentIndex;
              const isLiked = liked.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => handleTrackClick(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors",
                    isActive
                      ? "bg-white/[0.06]"
                      : "hover:bg-white/[0.02]"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-md text-[9px] font-mono",
                      isActive
                        ? "text-white/80"
                        : "text-white/20"
                    )}
                    style={
                      isActive
                        ? { background: `${accent}18`, color: accent }
                        : undefined
                    }
                  >
                    {isActive && isPlaying ? (
                      <Music className="h-3.5 w-3.5 animate-pulse" />
                    ) : (
                      (i + 1).toString().padStart(2, "0")
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-[11.5px]",
                        isActive ? "font-medium text-white/90" : "text-white/60"
                      )}
                    >
                      {t.name}
                    </p>
                    <p className="truncate text-[9.5px] text-white/30">{t.artist}</p>
                  </div>
                  <span className="text-[9.5px] text-white/20">{formatTime(t.duration)}</span>
                  <Heart
                    className={cn(
                      "h-3 w-3 shrink-0 transition-colors",
                      isLiked ? "fill-rose-500/60 text-rose-500" : "text-white/10"
                    )}
                    onClick={(e) => toggleLike(e, t.id)}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* now playing */}
        <div className="flex flex-1 flex-col p-5">
          {/* album art */}
          <div className="flex items-center gap-4">
            <div
              className="relative grid h-[88px] w-[88px] shrink-0 place-items-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${accent}40, ${accent}10, #0a0a0f)`,
                boxShadow: `0 4px 24px ${accent}15`,
              }}
            >
              <Music className="h-8 w-8 text-white/30" strokeWidth={1.2} />
              {isPlaying && (
                <div
                  className="absolute bottom-1 right-1 grid h-2 w-2 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-[15px] font-semibold text-white">
                {track.name}
              </h2>
              <p className="truncate text-[12px] text-white/45">{track.artist}</p>
              <p className="mt-0.5 font-mono text-[9.5px] text-white/20">{track.genre}</p>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-4">
            <div
              className="group relative h-[4px] cursor-pointer overflow-hidden rounded-full bg-white/[0.07]"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: accent,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9.5px] text-white/25">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(track.duration)}</span>
            </div>
          </div>

          {/* playback controls */}
          <div className="mt-3 flex items-center justify-center gap-1">
            <button
              onClick={() => setShuffle((s) => !s)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                shuffle ? "text-white/70" : "text-white/20 hover:text-white/40"
              )}
              title="Shuffle"
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handlePrev}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white/90"
              title="Previous"
            >
              <SkipBack className="h-4 w-4" fill="currentColor" />
            </button>
            <button
              onClick={handlePlayPause}
              className="grid h-11 w-11 place-items-center rounded-full text-white transition-transform active:scale-95"
              style={{
                background: accent,
                boxShadow: `0 4px 16px ${accent}40`,
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="white" />
              ) : (
                <Play className="h-5 w-5 translate-x-px" fill="white" />
              )}
            </button>
            <button
              onClick={handleNext}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white/90"
              title="Next"
            >
              <SkipForward className="h-4 w-4" fill="currentColor" />
            </button>
            <button
              onClick={() => setRepeat((r) => !r)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                repeat ? "text-white/70" : "text-white/20 hover:text-white/40"
              )}
              title="Repeat"
            >
              <Repeat className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* volume */}
          <div className="mt-auto flex items-center gap-2">
            <button
              onClick={() => setVolume((v) => (v === 0 ? 72 : 0))}
              className="grid h-6 w-6 place-items-center text-white/30"
            >
              {volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="group relative h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-white/30 transition-all"
                style={{ width: `${volume}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-white/20">{volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const app = defineApp({
  manifest: {
    id: "music",
    name: "Music",
    icon: Music,
    version: "1.0.0",
    defaultSize: { width: 600, height: 480 },
    minSize: { width: 440, height: 360 },
    tile: "from-violet-500 to-fuchsia-600",
  },
  Component: MusicApp,
});
