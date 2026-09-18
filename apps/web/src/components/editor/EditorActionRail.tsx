import React, { useCallback } from "react";
import {
  ToolcraftDropdownMenu as DropdownMenu,
  ToolcraftIconButton as IconButton,
  ToolcraftTooltip as Tooltip,
} from "@openreel/ui";
import { Icon } from "@/icons/Icon";
import {
  House,
  Sun,
  Moon,
  SunMoon,
  Settings,
  Circle,
  Play,
  Sparkles,
  HelpCircle,
} from "@/icons/lucide-compat";
import { useProjectStore } from "../../stores/project-store";
import { useUIStore } from "../../stores/ui-store";
import { useThemeStore } from "../../stores/theme-store";
import { useSettingsStore } from "../../stores/settings-store";
import { useRouter } from "../../hooks/use-router";
import { useTranslation } from "../../i18n";
import {
  startTour,
  ONBOARDING_KEY,
  startMoGraphTour,
  MOGRAPH_TOUR_KEY,
} from "./tour";

const RailButton: React.FC<{
  label: string;
  icon: string;
  onClick: () => void;
  active?: boolean;
}> = ({ label, icon, onClick, active = false }) => (
  <Tooltip content={label} placement="end">
    <IconButton
      label={label}
      icon={<Icon name={icon} size={16} ariaHidden />}
      size="sm"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
    />
  </Tooltip>
);

export const EditorActionRail: React.FC = () => {
  const { t } = useTranslation(["rail", "common"]);
  const { undo, redo, createMotionComposition } = useProjectStore();
  const {
    openModal,
    toggleKeyframeEditor,
    keyframeEditorOpen,
    panels,
    togglePanel,
    activeModal,
  } = useUIStore();
  const { mode: themeMode, toggleTheme } = useThemeStore();
  const { openSettings } = useSettingsStore();
  const { navigate } = useRouter();

  const themeLabel =
    themeMode === "auto"
      ? t("rail:themeAuto")
      : themeMode === "light"
        ? t("rail:themeLight")
        : t("rail:themeDark");
  const nextThemeLabel =
    themeMode === "light"
      ? t("rail:themeDark")
      : themeMode === "dark"
        ? t("rail:themeAuto")
        : t("rail:themeLight");
  const themeIcon =
    themeMode === "light" ? (
      <Sun size={16} aria-hidden />
    ) : themeMode === "dark" ? (
      <Moon size={16} aria-hidden />
    ) : (
      <SunMoon size={16} aria-hidden />
    );
  const themeActionLabel = t("rail:themeSwitch", {
    current: themeLabel,
    next: nextThemeLabel,
  });

  const handleCreateMotionScene = useCallback(async () => {
    const composition = await createMotionComposition("Motion Scene");
    if (composition) {
      navigate("motion", { compositionId: composition.id });
    }
  }, [createMotionComposition, navigate]);

  return (
    <nav
      data-tour="toolbar"
      aria-label="Editor tools"
      className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-bg-1 py-3"
    >
      <Tooltip content={t("rail:home")} placement="end">
        <IconButton
          label={t("rail:home")}
          icon={<House size={16} aria-hidden />}
          size="sm"
          variant="ghost"
          onClick={() => navigate("welcome")}
        />
      </Tooltip>

      <div className="my-1.5 h-px w-6 bg-border" />

      <RailButton
        label={t("rail:search")}
        icon="magnifyingglass"
        onClick={() => openModal("search")}
      />
      <RailButton
        label={t("common:undo")}
        icon="arrow.uturn.backward"
        onClick={() => void undo()}
      />
      <RailButton
        label={t("common:redo")}
        icon="arrow.uturn.forward"
        onClick={() => void redo()}
      />

      <div className="my-1.5 h-px w-6 bg-border" />

      <RailButton
        label={t("rail:motionScene")}
        icon="cube"
        onClick={() => void handleCreateMotionScene()}
      />
      <RailButton
        label={t("rail:history")}
        icon="clock"
        onClick={() => openModal("history")}
        active={activeModal === "history"}
      />
      <RailButton
        label={t("rail:keyframeEditor")}
        icon="diamond"
        onClick={toggleKeyframeEditor}
        active={keyframeEditorOpen}
      />
      <RailButton
        label={t("rail:audioMixer")}
        icon="music.note"
        onClick={() => togglePanel("audioMixer")}
        active={Boolean(panels.audioMixer?.visible)}
      />
      <RailButton
        label={t("rail:aiEditor")}
        icon="bubble.left.and.text.bubble.right"
        onClick={() => togglePanel("agentChat")}
        active={Boolean(panels.agentChat?.visible)}
      />
      <RailButton
        label={t("rail:scriptView")}
        icon="curlybraces"
        onClick={() => openModal("scriptView")}
      />

      <div className="flex-1" />

      <Tooltip content={themeActionLabel} placement="end">
        <IconButton
          label={themeActionLabel}
          icon={themeIcon}
          size="sm"
          variant="secondary"
          onClick={toggleTheme}
        />
      </Tooltip>

      <DropdownMenu
        placement="end"
        button={{
          label: t("rail:moreActions"),
          icon: <Icon name="star" size={16} ariaHidden />,
          size: "sm",
          variant: "ghost",
          isIconOnly: true,
        }}
        hasChevron={false}
        menuWidth={224}
        items={[
          {
            label: t("rail:settings"),
            icon: <Settings size={14} aria-hidden />,
            onClick: () => openSettings(),
          },
          {
            label: t("rail:record"),
            icon: (
              <Circle
                size={14}
                className="fill-current text-status-error"
                aria-hidden
              />
            ),
            onClick: () => openModal("recorder"),
          },
          { type: "divider" },
          {
            label: t("rail:tour"),
            icon: <Play size={14} aria-hidden />,
            onClick: () => {
              localStorage.removeItem(ONBOARDING_KEY);
              startTour();
            },
          },
          {
            label: t("rail:motionTour"),
            icon: <Sparkles size={14} className="text-accent" aria-hidden />,
            onClick: () => {
              localStorage.removeItem(MOGRAPH_TOUR_KEY);
              startMoGraphTour();
            },
          },
          { type: "divider" },
          {
            label: t("rail:shortcuts"),
            icon: <HelpCircle size={14} aria-hidden />,
            isDisabled: true,
          },
        ]}
      />
    </nav>
  );
};
