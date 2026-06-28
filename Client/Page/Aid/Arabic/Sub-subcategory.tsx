import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { Button } from "Client/Component/UI/Button";
import { getArabicSubcategory } from "Server/API/Aid";

export default function ArabicSubSubcategory() {
  const { vocabId, categoryId, subId } = useParams<{
    vocabId: string;
    categoryId: string;
    subId: string;
  }>();
  const sub = getArabicSubcategory(categoryId || "", subId || "", vocabId || "");

  if (!sub) {
    return (
      <Layout>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Not found</p>
          <Link to={`/Aid/Arabic/${vocabId}/${categoryId}`}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
        {sub.words.map((w) => (
          <Link key={w.id} to={`/Aid/Arabic/${vocabId}/${categoryId}/${subId}/${w.id}`}>
            <Card className="p-4 text-center group">
              <div className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {w.english}
              </div>
              {w.transliteration && (
                <div className="text-xs mt-0.5 text-muted-foreground italic">
                  {w.transliteration}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}