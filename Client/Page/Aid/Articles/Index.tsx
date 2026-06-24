import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { Link } from "react-router-dom";

export const ARTICLES = [
  { id: "Allah", name: "Belief in Allah" },
  { id: "Angels", name: "Belief in the Angels" },
  { id: "Books", name: "Belief in the Revealed Books" },
  { id: "Messengers", name: "Belief in the Messengers" },
  { id: "LastDay", name: "Belief in the Last Day" },
  { id: "Qadar", name: "Belief in Divine Decree (Qadar)" },
];

// All six articles share the same source — the Hadith of Jibrīl.
export const ARTICLES_HADITH_SOURCE =
  'Narrated by ʿUmar ibn al-Khattab (RA): Jibrīl (ʿAS) came to the Prophet ﷺ and asked, ' +
  '"Tell me about īmān." He ﷺ said: "It is to believe in Allah, His Angels, His Books, ' +
  'His Messengers, the Last Day, and to believe in the Divine Decree — its good and its evil." ' +
  '(Sahih Muslim 8; the meaning is also in Sahih al-Bukhari 50)';

export default function ArticlesIndex() {
  return (
    <Layout>
      <div className="space-y-4">
        <Card className="p-5" hoverable={false}>
          <p className="font-semibold">Hadith Source</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {ARTICLES_HADITH_SOURCE}
          </p>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ARTICLES.map((a, i) => (
            <Link key={a.id} to={`/Aid/Articles/${a.id}`}>
              <Card className="p-4 group">
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{i + 1}</p>
                  <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{a.name}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
