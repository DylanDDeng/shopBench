import { World, DEFAULT_EVENT_POOL } from "@shopbench/engine";
import type { ScenarioConfig, SimulationResult, DayRecord, ToolCallRecord } from "@shopbench/engine";
import { executeToolCall } from "@shopbench/tools";
import { calculateMetrics, calculateScore } from "@shopbench/scoring";
import { OpenRouterClient } from "./openrouter.js";
import type { Message, Provider, ReasoningEffort } from "./openrouter.js";
import { randomUUID } from "node:crypto";

export interface RunConfig {
  scenario: ScenarioConfig;
  // Display name stored in result.model (used by leaderboard/report)
  model: string;
  // Actual provider model ID used for API calls; defaults to `model`
  providerModel?: string;
  // Model provider endpoint flavor
  provider?: Provider;
  // Optional explicit override for reasoning.enabled in request body
  reasoningEnabled?: boolean;
  // Optional reasoning effort override for reasoning-enabled models
  reasoningEffort?: ReasoningEffort;
  // Optional strict mode for function tools (schema constrained)
  strictTools?: boolean;
  // Optional explicit control for provider-level parallel tool calls
  parallelToolCalls?: boolean;
  apiKey: string;
  baseUrl?: string;
  verbose?: boolean;
}

function buildSystemPrompt(startingCash: number, monthlyRent: number, totalDays: number): string {
  const dailyRent = Math.round(monthlyRent / 30);
  return `You are an AI agent managing a small convenience store (小卖部) in a Chinese neighborhood.

SCORING — HOW YOU WIN OR LOSE:
Your final score = final cash - ¥${startingCash} starting capital - outstanding loans.
Unsold inventory is worth NOTHING — only cash counts. You start with ¥${startingCash}. If you end with more cash than you started with (after subtracting any debt), you profit. Otherwise you lose.
A score of 0 means you broke even. Positive means you made money. Negative means you lost money.

CRITICAL: The daily settlement profit shown each evening only counts the cost of items SOLD that day. It does NOT reflect cash spent on inventory purchases that haven't sold yet. You can show a daily "profit" while your actual cash is shrinking — because purchase orders cost cash immediately, but only appear as cost-of-goods when the item sells. Always check view_financials to see your real cash position.

Your fixed costs are ¥${dailyRent + 220}/day (wages ¥220 + rent ¥${dailyRent}), totaling ~¥${(dailyRent + 220) * totalDays} over ${totalDays} days. If you do nothing at all, you lose ¥${(dailyRent + 220) * totalDays}. Every purchase must earn back more than it costs.

GAME FLOW:
Each day you receive a morning brief with weather, events, and store status.
You can use the available tools to:
- Check information (inventory, finances, market trends, weather, competitors, employees)
- Make operational decisions (purchase goods, set prices, run promotions, adjust hours)
- Manage staff (hire, fire, assign shifts)
- Handle finances (take loans, repay loans)
- Make strategic moves (negotiate with suppliers, upgrade store, launch marketing)
- Preview orders before committing (estimate_order)

After making your decisions, respond with a text message (no tool call) to end your turn.
The day will then be settled: customers visit, sales happen, expenses are deducted.

IMPORTANT MECHANICS:
- Orders take 1-3 days to arrive depending on supplier. Plan ahead — order BEFORE you run out.
- Each supplier has a minimum order amount (in ¥, not units). Use view_suppliers to see unit costs, then use estimate_order to verify your order meets the minimum before purchasing.
- Loans accrue 0.05% daily interest. Outstanding loans are subtracted from your final score.
- Unsold inventory at the end is worth NOTHING. Only cash in hand counts toward your score. Every unit you buy must be sold to earn back its cost.
- Fresh items (bread, ice cream) expire quickly — only order what you can sell before expiry.
- Weather affects customer traffic and product demand significantly.
- Employee morale matters — unhappy staff may quit.
- Staff quality directly affects customer traffic. More skilled and happier employees attract more customers. Understaffing cuts footfall significantly.

Think strategically. Every decision counts.`;
}

export async function runSimulation(config: RunConfig): Promise<SimulationResult> {
  const {
    scenario,
    model,
    providerModel,
    provider,
    reasoningEnabled,
    reasoningEffort,
    strictTools,
    parallelToolCalls,
    apiKey,
    baseUrl,
    verbose,
  } = config;

  // Merge default events if scenario has none
  const fullScenario: ScenarioConfig = {
    ...scenario,
    eventPool: scenario.eventPool.length > 0 ? scenario.eventPool : DEFAULT_EVENT_POOL,
  };

  const world = new World(fullScenario);
  const client = new OpenRouterClient({
    apiKey,
    model: providerModel ?? model,
    provider,
    baseUrl,
    reasoningEnabled,
    reasoningEffort,
    strictTools,
    parallelToolCalls,
  });
  const allDayRecords: DayRecord[] = [];

  const log = verbose ? console.log : () => {};

  for (let day = 1; day <= fullScenario.totalDays; day++) {
    log(`\n${"═".repeat(50)}`);
    log(`Day ${day}/${fullScenario.totalDays}`);

    // Morning brief
    const brief = world.generateMorningBrief();
    log(brief);

    const messages: Message[] = [
      { role: "system", content: buildSystemPrompt(fullScenario.startingCash, fullScenario.monthlyRent, fullScenario.totalDays) },
      { role: "user", content: brief },
    ];

    const dayToolCalls: ToolCallRecord[] = [];
    let toolCallsRemaining = fullScenario.maxToolCallsPerDay;

    // Decision loop
    while (toolCallsRemaining > 0) {
      const response = await client.chat(messages);
      const choice = response.choices[0];

      if (!choice) {
        log("  [No response from model]");
        break;
      }

      // If model responds with text (no tool calls), day is done
      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        log(`  Model: ${choice.message.content?.slice(0, 200) ?? "(no message)"}`);
        messages.push({
          role: "assistant",
          content: choice.message.content ?? "",
          reasoning_details: choice.message.reasoning_details,
          reasoning_content: choice.message.reasoning_content,
        });
        break;
      }

      // Process tool calls — preserve reasoning_details for multi-turn
      messages.push({
        role: "assistant",
        content: choice.message.content ?? undefined,
        tool_calls: choice.message.tool_calls,
        reasoning_details: choice.message.reasoning_details,
        reasoning_content: choice.message.reasoning_content,
      });

      for (const tc of choice.message.tool_calls) {
        toolCallsRemaining--;
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }

        log(`  Tool: ${tc.function.name}(${JSON.stringify(args)})`);

        const result = executeToolCall(world, { name: tc.function.name, arguments: args });
        log(`  Result: ${result.success ? "OK" : "ERROR"} ${JSON.stringify(result.data ?? result.error).slice(0, 200)}`);

        dayToolCalls.push({
          name: tc.function.name,
          arguments: args,
          result: result.success ? result.data : { error: result.error },
        });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result.success ? result.data : { error: result.error }),
        });

        if (toolCallsRemaining <= 0) {
          log("  [Max tool calls reached for today]");
          break;
        }
      }
    }

    // Settle the day
    const settlement = world.settleDay();
    log(`\n${settlement.summary}`);

    // Update history with tool calls
    const history = world.getHistory();
    const todayRecord = history[history.length - 1];
    if (todayRecord) {
      todayRecord.toolCalls = dayToolCalls;
    }
  }

  // Calculate final results
  const history = world.getHistory();
  const metrics = calculateMetrics(history, fullScenario.startingCash, fullScenario.inventoryLiquidationRate ?? 0);
  const finalScore = calculateScore(metrics);

  const result: SimulationResult = {
    id: randomUUID(),
    model,
    scenario: fullScenario.name,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    days: history,
    finalScore,
    metrics,
  };

  log(`\n${"═".repeat(50)}`);
  log(`SIMULATION COMPLETE`);
  log(`Model: ${model}`);
  log(`Final Score (Net Profit): ¥${finalScore.toFixed(2)}`);
  log(`Total Tokens Used: ${client.getTotalTokens()}`);

  return result;
}
