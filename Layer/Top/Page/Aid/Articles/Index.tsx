import { Layout } from "@/Top/Component/Layout/Index";
import { Card } from "@/Top/Component/UI/Card";
import { Link } from "react-router-dom";

export const ARTICLES = [
  { id: "Allah", name: "Belief in Allah" },
  { id: "Angels", name: "Belief in the Angels" },
  { id: "Books", name: "Belief in the Revealed Books" },
  { id: "Messengers", name: "Belief in the Messengers" },
  { id: "LastDay", name: "Belief in the Last Day" },
  { id: "Qadar", name: "Belief in Divine Decree (Qadar)" },
];

export default function ArticlesIndex() {
  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {ARTICLES.map((a, i) => (
          <Link key={a.id} to={`/Aid/Articles/${a.id}`}>
            <Card className="p-4 group">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{i + 1}</p>
                <p className="font-semibold text-right [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{a.name}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
