import React from "react";
import { Gamepad2 } from "lucide-react";

interface GameModeToggleProps {
    isActive: boolean;
    onToggle: () => void;
}

export const GameModeToggle: React.FC<GameModeToggleProps> = ({
    isActive,
    onToggle,
}) => {
    return (
        <button
            onClick={onToggle}
            className={`
        relative flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm
        transition-all duration-300 border-2 overflow-hidden
        ${isActive
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-violet-400 animate-glow-pulse shadow-lg shadow-violet-500/25"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-300 dark:hover:bg-gray-600"
                }
      `}
            title={isActive ? "Exit Game Mode" : "Enter Game Mode"}
        >
            <Gamepad2 className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
            <span>Game Mode</span>
            {isActive && (
                <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
            )}
        </button>
    );
};
