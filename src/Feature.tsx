import { useEffect, useMemo, useState } from "react";
import {
  MeshNameInput,
  createClockSync,
  useNamedPeer,
  useRoster,
  useSharedTimer,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";
export const PHRASES = [
  "small steady steps make surprisingly large changes",
  "the best room is one where every voice can be heard",
  "make the useful thing simple enough to share",
  "fast feedback turns a rough idea into a real game",
] as const;
const RACE_MS = 30_000;
export const phraseForRound = (n: number) => PHRASES[Math.abs(n) % PHRASES.length] ?? PHRASES[0];
export const accuracyFor = (v: string, p: string) =>
  v ? Math.round(([...v].filter((c, i) => c === p[i]).length / v.length) * 100) : 100;
export const wpmFor = (v: string, ms: number) =>
  ms > 0 ? Math.round((v.length / 5 / (ms / 60_000)) * 10) / 10 : 0;
type Result = { name: string; wpm: number; accuracy: number };
type Props = { room: YRoom | null; config: MeshConfig };
export function Feature({ room, config }: Props) {
  const named = useNamedPeer(config, room),
    roster = useRoster(room),
    clock = useMemo(() => createClockSync(room?.provider ?? null), [room?.provider]);
  useEffect(() => () => clock.destroy(), [clock]);
  const timer = useSharedTimer(room, "mesh-speed-type:race", { durationMs: RACE_MS, clock }),
    [text, setText] = useState(""),
    [rev, setRev] = useState(0);
  useEffect(() => {
    if (!room) return;
    const m = room.doc.getMap<Result>("mesh-speed-type:results"),
      f = () => setRev((x) => x + 1);
    m.observe(f);
    return () => m.unobserve(f);
  }, [room]);
  void rev;
  const phrase = phraseForRound(0),
    acc = accuracyFor(text, phrase),
    wpm = wpmFor(text, timer.elapsedMs),
    done = text === phrase,
    board = room
      ? Array.from(room.doc.getMap<Result>("mesh-speed-type:results").entries())
          .sort(([, a], [, b]) => b.wpm - a.wpm || b.accuracy - a.accuracy)
          .slice(0, 8)
      : [];
  useEffect(() => {
    if (room && done && timer.state === "running") {
      room.doc
        .getMap<Result>("mesh-speed-type:results")
        .set(room.peerId, { name: named.name || "Anonymous", wpm, accuracy: acc });
      timer.pause();
    }
  }, [room, done, timer, wpm, acc, named.name]);
  const start = () => {
    if (room) {
      setText("");
      room.doc.getMap<Result>("mesh-speed-type:results").clear();
      timer.start(RACE_MS);
    }
  };
  return (
    <main className="speed-page">
      <section className="speed-hero">
        <p className="speed-kicker">Shared typing sprint</p>
        <h1>
          Type fast.
          <br />
          Stay true.
        </h1>
        <p>Everyone in this room races the same phrase. Your score stays peer-to-peer.</p>
        <span>
          ● {room ? `${Math.max(1, roster.present.length)} racers connected` : "Joining room…"}
        </span>
      </section>
      <section className="speed-grid">
        <section className="race-card">
          <div className="race-top">
            <span>{timer.state === "running" ? "Race in progress" : "Ready to race"}</span>
            <b>{timer.remainingMs == null ? "30s" : `${Math.ceil(timer.remainingMs / 1000)}s`}</b>
          </div>
          <div className="meter">
            <i style={{ transform: `scaleX(${Math.min(1, timer.elapsedMs / RACE_MS)})` }} />
          </div>
          <p className="phrase-label">Copy this exactly</p>
          <h2>{phrase}</h2>
          <textarea
            aria-label="Type the race phrase"
            value={text}
            disabled={timer.state !== "running"}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start the shared race, then type here…"
            spellCheck={false}
          />
          <div className="metrics">
            <span>
              <b>{wpm}</b> WPM
            </span>
            <span>
              <b>{acc}%</b> accuracy
            </span>
          </div>
          <button className="race-button" onClick={start} disabled={!room}>
            {timer.state === "running" ? "Restart this race" : "Start 30-second race"}
          </button>
        </section>
        <aside className="leader-card">
          <p className="phrase-label">Live leaderboard</p>
          <h2>Clean speed wins</h2>
          <ol>
            {board.length ? (
              board.map(([id, r], i) => (
                <li key={id}>
                  <span>
                    {i + 1}. {r.name}
                  </span>
                  <b>
                    {r.wpm} WPM · {r.accuracy}%
                  </b>
                </li>
              ))
            ) : (
              <li>Start a race to see the room’s finishers.</li>
            )}
          </ol>
          <MeshNameInput
            label="Display name"
            value={named.name}
            onChange={named.setName}
            placeholder="Name on the board"
            maxLength={24}
            showCounter
          />
        </aside>
      </section>
    </main>
  );
}
