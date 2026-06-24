import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { Button } from "Client/Component/UI/Button";
import { getArabicCategory } from "Server/API/Arabic";

export default function ArabicCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = getArabicCategory(categoryId || "");

  if (!category) {
    return (
      <Layout>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Category not found</p>
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
        {category.subcategories.map((s) => (
          <Link key={s.id} to={`/Aid/Arabic/${category.id}/${s.id}`}>
            <Card className="p-4 text-center group">
              <div className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {s.name}
              </div>
              <div className="font-arabic text-lg mt-1 text-muted-foreground" dir="rtl">
                {s.arabicName}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
