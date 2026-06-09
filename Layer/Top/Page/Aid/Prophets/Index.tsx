import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Link } from "react-router-dom";

export const PROPHETS = [
  "Adam", "Idris", "Nuh", "Hud", "Salih", "Ibrahim", "Lut", "Ismail", "Ishaq",
  "Yaqub", "Yusuf", "Ayyub", "Shu'ayb", "Musa", "Harun", "Dhul-Kifl", "Dawud",
  "Sulayman", "Ilyas", "Al-Yasa", "Yunus", "Zakariya", "Yahya", "Isa", "Muhammad",
];

export default function ProphetsIndex() {
  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {PROPHETS.map((p, i) => (
          <Link key={p} to={`/Aid/Prophets/${encodeURIComponent(p)}`}>
            <Container className="!p-4 text-center hover:bg-accent transition-colors">
              <p className="text-xs text-muted-foreground">{i + 1}</p>
              <p className="font-semibold mt-1">{p}</p>
            </Container>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
