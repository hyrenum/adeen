import { useParams } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { getPillarDetail } from "Server/API/Aid";

export default function PillarDetail() {
  const { id = "" } = useParams();
  const data = getPillarDetail(id);

  return (
    <Layout>
      <div className="space-y-4">
        {!data ? (
          <Card className="p-6 text-center" hoverable={false}>
            Pillar not found.
          </Card>
        ) : (
          <>
            <Card className="p-5" hoverable={false}>
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{data.english}</p>
            </Card>
            
            {data.sections?.map((s) => (
              <Card key={s.heading} className="p-5" hoverable={false}>
                <p className="font-semibold">{s.heading}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {s.body}
                </p>
              </Card>
            ))}

            {data.source && (
              <Card className="p-5" hoverable={false}>
                <p className="font-semibold">Hadith Source</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {data.source}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}