export interface TrainerStem {
  name: string;
}

export interface TrainerTense {
  name: string;
  abbreviation: string;
}

export interface TrainerRootKind {
  id: number;
  strong: boolean;
  name: string;
}

export interface TrainerRoot {
  root: string;
  rootKindId: number | null;
  rootKindName: string | null;
  translation: string | null;
}

export type PersonValue = "1" | "2" | "3" | null;
export type GenderValue = "m" | "f" | "c" | null;
export type NumberValue = "s" | "p" | null;

export interface TrainerVerbEntry {
  id: number;
  verb: string;
  root: string;
  stem: string;
  tense: string;
  person: PersonValue;
  gender: GenderValue;
  number: NumberValue;
}

export interface TrainerDataset {
  meta: {
    generatedAt: string;
    source: string;
    version: number;
  };
  stems: TrainerStem[];
  tenses: TrainerTense[];
  rootKinds: TrainerRootKind[];
  roots: TrainerRoot[];
  verbs: TrainerVerbEntry[];
}

export interface FilterState {
  stems: string[];
  tenses: string[];
  roots: string[];
}

export interface UserSelection {
  root: string;
  stem: string;
  tense: string;
  person: "" | "1" | "2" | "3";
  gender: "" | "m" | "f" | "c";
  number: "" | "s" | "p";
}

export interface AnswerCandidate {
  root: string;
  stem: string;
  tense: string;
  person: PersonValue;
  gender: GenderValue;
  number: NumberValue;
}

export interface Prompt {
  word: string;
  answers: AnswerCandidate[];
}

export interface HistoryEntry extends Prompt {
  createdAt: string;
}

export interface DisplayLabelMap {
  stem: Record<string, string>;
  tense: Record<string, string>;
  person: Record<string, string>;
  gender: Record<string, string>;
  number: Record<string, string>;
}

export interface OptionItem {
  value: string;
  label: string;
}

export interface LeaderboardEntry {
  id: string;
  initials: string;
  streak: number;
  created_at: string;
}

export type GameTier =
  | "none"
  | "onFire"
  | "blazing"
  | "unstoppable"
  | "legendary"
  | "transcendent";

export interface GameState {
  isGameMode: boolean;
  streak: number;
  bestStreak: number;
  currentTier: GameTier;
  lastResult: "correct" | "incorrect" | null;
  showRulesModal: boolean;
  showSubmitModal: boolean;
  pendingSubmitStreak: number;
}
