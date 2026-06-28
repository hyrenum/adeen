import { useState } from "react";
import { Layout } from "Client/Component/Layout/Index";
import { Container } from "Client/Component/UI/Container";
import { Button } from "Client/Component/UI/Button";
import { getFeelings, getFeelingDetail } from "Server/API/Aid";

export default function Feeling() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const feelingsList = getFeelings();
  const data = selectedId ? getFeelingDetail(selectedId) : null;

  return (
    <Layout>
      <div className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">How are you feeling right now?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {feelingsList.map((f) => (
            <Button 
              key={f.id} 
              active={selectedId === f.id} 
              onClick={() => setSelectedId(f.id)} 
              fullWidth
            >
              {f.name}
            </Button>
          ))}
        </div>
        {data && (
          <>
            <Container className="!p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">From the Qur'an</p>
              <p className="text-base font-medium">“{data.verse}”</p>
              <p className="text-xs text-muted-foreground mt-2">— {data.verseRef}</p>
            </Container>
            <Container className="!p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">From the Hadith</p>
              <p className="text-base font-medium">“{data.hadith}”</p>
              <p className="text-xs text-muted-foreground mt-2">— {data.hadithRef}</p>
            </Container>
            <Container className="!p-5">
              <p className="text-sm">{data.note}</p>
            </Container>
          </>
        )}
      </div>
    </Layout>
  );
}