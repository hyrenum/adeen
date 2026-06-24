import { useMemo, useState } from "react";
import { Layout } from "Client/Component/Layout/Index";
import { Container } from "Client/Component/UI/Container";
import { Button } from "Client/Component/UI/Button";
import { Input } from "Client/Component/UI/Input";
import { SlidingPill } from "Client/Component/UI/Sliding-Pill";
import { Dropdown } from "Client/Component/UI/Dropdown";
import { Heart, HandHeart, Sprout, Repeat } from "lucide-react";
import { toast } from "Client/Hook/Use-Toast";
import { DonateProviderModal } from "Client/Component/Dialog/Donate-Provider";

type Frequency = "one_time" | "daily" | "weekly" | "monthly" | "yearly";
type DonationType = "general" | "zakat" | "sadaqah" | "sadaqah_jariya";

const CURRENCIES = [
  { value: "USD", label: "USD $" }, { value: "EUR", label: "EUR €" },
  { value: "GBP", label: "GBP £" }, { value: "PKR", label: "PKR ₨" },
  { value: "INR", label: "INR ₹" }, { value: "SAR", label: "SAR ﷼" },
  { value: "AED", label: "AED د.إ" }, { value: "MYR", label: "MYR RM" },
  { value: "IDR", label: "IDR Rp" }, { value: "TRY", label: "TRY ₺" },
];

const DONATION_TYPES: { id: DonationType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "general", label: "General", icon: <Heart className="h-4 w-4" />, desc: "Support our work and ongoing costs." },
  { id: "zakat", label: "Zakat", icon: <HandHeart className="h-4 w-4" />, desc: "Annual obligatory charity for eligible recipients." },
  { id: "sadaqah", label: "Sadaqah", icon: <HandHeart className="h-4 w-4" />, desc: "Voluntary charity, given freely." },
  { id: "sadaqah_jariya", label: "Sadaqah Jariya", icon: <Sprout className="h-4 w-4" />, desc: "Ongoing charity with lasting reward." },
];

export default function Donate() {
  const [mode, setMode] = useState<"once" | "recurring">("once");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [type, setType] = useState<DonationType>("general");
  const [currency, setCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<string>("25");
  const [modalOpen, setModalOpen] = useState(false);

  const effectiveFreq: Frequency = mode === "once" ? "one_time" : frequency;
  const currencySymbol = useMemo(
    () => CURRENCIES.find((c) => c.value === currency)?.label.split(" ")[1] ?? "",
    [currency],
  );

  const onDonate = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter an amount", description: "Please enter a valid donation amount.", variant: "destructive" });
      return;
    }
    setModalOpen(true);
  };

  return (
    <Layout>
      <section className="py-6 md:py-8 px-4">
        <div className="container max-w-xl mx-auto space-y-4">
          {/* Donation type selector */}
          <Container className="!p-4 sm:!p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Donation Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DONATION_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-2xl border transition-all text-xs font-medium ${
                    type === t.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-foreground border-border/40 hover:border-foreground/40"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {DONATION_TYPES.find((d) => d.id === type)?.desc}
            </p>
          </Container>

          {/* Frequency */}
          <Container className="!p-4 sm:!p-5 space-y-3">
            <div className="flex justify-center">
              <SlidingPill
                size="md"
                value={mode}
                onChange={(v) => setMode(v as "once" | "recurring")}
                options={[
                  { id: "once", label: "One Time" },
                  { id: "recurring", label: "Recurring" },
                ]}
              />
            </div>

            {mode === "recurring" && (
              <div className="flex justify-center">
                <SlidingPill
                  size="sm"
                  value={frequency}
                  onChange={(v) => setFrequency(v as Frequency)}
                  options={[
                    { id: "daily", label: "Daily" },
                    { id: "weekly", label: "Weekly" },
                    { id: "monthly", label: "Monthly" },
                    { id: "yearly", label: "Yearly" },
                  ]}
                />
              </div>
            )}

            {/* Amount with currency on left */}
            <div className="flex items-stretch gap-2">
              <div className="w-32 shrink-0">
                <Dropdown
                  value={currency}
                  onChange={setCurrency}
                  options={CURRENCIES}
                />
              </div>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="pl-9 text-base font-semibold"
                />
              </div>
            </div>

            <Button
              onClick={onDonate}
              className="w-full font-bold uppercase tracking-widest text-[10px] h-12"
            >
              <Heart className="h-4 w-4 mr-2" />
              {effectiveFreq === "one_time" ? "Donate Now" : "Donate Recurring"}
              {effectiveFreq !== "one_time" && <Repeat className="inline h-3 w-3 ml-2" />}
            </Button>
          </Container>

          <p className="text-xs text-muted-foreground text-center pt-1">
            Every Contribution, No Matter The Size, Is Deeply Appreciated. JazakAllahu Khairan.
          </p>
        </div>
      </section>

      <DonateProviderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        amount={parseFloat(amount) || 0}
        currency={currency}
        frequency={effectiveFreq}
        type={type}
      />
    </Layout>
  );
}

