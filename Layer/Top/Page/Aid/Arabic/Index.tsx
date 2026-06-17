import { Link } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { Card } from "@/Top/Component/UI/Card";
import { getArabicCategories } from "@/Bottom/API/Arabic";

export default function ArabicIndex() {
  const categories = getArabicCategories();

  const extra = [
    { to: "/Aid/Alphabet", name: "Alphabet" },
    { to: "/Aid/Tajweed", name: "Tajweed" },
  ];

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
        {extra.map((e) => (
          <Link key={e.to} to={e.to}>
            <Card className="p-4 text-center group">
              <div className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {e.name}
              </div>
            </Card>
          </Link>
        ))}
        {categories.map((c) => (
          <Link key={c.id} to={`/Aid/Arabic/${c.id}`}>
            <Card className="p-4 text-center group">
              <div className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {c.name}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
