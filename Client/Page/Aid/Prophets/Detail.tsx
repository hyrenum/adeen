import { useParams } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Container } from "Client/Component/UI/Container";
import { getProphetDetail } from "Server/API/Aid";

export default function ProphetDetail() {
  const { name = "" } = useParams();
  const key = decodeURIComponent(name);
  const data = getProphetDetail(key);

  return (
    <Layout>
      <div className="space-y-4">
        {!data ? (
          <Container className="!p-6 text-center">Prophet not found.</Container>
        ) : data.sections.length > 0 ? (
          <>
            <Container className="!p-5">
              <h1 className="text-2xl font-bold">{data.title}</h1>
            </Container>
            {data.sections.map((s) => (
              <Container key={s.heading} className="!p-5">
                <p className="font-semibold">{s.heading}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
              </Container>
            ))}
          </>
        ) : (
          <Container className="!p-6 text-center">
            <h1 className="text-xl font-bold">{data.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">Detailed content coming soon.</p>
          </Container>
        )}
      </div>
    </Layout>
  );
}