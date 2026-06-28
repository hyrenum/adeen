import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { getTajweedCategoryDetail } from "Server/API/Aid";
import { Button } from "Client/Component/UI/Button";

export default function TajweedCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = getTajweedCategoryDetail(categoryId || "");

  console.log("[TajweedCategory] categoryId:", categoryId);
  console.log("[TajweedCategory] category:", category);

  if (!category) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-muted-foreground">Category not found</p>
          <Link to="/Aid/Arabic/Tajweed">
            <Button variant="outline" className="font-bold">
              Back to Tajweed
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  console.log("[TajweedCategory] hasSubfolders:", category.hasSubfolders);
  console.log("[TajweedCategory] subfolders:", category.subfolders);
  console.log("[TajweedCategory] subcategories:", category.subcategories);

  return (
    <Layout>
      {category.hasSubfolders === true ? (
        <div className="space-y-3">
          {category.subfolders?.length === 0 && (
            <p className="text-muted-foreground text-sm">⚠ hasSubfolders is true but subfolders array is empty</p>
          )}
          {category.subfolders.map((folder) => (
            <Link key={folder.id} to={`/Aid/Arabic/Tajweed/${category.id}/${folder.id}`} className="block">
              <Button className="!p-5 w-full !justify-start !text-left" fullWidth>
                <h3 className="font-semibold">{folder.name}</h3>
              </Button>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {category.subcategories?.length === 0 && (
            <p className="text-muted-foreground text-sm">⚠ hasSubfolders is false but subcategories array is empty</p>
          )}
          {category.subcategories.map((sub) => (
            <Link key={sub.id} to={`/Aid/Arabic/Tajweed/${category.id}/${sub.id}`} className="block">
              <Button className="!p-5 w-full !justify-start !text-left" fullWidth>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1 flex-wrap">
                    <span className="font-semibold whitespace-nowrap">{sub.name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">–</span>
                    <span className="text-sm text-muted-foreground whitespace-normal break-words">
                      {sub.description}
                    </span>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}