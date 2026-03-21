import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import InsightsPageContent from "@/app/insights/InsightsPageContent";

export default async function LocalizedInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ model?: string | string[] }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <InsightsPageContent locale={locale} searchParams={searchParams} />;
}
