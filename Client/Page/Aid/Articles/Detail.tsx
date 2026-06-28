import { useParams } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { getArticleDetail } from "Server/API/Aid";

export default function ArticleDetail() {
  const { id = "" } = useParams();
  const data = getArticleDetail(id);

  return (
    <Layout>
      <div className="space-y-4">
        {!data ? (
          <Card className="p-6 text-center" hoverable={false}>
            Article not found.
          </Card>
        ) : (
          <>
            <Card className="p-5" hoverable={false}>
              <h1 className="text-2xl font-bold">{data.name}</h1>
              {data.source && (
                <p className="text-xs text-muted-foreground mt-1">
                  Source: {data.source}
                </p>
              )}
            </Card>

            {/* If your JSON backend modules contain a 'sections' array similar to Pillars: */}
            {(data as any).sections?.map((s: { heading: string; body: string }) => (
              <Card key={s.heading} className="p-5" hoverable={false}>
                <p className="font-semibold">{s.heading}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {s.body}
                </p>
              </Card>
            ))}
          </>
        )}
      </div>
    </Layout>
  );
}