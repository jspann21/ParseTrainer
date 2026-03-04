import React, { useEffect, useRef, useState } from "react";
import { Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";
import { submitScore } from "../services/leaderboardService";

interface ScoreSubmitModalProps {
    isOpen: boolean;
    streak: number;
    onClose: () => void;
    onSubmitted: () => void;
}

export const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({
    isOpen,
    streak,
    onClose,
    onSubmitted,
}) => {
    const [initials, setInitials] = useState(["", "", ""]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];
    const confettiFired = useRef(false);

    // Fire confetti on open
    useEffect(() => {
        if (isOpen && !confettiFired.current) {
            confettiFired.current = true;
            const duration = 2000;
            const end = Date.now() + duration;
            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.7 },
                    colors: ["#a78bfa", "#fbbf24", "#ec4899", "#38bdf8"],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.7 },
                    colors: ["#a78bfa", "#fbbf24", "#ec4899", "#38bdf8"],
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
        }
        if (!isOpen) {
            confettiFired.current = false;
            setInitials(["", "", ""]);
            setSubmitting(false);
            setSubmitted(false);
        }
    }, [isOpen]);

    // Focus first input
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRefs[0].current?.focus(), 200);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleChange = (index: number, value: string) => {
        const char = value.toUpperCase().replace(/[^A-Z]/g, "");
        if (!char) return;

        const next = [...initials];
        next[index] = char[0];
        setInitials(next);

        // Auto-advance
        if (index < 2) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !initials[index] && index > 0) {
            const next = [...initials];
            next[index - 1] = "";
            setInitials(next);
            inputRefs[index - 1].current?.focus();
        }
    };

    const canSubmit = initials.every((c) => c.length === 1);

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;

        const combined = initials.join("");
        // Basic profanity filter (3-letter acronyms)
        const BLACKLIST = ["FUK", "FUC", "CNT", "KLL", "DIE", "WFT", "WTF", "ASS", "DIK", "COC", "KKK", "SEX", "GAY", "FAG", "PIS", "POO", "CUM", "TIT"];

        if (BLACKLIST.includes(combined)) {
            alert("Please choose different initials.");
            setInitials(["", "", ""]);
            inputRefs[0].current?.focus();
            return;
        }

        setSubmitting(true);
        const success = await submitScore(combined, streak);
        setSubmitting(false);
        if (success) {
            setSubmitted(true);
            // Final celebration
            confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.6 },
                colors: ["#a78bfa", "#fbbf24", "#ec4899", "#22c55e"],
            });
            setTimeout(() => {
                onSubmitted();
                onClose();
            }, 1500);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-violet-950/50 to-slate-900 rounded-2xl shadow-2xl border border-violet-500/30 overflow-hidden">
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-fuchsia-500 to-yellow-500" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center">
                    {/* Trophy */}
                    <div className="text-6xl mb-4 animate-trophy-glow">🏆</div>

                    <h2 className="text-2xl font-black text-white mb-2">
                        {submitted ? "Saved Locally!" : "New High Score!"}
                    </h2>

                    {/* Streak display */}
                    <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-6">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 font-black text-lg tabular-nums">{streak}</span>
                        <span className="text-yellow-300/60 text-sm font-medium">streak</span>
                    </div>

                    {!submitted ? (
                        <>
                            <p className="text-white/50 text-sm mb-6">Enter your initials</p>

                            {/* 3 letter inputs */}
                            <div className="flex justify-center gap-3 mb-8">
                                {initials.map((char, i) => (
                                    <input
                                        key={i}
                                        ref={inputRefs[i]}
                                        type="text"
                                        maxLength={1}
                                        value={char}
                                        onChange={(e) => handleChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className="w-16 h-20 text-center text-3xl font-black text-white bg-white/5 border-2 border-white/20 rounded-xl focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all uppercase"
                                        disabled={submitting}
                                    />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || submitting}
                                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25"
                                >
                                    {submitting ? "Saving..." : "Submit"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-green-400 font-semibold text-lg mt-4">
                            ✓ Saved to your local leaderboard!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
