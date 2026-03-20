import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import InsightsPage from "@/app/insights/page";

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

  return <InsightsPage locale={locale} searchParams={searchParams} />;
}
