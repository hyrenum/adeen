import { useParams, Link } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { ArrowLeft } from "lucide-react";
import { PROPHETS } from "./Index";

const DETAILS: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  Adam: {
    title: "Adam (عليه السلام)",
    sections: [
      { heading: "Who he was", body: "Adam was the first human and the first Prophet of Allah. He was created by Allah from clay and given life by Allah's command. Allah taught him the names of all things and commanded the angels to prostrate to him as a sign of honour." },
      { heading: "In Paradise", body: "Adam and his wife Hawwa were placed in Paradise and permitted to enjoy everything in it except one tree. Iblis whispered to them and they ate from the forbidden tree, after which they were sent to Earth as Allah had decreed." },
      { heading: "Repentance", body: "Adam learned words of repentance from his Lord, turned back to Him, and Allah accepted his repentance — a reminder to all his descendants that the door of tawbah is always open." },
      { heading: "Legacy", body: "Adam is the father of mankind. His story teaches us about responsibility, the enmity of Shaytan, the mercy of Allah, and the value of sincere repentance." },
    ],
  },
};

export default function ProphetDetail() {
  const { name = "" } = useParams();
  const key = decodeURIComponent(name);
  const data = DETAILS[key];
  const exists = PROPHETS.includes(key);

  return (
    <Layout>
      <div className="space-y-4">
        <Link to="/Aid/Prophets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        {!exists ? (
          <Container className="!p-6 text-center">Prophet not found.</Container>
        ) : data ? (
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
            <h1 className="text-xl font-bold">{key} (عليه السلام)</h1>
            <p className="text-sm text-muted-foreground mt-2">Detailed content coming soon.</p>
          </Container>
        )}
      </div>
    </Layout>
  );
}
