"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
}: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-2.5 text-sm font-medium transition-colors
              disabled:cursor-not-allowed disabled:opacity-40
              ${
                active
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }
            `}
          >
            {tab.label}

            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-slate-900" />
            )}
          </button>
        );
      })}
    </div>
  );
}