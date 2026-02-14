import rawDataset from "../data/parsetrainer-data.json";
import {
  AnswerCandidate,
  FilterState,
  Prompt,
  TrainerDataset,
  TrainerVerbEntry,
  UserSelection,
} from "../types";
import { normalizeHebrewText, normalizeRoot } from "../utils/hebrew";

const FILTER_KEY = "parsetrainer:filters:v1";

const normalizeDataset = (data: TrainerDataset): TrainerDataset => {
  return {
    ...data,
    roots: data.roots.map((root) => ({
      ...root,
      root: normalizeHebrewText(root.root),
      translation: root.translation ? normalizeHebrewText(root.translation) : root.translation,
    })),
    verbs: data.verbs.map((verb) => ({
      ...verb,
      verb: normalizeHebrewText(verb.verb),
      root: normalizeHebrewText(verb.root),
    })),
  };
};

export const dataset: TrainerDataset = normalizeDataset(rawDataset as TrainerDataset);

const normalizeNullable = (value: string | null | undefined): string => value ?? "";

const answerKey = (answer: AnswerCandidate): string => {
  return [
    answer.root,
    answer.stem,
    answer.tense,
    normalizeNullable(answer.person),
    normalizeNullable(answer.gender),
    normalizeNullable(answer.number),
  ].join("|");
};

const answerBaseKey = (answer: AnswerCandidate): string => {
  return [
    answer.root,
    answer.stem,
    answer.tense,
    normalizeNullable(answer.person),
    normalizeNullable(answer.number),
  ].join("|");
};

const canonicalizeAnswers = (answers: AnswerCandidate[]): AnswerCandidate[] => {
  const grouped = new Map<
    string,
    { base: Omit<AnswerCandidate, "gender">; genders: Set<string> }
  >();

  for (const answer of answers) {
    const key = answerBaseKey(answer);
    const group = grouped.get(key);
    const gender = normalizeNullable(answer.gender);

    if (group) {
      group.genders.add(gender);
      continue;
    }

    grouped.set(key, {
      base: {
        root: answer.root,
        stem: answer.stem,
        tense: answer.tense,
        person: answer.person,
        number: answer.number,
      },
      genders: new Set([gender]),
    });
  }

  return Array.from(grouped.values()).map(({ base, genders }) => {
    let gender: AnswerCandidate["gender"] = null;
    if (genders.has("c") || (genders.has("m") && genders.has("f"))) {
      gender = "c";
    } else if (genders.has("m")) {
      gender = "m";
    } else if (genders.has("f")) {
      gender = "f";
    }

    return {
      ...base,
      gender,
    };
  });
};

export const defaultFilters = (data: TrainerDataset): FilterState => ({
  stems: data.stems.map((stem) => stem.name),
  tenses: data.tenses.map((tense) => tense.name),
  roots: data.roots.map((root) => root.root),
});

export const sanitizeFilters = (filters: FilterState, data: TrainerDataset): FilterState => {
  const allowedStems = new Set(data.stems.map((stem) => stem.name));
  const allowedTenses = new Set(data.tenses.map((tense) => tense.name));
  const allowedRoots = new Set(data.roots.map((root) => root.root));

  const next: FilterState = {
    stems: filters.stems.filter((stem) => allowedStems.has(stem)),
    tenses: filters.tenses.filter((tense) => allowedTenses.has(tense)),
    roots: filters.roots.filter((root) => allowedRoots.has(root)),
  };

  if (next.stems.length === 0 || next.tenses.length === 0 || next.roots.length === 0) {
    return {
      stems: next.stems.length ? next.stems : data.stems.map((stem) => stem.name),
      tenses: next.tenses.length ? next.tenses : data.tenses.map((tense) => tense.name),
      roots: next.roots.length ? next.roots : data.roots.map((root) => root.root),
    };
  }

  return next;
};

export const loadSavedFilters = (data: TrainerDataset): FilterState => {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) {
      return defaultFilters(data);
    }

    const parsed = JSON.parse(raw) as FilterState;
    return sanitizeFilters(parsed, data);
  } catch (_error) {
    return defaultFilters(data);
  }
};

export const saveFilters = (filters: FilterState): void => {
  localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
};

export const filterVerbs = (data: TrainerDataset, filters: FilterState): TrainerVerbEntry[] => {
  const stems = new Set(filters.stems);
  const tenses = new Set(filters.tenses);
  const roots = new Set(filters.roots);

  return data.verbs.filter((verb) => stems.has(verb.stem) && tenses.has(verb.tense) && roots.has(verb.root));
};

export const buildPrompt = (verbs: TrainerVerbEntry[]): Prompt | null => {
  if (verbs.length === 0) {
    return null;
  }

  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
  const rawAnswers: AnswerCandidate[] = [];

  for (const verb of verbs) {
    if (verb.verb !== randomVerb.verb) {
      continue;
    }

    const answer: AnswerCandidate = {
      root: verb.root,
      stem: verb.stem,
      tense: verb.tense,
      person: verb.person,
      gender: verb.gender,
      number: verb.number,
    };

    rawAnswers.push(answer);
  }

  const answers = canonicalizeAnswers(rawAnswers);

  return {
    word: randomVerb.verb,
    answers,
  };
};

const genderMatches = (selected: string, expected: string | null): boolean => {
  const normalizedExpected = normalizeNullable(expected);

  if (selected === normalizedExpected) {
    return true;
  }

  if (selected === "c") {
    return normalizedExpected === "m" || normalizedExpected === "f";
  }

  if (normalizedExpected === "c") {
    return selected === "m" || selected === "f";
  }

  return false;
};

export const findMatchingAnswers = (
  selection: UserSelection,
  answers: AnswerCandidate[]
): AnswerCandidate[] => {
  const normalizedSelectedRoot = normalizeRoot(selection.root);
  const isRootSkipped = normalizedSelectedRoot.length === 0;

  return answers.filter((answer) => {
    const normalizedAnswerRoot = normalizeRoot(answer.root);
    const rootMatch =
      isRootSkipped ||
      (normalizedSelectedRoot.length >= 2 && normalizedAnswerRoot.includes(normalizedSelectedRoot));

    if (!rootMatch) {
      return false;
    }

    return (
      selection.stem === answer.stem &&
      selection.tense === answer.tense &&
      selection.person === normalizeNullable(answer.person) &&
      genderMatches(selection.gender, answer.gender) &&
      selection.number === normalizeNullable(answer.number)
    );
  });
};

export const removeAnswered = (
  answers: AnswerCandidate[],
  matched: AnswerCandidate[]
): AnswerCandidate[] => {
  if (matched.length === 0) {
    return answers;
  }

  const matchedKeys = new Set(matched.map((answer) => answerKey(answer)));
  return answers.filter((answer) => !matchedKeys.has(answerKey(answer)));
};
