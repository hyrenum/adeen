import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { Button } from "Client/Component/UI/Button";
import { getVocabulary } from "Server/API/Aid";

export default function ArabicCategory() {
  const { vocabId } = useParams<{ vocabId: string }>();
  const vocab = getVocabulary().find((v) => v.id === (vocabId || ""));

  if (!vocab) {
    return (
      <Layout>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Not found</p>
          <Link to="/Aid/Arabic">
            <Button variant="outline">Back to Arabic</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
        {vocab.subcategories.map((c) => (
          <Link key={c.id} to={`/Aid/Arabic/${vocab.id}/${c.id}`}>
            <Card className="p-4 text-center group">
              <div className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {c.name}
              </div>
              <div className="font-arabic text-lg mt-1 text-muted-foreground" dir="rtl">
                {c.arabicName}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}