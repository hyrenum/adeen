// Client/Component/Layout/Header/Navigator/Aid.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "Client/Component/UI/Button";
import { cn } from "Client/Library/utils";
import { NavigatorLayout } from "./Utility";
import { 
  getAllDuaCategories, 
  getLetters,
  getProphets,
  getArticles,
  getPillars,
  getFeelings,
  getArabicCategories,
  getArabicCategory,
  getArabicSubcategory,
  getTajweedCategories,
  getTajweedCategoryDetail,
  getTajweedSubcategory
} from "Server/API/Aid";

type ViewDepth = "Category" | "Subcategory" | "Sub-Subcategory" | "Detail";
type DrillState = "root" | "module-select" | "category-select" | "subcategory-select";

interface AidNavigatorProps {
  onOpenChange?: (open: boolean) => void;
}

const ALLOWED_SECTIONS = ["Feeling", "Prophets", "Arabic", "Dua", "Pillars", "Articles"];

const SECTION_LABELS: Record<string, string> = {
  Dua: "Dua",
  Prophets: "Prophets",
  Articles: "6 Articles of Faith",
  Pillars: "5 Pillars",
  Feeling: "Feelings",
  Arabic: "Arabic",
};

function parseAidRoute(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "Aid" && parts[1]) {
    let section = parts[1];

    const isTajweed = section === "Tajweed" || parts[2] === "Tajweed";
    const isAlphabet = section === "Alphabet" || parts[2] === "Alphabet";
    const isVocabulary = section === "Vocabulary" || parts[2] === "Vocabulary";

    if (section === "Alphabet" || section === "Vocabulary" || section === "Tajweed") {
      section = "Arabic";
    }

    if (!ALLOWED_SECTIONS.includes(section)) {
      return null;
    }

    const hasSubfolder = parts[2] === "Tajweed" || parts[2] === "Vocabulary" || parts[2] === "Alphabet";
    const p1 = hasSubfolder ? parts[3] : parts[2];
    const p2 = hasSubfolder ? parts[4] : parts[3];
    const p3 = hasSubfolder ? parts[5] : parts[4];

    // For non-Arabic sections, only mount the navigator when inside a specific item
    if (section !== "Arabic" && !p1) {
      return null;
    }

    return {
      sectionSlug: section,
      isTajweed,
      isAlphabet,
      isVocabulary,
      param1: p1,
      param2: p2,
      param3: p3,
    };
  }
  return null;
}

export function Aid_Navigator({ onOpenChange }: AidNavigatorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const route = parseAidRoute(location.pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentDepth, setCurrentDepth] = useState<ViewDepth>("Category");
  const [isMobileDepthOpen, setIsMobileDepthOpen] = useState(false);
  const [isDesktopDepthOpen, setIsDesktopDepthOpen] = useState(false);
  
  // Drill-down sequence state trackers mirroring the Hadith schema engine
  const [drillStep, setDrillStep] = useState<DrillState>("root");
  const [selectedModule, setSelectedModule] = useState<"Vocabulary" | "Tajweed" | "Alphabet" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isLockActive = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!route) return null;

  const activeSection = route.sectionSlug;
  const isArabicModule = activeSection === "Arabic";
  const sectionLabel = SECTION_LABELS[activeSection] ?? "Aid";

  useEffect(() => {
    if (!isArabicModule) {
      setCurrentDepth("Category");
      return;
    }
    
    if (isLockActive.current) {
      return;
    }
    
    if (route.param3 || route.isAlphabet) {
      setCurrentDepth("Detail");
    } else if (route.param2) {
      setCurrentDepth("Sub-Subcategory");
    } else if (route.param1) {
      setCurrentDepth("Subcategory");
    } else {
      setCurrentDepth("Category");
    }
  }, [location.pathname, isArabicModule, route]);

  // Synchronize internal layout branches with explicit depth dropdown updates
  useEffect(() => {
    setDrillStep("root");
    setSelectedModule(null);
    setSelectedCategory(null);
  }, [currentDepth]);

  useEffect(() => {
    onOpenChange?.(isOpen);
    return () => onOpenChange?.(false);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isMobileDepthOpen && !isDesktopDepthOpen) return;
    const handleOutsideClick = () => {
      setIsMobileDepthOpen(false);
      setIsDesktopDepthOpen(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [isMobileDepthOpen, isDesktopDepthOpen]);

  const closeAll = () => {
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery("");
    setIsMobileDepthOpen(false);
    setIsDesktopDepthOpen(false);
    setDrillStep("root");
    setSelectedModule(null);
    setSelectedCategory(null);
    isLockActive.current = false;
  };

  const handleGoBack = useCallback(() => {
    if (drillStep === "subcategory-select") {
      setDrillStep("category-select");
    } else if (drillStep === "category-select") {
      setDrillStep("module-select");
    } else if (drillStep === "module-select") {
      setDrillStep("root");
      setSelectedModule(null);
    }
  }, [drillStep]);

  const showGoBack = useMemo(() => {
    return isArabicModule && drillStep !== "root";
  }, [isArabicModule, drillStep]);

  const sectionItems = useMemo(() => {
    const items: { slug: string; name: string; isBranchTrigger?: boolean; branchAction?: () => void }[] = [];
    
    if (isArabicModule) {
      if (currentDepth === "Category") {
        items.push({ slug: "Aid/Arabic/Tajweed", name: "Tajweed" });
        items.push({ slug: "Aid/Arabic/Vocabulary", name: "Vocabulary" });
        items.push({ slug: "Aid/Arabic/Alphabet", name: "Alphabet" });
      } 
      else if (currentDepth === "Subcategory") {
        if (drillStep === "root") {
          items.push({ slug: "", name: "Vocabulary", isBranchTrigger: true, branchAction: () => { setSelectedModule("Vocabulary"); setDrillStep("module-select"); } });
          items.push({ slug: "", name: "Tajweed", isBranchTrigger: true, branchAction: () => { setSelectedModule("Tajweed"); setDrillStep("module-select"); } });
        } else if (selectedModule === "Vocabulary") {
          getArabicCategories()?.forEach((c) => {
            const data = getArabicCategory(c.id);
            if (!data?.subfolders && !data?.subFolderCategory?.length) {
              items.push({ slug: `Aid/Arabic/Vocabulary/${c.id}`, name: c.name });
            }
          });
        } else if (selectedModule === "Tajweed") {
          getTajweedCategories()?.forEach((t) => {
            const data = getTajweedCategoryDetail(t.id);
            if (!data?.subfolders?.length) {
              items.push({ slug: `Aid/Arabic/Tajweed/${t.id}`, name: t.name });
            }
          });
        }
      } 
      else if (currentDepth === "Sub-Subcategory") {
        if (drillStep === "root") {
          items.push({ slug: "", name: "Vocabulary", isBranchTrigger: true, branchAction: () => { setSelectedModule("Vocabulary"); setDrillStep("module-select"); } });
          items.push({ slug: "", name: "Tajweed", isBranchTrigger: true, branchAction: () => { setSelectedModule("Tajweed"); setDrillStep("module-select"); } });
        } 
        else if (drillStep === "module-select") {
          if (selectedModule === "Vocabulary") {
            getArabicCategories()?.forEach((c) => {
              const data = getArabicCategory(c.id);
              if (!data?.subfolders && !data?.subFolderCategory?.length) {
                items.push({ slug: "", name: c.name, isBranchTrigger: true, branchAction: () => { setSelectedCategory(c.id); setDrillStep("category-select"); } });
              }
            });
          } else if (selectedModule === "Tajweed") {
            getTajweedCategories()?.forEach((t) => {
              const data = getTajweedCategoryDetail(t.id);
              if (!data?.subfolders?.length && data?.subcategories?.length) {
                items.push({ slug: "", name: t.name, isBranchTrigger: true, branchAction: () => { setSelectedCategory(t.id); setDrillStep("category-select"); } });
              }
            });
          }
        } 
        else if (drillStep === "category-select" && selectedCategory) {
          if (selectedModule === "Vocabulary") {
            getArabicCategory(selectedCategory)?.subcategories?.forEach((sub) => {
              items.push({ slug: `Aid/Arabic/Vocabulary/${selectedCategory}/${sub.id}`, name: sub.name });
            });
          } else if (selectedModule === "Tajweed") {
            getTajweedCategoryDetail(selectedCategory)?.subcategories?.forEach((sub) => {
              items.push({ slug: `Aid/Arabic/Tajweed/${selectedCategory}/${sub.id}`, name: sub.name });
            });
          }
        }
      } 
      else if (currentDepth === "Detail") {
        if (drillStep === "root") {
          items.push({ slug: "", name: "Vocabulary", isBranchTrigger: true, branchAction: () => { setSelectedModule("Vocabulary"); setDrillStep("module-select"); } });
          items.push({ slug: "", name: "Tajweed", isBranchTrigger: true, branchAction: () => { setSelectedModule("Tajweed"); setDrillStep("module-select"); } });
          items.push({ slug: "", name: "Alphabet", isBranchTrigger: true, branchAction: () => { setSelectedModule("Alphabet"); setDrillStep("module-select"); } });
        } 
        else if (drillStep === "module-select") {
          if (selectedModule === "Alphabet") {
            getLetters()?.forEach((l) => {
              items.push({ slug: `Aid/Arabic/Alphabet/${l.id}`, name: `Letter ${l.name}` });
            });
          } else if (selectedModule === "Vocabulary") {
            getArabicCategories()?.forEach((c) => {
              const data = getArabicCategory(c.id);
              if (!data?.subfolders && !data?.subFolderCategory?.length) {
                items.push({ slug: "", name: c.name, isBranchTrigger: true, branchAction: () => { setSelectedCategory(c.id); setDrillStep("category-select"); } });
              }
            });
          } else if (selectedModule === "Tajweed") {
            getTajweedCategories()?.forEach((t) => {
              const data = getTajweedCategoryDetail(t.id);
              if (!data?.subfolders?.length) {
                items.push({ slug: "", name: t.name, isBranchTrigger: true, branchAction: () => { setSelectedCategory(t.id); setDrillStep("category-select"); } });
              }
            });
          }
        }
        else if (drillStep === "category-select" && selectedCategory) {
          if (selectedModule === "Vocabulary") {
            getArabicCategory(selectedCategory)?.subcategories?.forEach((sub) => {
              items.push({ slug: "", name: sub.name, isBranchTrigger: true, branchAction: () => { setSelectedCategory(sub.id); setDrillStep("subcategory-select"); } });
            });
          } else if (selectedModule === "Tajweed") {
            getTajweedCategoryDetail(selectedCategory)?.subcategories?.forEach((sub) => {
              items.push({ slug: "", name: sub.name, isBranchTrigger: true, branchAction: () => { setSelectedCategory(sub.id); setDrillStep("subcategory-select"); } });
            });
          }
        }
        else if (drillStep === "subcategory-select" && selectedCategory) {
          // Resolve previous active state tracking keys to execute terminal list queries safely
          const originalCatId = route.param1 || "";
          if (selectedModule === "Vocabulary") {
            getArabicSubcategory(originalCatId, selectedCategory)?.words?.forEach((w) => {
              items.push({ slug: `Aid/Arabic/Vocabulary/${originalCatId}/${selectedCategory}/${w.id}`, name: w.english });
            });
          } else if (selectedModule === "Tajweed") {
            getTajweedSubcategory(originalCatId, selectedCategory)?.rules?.forEach((r: any) => {
              items.push({ slug: `Aid/Arabic/Tajweed/${originalCatId}/${selectedCategory}/${r.id}`, name: r.name });
            });
          }
        }
      }
    } 
    else if (activeSection === "Dua") {
      getAllDuaCategories()?.forEach((d) => {
        items.push({ slug: `Aid/Dua/${d.name.replace(/ /g, "-")}`, name: d.name });
      });
    } else if (activeSection === "Prophets") {
      getProphets()?.forEach((p) => {
        items.push({ slug: `Aid/Prophets/${encodeURIComponent(p.id)}`, name: p.title });
      });
    } else if (activeSection === "Articles") {
      getArticles()?.forEach((a) => {
        items.push({ slug: `Aid/Articles/${a.id}`, name: a.name });
      });
    } else if (activeSection === "Pillars") {
      getPillars()?.forEach((p) => {
        items.push({ slug: `Aid/Pillars/${p.id}`, name: `${p.name} (${p.english})` });
      });
    } else if (activeSection === "Feeling") {
      getFeelings()?.forEach((f) => {
        items.push({ slug: `Aid/Feeling/${f.id}`, name: f.name });
      });
    }
    return items;
  }, [activeSection, currentDepth, route, isArabicModule, drillStep, selectedModule, selectedCategory]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sectionItems.filter((item) => !q || item.name.toLowerCase().includes(q));
  }, [sectionItems, searchQuery]);

  const handleDepthSelect = (depth: ViewDepth, screenMode: "mobile" | "desktop") => {
    isLockActive.current = true;
    if (screenMode === "mobile") {
      setIsMobileDepthOpen(false);
    } else {
      setIsDesktopDepthOpen(false);
    }
    setCurrentDepth(depth);
    setSearchQuery("");
  };

  const renderHeaderLeftDropdown = (isOpenState: boolean, setOpenState: (o: boolean) => void, screenMode: "mobile" | "desktop") => {
    return (
      <div className="relative inline-block text-left max-w-full z-[10002]">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1 px-2.5 text-xs font-medium text-foreground max-w-full justify-between rounded-full bg-[#fafafa]/80 backdrop-blur-sm [.high-contrast_&]:bg-white [.high-contrast_&]:border-black",
            screenMode === "mobile" ? "h-8" : "h-7"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (isArabicModule) setOpenState(!isOpenState);
          }}
        >
          {isArabicModule ? currentDepth : sectionLabel}
          {isArabicModule && (
            <ChevronDown className={cn("h-5 w-5 ml-1 transition-transform duration-200", isOpenState && "rotate-180")} />
          )}
        </Button>

        {isOpenState && isArabicModule && (
          <div className="absolute left-0 top-full mt-1 min-w-[150px] border border-border/40 bg-popover text-popover-foreground z-[10003] overflow-hidden rounded-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {(["Category", "Subcategory", "Sub-Subcategory", "Detail"] as ViewDepth[]).map((depth) => (
              <button
                key={depth}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDepthSelect(depth, screenMode);
                }}
                className={cn(
                  "w-full flex items-center justify-between text-left px-4 py-2.5 text-xs font-medium rounded-none h-auto border-0 bg-transparent transition-colors duration-200 focus:outline-none sm:hover:bg-accent sm:hover:text-accent-foreground",
                  currentDepth === depth ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground"
                )}
              >
                {depth}
                {currentDepth === depth && <Check className="h-5 w-5 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const nativeButtonBase = "w-full justify-start text-left font-normal truncate text-xs h-12 sm:h-9 rounded-lg px-3 sm:px-4 shrink-0 inline-flex items-center gap-2 py-2 transition-colors duration-200 focus:outline-none border snap-start";

  const getNativeButtonClassName = (isActive: boolean) => {
    return cn(
      nativeButtonBase,
      isActive
        ? "bg-accent text-accent-foreground font-semibold border-border/60"
        : "bg-card border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
    );
  };

  return (
    <NavigatorLayout
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      buttonLabel={sectionLabel}
      inputRef={inputRef}
      renderMobileHeaderLeft={() => renderHeaderLeftDropdown(isMobileDepthOpen, setIsMobileDepthOpen, "mobile")}
      renderDesktopHeaderLeft={() => renderHeaderLeftDropdown(isDesktopDepthOpen, setIsDesktopDepthOpen, "desktop")}
      showGoBack={showGoBack}
      onGoBack={handleGoBack}
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {filteredItems.map((item, index) => {
          if (item.isBranchTrigger) {
            return (
              <button
                key={`branch-${index}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  item.branchAction?.();
                }}
                className={getNativeButtonClassName(false)}
              >
                <span className="truncate">{item.name}</span>
              </button>
            );
          }

          const isSelected = location.pathname.toLowerCase().endsWith(item.slug.toLowerCase());
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => {
                isLockActive.current = false;
                navigate(`/${item.slug}`);
                closeAll();
              }}
              className={getNativeButtonClassName(isSelected)}
            >
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}

        {filteredItems.length === 0 && (
          <p className="text-xs text-muted-foreground p-8 text-center">
            No entries found matching specified layout
          </p>
        )}
      </div>
    </NavigatorLayout>
  );
}

export function isAidPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "Aid" || !parts[1]) return false;

  let section = parts[1];
  if (section === "Alphabet" || section === "Vocabulary" || section === "Tajweed") {
    section = "Arabic";
  }

  const allowed = ["Feeling", "Prophets", "Arabic", "Dua", "Pillars", "Articles"];
  if (!allowed.includes(section)) return false;

  // For non-Arabic sections, only show the navigator when inside a specific item
  if (section !== "Arabic") {
    const hasSubfolder = parts[2] === "Tajweed" || parts[2] === "Vocabulary" || parts[2] === "Alphabet";
    const p1 = hasSubfolder ? parts[3] : parts[2];
    if (!p1) return false;
  }

  return true;
}