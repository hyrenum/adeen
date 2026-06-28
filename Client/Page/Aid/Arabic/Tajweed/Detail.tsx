import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { getTajweedSubcategory, getTajweedSubfolderSubcategory } from "Server/API/Aid";
import { Button } from "Client/Component/UI/Button";
import { Container } from "Client/Component/UI/Container";

export default function TajweedDetail() {
  const { categoryId, subcategoryId, subSubId } = useParams<{
    categoryId: string;
    subcategoryId: string;
    subSubId?: string;
  }>();

  const subcategory = subSubId
    ? getTajweedSubfolderSubcategory(categoryId || "", subcategoryId || "", subSubId)
    : getTajweedSubcategory(categoryId || "", subcategoryId || "");

  const backPath = subSubId
    ? `/Aid/Arabic/Tajweed/${categoryId}/${subcategoryId}`
    : `/Aid/Arabic/Tajweed/${categoryId}`;

  if (!subcategory) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-muted-foreground">Not found</p>
          <Link to={backPath}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {subcategory.rules.map((rule: any, idx: number) => (
          <Container key={idx} className="!p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{rule.transliteration}</span>
                <Container className="!py-1 !px-3 !w-auto">
                  <span className="font-arabic text-2xl" dir="rtl">{rule.letter}</span>
                </Container>
              </div>
              <p className="text-sm text-foreground">{rule.description}</p>
              {rule.example && (
                <Container className="!p-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Example</p>
                    <p className="font-arabic text-2xl text-foreground" dir="rtl">{rule.example}</p>
                    {rule.exampleTranslation && (
                      <p className="text-sm text-muted-foreground italic">{rule.exampleTranslation}</p>
                    )}
                  </div>
                </Container>
              )}
            </div>
          </Container>
        ))}
      </div>
    </Layout>
  );
}