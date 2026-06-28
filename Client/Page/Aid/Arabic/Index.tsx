import { Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { getVocabulary } from "Server/API/Aid";

export default function ArabicIndex() {
  const vocabulary = getVocabulary();

  const extra = [
    { to: "/Aid/Arabic/Alphabet", name: "Alphabet" },
    { to: "/Aid/Arabic/Tajweed", name: "Tajweed" },
  ];

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
        {extra.map((e) => (
          <Link key={e.to} to={e.to}>
            <Card className="p-4 text-center group">
              <div className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {e.name}
              </div>
            </Card>
          </Link>
        ))}
        {vocabulary.map((v) => (
          <Link key={v.id} to={`/Aid/Arabic/${v.id}`}>
            <Card className="p-4 text-center group">
              <div className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {v.name}
              </div>
              <div className="font-arabic text-lg mt-1 text-muted-foreground" dir="rtl">
                {v.arabicName}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}