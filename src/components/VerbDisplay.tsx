import React from "react";

interface VerbDisplayProps {
  word: string;
  loading: boolean;
}

export const VerbDisplay: React.FC<VerbDisplayProps> = ({ word, loading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center mb-6 border-t-4 border-blue-600 dark:border-blue-500 transition-colors duration-300">
      <h2 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
        Identify this form
      </h2>
      {loading ? (
        <div className="h-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : (
        <h1 className="hebrew-text text-6xl text-gray-800 dark:text-gray-100 font-bold mb-2 py-2">
          {word}
        </h1>
      )}
    </div>
  );
};
