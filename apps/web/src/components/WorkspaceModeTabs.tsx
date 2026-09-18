import type { JSX } from "react";
import { useTranslation } from "../i18n";

export type WorkspaceMode = "video" | "motion";

export function WorkspaceModeTabs({
  activeMode,
  onSelectMode,
  ariaLabel = "Editor workspaces",
  className = "",
  accessibleLabels,
}: {
  activeMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  ariaLabel?: string;
  className?: string;
  accessibleLabels?: Partial<Record<WorkspaceMode, string>>;
}): JSX.Element {
  const { t } = useTranslation("common");

  const modes = [
    { id: "video" as const, label: t("videoEditor", "Video Editor") },
    { id: "motion" as const, label: t("motionDesign", "Motion Design") },
  ];
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-0 rounded-[9px] bg-bg-3 p-[3px] ${className}`}
    >
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-label={accessibleLabels?.[mode.id]}
            aria-selected={isActive}
            onClick={() => onSelectMode(mode.id)}
            className={`rounded-[7px] px-4 py-[7px] text-[13px] transition-colors ${
              isActive
                ? "bg-bg-1 text-fg font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                : "bg-transparent text-fg-3 font-medium hover:text-fg-2"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
