import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Filter,
  History,
  Moon,
  RotateCcw,
  Sun,
} from "lucide-react";
import { DISPLAY_LABELS, INITIAL_SELECTION } from "./constants";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FilterDrawer } from "./components/FilterDrawer";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { ParsingForm } from "./components/ParsingForm";
import { VerbDisplay } from "./components/VerbDisplay";
import {
  buildPrompt,
  dataset,
  filterVerbs,
  findMatchingAnswers,
  loadSavedFilters,
  removeAnswered,
  saveFilters,
} from "./services/trainerService";
import { AnswerCandidate, FilterState, HistoryEntry, OptionItem, Prompt, UserSelection } from "./types";

const formatParsing = (answer: AnswerCandidate): string => {
  const person = DISPLAY_LABELS.person[answer.person ?? ""];
  const gender = DISPLAY_LABELS.gender[answer.gender ?? ""];
  const number = DISPLAY_LABELS.number[answer.number ?? ""];
  const tense = DISPLAY_LABELS.tense[answer.tense] || answer.tense;
  const stem = DISPLAY_LABELS.stem[answer.stem] || answer.stem;

  return `${stem}, ${tense}, ${person} ${gender} ${number}, Root ${answer.root}`;
};

type SubmissionStatus = "idle" | "partial" | "correct" | "incorrect";

function AppContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>(() => loadSavedFilters(dataset));
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [remainingAnswers, setRemainingAnswers] = useState<AnswerCandidate[]>([]);
  const [selection, setSelection] = useState<UserSelection>(INITIAL_SELECTION);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [statusText, setStatusText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [reviewEntry, setReviewEntry] = useState<HistoryEntry | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const stemOptions: OptionItem[] = useMemo(() => {
    return dataset.stems.map((stem) => ({
      value: stem.name,
      label: DISPLAY_LABELS.stem[stem.name] || stem.name,
    }));
  }, []);

  const tenseOptions: OptionItem[] = useMemo(() => {
    return dataset.tenses.map((tense) => ({
      value: tense.name,
      label: DISPLAY_LABELS.tense[tense.name] || tense.name,
    }));
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const loadPrompt = (activeFilters: FilterState) => {
    setLoading(true);
    setError(null);
    setStatus("idle");
    setStatusText("");
    setSelection(INITIAL_SELECTION);
    setReviewEntry(null);

    const filtered = filterVerbs(dataset, activeFilters);
    const nextPrompt = buildPrompt(filtered);

    if (!nextPrompt) {
      setPrompt(null);
      setRemainingAnswers([]);
      setError("There are no verbs matching your selected filters.");
      setLoading(false);
      return;
    }

    setPrompt(nextPrompt);
    setRemainingAnswers(nextPrompt.answers);
    setHistory((previous) => {
      const entry: HistoryEntry = {
        ...nextPrompt,
        createdAt: new Date().toISOString(),
      };
      return [entry, ...previous].slice(0, 20);
    });
    setLoading(false);
  };

  useEffect(() => {
    loadPrompt(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersChange = (nextFilters: FilterState) => {
    const sanitized: FilterState = {
      stems: nextFilters.stems,
      tenses: nextFilters.tenses,
      roots: nextFilters.roots,
    };

    setFilters(sanitized);
    saveFilters(sanitized);
    loadPrompt(sanitized);
  };

  const handleSelectionChange = (field: keyof UserSelection, value: string) => {
    if (reviewEntry || status === "correct" || status === "incorrect") {
      return;
    }

    setSelection((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!prompt || reviewEntry) {
      return;
    }

    const matched = findMatchingAnswers(selection, remainingAnswers);
    if (matched.length === 0) {
      setStatus("incorrect");
      setStatusText("Not quite right. Correct choices are highlighted in the form.");
      return;
    }

    const updatedRemaining = removeAnswered(remainingAnswers, matched);
    setRemainingAnswers(updatedRemaining);

    if (updatedRemaining.length === 0) {
      setStatus("correct");
      setStatusText("All valid parsings found.");
      return;
    }

    setStatus("partial");
    setStatusText(`Correct. ${updatedRemaining.length} parsing(s) still remaining for this form.`);
    setSelection(INITIAL_SELECTION);
  };

  const handleNextVerb = () => {
    loadPrompt(filters);
  };

  const displayed = reviewEntry || prompt;
  const isReviewMode = Boolean(reviewEntry);

  const feedbackAnswers = useMemo(() => {
    if (isReviewMode) {
      return reviewEntry?.answers || [];
    }

    if (status === "incorrect") {
      return remainingAnswers;
    }

    return prompt ? prompt.answers : [];
  }, [isReviewMode, prompt, remainingAnswers, reviewEntry, status]);

  const showAnswersList =
    isReviewMode || ((status === "incorrect" || status === "correct") && feedbackAnswers.length > 1);

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto font-sans transition-colors duration-300">
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(entry) => {
          setReviewEntry(entry);
          setStatus("idle");
          setStatusText("");
          setIsHistoryOpen(false);
        }}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        dataset={dataset}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <header className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Morphology Master</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Biblical Hebrew Parser</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
          >
            <History className="w-4 h-4" />
            History
          </button>

          <button
            onClick={() => setIsDarkMode((value) => !value)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        <VerbDisplay word={displayed?.word || "..."} loading={loading} />

        {(status !== "idle" || isReviewMode) && displayed && (
          <div
            className={`mb-8 p-6 rounded-xl border-l-8 shadow-md flex flex-col gap-4 ${isReviewMode
                ? "bg-gray-100 dark:bg-slate-800 border-gray-400"
                : status === "correct" || status === "partial"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                  : "bg-red-50 dark:bg-red-900/20 border-red-500"
              }`}
          >
            <div className="flex items-center gap-2">
              {isReviewMode ? (
                <History className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              ) : status === "correct" || status === "partial" ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
              <h3 className="text-xl font-bold">{isReviewMode ? "History Review" : statusText}</h3>
            </div>

            {showAnswersList && (
              <div className="text-sm md:text-base space-y-1 text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">Possible answers:</span>
                </p>
                <ul className="space-y-1">
                  {feedbackAnswers.map((answer, index) => (
                    <li key={`${answer.root}-${answer.stem}-${answer.tense}-${index}`}>{formatParsing(answer)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {isReviewMode ? (
                <button
                  onClick={() => {
                    setReviewEntry(null);
                  }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-lg font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Practice
                </button>
              ) : status === "incorrect" || status === "correct" ? (
                <button
                  onClick={handleNextVerb}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-lg font-semibold"
                >
                  <RotateCcw className="w-4 h-4" />
                  Next Verb
                </button>
              ) : null}
            </div>
          </div>
        )}

        {!isReviewMode && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors duration-300">
            <ParsingForm
              selection={selection}
              onChange={handleSelectionChange}
              onSubmit={handleSubmit}
              isSubmitted={status === "incorrect" || status === "correct"}
              disabled={loading || status === "correct" || status === "incorrect"}
              possibleAnswers={feedbackAnswers}
              stemOptions={stemOptions}
              tenseOptions={tenseOptions}
            />
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-gray-400 dark:text-gray-600 text-sm">
        <p>Fixed ParseTrainer data • Static GitHub Pages build</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
