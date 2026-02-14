import { supabase } from "./supabaseClient";
import { LeaderboardEntry } from "../types";

export const fetchTopScores = async (): Promise<LeaderboardEntry[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase.rpc("get_top_scores");
    if (error) {
        console.error("Failed to fetch top scores:", error);
        return [];
    }

    return (data ?? []) as LeaderboardEntry[];
};

export const submitScore = async (
    initials: string,
    streak: number
): Promise<boolean> => {
    if (!supabase) return false;

    const { error } = await supabase
        .from("leaderboard")
        .insert({ initials: initials.toUpperCase(), streak });

    if (error) {
        console.error("Failed to submit score:", error);
        return false;
    }

    return true;
};

export const qualifiesForLeaderboard = async (
    streak: number
): Promise<boolean> => {
    if (!supabase || streak < 1) return false;

    const { data, error } = await supabase.rpc("qualifies_for_leaderboard", {
        score: streak,
    });

    if (error) {
        console.error("Failed to check leaderboard qualification:", error);
        return false;
    }

    return data as boolean;
};

export const subscribeToLeaderboard = (
    callback: (entries: LeaderboardEntry[]) => void
) => {
    if (!supabase) return () => { };

    const channel = supabase
        .channel("leaderboard-realtime")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "leaderboard" },
            () => {
                fetchTopScores().then(callback);
            }
        )
        .subscribe();

    return () => {
        supabase!.removeChannel(channel);
    };
};
