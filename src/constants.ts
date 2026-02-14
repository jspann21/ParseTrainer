import { DisplayLabelMap, UserSelection } from "./types";

export const INITIAL_SELECTION: UserSelection = {
  root: "",
  stem: "",
  tense: "",
  person: "",
  gender: "",
  number: "",
};

export const HEBREW_KEYBOARD_ROWS = [
  ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ"],
  ["ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת"],
];

export const PERSON_OPTIONS = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "", label: "N/A" },
];

export const GENDER_OPTIONS = [
  { value: "m", label: "Masculine" },
  { value: "f", label: "Feminine" },
  { value: "c", label: "Common" },
  { value: "", label: "N/A" },
];

export const NUMBER_OPTIONS = [
  { value: "s", label: "Singular" },
  { value: "p", label: "Plural" },
  { value: "", label: "N/A" },
];

export const DISPLAY_LABELS: DisplayLabelMap = {
  stem: {
    Qal: "Qal",
    Niphal: "Niphal",
    Piel: "Piel",
    Pual: "Pual",
    Hiphil: "Hiphil",
    Hophal: "Hophal",
    Hitpael: "Hithpael",
  },
  tense: {
    perfect: "Perfect (Qatal)",
    imperfect: "Imperfect (Yiqtol)",
    cohortative: "Cohortative",
    imperative: "Imperative",
    jussive: "Jussive",
    "infinitive construct": "Infinitive Construct",
    "infinitive absolute": "Infinitive Absolute",
    participle: "Participle",
    "passive participle (qal)": "Passive Participle (Qal)",
  },
  person: {
    "1": "1st",
    "2": "2nd",
    "3": "3rd",
    "": "N/A",
  },
  gender: {
    m: "Masculine",
    f: "Feminine",
    c: "Common",
    "": "N/A",
  },
  number: {
    s: "Singular",
    p: "Plural",
    "": "N/A",
  },
};
