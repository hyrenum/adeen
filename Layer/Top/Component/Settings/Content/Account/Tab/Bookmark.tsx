import { Link } from "react-router-dom";
import { Skeleton } from "@/Top/Component/UI/Skeleton";
import { Button } from "@/Top/Component/UI/Button";
import { Container } from "@/Top/Component/UI/Container";
import { Bookmark, Trash2 } from "lucide-react";
import { surahList } from "@/Bottom/API/Quran";

interface BookmarksTabProps {
  bookmarks: any[];
  isLoading: boolean;
  removeBookmark: (id: string) => Promise<void>;
  setSettingsSidebarOpen: (open: boolean) => void;
}

export function BookmarksTab({
  bookmarks,
  isLoading,
  removeBookmark,
  setSettingsSidebarOpen,
}: BookmarksTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-[40px]" />)}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Container className="text-center py-6">
        <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No bookmarks yet</p>
      </Container>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => {
        const surah = surahList.find((s) => s.id === bookmark.surah_id);
        return (
          <Container key={bookmark.id} className="!p-3 group">
            <div className="flex items-center gap-3">
              <Link
                to={`/Quran/Surah/${bookmark.surah_id}${bookmark.ayah_id ? `?verse=${bookmark.ayah_id}` : ""}`}
                onClick={() => setSettingsSidebarOpen(false)}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium truncate">{surah?.englishName}</p>
                <p className="text-xs text-muted-foreground">
                  {bookmark.ayah_id ? `Ayah ${bookmark.ayah_id}` : "Surah"}
                </p>
              </Link>
              <Button
                onClick={() => removeBookmark(bookmark.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 p-0 rounded-full"
                size="sm"
                variant="secondary"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </Container>
        );
      })}
    </div>
  );
}