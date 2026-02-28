import { getResult, getModelDisplayName, formatYen } from "@/lib/data";
import { ReplayView } from "./ReplayView";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const REPLAY_PAGE_TEXT: Record<Locale, {
  replay: string;
  scenario: string;
  score: string;
}> = {
  en: {
    replay: "Replay",
    scenario: "Scenario",
    score: "Score",
  },
  zh: {
    replay: "回放",
    scenario: "场景",
    score: "得分",
  },
};

export default async function ReplayPage({
  params,
  locale = "en",
}: {
  params: Promise<{ id: string }>;
  locale?: Locale;
}) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) notFound();
  const text = REPLAY_PAGE_TEXT[locale];

  return (
    <div className="container">
      <div className="page-header">
        <h1>{text.replay}: {getModelDisplayName(result.model)}</h1>
        <p>
          {text.scenario}: {result.scenario} &middot; {text.score}: {formatYen(result.finalScore)}
        </p>
      </div>
      <ReplayView days={result.days} resultId={result.id} locale={locale} />
    </div>
  );
}
