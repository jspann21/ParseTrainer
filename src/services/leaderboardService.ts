import { supabase } from "./supabaseClient";
import { LeaderboardEntry } from "../types";

export const fetchTopScores = async (): Promise<LeaderboardEntry[]> => {
    if (!supabase) return [];

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_top_scores");

    if (!rpcError && rpcData) {
        return rpcData as LeaderboardEntry[];
    }

    if (rpcError) {
        console.warn("RPC get_top_scores failed, falling back to raw select:", rpcError);
    }

    // Fallback: Raw Select
    const { data, error } = await supabase
        .from("leaderboard")
        .select("id, initials, streak, created_at")
        .order("streak", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(10);

    if (error) {
        console.error("Failed to fetch top scores (fallback):", error);
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

    // Try RPC first
    const { data, error } = await supabase.rpc("qualifies_for_leaderboard", {
        score: streak,
    });

    if (!error && typeof data === "boolean") {
        return data;
    }

    console.warn("RPC qualifies_for_leaderboard failed or missing, using fallback check:", error);

    // Fallback: Fetch top scores and compare manually
    const topScores = await fetchTopScores();

    // If fewer than 10 scores, any score > 0 qualifies (we already checked streak < 1)
    if (topScores.length < 10) {
        return true;
    }

    // If 10 scores, must beat the 10th score
    const lowestTopScore = topScores[topScores.length - 1].streak;
    return streak > lowestTopScore;
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
