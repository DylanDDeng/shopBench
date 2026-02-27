import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import InsightsPage from "@/app/insights/page";

export default async function LocalizedInsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <InsightsPage locale={locale} />;
}
