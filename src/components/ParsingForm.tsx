import React from "react";
import { Delete, Check, X } from "lucide-react";
import {
  GENDER_OPTIONS,
  HEBREW_LETTERS,
  NUMBER_OPTIONS,
  PERSON_OPTIONS,
} from "../constants";
import { AnswerCandidate, OptionItem, UserSelection } from "../types";
import { normalizeRoot } from "../utils/hebrew";

interface ParsingFormProps {
  selection: UserSelection;
  onChange: (field: keyof UserSelection, value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  isSubmitted: boolean;
  possibleAnswers?: AnswerCandidate[];
  stemOptions: OptionItem[];
  tenseOptions: OptionItem[];
}

const OptionGroup = ({
  label,
  value,
  options,
  onChange,
  disabled,
  acceptableValues,
  isSubmitted,
}: {
  label: string;
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  disabled: boolean;
  acceptableValues: Set<string>;
  isSubmitted: boolean;
}) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 ml-1">
      {label}
    </label>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option.value;
        const isCorrect = isSubmitted && acceptableValues.has(option.value);
        const isWrong = isSubmitted && isSelected && !isCorrect;

        let classes = "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-2 ";

        if (isSubmitted) {
          if (isCorrect) {
            classes +=
              "bg-green-100 dark:bg-green-900/40 border-green-500 dark:border-green-500/50 text-green-800 dark:text-green-200 ring-1 ring-green-500 shadow-sm font-bold opacity-100";
          } else if (isWrong) {
            classes +=
              "bg-red-50 dark:bg-red-900/40 border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-200 opacity-100";
          } else {
            classes += "bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700 opacity-40";
          }
        } else if (isSelected) {
          classes += "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200 dark:ring-blue-900 ring-offset-1";
        } else {
          classes += "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600";
          if (disabled) {
            classes += " opacity-50 cursor-not-allowed";
          }
        }

        return (
          <button
            key={option.value || "na"}
            onClick={() => !isSubmitted && onChange(option.value)}
            disabled={disabled}
            className={classes}
          >
            {option.label}
            {isSubmitted && isCorrect && <Check className="w-4 h-4" />}
            {isSubmitted && isWrong && <X className="w-4 h-4" />}
          </button>
        );
      })}
    </div>
  </div>
);

export const ParsingForm: React.FC<ParsingFormProps> = ({
  selection,
  onChange,
  onSubmit,
  disabled,
  isSubmitted,
  possibleAnswers = [],
  stemOptions,
  tenseOptions,
}) => {
  const handleVirtualKey = (char: string) => {
    onChange("root", selection.root + char);
  };

  const handleBackspace = () => {
    onChange("root", selection.root.slice(0, -1));
  };

  const normalizeNullable = (value: string | null | undefined) => value ?? "";

  const possibleRoots = React.useMemo(() => {
    return Array.from(new Set(possibleAnswers.map((answer) => answer.root)));
  }, [possibleAnswers]);

  const isRootCorrect = React.useMemo(() => {
    if (possibleRoots.length === 0) {
      return false;
    }

    const normalizedSelected = normalizeRoot(selection.root);
    if (normalizedSelected.length < 2) {
      return false;
    }

    return possibleRoots.some((root) => normalizeRoot(root).includes(normalizedSelected));
  }, [possibleRoots, selection.root]);

  const acceptedStemValues = React.useMemo(() => {
    return new Set(possibleAnswers.map((answer) => answer.stem));
  }, [possibleAnswers]);

  const acceptedTenseValues = React.useMemo(() => {
    return new Set(possibleAnswers.map((answer) => answer.tense));
  }, [possibleAnswers]);

  const acceptedPersonValues = React.useMemo(() => {
    return new Set(possibleAnswers.map((answer) => normalizeNullable(answer.person)));
  }, [possibleAnswers]);

  const acceptedGenderValues = React.useMemo(() => {
    return new Set(possibleAnswers.map((answer) => normalizeNullable(answer.gender)));
  }, [possibleAnswers]);

  const acceptedNumberValues = React.useMemo(() => {
    return new Set(possibleAnswers.map((answer) => normalizeNullable(answer.number)));
  }, [possibleAnswers]);

  return (
    <div className="space-y-8">
      <div>
        <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 ml-1 block">
          Root
        </label>

        <div className="relative">
          <input
            type="text"
            value={selection.root}
            onChange={(event) => onChange("root", event.target.value)}
            disabled={disabled}
            placeholder="Type or use keyboard below"
            className={`hebrew-text text-right border text-2xl rounded-xl block w-full p-3 pl-12 transition-all shadow-sm ${isSubmitted
              ? isRootCorrect
                ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                : "bg-red-50 dark:bg-red-900/20 border-red-500"
              : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
              }`}
            dir="rtl"
          />

          {isSubmitted ? (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {isRootCorrect ? (
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          ) : (
            !disabled && selection.root.length > 0 && (
              <button
                onClick={handleBackspace}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-2 rounded-full transition-colors"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            )
          )}
        </div>

        {isSubmitted && !isRootCorrect && possibleRoots.length > 0 && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium flex items-center justify-end gap-2">
            Possible Root{possibleRoots.length > 1 ? "s" : ""}:{" "}
            <span className="hebrew-text text-lg">{possibleRoots.join(" / ")}</span>
          </div>
        )}

        {!disabled && !isSubmitted && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl border border-slate-200 dark:border-gray-600 shadow-inner">
            <div className="flex flex-wrap gap-1.5 justify-center md:justify-end" dir="rtl">
              {HEBREW_LETTERS.map((char) => (
                <button
                  key={char}
                  onClick={() => handleVirtualKey(char)}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm text-lg sm:text-xl text-gray-800 dark:text-gray-100 hebrew-text transition-all active:scale-95 flex items-center justify-center"
                >
                  {char}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 dark:bg-gray-600 border border-slate-300 dark:border-gray-500 rounded-lg transition-all active:scale-95 flex items-center justify-center"
                dir="ltr"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <OptionGroup
          label="Stem"
          value={selection.stem}
          options={stemOptions}
          onChange={(value) => onChange("stem", value)}
          disabled={disabled}
          isSubmitted={isSubmitted}
          acceptableValues={acceptedStemValues}
        />

        <OptionGroup
          label="Tense"
          value={selection.tense}
          options={tenseOptions}
          onChange={(value) => onChange("tense", value)}
          disabled={disabled}
          isSubmitted={isSubmitted}
          acceptableValues={acceptedTenseValues}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <OptionGroup
            label="Person"
            value={selection.person}
            options={PERSON_OPTIONS}
            onChange={(value) => onChange("person", value)}
            disabled={disabled}
            isSubmitted={isSubmitted}
            acceptableValues={acceptedPersonValues}
          />

          <OptionGroup
            label="Gender"
            value={selection.gender}
            options={GENDER_OPTIONS}
            onChange={(value) => onChange("gender", value)}
            disabled={disabled}
            isSubmitted={isSubmitted}
            acceptableValues={acceptedGenderValues}
          />

          <OptionGroup
            label="Number"
            value={selection.number}
            options={NUMBER_OPTIONS}
            onChange={(value) => onChange("number", value)}
            disabled={disabled}
            isSubmitted={isSubmitted}
            acceptableValues={acceptedNumberValues}
          />
        </div>
      </div>

      {!isSubmitted && (
        <button
          onClick={onSubmit}
          disabled={disabled || !selection.root || !selection.stem || !selection.tense}
          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg text-base"
        >
          Check Answer
        </button>
      )}
    </div>
  );
};
