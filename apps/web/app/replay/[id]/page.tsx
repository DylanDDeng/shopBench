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
  searchParams,
  locale = "en",
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ day?: string | string[] }>;
  locale?: Locale;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const result = getResult(id);
  if (!result) notFound();
  const text = REPLAY_PAGE_TEXT[locale];

  const requestedDay = Array.isArray(resolvedSearchParams?.day)
    ? resolvedSearchParams?.day[0]
    : resolvedSearchParams?.day;
  const parsedDay = requestedDay ? Number.parseInt(requestedDay, 10) : Number.NaN;
  const selectedDayIndex = Number.isFinite(parsedDay)
    ? Math.min(Math.max(parsedDay, 1), result.days.length) - 1
    : 0;

  const daySummaries = result.days.map((day) => {
    const inventoryValue = day.stateSnapshot.inventory.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0);
    const inventoryUnits = day.stateSnapshot.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const errorCount = day.toolCalls.filter((tc) => {
      return typeof tc.result === "object" && tc.result !== null && "error" in (tc.result as Record<string, unknown>);
    }).length;

    return {
      day: day.day,
      cash: day.stateSnapshot.cash,
      customerSatisfaction: day.stateSnapshot.customerSatisfaction,
      reputation: day.stateSnapshot.reputation,
      employeeCount: day.stateSnapshot.employees.length,
      inventoryUnits,
      inventoryValue,
      weather: day.stateSnapshot.weather,
      revenue: day.settlement.revenue,
      netProfit: day.settlement.netProfit,
      customerCount: day.settlement.customerCount,
      toolCallCount: day.toolCalls.length,
      errorCount,
    };
  });

  const basePath = locale === "en" ? `/replay/${result.id}` : `/${locale}/replay/${result.id}`;

  return (
    <div className="container">
      <div className="page-header">
        <h1>{text.replay}: {getModelDisplayName(result.model)}</h1>
        <p>
          {text.scenario}: {result.scenario} &middot; {text.score}: {formatYen(result.finalScore)}
        </p>
      </div>
      <ReplayView
        daySummaries={daySummaries}
        selectedDay={result.days[selectedDayIndex] ?? null}
        selectedDayIndex={selectedDayIndex}
        basePath={basePath}
        locale={locale}
      />
    </div>
  );
}
