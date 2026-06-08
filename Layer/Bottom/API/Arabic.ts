import data from "@/Bottom/Data/Aid/Arabic/Vocabulary.json";

export interface ArabicWord {
  id: string;
  english: string;
  arabic: string;
  transliteration: string;
  definition: string;
  root?: string;        // e.g. "k-t-b"
  diminutive?: string;  // e.g. "كُتَيِّب"
}

export interface ArabicSubcategory {
  id: string;
  name: string;
  arabicName: string;
  words: ArabicWord[];
}

export interface ArabicCategory {
  id: string;
  name: string;
  arabicName: string;
  subcategories: ArabicSubcategory[];
}

export function getArabicCategories(): ArabicCategory[] {
  return (data as { categories: ArabicCategory[] }).categories;
}

export function getArabicCategory(id: string): ArabicCategory | undefined {
  return getArabicCategories().find((c) => c.id === id);
}

export function getArabicSubcategory(catId: string, subId: string): ArabicSubcategory | undefined {
  return getArabicCategory(catId)?.subcategories.find((s) => s.id === subId);
}

export function getArabicWord(catId: string, subId: string, wordId: string): ArabicWord | undefined {
  return getArabicSubcategory(catId, subId)?.words.find((w) => w.id === wordId);
}
