import { useParams } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { Card } from "@/Top/Component/UI/Card";
import { ARTICLES } from "./Index";

type Section = { heading: string; body: string };
type Detail = {
  title: string;
  source: string;
  sections: Section[];
};

// The six articles of faith come from the "Hadith of Jibril":
// Sahih al-Bukhari 50, Sahih Muslim 8 — narrated by ʿUmar ibn al-Khattab (RA).
const HADITH_SOURCE =
  'Narrated by ʿUmar ibn al-Khattab (RA): Jibrīl (ʿAS) came to the Prophet ﷺ and asked, ' +
  '"Tell me about īmān." He ﷺ said: "It is to believe in Allah, His Angels, His Books, ' +
  'His Messengers, the Last Day, and to believe in the Divine Decree — its good and its evil." ' +
  '(Sahih Muslim 8; the meaning is also in Sahih al-Bukhari 50)';

const DETAILS: Record<string, Detail> = {
  Allah: {
    title: "Belief in Allah",
    source: HADITH_SOURCE,
    sections: [
      { heading: "Tawḥīd", body: "To believe that Allah alone is the Creator, Sustainer, and Sovereign of all that exists; that He alone deserves worship; and that He is described with the perfect names and attributes He has affirmed for Himself, without resemblance to creation." },
      { heading: "Its fruit", body: "This belief frees the heart from servitude to anyone or anything besides Allah — no fear, hope, or love is given to any rival beside Him." },
    ],
  },
  Angels: {
    title: "Belief in the Angels",
    source: HADITH_SOURCE,
    sections: [
      { heading: "Who they are", body: "Angels are noble servants created by Allah from light, who never disobey Him and carry out all that He commands. Among them: Jibrīl (revelation), Mīkāʾīl (provision and rain), and Isrāfīl (the Trumpet)." },
      { heading: "Their roles", body: "They write our deeds, guard us, take souls, and stand in ranks of worship — a reminder that the unseen world is full of obedience to Allah." },
    ],
  },
  Books: {
    title: "Belief in the Revealed Books",
    source: HADITH_SOURCE,
    sections: [
      { heading: "What it means", body: "To believe that Allah revealed Scriptures to His Messengers as guidance: the Ṣuḥuf of Ibrāhīm, the Tawrāh to Mūsā, the Zabūr to Dāwūd, the Injīl to ʿĪsā, and the Qur'an to Muhammad ﷺ." },
      { heading: "The Qur'an", body: "The Qur'an is Allah's final, preserved Word — confirming the truth of what came before and superseding it as the standard for mankind until the Last Day." },
    ],
  },
  Messengers: {
    title: "Belief in the Messengers",
    source: HADITH_SOURCE,
    sections: [
      { heading: "Who they are", body: "Allah sent Messengers to every nation calling people to worship Him alone — from Ādam to Muhammad ﷺ. We believe in all of them without distinction, and that Muhammad ﷺ is the final Messenger." },
      { heading: "Why they were sent", body: "So that no one would have an argument against Allah after the Messengers (Qur'an 4:165). They are the example of how to live a life pleasing to Allah." },
    ],
  },
  LastDay: {
    title: "Belief in the Last Day",
    source: HADITH_SOURCE,
    sections: [
      { heading: "Resurrection", body: "All people will be raised from their graves, gathered before Allah, and shown their deeds — small and great. The scales will be set up, the Books of deeds given, and the Bridge crossed." },
      { heading: "Paradise and Hell", body: "Jannah is the eternal home of the believers, prepared with what no eye has seen; Jahannam is the warning for those who rejected the truth. This belief gives meaning to every choice in this life." },
    ],
  },
  Qadar: {
    title: "Belief in Divine Decree (Qadar)",
    source: HADITH_SOURCE,
    sections: [
      { heading: "Its four levels", body: "Allah knows everything; He wrote everything in the Preserved Tablet before creation; nothing happens except by His will; and He is the Creator of all things — including our actions, which we still truly choose." },
      { heading: "Its fruit", body: "Contentment with Allah's decree: gratitude in ease, patience in hardship, and the freedom of knowing nothing reaches us except what Allah has written for us." },
    ],
  },
};

export default function ArticleDetail() {
  const { id = "" } = useParams();
  const data = DETAILS[id];
  const exists = ARTICLES.some((a) => a.id === id);

  return (
    <Layout>
      <div className="space-y-4">
        {!exists || !data ? (
          <Card className="p-6 text-center" hoverable={false}>Article not found.</Card>
        ) : (
          <>
            <Card className="p-5" hoverable={false}>
              <h1 className="text-2xl font-bold">{data.title}</h1>
            </Card>
            {data.sections.map((s) => (
              <Card key={s.heading} className="p-5" hoverable={false}>
                <p className="font-semibold">{s.heading}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
              </Card>
            ))}
          </>
        )}
      </div>
    </Layout>
  );
}
