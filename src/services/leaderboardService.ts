import { LeaderboardEntry } from "../types";

const LEADERBOARD_KEY = "parsetrainer:leaderboard:v1";
const LEADERBOARD_EVENT = "parsetrainer:leaderboard-updated";
const MAX_LEADERBOARD_ENTRIES = 10;

const canUseStorage = (): boolean => {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
};

const normalizeEntry = (value: unknown): LeaderboardEntry | null => {
    if (!value || typeof value !== "object") return null;

    const candidate = value as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const initialsRaw = typeof candidate.initials === "string" ? candidate.initials : "";
    const streakRaw = typeof candidate.streak === "number" ? candidate.streak : NaN;
    const createdAtRaw = typeof candidate.created_at === "string" ? candidate.created_at : "";

    if (!id || !Number.isFinite(streakRaw) || streakRaw < 1 || !createdAtRaw) return null;

    const createdTime = Date.parse(createdAtRaw);
    if (Number.isNaN(createdTime)) return null;

    const initials = initialsRaw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    if (initials.length !== 3) return null;

    return {
        id,
        initials,
        streak: Math.trunc(streakRaw),
        created_at: new Date(createdTime).toISOString(),
    };
};

const sortEntries = (a: LeaderboardEntry, b: LeaderboardEntry): number => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return a.created_at.localeCompare(b.created_at);
};

const readStoredEntries = (): LeaderboardEntry[] => {
    if (!canUseStorage()) return [];

    try {
        const raw = window.localStorage.getItem(LEADERBOARD_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map(normalizeEntry)
            .filter((entry): entry is LeaderboardEntry => entry !== null)
            .sort(sortEntries)
            .slice(0, MAX_LEADERBOARD_ENTRIES);
    } catch (_error) {
        return [];
    }
};

const writeStoredEntries = (entries: LeaderboardEntry[]): boolean => {
    if (!canUseStorage()) return false;

    try {
        const next = entries.sort(sortEntries).slice(0, MAX_LEADERBOARD_ENTRIES);
        window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(LEADERBOARD_EVENT));
        return true;
    } catch (_error) {
        return false;
    }
};

const createEntryId = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const fetchTopScores = async (): Promise<LeaderboardEntry[]> => {
    return readStoredEntries();
};

export const submitScore = async (
    initials: string,
    streak: number
): Promise<boolean> => {
    if (!canUseStorage() || streak < 1) return false;

    const normalizedInitials = initials.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    if (normalizedInitials.length !== 3) return false;

    const nextEntries = [
        ...readStoredEntries(),
        {
            id: createEntryId(),
            initials: normalizedInitials,
            streak: Math.trunc(streak),
            created_at: new Date().toISOString(),
        },
    ];

    return writeStoredEntries(nextEntries);
};

export const qualifiesForLeaderboard = async (
    streak: number
): Promise<boolean> => {
    if (streak < 1) return false;

    const topScores = readStoredEntries();
    if (topScores.length < MAX_LEADERBOARD_ENTRIES) {
        return true;
    }

    const lowestTopScore = topScores[topScores.length - 1].streak;
    return streak > lowestTopScore;
};

export const subscribeToLeaderboard = (
    callback: (entries: LeaderboardEntry[]) => void
) => {
    if (typeof window === "undefined") return () => { };

    const emit = () => {
        fetchTopScores().then(callback);
    };

    const handleStorage = (event: StorageEvent) => {
        if (event.key === LEADERBOARD_KEY) {
            emit();
        }
    };

    const handleLocalUpdate = () => {
        emit();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LEADERBOARD_EVENT, handleLocalUpdate);

    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(LEADERBOARD_EVENT, handleLocalUpdate);
    };
};
