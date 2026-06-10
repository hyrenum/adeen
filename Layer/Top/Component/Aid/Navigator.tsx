// Layer/Top/Component/Aid/Navigator.tsx
// Dropdown-style breadcrumb navigator for Dua + Hadith pages,
// modelled on Quran_Navigator. Lets the user drill into another
// category / collection / chapter / hadith without leaving the header.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ArrowLeft, Check, Search } from "lucide-react";
import { useIsMobile } from "@/Middle/Hook/Use-Mobile";
import { Button } from "@/Top/Component/UI/Button";
import { Container } from "@/Top/Component/UI/Container";
import { Input } from "@/Top/Component/UI/Input";
import { cn } from "@/Middle/Library/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Top/Component/UI/Dropdown-Menu";
import { duaCategories } from "@/Bottom/API/Aid";
import {
  hadithCollections,
  getChaptersByCollection,
  getChapter,
} from "@/Bottom/API/Hadith";

// ---------- route parsing ----------
type AidMode = "dua" | "hadith";

function parseRoute(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "Aid" && parts[1] === "Dua") {
    return {
      mode: "dua" as AidMode,
      duaCategoryId: parts[2] ? decodeURIComponent(parts[2]) : undefined,
    };
  }
  if (parts[0] === "Hadith") {
    return {
      mode: "hadith" as AidMode,
      collectionSlug: parts[1],
      chapterId: parts[2],
      hadithId: parts[3] ? parseInt(parts[3], 10) : undefined,
    };
  }
  return null;
}

export function isAidPath(pathname: string) {
  return parseRoute(pathname) !== null;
}

function idFromName(name: string): string {
  return name.replace(/\s+/g, "-");
}

// ---------- component ----------
type DuaLevel = "category";
type HadithLevel = "collection" | "chapter" | "hadith";
type Level = DuaLevel | HadithLevel;

export function Aid_Navigator() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const route = parseRoute(location.pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Level>(() => {
    if (route?.mode === "dua") return "category";
    if (route?.mode === "hadith") {
      if (route.hadithId) return "hadith";
      if (route.chapterId) return "chapter";
      return "collection";
    }
    return "collection";
  });

  // Drill state for Hadith chapter/hadith levels
  const [drillCollection, setDrillCollection] = useState<string | undefined>(
    route?.mode === "hadith" ? route.collectionSlug : undefined
  );
  const [drillChapter, setDrillChapter] = useState<string | undefined>(
    route?.mode === "hadith" ? route.chapterId : undefined
  );
  const [drillStep, setDrillStep] =
    useState<"collection" | "chapter" | "hadith">("collection");

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTop, setMobileTop] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target) ||
        (target as Element)?.closest?.(".aid-navigator-dropdown")
      )
        return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const toggle = () => {
    if (!isOpen) {
      if (isMobile && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMobileTop(rect.bottom + 8);
      }
      setSearchQuery("");
      if (route?.mode === "hadith") {
        setDrillCollection(route.collectionSlug);
        setDrillChapter(route.chapterId);
        setDrillStep(
          activeTab === "collection"
            ? "collection"
            : activeTab === "chapter"
            ? route.collectionSlug
              ? "chapter"
              : "collection"
            : route.chapterId
            ? "hadith"
            : route.collectionSlug
            ? "chapter"
            : "collection"
        );
      }
    }
    setIsOpen((p) => !p);
  };

  // ----- commit helpers -----
  const goDuaCategory = (name: string) => {
    navigate(`/Aid/Dua/${idFromName(name)}`);
    setIsOpen(false);
  };

  const commitCollection = useCallback(
    (slug: string) => {
      if (activeTab === "collection") {
        navigate(`/Hadith/${slug}`);
        setIsOpen(false);
        return;
      }
      setDrillCollection(slug);
      setDrillStep("chapter");
    },
    [activeTab, navigate]
  );

  const commitChapter = useCallback(
    (chapterId: string) => {
      if (!drillCollection) return;
      if (activeTab === "chapter") {
        navigate(`/Hadith/${drillCollection}/${chapterId}`);
        setIsOpen(false);
        return;
      }
      setDrillChapter(chapterId);
      setDrillStep("hadith");
    },
    [activeTab, drillCollection, navigate]
  );

  const commitHadith = useCallback(
    (hadithId: number) => {
      if (!drillCollection || !drillChapter) return;
      navigate(`/Hadith/${drillCollection}/${drillChapter}/${hadithId}`);
      setIsOpen(false);
    },
    [drillCollection, drillChapter, navigate]
  );

  // ----- derived data -----
  const filteredDuaCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return duaCategories.filter((c) =>
      !q ? true : c.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredCollections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return hadithCollections.filter((c) =>
      !q
        ? true
        : c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const chaptersForDrill = useMemo(() => {
    if (!drillCollection) return [];
    const list = getChaptersByCollection(drillCollection);
    const q = searchQuery.toLowerCase().trim();
    return q
      ? list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.id.toString().includes(q)
        )
      : list;
  }, [drillCollection, searchQuery]);

  const hadithIdsForDrill = useMemo(() => {
    if (!drillCollection || !drillChapter) return [];
    const chap = getChapter(drillCollection, drillChapter);
    return chap?.hadith.map((h) => h.id) ?? [];
  }, [drillCollection, drillChapter]);

  // ----- picker render -----
  const itemBase =
    "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10";
  const itemActive = "bg-black/5 dark:bg-white/5 font-medium";

  const renderPicker = () => {
    if (route?.mode === "dua") {
      return (
        <div className="overflow-y-auto space-y-0.5 max-h-full">
          {filteredDuaCategories.map((c) => (
            <button
              key={c.name}
              onClick={() => goDuaCategory(c.name)}
              className={cn(
                itemBase,
                route.duaCategoryId === idFromName(c.name) && itemActive
              )}
            >
              {c.name}
            </button>
          ))}
          {filteredDuaCategories.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">No results</p>
          )}
        </div>
      );
    }

    // Hadith mode
    if (activeTab === "collection" || drillStep === "collection") {
      return (
        <div className="overflow-y-auto space-y-0.5 max-h-full">
          {filteredCollections.map((c) => (
            <button
              key={c.slug}
              onClick={() => commitCollection(c.slug)}
              className={cn(
                itemBase,
                (route?.mode === "hadith" && route.collectionSlug === c.slug) &&
                  itemActive
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      );
    }

    if (drillStep === "chapter") {
      return (
        <div className="flex flex-col max-h-full">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setDrillStep("collection")}
              className="p-1 rounded hover:bg-muted/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground truncate">
              {drillCollection}
            </span>
          </div>
          <div className="overflow-y-auto space-y-0.5 p-1">
            {chaptersForDrill.map((c) => (
              <button
                key={c.id}
                onClick={() => commitChapter(c.id)}
                className={cn(
                  itemBase,
                  route?.mode === "hadith" &&
                    route.chapterId === c.id &&
                    itemActive
                )}
              >
                <span className="text-muted-foreground mr-2">{c.id}.</span>
                {c.name}
              </button>
            ))}
            {chaptersForDrill.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">No results</p>
            )}
          </div>
        </div>
      );
    }

    // hadith step
    return (
      <div className="flex flex-col max-h-full">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => setDrillStep("chapter")}
            className="p-1 rounded hover:bg-muted/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground truncate">
            {drillCollection} · Ch. {drillChapter}
          </span>
        </div>
        <div className="overflow-y-auto grid grid-cols-5 gap-1 p-1">
          {hadithIdsForDrill.map((id) => (
            <button
              key={id}
              onClick={() => commitHadith(id)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10",
                route?.mode === "hadith" && route.hadithId === id && itemActive
              )}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ----- tab options & current label -----
  const tabOptions = useMemo(() => {
    if (route?.mode === "dua") {
      return [{ id: "category" as Level, label: "Category" }];
    }
    const opts: { id: Level; label: string }[] = [
      { id: "collection", label: "Collection" },
    ];
    if (route?.mode === "hadith" && route.collectionSlug) {
      opts.push({ id: "chapter", label: "Chapter" });
      if (route.chapterId) opts.push({ id: "hadith", label: "Hadith" });
    }
    return opts;
  }, [route]);

  const buttonLabel = useMemo(() => {
    if (route?.mode === "dua") {
      return route.duaCategoryId
        ? route.duaCategoryId.replace(/-/g, " ")
        : "Categories";
    }
    if (route?.mode === "hadith") {
      if (route.hadithId) return `Hadith ${route.hadithId}`;
      if (route.chapterId) {
        const chap = getChapter(route.collectionSlug!, route.chapterId);
        return chap?.name ?? `Chapter ${route.chapterId}`;
      }
      if (route.collectionSlug) {
        const c = hadithCollections.find((x) => x.slug === route.collectionSlug);
        return c?.name ?? route.collectionSlug;
      }
      return "Hadith";
    }
    return "";
  }, [route]);

  const showSearch =
    route?.mode === "dua" ||
    activeTab === "collection" ||
    drillStep === "collection" ||
    drillStep === "chapter";

  const mobilePanelStyle = {
    top: `${mobileTop}px`,
    left: 0,
    right: 0,
    maxHeight: `calc(100vh - ${mobileTop}px - 0.5rem)`,
  };

  // On index pages (no specific item selected) render the label as plain text
  const isIndexOnly =
    (route?.mode === "dua" && !route.duaCategoryId) ||
    (route?.mode === "hadith" && !route.collectionSlug);

  if (isIndexOnly) {
    return (
      <span className="inline-flex items-center px-3 py-1 h-8 sm:h-9 text-sm font-medium truncate max-w-[200px] sm:max-w-[280px]">
        {buttonLabel}
      </span>
    );
  }

  return (
    <div className={cn("relative", isMobile ? "w-full" : "inline-block")}>
      <Button
        ref={buttonRef}
        onClick={toggle}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 h-8 sm:h-9",
          !isMobile && isOpen ? "w-72 justify-between rounded-b-none" : "w-auto justify-center"
        )}
        variant="ghost"
      >
        <span className="truncate max-w-[150px] sm:max-w-[220px]">
          {buttonLabel}
        </span>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
      </Button>

      {isOpen && (
        <div
          ref={panelRef}
          className={
            isMobile
              ? "fixed z-50 overflow-auto"
              : "absolute top-full left-0 right-0 mt-0 z-50"
          }
          style={isMobile ? mobilePanelStyle : undefined}
        >
          <Container className={cn("!p-3", !isMobile && "!rounded-t-none")}>
            <div className="flex items-center gap-2 mb-2">
              {tabOptions.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-medium px-2 py-1"
                    >
                      {tabOptions.find((o) => o.id === activeTab)?.label ??
                        "Browse"}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="aid-navigator-dropdown min-w-[140px]"
                  >
                    {tabOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.id}
                        onClick={() => {
                          setActiveTab(opt.id);
                          setSearchQuery("");
                          if (route?.mode === "hadith") {
                            setDrillCollection(route.collectionSlug);
                            setDrillChapter(route.chapterId);
                            setDrillStep(
                              opt.id === "collection"
                                ? "collection"
                                : opt.id === "chapter"
                                ? "chapter"
                                : "hadith"
                            );
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between text-xs",
                          activeTab === opt.id && "font-medium"
                        )}
                      >
                        {opt.label}
                        {activeTab === opt.id && (
                          <Check className="h-3 w-3 ml-2" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-xs font-medium px-2 py-1 text-muted-foreground">
                  {tabOptions[0]?.label}
                </span>
              )}

              {showSearch && (
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
              )}
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: `calc(${mobilePanelStyle.maxHeight} - 4rem)` }}
            >
              {renderPicker()}
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
