"use client";

import { History } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { AssetHistory, AssetStatus } from "@/types";

interface LifecycleTrackerProps {
  currentStatus: AssetStatus;
  history: AssetHistory[];
}

const statusOrder: AssetStatus[] = [
  "draft",
  "available",
  "reserved",
  "assigned",
  "maintenance",
  "repair",
  "returned",
  "disposed",
];

export function LifecycleTracker({ currentStatus, history }: LifecycleTrackerProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Current Asset Lifecycle Stage
        </h4>
        <div className="flex flex-wrap gap-2 items-center">
          {statusOrder.map((st, idx) => {
            const isCurrent = currentStatus === st;
            return (
              <div key={st} className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted text-muted-foreground border-transparent"
                  }`}
                >
                  {st.replace("_", " ")}
                </span>
                {idx < statusOrder.length - 1 && (
                  <span className="text-muted-foreground/40 font-mono text-xs">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Lifecycle Audit History Log
        </h4>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No lifecycle actions recorded yet.</p>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 font-sans before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {history.map((item) => (
              <div key={item.id} className="relative group">
                <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                <div className="space-y-1 rounded-lg border p-3 bg-background/50 hover:bg-background transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize text-foreground">
                      {item.action.replace("_", " ")}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {formatDateTime(item.date)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {item.remarks || "Lifecycle state updated"}
                  </p>

                  {(item.employee || item.performer) && (
                    <div className="flex gap-4 text-[11px] text-muted-foreground/80 pt-1">
                      {item.employee && (
                        <span>Holder: <strong className="text-foreground">{item.employee.employee_name}</strong></span>
                      )}
                      {item.performer && (
                        <span>Performed By: <strong className="text-foreground">{item.performer.full_name}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
