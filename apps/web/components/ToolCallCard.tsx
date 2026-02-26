"use client";

import { useState } from "react";
import type { ToolCall } from "@/lib/types";
import { getToolCategory, getToolLabel } from "@/lib/types";

interface ToolCallCardProps {
  call: ToolCall;
  index: number;
}

export function ToolCallCard({ call, index }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const category = getToolCategory(call.name);
  const label = getToolLabel(call.name);
  const isError = typeof call.result === "object" && call.result !== null && "error" in (call.result as Record<string, unknown>);

  const args = Object.keys(call.arguments).length > 0
    ? JSON.stringify(call.arguments, null, 2)
    : null;

  return (
    <div
      className={`tool-call-card tool-${category} ${isError ? "error" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="tool-call-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>
            #{index + 1}
          </span>
          <span className="tool-call-name">{label}</span>
          <span className={`badge tool-badge-${category}`} style={{ fontSize: "0.6875rem" }}>
            {category}
          </span>
        </div>
        <span style={{ fontSize: "0.75rem" }}>
          {isError ? (
            <span style={{ color: "var(--accent-red)" }}>Error</span>
          ) : (
            <span style={{ color: "var(--accent-green)" }}>OK</span>
          )}
        </span>
      </div>

      {expanded && (
        <>
          {args && <div className="tool-call-args">{args}</div>}
          <div className="tool-call-result">
            {JSON.stringify(call.result, null, 2)}
          </div>
        </>
      )}
    </div>
  );
}
