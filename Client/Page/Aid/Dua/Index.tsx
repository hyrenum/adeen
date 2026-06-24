import { Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { duaCategories } from "Server/API/Aid";
import { Button } from "Client/Component/UI/Button";

function getIdFromName(name: string): string {
  return name.replace(/\s+/g, "-");
}

const Dua = () => {
  return (
    <Layout>
      <div className="w-full p-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:px-0">
          {duaCategories.map((category, index) => (
            <Link key={index} to={`/Aid/Dua/${getIdFromName(category.name)}`} className="block">
              <Button className="w-full h-full p-4 text-center group">
                <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {category.name}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dua;