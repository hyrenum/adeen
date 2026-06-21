import { Layout } from "@/Top/Component/Layout/Index";
import { Card } from "@/Top/Component/UI/Card";
import schoolsData from "@/Bottom/Data/Aid/Schools.json";

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
  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <header>
          <h1 className="text-2xl font-bold mb-1">Schools &amp; Branches</h1>
          <p className="text-sm text-muted-foreground">
            Overview of the major branches of Islam and their schools of jurisprudence (madhāhib).
          </p>
        </header>

        {branches.map((branch) => (
          <section key={branch.id}>
            <Card className="p-5 mb-3">
              <h2 className="text-xl font-semibold mb-2">{branch.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{branch.summary}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {branch.schools.map((school) => (
                <Card key={school.id} className="p-4">
                  <h3 className="font-semibold text-base mb-2">{school.name}</h3>
                  <dl className="text-sm space-y-1.5">
                    <div>
                      <dt className="inline font-medium text-muted-foreground">Founder: </dt>
                      <dd className="inline">{school.founder}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-muted-foreground">Regions: </dt>
                      <dd className="inline">{school.regions}</dd>
                    </div>
                  </dl>
                  <p className="text-sm mt-3 leading-relaxed">{school.description}</p>
                </Card>
              ))}
            </div>
          </section>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-4">
          This is an introductory overview, not a fatwa. Refer to qualified scholars for detailed rulings.
        </p>
      </div>
    </Layout>
  );
};

export default Schools;
