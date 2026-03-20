import { notFound } from "next/navigation";
import ReplayPage from "@/app/replay/[id]/page";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedReplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ day?: string | string[] }>;
}) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <ReplayPage params={Promise.resolve({ id })} searchParams={searchParams} locale={locale} />;
}
