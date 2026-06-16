import { Layout } from "@/Top/Component/Layout/Index";
import { Card } from "@/Top/Component/UI/Card";
import { Link } from "react-router-dom";

export const PILLARS = [
  { id: "Shahadah", name: "Shahādah", english: "Declaration of Faith" },
  { id: "Salah", name: "Ṣalāh", english: "Prayer" },
  { id: "Zakat", name: "Zakāh", english: "Almsgiving" },
  { id: "Sawm", name: "Ṣawm", english: "Fasting in Ramaḍān" },
  { id: "Hajj", name: "Ḥajj", english: "Pilgrimage to Makkah" },
];

export default function PillarsIndex() {
  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {PILLARS.map((p, i) => (
          <Link key={p.id} to={`/Aid/Pillars/${p.id}`}>
            <Card className="p-4 group">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{i + 1}</p>
                <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{p.name}</p>
                <p className="text-sm text-muted-foreground text-right [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{p.english}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
