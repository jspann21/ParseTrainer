import React from "react";
import { X, History, ChevronRight } from "lucide-react";
import { HistoryEntry } from "../types";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, history, onSelect }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <History className="w-5 h-5" />
              <h2 className="font-bold text-lg">History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                <p>No verbs in history yet.</p>
                <p className="text-sm mt-2">Practice a few rounds to fill this list.</p>
              </div>
            ) : (
              history.map((entry, index) => {
                const roots = Array.from(new Set(entry.answers.map((answer) => answer.root))).join(", ");
                return (
                  <button
                    key={`${entry.word}-${index}-${entry.createdAt}`}
                    onClick={() => onSelect(entry)}
                    className="w-full text-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-4 transition-all hover:shadow-md group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="hebrew-text text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {entry.word}
                      </span>
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded max-w-48 truncate">
                        {roots}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                      {entry.answers.length} possible parsing{entry.answers.length === 1 ? "" : "s"}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-4 right-4">
                      Review <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50 text-center">
            <p className="text-xs text-gray-400">Stores last 20 prompts</p>
          </div>
        </div>
      </div>
    </>
  );
};
