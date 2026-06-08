import { Link } from "react-router-dom";
import { Skeleton } from "@/Top/Component/UI/Skeleton";
import { Button } from "@/Top/Component/UI/Button";
import { Container } from "@/Top/Component/UI/Container";
import { FileText, Trash2 } from "lucide-react";
import { surahList } from "@/Bottom/API/Quran";

interface NotesTabProps {
  notes: any[];
  isLoading: boolean;
  deleteNote: (id: string) => Promise<void>;
  setSettingsSidebarOpen: (open: boolean) => void;
}

export function NotesTab({
  notes,
  isLoading,
  deleteNote,
  setSettingsSidebarOpen,
}: NotesTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-[40px]" />)}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Container className="text-center py-6">
        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No notes yet</p>
      </Container>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => {
        const surah = surahList.find((s) => s.id === note.surah_id);
        return (
          <Container key={note.id} className="!p-3 group relative">
            <Link
              to={`/Quran/Surah/${note.surah_id}${note.ayah_id ? `?verse=${note.ayah_id}` : ""}`}
              onClick={() => setSettingsSidebarOpen(false)}
              className="block"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary">
                  {surah?.englishName} {note.ayah_id ? `${note.surah_id}:${note.ayah_id}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">{note.content}</p>
            </Link>
            <Button
              onClick={() => deleteNote(note.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 rounded-full"
              size="sm"
              variant="secondary"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </Container>
        );
      })}
    </div>
  );
}