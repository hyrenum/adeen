import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import { Link } from "react-router-dom";
import { getPillars } from "Server/API/Aid";

export default function PillarsIndex() {
  const pillarsList = getPillars();

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {pillarsList.map((p, i) => (
          <Link key={p.id} to={`/Aid/Pillars/${p.id}`}>
            <Card className="p-4 group">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {i + 1}
                </p>
                <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {p.name}
                </p>
                <p className="text-sm text-muted-foreground text-right [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {p.english}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}