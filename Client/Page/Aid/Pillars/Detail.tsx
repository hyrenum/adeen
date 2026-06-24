import { useParams } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { PILLARS } from "./Index";

type Section = { heading: string; body: string };
type Detail = {
  title: string;
  english: string;
  source: string;
  sections: Section[];
};

// All five pillars come from the famous "Hadith of Jibril" / Hadith of Ibn Umar:
// Sahih al-Bukhari 8, Sahih Muslim 16 — "Islam is built upon five..."
const HADITH_SOURCE =
  'Narrated by Ibn ʿUmar (RA): The Prophet ﷺ said, "Islam is built upon five: ' +
  'to testify that there is no god but Allah and that Muhammad is the Messenger of Allah, ' +
  'to establish the prayer, to pay zakat, to perform Hajj, and to fast Ramadan." ' +
  '(Sahih al-Bukhari 8, Sahih Muslim 16)';

const DETAILS: Record<string, Detail> = {
  Shahadah: {
    title: "Shahādah",
    english: "Declaration of Faith",
    source: HADITH_SOURCE,
    sections: [
      { heading: "The testimony", body: "Ash-hadu an lā ilāha illa-Llāh, wa ash-hadu anna Muhammadan rasūlu-Llāh — I bear witness that there is no god but Allah and that Muhammad is the Messenger of Allah." },
      { heading: "Its meaning", body: "It is a rejection of every false object of worship and a sincere affirmation that worship is due to Allah alone, and that Muhammad ﷺ is His final Messenger whose guidance is to be followed." },
      { heading: "Its place", body: "It is the gateway to Islam: a person enters the faith by sincerely uttering and believing it, and it is the foundation on which the other four pillars stand." },
    ],
  },
  Salah: {
    title: "Ṣalāh",
    english: "The Prayer",
    source: HADITH_SOURCE,
    sections: [
      { heading: "Five daily prayers", body: "A Muslim prays five obligatory prayers each day: Fajr, Ẓuhr, ʿAṣr, Maghrib, and ʿIshāʾ, facing the Kaʿbah in Makkah." },
      { heading: "Its importance", body: "Salah is the first matter a person will be asked about on the Day of Judgement. It is the direct link between the servant and his Lord, performed in cleanliness and humility." },
      { heading: "Beyond ritual", body: "Allah says the prayer restrains from immorality and wrongdoing (Qur'an 29:45) — it is meant to shape character, not only mark the day." },
    ],
  },
  Zakat: {
    title: "Zakāh",
    english: "Almsgiving",
    source: HADITH_SOURCE,
    sections: [
      { heading: "What it is", body: "Zakat is an obligatory annual charity of 2.5% on wealth held above a minimum threshold (niṣāb) for a lunar year. It is paid to eight categories defined in Surah at-Tawbah (9:60)." },
      { heading: "Its purpose", body: "It purifies wealth and the heart from greed, lifts up the poor and indebted, and binds the community together as one body." },
      { heading: "A right, not a favour", body: "The Qur'an describes zakat as a right of the needy upon the wealthy (51:19) — not a generous gift, but a due owed to Allah and to His servants." },
    ],
  },
  Sawm: {
    title: "Ṣawm",
    english: "Fasting in Ramaḍān",
    source: HADITH_SOURCE,
    sections: [
      { heading: "What it is", body: "Every adult, healthy Muslim abstains from food, drink, and intimacy from dawn (Fajr) until sunset (Maghrib) during the month of Ramadan." },
      { heading: "Its purpose", body: "Allah says: 'O you who believe, fasting is prescribed for you... that you may attain taqwa' (Qur'an 2:183). It trains the soul in patience, gratitude, and self-restraint." },
      { heading: "More than hunger", body: "The Prophet ﷺ said whoever does not give up false speech and acting upon it, Allah has no need that he give up his food and drink (Sahih al-Bukhari 1903)." },
    ],
  },
  Hajj: {
    title: "Ḥajj",
    english: "Pilgrimage to Makkah",
    source: HADITH_SOURCE,
    sections: [
      { heading: "What it is", body: "Hajj is the pilgrimage to the sacred House in Makkah, performed in the month of Dhul-Hijjah, obligatory once in a lifetime upon every Muslim who is able physically and financially." },
      { heading: "Its rites", body: "The pilgrim enters iḥrām, performs ṭawāf around the Kaʿbah, saʿy between Ṣafa and Marwa, stands on the plain of ʿArafah, stones the pillars at Mina, and offers a sacrifice." },
      { heading: "Its reward", body: "The Prophet ﷺ said: 'Whoever performs Hajj for Allah's sake and does not commit obscenity or transgression returns as the day his mother bore him' (Sahih al-Bukhari 1521)." },
    ],
  },
};

export default function PillarDetail() {
  const { id = "" } = useParams();
  const data = DETAILS[id];
  const exists = PILLARS.some((p) => p.id === id);

  return (
    <Layout>
      <div className="space-y-4">
        {!exists || !data ? (
          <Card className="p-6 text-center" hoverable={false}>Pillar not found.</Card>
        ) : (
          <>
            <Card className="p-5" hoverable={false}>
              <h1 className="text-2xl font-bold">{data.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{data.english}</p>
            </Card>
            {data.sections.map((s) => (
              <Card key={s.heading} className="p-5" hoverable={false}>
                <p className="font-semibold">{s.heading}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
              </Card>
            ))}
            <Card className="p-5" hoverable={false}>
              <p className="font-semibold">Hadith Source</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{data.source}</p>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
