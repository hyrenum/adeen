import { Layout } from "Client/Component/Layout/Index";
import { Container } from "Client/Component/UI/Container";
import { getDivineNames } from "Server/API/Aid";

export default function Names() {
  const divineNames = getDivineNames();

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {divineNames.map((n) => (
          <Container key={`${n.english}-${n.index}`} className="!p-4 text-center">
            <p className="text-xs text-muted-foreground">{n.index}</p>
            <p className="text-2xl font-arabic mt-1" dir="rtl">{n.arabic}</p>
            <p className="font-semibold mt-2">{n.english}</p>
            <p className="text-xs text-muted-foreground">{n.meaning}</p>
          </Container>
        ))}
      </div>
    </Layout>
  );
}