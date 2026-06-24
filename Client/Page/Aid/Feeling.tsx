import { useState } from "react";
import { Layout } from "Client/Component/Layout/Index";
import { Container } from "Client/Component/UI/Container";
import { Button } from "Client/Component/UI/Button";

type Entry = {
  verse: string;
  verseRef: string;
  hadith: string;
  hadithRef: string;
  note: string;
};

const FEELINGS: Record<string, Entry> = {
  Anxious: {
    verse: "Verily, in the remembrance of Allah do hearts find rest.",
    verseRef: "Qur'an 13:28",
    hadith: "Whoever takes a path in search of knowledge, Allah makes easy for him a path to Paradise.",
    hadithRef: "Sahih Muslim 2699",
    note: "Try reciting Surah Ash-Sharh and take deep breaths.",
  },
  Sad: {
    verse: "Do not grieve; indeed Allah is with us.",
    verseRef: "Qur'an 9:40",
    hadith: "No fatigue, illness, sorrow, sadness, hurt or distress befalls a Muslim — even a thorn — but Allah expiates some of his sins for it.",
    hadithRef: "Sahih al-Bukhari 5641",
    note: "Make sincere du'a — sadness is a means of purification.",
  },
  Grateful: {
    verse: "If you are grateful, I will surely increase you.",
    verseRef: "Qur'an 14:7",
    hadith: "He who does not thank people does not thank Allah.",
    hadithRef: "Sunan Abi Dawud 4811",
    note: "Say 'Alhamdulillah' often today and thank someone around you.",
  },
  Angry: {
    verse: "Those who restrain anger and pardon people — Allah loves the doers of good.",
    verseRef: "Qur'an 3:134",
    hadith: "The strong is not the one who overcomes people by his strength, but the one who controls himself when angry.",
    hadithRef: "Sahih al-Bukhari 6114",
    note: "Seek refuge from Shaytan, sit down, and make wudu.",
  },
  Hopeless: {
    verse: "Do not despair of the mercy of Allah.",
    verseRef: "Qur'an 39:53",
    hadith: "Allah is more pleased with the repentance of His servant than one of you who finds his lost camel in the desert.",
    hadithRef: "Sahih al-Bukhari 6309",
    note: "The door of tawbah is always open — turn back.",
  },
  Lost: {
    verse: "Whoever puts his trust in Allah — He will be sufficient for him.",
    verseRef: "Qur'an 65:3",
    hadith: "If you were to rely upon Allah with the reliance He deserves, you would be provided for as the birds are.",
    hadithRef: "Sunan at-Tirmidhi 2344",
    note: "Pray two rak'ahs of Istikhara and trust the outcome.",
  },
  Lonely: {
    verse: "And We are closer to him than his jugular vein.",
    verseRef: "Qur'an 50:16",
    hadith: "Allah says: I am as my servant thinks of Me, and I am with him when he remembers Me.",
    hadithRef: "Sahih al-Bukhari 7405",
    note: "You are never alone — dhikr brings the heart company.",
  },
  Fearful: {
    verse: "Sufficient for us is Allah, and He is the best Disposer of affairs.",
    verseRef: "Qur'an 3:173",
    hadith: "Know that if the entire nation gathered to harm you, they could not harm you except with what Allah has decreed.",
    hadithRef: "Sunan at-Tirmidhi 2516",
    note: "Recite the last two surahs (Al-Falaq, An-Nas) for protection.",
  },
  Tired: {
    verse: "Allah does not burden a soul beyond what it can bear.",
    verseRef: "Qur'an 2:286",
    hadith: "Take advantage of five before five: your youth before old age, your health before sickness…",
    hadithRef: "Mustadrak al-Hakim 7846",
    note: "Rest is worship when it renews your service to Allah.",
  },
  Guilty: {
    verse: "Indeed, Allah loves those who turn back to Him in repentance.",
    verseRef: "Qur'an 2:222",
    hadith: "All the sons of Adam are sinners, and the best of the sinners are those who repent.",
    hadithRef: "Sunan Ibn Majah 4251",
    note: "Make wudu, pray two rak'ahs, and seek forgiveness sincerely.",
  },
  Happy: {
    verse: "Say: In the bounty of Allah and His mercy — in that let them rejoice.",
    verseRef: "Qur'an 10:58",
    hadith: "A cheerful face for your brother is charity.",
    hadithRef: "Sunan at-Tirmidhi 1956",
    note: "Share your happiness — smile, give, and praise Allah.",
  },
  Hopeful: {
    verse: "And whoever fears Allah — He will make for him a way out.",
    verseRef: "Qur'an 65:2",
    hadith: "How wonderful is the affair of the believer — all of it is good.",
    hadithRef: "Sahih Muslim 2999",
    note: "Hold onto good thoughts about Allah — He answers them.",
  },
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
