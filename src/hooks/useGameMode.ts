import { useCallback, useEffect, useRef, useState } from "react";
import { GameState, GameTier, LeaderboardEntry } from "../types";
import {
    fetchTopScores,
    qualifiesForLeaderboard,
    subscribeToLeaderboard,
} from "../services/leaderboardService";

const TIER_THRESHOLDS: { min: number; tier: GameTier; label: string }[] = [
    { min: 20, tier: "transcendent", label: "TRANSCENDENT" },
    { min: 15, tier: "legendary", label: "LEGENDARY" },
    { min: 10, tier: "unstoppable", label: "UNSTOPPABLE" },
    { min: 5, tier: "blazing", label: "BLAZING" },
    { min: 3, tier: "onFire", label: "ON FIRE" },
];

export const getTier = (streak: number): GameTier => {
    for (const t of TIER_THRESHOLDS) {
        if (streak >= t.min) return t.tier;
    }
    return "none";
};

export const getTierLabel = (tier: GameTier): string => {
    const found = TIER_THRESHOLDS.find((t) => t.tier === tier);
    return found?.label ?? "";
};

export const getNextTierThreshold = (streak: number): number => {
    for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
        if (streak < TIER_THRESHOLDS[i].min) {
            return TIER_THRESHOLDS[i].min;
        }
    }
    return TIER_THRESHOLDS[0].min + 5;
};

export const getPrevTierThreshold = (streak: number): number => {
    for (const t of TIER_THRESHOLDS) {
        if (streak >= t.min) {
            return t.min;
        }
    }
    return 0;
};

const INITIAL_STATE: GameState = {
    isGameMode: false,
    streak: 0,
    bestStreak: 0,
    currentTier: "none",
    lastResult: null,
    showRulesModal: false,
    showSubmitModal: false,
    pendingSubmitStreak: 0,
};

export function useGameMode() {
    const [state, setState] = useState<GameState>(INITIAL_STATE);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [comboText, setComboText] = useState<string | null>(null);
    const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Fetch leaderboard on mount + subscribe to local updates
    useEffect(() => {
        fetchTopScores().then(setLeaderboard);
        const unsubscribe = subscribeToLeaderboard(setLeaderboard);
        return unsubscribe;
    }, []);

    const clearResultAfterDelay = useCallback(() => {
        if (resultTimeoutRef.current) {
            clearTimeout(resultTimeoutRef.current);
        }
        resultTimeoutRef.current = setTimeout(() => {
            setState((prev) => ({ ...prev, lastResult: null }));
        }, 1200);
    }, []);

    const showComboTextBriefly = useCallback((text: string) => {
        setComboText(text);
        setTimeout(() => setComboText(null), 1500);
    }, []);

    const toggleGameMode = useCallback(() => {
        setState((prev) => {
            const nextGameMode = !prev.isGameMode;
            return {
                ...prev,
                isGameMode: nextGameMode,
                streak: nextGameMode ? 0 : prev.streak,
                currentTier: nextGameMode ? "none" : prev.currentTier,
                lastResult: null,
                showRulesModal: nextGameMode,
            };
        });
    }, []);

    const dismissRulesModal = useCallback(() => {
        setState((prev) => ({ ...prev, showRulesModal: false }));
    }, []);

    const dismissSubmitModal = useCallback(() => {
        setState((prev) => ({
            ...prev,
            showSubmitModal: false,
            pendingSubmitStreak: 0,
        }));
    }, []);

    const recordCorrect = useCallback(() => {
        setState((prev) => {
            const newStreak = prev.streak + 1;
            const newTier = getTier(newStreak);
            const newBest = Math.max(newStreak, prev.bestStreak);
            const oldTier = prev.currentTier;

            // Show combo text at milestones
            if (newTier !== oldTier && newTier !== "none") {
                showComboTextBriefly(getTierLabel(newTier) + "!");
            } else if (newStreak % 5 === 0 && newStreak > 0) {
                showComboTextBriefly(`COMBO ×${newStreak}!`);
            }

            return {
                ...prev,
                streak: newStreak,
                bestStreak: newBest,
                currentTier: newTier,
                lastResult: "correct",
            };
        });
        clearResultAfterDelay();
    }, [clearResultAfterDelay, showComboTextBriefly]);

    const recordIncorrect = useCallback(() => {
        setState((prev) => {
            const brokenStreak = prev.streak;
            if (brokenStreak > 0) {
                // Check if qualifies for local leaderboard asynchronously
                qualifiesForLeaderboard(brokenStreak).then((qualifies) => {
                    if (qualifies) {
                        setState((p) => ({
                            ...p,
                            showSubmitModal: true,
                            pendingSubmitStreak: brokenStreak,
                        }));
                    }
                });
            }

            return {
                ...prev,
                streak: 0,
                currentTier: "none",
                lastResult: "incorrect",
            };
        });
        showComboTextBriefly("STREAK LOST");
        clearResultAfterDelay();
    }, [clearResultAfterDelay, showComboTextBriefly]);

    const refreshLeaderboard = useCallback(() => {
        fetchTopScores().then(setLeaderboard);
    }, []);

    return {
        ...state,
        leaderboard,
        comboText,
        toggleGameMode,
        dismissRulesModal,
        dismissSubmitModal,
        recordCorrect,
        recordIncorrect,
        refreshLeaderboard,
    };
}
