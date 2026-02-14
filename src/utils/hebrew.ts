export const normalizeHebrewText = (value: string): string => {
  return value.normalize("NFC");
};

export const normalizeRoot = (value: string): string => {
  return normalizeHebrewText(value)
    .replace(/[^א-ת]/g, "")
    .replace(/ך/g, "כ")
    .replace(/ם/g, "מ")
    .replace(/ן/g, "נ")
    .replace(/ף/g, "פ")
    .replace(/ץ/g, "צ");
};
