// Client/Page/Aid/Schools/Detail.tsx
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Card } from "Client/Component/UI/Card";
import schoolsData from "Server/Data/Aid/Schools.json";

type School = {
  id: string;
  name: string;
  founder: string;
  regions: string;
  description: string;
};

type Branch = {
  id: string;
  name: string;
  summary: string;
  schools: School[];
};

const branches = (schoolsData as { branches: Branch[] }).branches;

const Detail = () => {
  const { branch: branchId, detail: schoolId } = useParams<{ branch: string; detail: string }>();
  const navigate = useNavigate();

  const branch = branches.find((b) => b.id === branchId);
  const school = branch?.schools.find((s) => s.id === schoolId);

  if (!branch || !school) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-muted-foreground">School not found.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate(`/Aid/Schools/${branchId}`)}>
            ← Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Card className="p-5 space-y-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Founder</dt>
              <dd>{school.founder}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Regions</dt>
              <dd>{school.regions}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Branch</dt>
              <dd
                className="inline-flex items-center cursor-pointer text-foreground hover:underline"
                onClick={() => navigate(`/Aid/Schools/${branch.id}`)}
              >
                {branch.name}
              </dd>
            </div>
          </dl>

          <hr className="border-border/40" />

          <p className="text-sm leading-relaxed">{school.description}</p>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-2">
          This is an introductory overview, not a fatwa. Refer to qualified scholars for detailed rulings.
        </p>
      </div>
    </Layout>
  );
};

export default Detail;