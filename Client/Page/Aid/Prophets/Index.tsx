import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Container } from "Client/Component/UI/Container";
import { getProphets } from "Server/API/Aid";

export default function ProphetsIndex() {
  const prophets = useMemo(() => getProphets(), []);

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {prophets.map((p, i) => (
          <Link key={p.id} to={`/Aid/Prophets/${encodeURIComponent(p.id)}`}>
            <Container className="!p-4 text-center hover:bg-accent transition-colors">
              <p className="text-xs text-muted-foreground">{i + 1}</p>
              <p className="font-semibold mt-1">{p.id}</p>
            </Container>
          </Link>
        ))}
      </div>
    </Layout>
  );
}