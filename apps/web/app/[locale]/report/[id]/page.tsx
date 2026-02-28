import { notFound } from "next/navigation";
import ReportPage from "@/app/report/[id]/page";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedReportPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <ReportPage params={Promise.resolve({ id })} locale={locale} />;
}
