import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { Button } from "Client/Component/UI/Button";
import { useHadithCorpus } from "Server/API/Hadith";
import { useTranslation } from "Client/Hook/Use-Translation";

const Chapter = () => {
  const { Collection } = useParams<{ Collection: string }>();
  const { t } = useTranslation();
  
  const { data: corpus, isLoading } = useHadithCorpus();

  if (isLoading) {
    return (
      <Layout>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground animate-pulse">Loading chapters...</p>
        </Card>
      </Layout>
    );
  }

  const collection = corpus?.collections?.find(
    (c: any) => c.slug.toLowerCase() === Collection?.toLowerCase()
  );

  if (!collection) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Card className="max-w-md mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-4">Collection Not Found</h1>
            <Link to="/Hadith">
              <Button>{t.common.back} to {t.hadith.title}</Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {collection.chapters?.map((chapter: any, index: number) => (
          <Link key={chapter.id} to={`/Hadith/${collection.slug}/${chapter.id}`}>
            <Card className="p-4 transition-all group">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                  {index + 1}
                </span>
                <p className="font-semibold text-sm truncate group-hover:text-foreground">
                  {chapter.name}
                </p>
                <div className="text-right flex flex-col justify-center">
                  {chapter.range && (
                    <span className="text-sm font-medium text-foreground group-hover:text-foreground">
                      {chapter.range}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default Chapter;