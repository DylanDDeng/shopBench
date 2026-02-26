"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface CompareTabPanelProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function CompareTabPanel({ tabs, defaultTab }: CompareTabPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div>
      <div className="tab-bar" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            className={`tab-btn ${tab.id === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{activeContent}</div>
    </div>
  );
}
