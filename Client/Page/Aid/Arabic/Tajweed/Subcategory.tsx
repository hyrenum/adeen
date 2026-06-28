// TajweedSubcategory.tsx
import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { getTajweedCategoryDetail } from "Server/API/Aid";
import { Button } from "Client/Component/UI/Button";
import TajweedDetail from "./Detail"; // adjust import path as needed

export default function TajweedSubcategory() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const category = getTajweedCategoryDetail(categoryId || "");
  const subfolder = category?.subfolders.find(f => f.id === subcategoryId);

  // Not a subfolder — hand off to Detail which handles flat leaves
  if (!subfolder) {
    return <TajweedDetail />;
  }

  if (!category) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-muted-foreground">Not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3">
        {subfolder.subcategories.map((sub) => (
          <Link key={sub.id} to={`/Aid/Arabic/Tajweed/${category.id}/${subfolder.id}/${sub.id}`} className="block">
            <Button className="!p-5 w-full !justify-start !text-left" fullWidth>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{sub.name}</h3>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </Layout>
  );
}