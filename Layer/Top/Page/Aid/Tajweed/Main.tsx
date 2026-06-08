import { Link } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { getTajweedCategories } from "@/Bottom/API/Aid";
import { ChevronRight } from "lucide-react";
import { Button } from "@/Top/Component/UI/Button";

const TajweedIndex = () => {
  const tajweedCategories = getTajweedCategories();

  return (
    <Layout>
      <section className="py-6">
        <div className="container max-w-4xl mx-auto">
          {tajweedCategories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No tajweed categories available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tajweedCategories.map((cat) => (
                <Link key={cat.id} to={`/Aid/Tajweed/${cat.id}`}>
                  <Button className="w-full !p-5 flex items-center justify-between" fullWidth>
                    <div className="text-left">
                      <h3 className="font-semibold">{cat.name}</h3>
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default TajweedIndex;