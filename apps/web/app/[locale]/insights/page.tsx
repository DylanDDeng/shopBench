import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import InsightsPage from "@/app/insights/page";

export default function LocalizedInsightsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <InsightsPage locale={params.locale} />;
}
