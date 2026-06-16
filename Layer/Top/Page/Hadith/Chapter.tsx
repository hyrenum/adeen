import { useParams, Link } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { Card } from "@/Top/Component/UI/Card";
import { Button } from "@/Top/Component/UI/Button";
import { getCollection, getChaptersByCollection } from "@/Bottom/API/Hadith";
import { useTranslation } from "@/Middle/Hook/Use-Translation";

const Chapter = () => {
  const { Collection } = useParams<{ Collection: string }>();
  const { t } = useTranslation();

  const collection = Collection ? getCollection(Collection) : null;
  const chapters = Collection ? getChaptersByCollection(Collection) : [];

  if (!collection) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Card className="max-w-md mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-4">Collection Not Found</h1>
            <Link to="/Hadith">
              <Button>
                {t.common.back} to {t.hadith.title}
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {chapters.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No chapters available yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chapters.map((chapter, index) => (
            <Link
              key={chapter.id}
              to={`/Hadith/${collection.slug}/${chapter.id}`}
            >
              <Card className="p-4 transition-all group">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-sm truncate [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                    {chapter.name}
                  </p>
                  {chapter.hadithRange && (
                    <span className="text-xs text-muted-foreground text-right [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                      {chapter.hadithRange} Hadith
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Chapter;