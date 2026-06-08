import { useParams, Link } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { getTajweedCategoryDetail } from "@/Bottom/API/Aid";
import { Button } from "@/Top/Component/UI/Button";
import { Container } from "@/Top/Component/UI/Container";

export default function TajweedSubfolder() {
  const { categoryId, subfolderId } = useParams<{ categoryId: string; subfolderId: string }>();
  const category = getTajweedCategoryDetail(categoryId || "");
  const subfolder = category?.subfolders.find(f => f.id === subfolderId);

  if (!category || !subfolder) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground mb-4">Folder not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 max-w-4xl mx-auto px-4">
        <Container className="!p-5 mb-6">
          <h1 className="text-2xl font-bold">{subfolder.name}</h1>
        </Container>

        <div className="space-y-3">
          {subfolder.subcategories.map((sub) => (
            <Link key={sub.id} to={`/Aid/Tajweed/${category.id}/${subfolder.id}/${sub.id}`} className="block">
              <Button className="!p-5 w-full !justify-start !text-left" fullWidth>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{sub.name}</h3>
                    {sub.arabicName && (
                      <span className="font-arabic text-sm text-muted-foreground" dir="rtl">
                        {sub.arabicName}
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}