import React from "react";
import { X, Zap, Target, Trophy, RotateCcw, Keyboard } from "lucide-react";

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-2xl border border-indigo-500/30 overflow-hidden">
                {/* Header glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 mb-4">
                            <Zap className="w-4 h-4 text-violet-400" />
                            <span className="text-violet-300 text-sm font-semibold tracking-wide uppercase">
                                Game Mode
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            How to Play
                        </h2>
                    </div>

                    {/* Rules */}
                    <div className="space-y-5">
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                                <Target className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">
                                    Parse Correctly
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Select the correct stem, tense, person, gender, and number for each Hebrew verb form.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <Keyboard className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">
                                    Root Letters Required
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Unlike practice mode, you <span className="text-amber-300 font-semibold">must enter the root letters</span> for your answer to count toward your streak.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">
                                    Build Your Streak
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Your score is the number of <span className="text-blue-300 font-semibold">consecutive correct answers</span>. Hit milestones to unlock tiers: On Fire → Blazing → Unstoppable → Legendary → Transcendent.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                <RotateCcw className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">
                                    Miss? Keep Going!
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    A wrong answer <span className="text-red-300 font-semibold">resets your streak to zero</span>, but there's no game over. Keep playing and beat your best.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">
                                    Top 10 Leaderboard
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    The global leaderboard tracks the <span className="text-yellow-300 font-semibold">top 10 highest streaks</span> in real time. If your streak qualifies, enter your initials to claim your spot!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Start button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98]"
                    >
                        Let's Go!
                    </button>
                </div>
            </div>
        </div>
    );
};
