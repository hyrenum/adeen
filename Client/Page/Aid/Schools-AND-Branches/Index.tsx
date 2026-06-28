// Client/Page/Aid/Schools/Index.tsx
import { useNavigate } from "react-router-dom";
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

const Schools = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className="p-5 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground group"
              onClick={() => navigate(`/Aid/Schools/${branch.id}`)}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-xl font-semibold">{branch.name}</h2>
                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground shrink-0 mt-1">
                  {branch.schools.length} schools →
                </span>
              </div>
              <p className="text-sm text-muted-foreground group-hover:text-accent-foreground leading-relaxed">
                {branch.summary}
              </p>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          This is an introductory overview, not a fatwa. Refer to qualified scholars for detailed rulings.
        </p>
      </div>
    </Layout>
  );
};

export default Schools;