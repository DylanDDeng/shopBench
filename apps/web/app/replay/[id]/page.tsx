import { getResult, getModelDisplayName, formatYen } from "@/lib/data";
import { ReplayView } from "./ReplayView";
import { notFound } from "next/navigation";

export default async function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) notFound();

  return (
    <div className="container">
      <div className="page-header">
        <h1>Replay: {getModelDisplayName(result.model)}</h1>
        <p>
          Scenario: {result.scenario} &middot; Score: {formatYen(result.finalScore)}
        </p>
      </div>
      <ReplayView days={result.days} resultId={result.id} />
    </div>
  );
}
