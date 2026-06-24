import { useQuery } from "@tanstack/react-query";

export interface Hadith {
  i: number;           
  id: string;          
  num: number;         
  ar: string;          
  en: string;          
  na: string;          
}

export interface HadithChapterMeta {
  id: string;
  name: string;
  count: number;
  hadithRange: string;
}

export interface HadithChapter extends HadithChapterMeta {
  hadiths: Hadith[];
}

export interface HadithCollection {
  id: string;          
  slug: string;
  name: string;
  author: string;
  topFolder: string;   
  authorFolder: string;
  hadithCount: number;
  description: string;
}

// 🌟 Synchronous placeholder mirror array for immediate layout renders
export const hadithCollections: HadithCollection[] = [
  {
    id: "Sahih-Muslim",
    slug: "Sahih-Muslim",
    name: "Sahih Muslim",
    author: "Muslim",
    topFolder: "Sahih",
    authorFolder: "Muslim",
    hadithCount: 0, 
    description: "Sahih collection compiled by Muslim."
  }
];

// 🌟 Clean fetch function tied to React Query
export async function fetchHadithCorpus() {
  const response = await fetch("/RAG/HadithCorpus.json");
  if (!response.ok) throw new Error("Failed to load Hadith asset database.");
  
  const data = await response.json();
  
  // Keep the synchronous placeholder array updated when data arrives
  if (data?.collections) {
    data.collections.forEach((fresh: any) => {
      const existing = hadithCollections.find(c => c.slug.toLowerCase() === fresh.slug.toLowerCase());
      if (existing) {
        existing.hadithCount = fresh.hadithCount;
        existing.slug = fresh.slug;
      } else {
        hadithCollections.push({
          id: fresh.id,
          slug: fresh.slug,
          name: fresh.name,
          author: fresh.author,
          topFolder: fresh.topFolder,
          authorFolder: fresh.authorFolder,
          hadithCount: fresh.hadithCount,
          description: fresh.description
        });
      }
    });
  }
  
  return data;
}

// 🌟 Main Hook: Handles all global reactive memory updates completely automatically
export function useHadithCorpus() {
  return useQuery({
    queryKey: ["hadithCorpus"],
    queryFn: fetchHadithCorpus,
    staleTime: Infinity, // The JSON file doesn't change at runtime, keep it cached
  });
}