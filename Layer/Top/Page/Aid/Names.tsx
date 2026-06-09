import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";

const NAMES: { ar: string; en: string; meaning: string }[] = [
  { ar: "الرَّحْمَنُ", en: "Ar-Rahman", meaning: "The Most Compassionate" },
  { ar: "الرَّحِيمُ", en: "Ar-Rahim", meaning: "The Most Merciful" },
  { ar: "الْمَلِكُ", en: "Al-Malik", meaning: "The King" },
  { ar: "الْقُدُّوسُ", en: "Al-Quddus", meaning: "The Most Holy" },
  { ar: "السَّلَامُ", en: "As-Salam", meaning: "The Peace" },
  { ar: "الْمُؤْمِنُ", en: "Al-Mu'min", meaning: "The Giver of Faith" },
  { ar: "الْمُهَيْمِنُ", en: "Al-Muhaymin", meaning: "The Guardian" },
  { ar: "الْعَزِيزُ", en: "Al-Aziz", meaning: "The Almighty" },
  { ar: "الْجَبَّارُ", en: "Al-Jabbar", meaning: "The Compeller" },
  { ar: "الْمُتَكَبِّرُ", en: "Al-Mutakabbir", meaning: "The Supreme" },
];

export default function Names() {
  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {NAMES.map((n, i) => (
          <Container key={n.en} className="!p-4 text-center">
            <p className="text-xs text-muted-foreground">{i + 1}</p>
            <p className="text-2xl font-arabic mt-1">{n.ar}</p>
            <p className="font-semibold mt-2">{n.en}</p>
            <p className="text-xs text-muted-foreground">{n.meaning}</p>
          </Container>
        ))}
        <Container className="!p-4 text-center text-xs text-muted-foreground">
          More names coming soon…
        </Container>
      </div>
    </Layout>
  );
}
