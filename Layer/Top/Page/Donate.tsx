import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { Heart, Coffee, Sparkles, ExternalLink } from "lucide-react";

const TIERS = [
  { id: "tea",      icon: Coffee,    title: "A Cup Of Tea",  amount: "$3",  desc: "Small Token Of Support" },
  { id: "supporter", icon: Heart,     title: "Supporter",     amount: "$10", desc: "Help Cover Hosting Costs" },
  { id: "patron",   icon: Sparkles,  title: "Patron",        amount: "$25", desc: "Fuel New Features" },
];

const DONATE_URL = "https://ko-fi.com";

export default function Donate() {
  return (
    <Layout>
      <section className="py-8 md:py-12 px-4">
        <div className="container max-w-2xl mx-auto space-y-6">
          {/* Title */}
          <div className="flex justify-center">
            <Container className="!py-1 !px-4 inline-flex w-auto">
              <span className="text-sm font-medium">Donate</span>
            </Container>
          </div>

          {/* Hero */}
          <Container className="!p-6 sm:!p-10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-foreground text-background flex items-center justify-center">
              <Heart className="h-7 w-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Support Al-Deen.org</h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              Al-Deen.org Is Free And Ad-Free. Your Donation Keeps The Servers Running
              And Helps Us Build Better Tools For The Ummah.
            </p>
          </Container>

          {/* Tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIERS.map(({ id, icon: Icon, title, amount, desc }) => (
              <Container key={id} className="!p-5 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
                <p className="text-xl font-bold">{amount}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </Container>
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-2">
            <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto font-bold uppercase tracking-widest text-[10px] h-12 px-8">
                Donate Now <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Every Contribution, No Matter The Size, Is Deeply Appreciated. JazakAllahu Khairan.
          </p>
        </div>
      </section>
    </Layout>
  );
}
