import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trophy, Flame, Zap, Crown, Sparkles, Star } from "lucide-react";
import { LeaderboardEntry, GameTier } from "../types";
import { getTierLabel, getNextTierThreshold, getPrevTierThreshold } from "../hooks/useGameMode";

interface GamePanelProps {
    streak: number;
    bestStreak: number;
    currentTier: GameTier;
    lastResult: "correct" | "incorrect" | null;
    comboText: string | null;
    leaderboard: LeaderboardEntry[];
}

const TIER_ICONS: Record<GameTier, React.ReactNode> = {
    none: <Star className="w-5 h-5" />,
    onFire: <Flame className="w-5 h-5 text-orange-400" />,
    blazing: <Zap className="w-5 h-5 text-blue-400" />,
    unstoppable: <Sparkles className="w-5 h-5 text-purple-400" />,
    legendary: <Crown className="w-5 h-5 text-yellow-400" />,
    transcendent: <Crown className="w-5 h-5 text-pink-400" />,
};

/** Particles that burst on correct answer */
const Particles: React.FC<{ trigger: number }> = ({ trigger }) => {
    const [particles, setParticles] = useState<
        { id: number; x: number; y: number; color: string; size: number; dx: number; duration: number }[]
    >([]);

    useEffect(() => {
        if (trigger === 0) return;
        const colors = ["#22c55e", "#4ade80", "#86efac", "#a78bfa", "#fbbf24", "#38bdf8"];
        const newParticles = Array.from({ length: 12 }, (_, i) => ({
            id: Date.now() + i,
            x: 50 + (Math.random() - 0.5) * 40,
            y: 35 + (Math.random() - 0.5) * 20,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6,
            dx: (Math.random() - 0.5) * 80,
            duration: 0.6 + Math.random() * 0.6,
        }));
        setParticles(newParticles);
        const timeout = setTimeout(() => setParticles([]), 1500);
        return () => clearTimeout(timeout);
    }, [trigger]);

    return (
        <>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="game-particle"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        "--px": `${p.dx}px`,
                        "--duration": `${p.duration}s`,
                    } as React.CSSProperties}
                />
            ))}
        </>
    );
};

/** SVG circular combo ring */
const ComboRing: React.FC<{ streak: number; tier: GameTier }> = ({ streak, tier }) => {
    const nextThreshold = getNextTierThreshold(streak);
    const prevThreshold = getPrevTierThreshold(streak);
    const range = nextThreshold - prevThreshold;
    const progress = range > 0 ? (streak - prevThreshold) / range : 0;
    const circumference = 2 * Math.PI * 58;
    const offset = circumference * (1 - Math.min(progress, 1));

    const strokeColors: Record<GameTier, string> = {
        none: "#6366f1",
        onFire: "#fb923c",
        blazing: "#3b82f6",
        unstoppable: "#a855f7",
        legendary: "#eab308",
        transcendent: "#ec4899",
    };

    return (
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                strokeWidth="4"
                className="combo-ring-track"
            />
            <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                strokeWidth="4"
                stroke={strokeColors[tier]}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="combo-ring-fill"
                style={{ filter: `drop-shadow(0 0 6px ${strokeColors[tier]})` }}
            />
        </svg>
    );
};

export const GamePanel: React.FC<GamePanelProps> = ({
    streak,
    bestStreak,
    currentTier,
    lastResult,
    comboText,
    leaderboard,
}) => {
    const [animKey, setAnimKey] = useState(0);
    const [displayStreak, setDisplayStreak] = useState(streak);
    const [floatingPlus, setFloatingPlus] = useState(false);
    const prevStreak = useRef(streak);
    const particleTrigger = useRef(0);
    const [showHighScoreAnim, setShowHighScoreAnim] = useState(false);
    const hasShownHighThisSession = useRef(false);

    // Get #1 local score for high score animation check
    const topScore = leaderboard.length > 0 ? leaderboard[0].streak : 0;

    // Animate streak changes & check high score
    useEffect(() => {
        if (streak !== prevStreak.current) {
            // Check for new high score (passing #1)
            // Only trigger if we weren't already #1 (prev <= top) and now we are (> top)
            if (streak > topScore && prevStreak.current <= topScore && !hasShownHighThisSession.current && topScore > 0) {
                setShowHighScoreAnim(true);
                hasShownHighThisSession.current = true;
                setTimeout(() => setShowHighScoreAnim(false), 3000); // 3s animation
            }

            setAnimKey((k) => k + 1);
            if (streak > prevStreak.current) {
                particleTrigger.current += 1;
                setFloatingPlus(true);
                setTimeout(() => setFloatingPlus(false), 800);
            }
            setDisplayStreak(streak);
            prevStreak.current = streak;
        }
    }, [streak, topScore]);

    const tierLabel = getTierLabel(currentTier);

    // Compute display leaderboard with "Ghost Row" logic
    const displayItems = useMemo(() => {
        // 1. Create a ghost entry for current user if streak > 0
        const ghostEntry: LeaderboardEntry | null = streak > 0 ? {
            id: "ghost-user",
            initials: "YOU",
            streak: streak,
            created_at: new Date().toISOString(), // Mock, sortable
        } : null;

        // 2. Combine with real leaderboard
        // We want to see where the ghost fits.
        // If the ghost matches an existing entry (perfect tie), we still want to show "YOU" maybe?
        // Let's just create a combined list and sort it.
        // Mark the ghost entry so we can highlight it.

        let combined = [...leaderboard];

        // Remove any old "YOU" entries if they somehow got in (shouldn't happen with real data props)
        // But just in case we are modifying a local copy.

        if (ghostEntry) {
            combined.push(ghostEntry);
        }

        // 3. Sort by streak DESC, then created_at ASC (standard tie breaker: older score wins)
        // However, for "YOU" (ghost), we usually are "newer" so we lose ties, which is fair.
        combined.sort((a, b) => {
            if (b.streak !== a.streak) return b.streak - a.streak;
            // Ghost (YOU) always loses ties conceptually until submitted? 
            // Or typically "last qualified" goes below.
            // Let's just use string comparison on ID or initials to ensure stability if timestamps match (unlikely)
            return a.created_at.localeCompare(b.created_at);
        });

        // 4. Calculate Ranks (Competition Ranking: 1, 1, 3)
        // We map to a new structure that includes { ...entry, rank, isGhost }
        let currentRank = 1;
        const processed: (LeaderboardEntry & { rank: number; isGhost: boolean })[] = [];

        for (let i = 0; i < combined.length; i++) {
            const entry = combined[i];

            // Competition ranking:
            // If this streak < previous streak, rank = i + 1
            // If equal, rank = previous rank
            if (i > 0 && entry.streak < combined[i - 1].streak) {
                currentRank = i + 1;
            }

            processed.push({
                ...entry,
                rank: currentRank,
                isGhost: entry.id === "ghost-user"
            });
        }

        // 5. Truncate to top 10 
        // User said: "if you match another score, you are tied... last one gets bumped off to keep '10' only".
        // This implies the list IS top 10.
        // BUT, "marker that shows where they are... if they're rising".
        // If I am #50, I am not rising into the view yet.
        // I will just show the Top 10. If the ghost is in the top 10, it will appear.

        return processed.slice(0, 10);

    }, [leaderboard, streak]);

    // Find if ghost is visible (for "Would Place" logic visual check)
    // actually we can just rely on rendering logic now.

    const userRank = displayItems.find(i => i.isGhost)?.rank;


    return (
        <div
            className={`
        relative rounded-2xl border-2 p-6 overflow-hidden transition-all duration-700
        tier-${currentTier} tier-border-${currentTier}
        ${lastResult === "incorrect" ? "animate-screen-shake" : ""}
      `}
            style={{ minHeight: 500 }}
        >
            {/* Edge flash overlay */}
            {lastResult && (
                <div
                    key={`flash-${animKey}`}
                    className={`absolute inset-0 rounded-2xl pointer-events-none z-10 ${lastResult === "correct" ? "edge-flash-green" : "edge-flash-red"
                        }`}
                />
            )}

            {/* HIGH SCORE ANIMATION OVERLAY */}
            {showHighScoreAnim && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
                    <div className="relative text-center animate-bounce-in">
                        <div className="text-6xl mb-2 animate-pulse-fast">🏆</div>
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">
                            NEW HIGH SCORE!
                        </h2>
                        <p className="text-white/80 font-bold text-lg mt-2 tracking-widest uppercase">Unstoppable!</p>
                    </div>
                </div>
            )}

            {/* Particles */}
            <Particles trigger={particleTrigger.current} />

            {/* Ambient twinkling stars in the background */}
            {[
                { x: 12, y: 15, dur: 3, delay: 0 },
                { x: 85, y: 20, dur: 4, delay: 1.2 },
                { x: 25, y: 80, dur: 3.5, delay: 0.5 },
                { x: 75, y: 70, dur: 2.8, delay: 2 },
                { x: 50, y: 90, dur: 3.2, delay: 1.8 },
                { x: 8, y: 55, dur: 4.2, delay: 0.8 },
                { x: 92, y: 50, dur: 3, delay: 2.5 },
                { x: 40, y: 12, dur: 3.7, delay: 1.5 },
            ].map((star, i) => (
                <div
                    key={`twinkle-${i}`}
                    className="ambient-twinkle"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        "--twinkle-duration": `${star.dur}s`,
                        "--twinkle-delay": `${star.delay}s`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Energy burst / shockwave behind streak number */}
            {lastResult && (
                <div
                    key={`fx-${animKey}`}
                    className={`absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 z-0 ${lastResult === "correct" ? "energy-burst-correct" : "shockwave-red"
                        }`}
                />
            )}

            {/* ── Streak Counter ─────────────────────────── */}
            <div className="relative flex flex-col items-center mb-6 z-20">
                {/* Tier badge */}
                {currentTier !== "none" && (
                    <div className="flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                        {TIER_ICONS[currentTier]}
                        <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                            {tierLabel}
                        </span>
                    </div>
                )}

                {/* Combo ring + streak number */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                    <ComboRing streak={streak} tier={currentTier} />

                    {/* Ambient orbiting sparkles — varied orbits */}
                    {[
                        { anim: "sparkle-orbit-a", dur: 5.5, delay: 0, size: 3 },
                        { anim: "sparkle-orbit-b", dur: 7, delay: 0.8, size: 4 },
                        { anim: "sparkle-orbit-c", dur: 6, delay: 2.2, size: 3 },
                        { anim: "sparkle-orbit-a", dur: 8, delay: 3.5, size: 4 },
                        { anim: "sparkle-orbit-b", dur: 5, delay: 1.5, size: 3 },
                        { anim: "sparkle-orbit-c", dur: 7.5, delay: 4, size: 3 },
                    ].map((s, i) => {
                        const tierColor =
                            currentTier === "onFire" ? "rgba(251,146,60,0.8)"
                                : currentTier === "blazing" ? "rgba(96,165,250,0.8)"
                                    : currentTier === "unstoppable" ? "rgba(192,132,252,0.8)"
                                        : currentTier === "legendary" ? "rgba(250,204,21,0.8)"
                                            : currentTier === "transcendent" ? "rgba(244,114,182,0.8)"
                                                : "rgba(165,180,252,0.7)";
                        return (
                            <div
                                key={`sparkle-${i}`}
                                className="ambient-sparkle"
                                style={{
                                    "--spark-anim": s.anim,
                                    "--spark-delay": `${s.delay}s`,
                                    "--spark-duration": `${s.dur}s`,
                                    "--spark-size": `${s.size}px`,
                                    "--spark-color": tierColor,
                                } as React.CSSProperties}
                            />
                        );
                    })}

                    <div
                        key={`s-${animKey}`}
                        className={`
              text-6xl font-black tabular-nums
              streak-color-${currentTier}
              ${lastResult === "correct" ? "animate-streak-punch" : ""}
              ${lastResult === "incorrect" ? "animate-streak-shatter" : ""}
              ${!lastResult && streak > 0 ? "animate-streak-pulse" : ""}
            `}
                    >
                        {displayStreak}
                    </div>

                    {/* Floating +1 */}
                    {floatingPlus && (
                        <span className="absolute top-2 right-4 text-green-400 font-bold text-lg animate-float-up z-30">
                            +1
                        </span>
                    )}
                </div>

                <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-2">
                    Streak
                </p>

                {/* Best streak */}
                <div className="mt-2 flex items-center gap-1.5 text-white/30 text-xs">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Session Best: <span className="text-white/60 font-bold">{bestStreak}</span></span>
                </div>
            </div>

            {/* ── Combo Text (floating) ──────────────────── */}
            {comboText && (
                <div
                    key={`combo-${comboText}-${animKey}`}
                    className={`
            absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40
            text-2xl font-black uppercase tracking-wide text-center
            animate-combo-slam pointer-events-none select-none
            ${comboText === "STREAK LOST"
                            ? "text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                            : "text-white drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                        }
          `}
                >
                    {comboText}
                </div>
            )}

            {/* ── Next Tier Indicator ────────────────────── */}
            <div className="mb-6 text-center">
                <p className="text-white/30 text-xs">
                    {currentTier === "transcendent"
                        ? "Maximum tier reached!"
                        : `Next tier at ${getNextTierThreshold(streak)} streak`}
                </p>
            </div>

            {/* ── Leaderboard ────────────────────────────── */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">
                        Local Top 10
                    </h3>
                    {userRank && (
                        <span className="ml-auto text-xs font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">
                            #{userRank}
                        </span>
                    )}
                </div>

                <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                    {displayItems.length === 0 ? (
                        <div className="px-4 py-6 text-center text-white/30 text-sm">
                            No local scores yet. Be the first!
                        </div>
                    ) : (
                        displayItems.map((entry, index) => {
                            // Check if this row is the ghost "YOU" row
                            const isGhost = (entry as any).isGhost;

                            // Medals for ranks 1, 2, 3 (handled by rank, not index!)
                            const rank = (entry as any).rank;
                            let medal = null;
                            if (rank === 1) medal = "🥇";
                            else if (rank === 2) medal = "🥈";
                            else if (rank === 3) medal = "🥉";

                            return (
                                <div
                                    key={entry.id}
                                    className={`flex items-center px-4 py-2.5 gap-3 transition-colors duration-300 ${isGhost
                                            ? "bg-violet-600/20 border-l-2 border-violet-400"
                                            : (rank === 1 ? "bg-yellow-500/5" : "")
                                        }`}
                                >
                                    <span className="w-6 text-center text-sm">
                                        {medal ? <span className="text-base">{medal}</span> : (
                                            <span className="text-white/40 font-mono text-xs">{rank}</span>
                                        )}
                                    </span>
                                    <span className={`font-mono font-bold text-sm tracking-wider flex-1 ${isGhost ? "text-violet-300" : "text-white/80"
                                        }`}>
                                        {entry.initials}
                                    </span>
                                    <span className={`font-bold tabular-nums text-sm ${rank === 1 ? "text-yellow-400" : (isGhost ? "text-violet-300" : "text-white/60")
                                        }`}>
                                        {entry.streak}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
