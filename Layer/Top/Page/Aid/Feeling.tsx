import { useState } from "react";
import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";

const FEELINGS: Record<string, { verse: string; ref: string; note: string }> = {
  Anxious: { verse: "Verily, in the remembrance of Allah do hearts find rest.", ref: "Qur'an 13:28", note: "Try reciting Surah Ash-Sharh." },
  Sad: { verse: "Do not grieve; indeed Allah is with us.", ref: "Qur'an 9:40", note: "Take a moment for dhikr." },
  Grateful: { verse: "If you are grateful, I will surely increase you.", ref: "Qur'an 14:7", note: "Say 'Alhamdulillah' often today." },
  Angry: { verse: "Those who restrain anger and pardon people — Allah loves the doers of good.", ref: "Qur'an 3:134", note: "Seek refuge from Shaytan and make wudu." },
  Hopeless: { verse: "Do not despair of the mercy of Allah.", ref: "Qur'an 39:53", note: "Make du'a sincerely." },
  Lost: { verse: "Whoever puts his trust in Allah — He will be sufficient for him.", ref: "Qur'an 65:3", note: "Pray two rak'ahs of Istikhara." },
};

export default function Feeling() {
  const [selected, setSelected] = useState<string | null>(null);
  const data = selected ? FEELINGS[selected] : null;

  return (
    <Layout>
      <div className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">How are you feeling right now?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.keys(FEELINGS).map((f) => (
            <Button key={f} active={selected === f} onClick={() => setSelected(f)} fullWidth>
              {f}
            </Button>
          ))}
        </div>
        {data && (
          <Container className="!p-5">
            <p className="text-base font-medium">“{data.verse}”</p>
            <p className="text-xs text-muted-foreground mt-2">— {data.ref}</p>
            <p className="text-sm mt-3">{data.note}</p>
          </Container>
        )}
      </div>
    </Layout>
  );
}
