import { notFound } from "next/navigation";
import ReplayPage from "@/app/replay/[id]/page";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedReplayPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <ReplayPage params={Promise.resolve({ id })} locale={locale} />;
}
