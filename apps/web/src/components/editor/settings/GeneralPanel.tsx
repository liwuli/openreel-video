import React, { useCallback } from "react";
import { ToolcraftSwitchControl } from "@openreel/ui";
import { ToolcraftButton as Button } from "@openreel/ui";
import { ToolcraftClickableCard as ClickableCard } from "@openreel/ui";
import { ToolcraftNumberInputControl } from "@openreel/ui";
import { ToolcraftSelectControl as Selector } from "@openreel/ui";
import { ToolcraftText as Text } from "@openreel/ui";
import { ToolcraftTextInputControl as TextInput } from "@openreel/ui";
import { useSettingsStore, SERVICE_REGISTRY, type TtsProvider, type LlmProvider, type AggregatorProvider } from "../../../stores/settings-store";
import { useProjectStore } from "../../../stores/project-store";
import { EDITING_FRAME_RATE_OPTIONS } from "../editing-frame-rate";
import { useTranslation, SUPPORTED_LANGUAGES } from "../../../i18n";

const ASPECT_PRESETS: Array<{ key: string; label: string; width: number; height: number }> = [
  { key: "16_9", label: "16:9 Landscape (1080p)", width: 1920, height: 1080 },
  { key: "9_16", label: "9:16 Vertical (TikTok/Reels)", width: 1080, height: 1920 },
  { key: "1_1", label: "1:1 Square", width: 1080, height: 1080 },
  { key: "4_5", label: "4:5 Portrait", width: 1080, height: 1350 },
  { key: "4_3", label: "4:3 Standard", width: 1440, height: 1080 },
  { key: "21_9", label: "21:9 Cinematic", width: 2560, height: 1080 },
  { key: "4k", label: "4K Landscape", width: 3840, height: 2160 },
];

const BACKGROUND_SWATCHES = [
  "#000000",
  "#FFFFFF",
  "#1E1E1E",
  "#2563EB",
  "#DC2626",
  "#16A34A",
  "#F59E0B",
  "#9333EA",
  "#DB2777",
  "#0EA5E9",
];

export const GeneralPanel: React.FC = () => {
  const { t } = useTranslation(["settings", "common"]);
  const {
    language,
    autoSave,
    autoSaveInterval,
    defaultTtsProvider,
    defaultLlmProvider,
    llmBaseUrl,
    llmModel,
    defaultAggregator,
    configuredServices,
    setLanguage,
    setAutoSave,
    setAutoSaveInterval,
    setDefaultTtsProvider,
    setDefaultLlmProvider,
    setLlmBaseUrl,
    setLlmModel,
    setDefaultAggregator,
  } = useSettingsStore();

  const projectWidth = useProjectStore((s) => s.project.settings.width);
  const projectHeight = useProjectStore((s) => s.project.settings.height);
  const projectFrameRate = useProjectStore(
    (s) => s.project.settings.frameRate,
  );
  const updateProjectSettings = useProjectStore((s) => s.updateSettings);
  const backgroundFillMode = useProjectStore(
    (s) => s.project.timeline.backgroundFillMode,
  );
  const layoutBackgroundColor = useProjectStore(
    (s) => s.project.timeline.layoutBackgroundColor,
  );
  const setCanvasBackground = useProjectStore((s) => s.setCanvasBackground);

  const [draftWidth, setDraftWidth] = React.useState(String(projectWidth));
  const [draftHeight, setDraftHeight] = React.useState(String(projectHeight));

  React.useEffect(() => {
    setDraftWidth(String(projectWidth));
    setDraftHeight(String(projectHeight));
  }, [projectWidth, projectHeight]);

  const applyDimensions = useCallback(
    async (width: number, height: number) => {
      const w = Math.max(16, Math.min(7680, Math.round(width)));
      const h = Math.max(16, Math.min(7680, Math.round(height)));
      await updateProjectSettings({ width: w, height: h });
    },
    [updateProjectSettings],
  );

  const handleApplyCustom = useCallback(() => {
    const w = Number(draftWidth);
    const h = Number(draftHeight);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      applyDimensions(w, h);
    }
  }, [draftWidth, draftHeight, applyDimensions]);

  const ttsProviders = SERVICE_REGISTRY.filter((s) => s.id === "elevenlabs");

  const llmProviders = SERVICE_REGISTRY.filter(
    (s) => s.id === "openai-compatible" || s.id === "anthropic-compatible",
  );

  const aggregatorProviders = SERVICE_REGISTRY.filter(
    (s) =>
      s.id === "kie-ai" ||
      s.id === "freepik" ||
      configuredServices.includes(s.id),
  );
  return (
    <div className="space-y-6 pb-4">
      {/* Language Preferences */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Text type="body" color="primary" className="text-sm font-medium">
              {t("settings:general.language")}
            </Text>
            <Text type="supporting" color="secondary" className="mt-0.5 text-xs">
              {t("settings:general.languageDescription")}
            </Text>
          </div>
          <Selector
            label={t("settings:general.language")}
            isLabelHidden
            size="md"
            width={180}
            value={language}
            onChange={(value) => setLanguage(value)}
            options={SUPPORTED_LANGUAGES.map((lang) => ({
              label: lang.nativeName,
              value: lang.code,
            }))}
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Project Composition */}
      <div className="space-y-4">
        <div>
          <Text type="body" color="primary" className="text-sm font-medium">
            {t("settings:general.projectComposition")}
          </Text>
          <Text type="supporting" color="secondary" className="mt-0.5 text-xs">
            {t("settings:general.projectCompositionDescription")}
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ASPECT_PRESETS.map((preset) => {
            const isActive =
                preset.width === projectWidth && preset.height === projectHeight;
            const presetLabel = t(`settings:general.presets.${preset.key}`, preset.label);
            return (
              <ClickableCard
                key={preset.key}
                label={presetLabel}
                onClick={() => applyDimensions(preset.width, preset.height)}
                padding={3}
                variant={isActive ? "green" : "muted"}
                className={`text-left text-xs border ${
                  isActive
                    ? "border-primary bg-primary/10 text-text-primary"
                    : "border-border bg-background-tertiary text-text-secondary hover:text-text-primary hover:border-primary/40"
                }`}
              >
                <Text type="supporting" color="inherit" className="font-medium">
                  {presetLabel}
                </Text>
                <Text type="supporting" color="secondary" className="mt-0.5 text-[10px]">
                  {preset.width} × {preset.height}
                </Text>
              </ClickableCard>
            );
          })}
        </div>

        <div className="flex items-end gap-2">
          <ToolcraftNumberInputControl
            label={t("settings:general.width")}
            size="md"
            width="100%"
            min={16}
            max={7680}
            value={Number.isFinite(Number(draftWidth)) ? Number(draftWidth) : null}
            onChange={(value) => setDraftWidth(String(value))}
          />
          <ToolcraftNumberInputControl
            label={t("settings:general.height")}
            size="md"
            width="100%"
            min={16}
            max={7680}
            value={Number.isFinite(Number(draftHeight)) ? Number(draftHeight) : null}
            onChange={(value) => setDraftHeight(String(value))}
          />
          <Button
            label={t("common:apply")}
            onClick={handleApplyCustom}
            variant="primary"
            size="md"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background-tertiary p-3">
          <div>
            <Text type="supporting" color="primary" className="text-sm font-medium">
              {t("settings:general.editingFrameRate")}
            </Text>
            <Text type="supporting" color="secondary" className="mt-0.5 block text-[11px]">
              {t("settings:general.editingFrameRateDescription")}
            </Text>
          </div>
          <Selector
            label={t("settings:general.editingFrameRate")}
            isLabelHidden
            size="md"
            width={160}
            value={String(projectFrameRate)}
            onChange={(value) => {
              const frameRate = Number(value);
              if (Number.isFinite(frameRate) && frameRate > 0) {
                void updateProjectSettings({ frameRate });
              }
            }}
            options={EDITING_FRAME_RATE_OPTIONS.map((option) => ({
              label: option.label,
              value: String(option.value),
            }))}
          />
        </div>

        <div className="space-y-2">
          <Text type="supporting" color="secondary" className="text-xs font-medium">
            {t("settings:general.backgroundFill")}
          </Text>
          <Text type="supporting" color="secondary" className="text-[11px]">
            {t("settings:general.backgroundFillDescription")}
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <ClickableCard
              label={t("settings:general.fillNone")}
              onClick={() => setCanvasBackground(undefined, undefined)}
              padding={2}
              variant={!backgroundFillMode ? "green" : "muted"}
              className={`border px-3 py-1.5 text-xs ${
                !backgroundFillMode
                  ? "border-primary bg-primary/10 text-text-primary"
                  : "border-border bg-background-tertiary text-text-secondary hover:text-text-primary"
              }`}
            >
              {t("settings:general.fillNone")}
            </ClickableCard>
            <ClickableCard
              label={t("settings:general.fillBlur")}
              onClick={() =>
                setCanvasBackground("blur", layoutBackgroundColor)
              }
              padding={2}
              variant={backgroundFillMode === "blur" ? "green" : "muted"}
              className={`border px-3 py-1.5 text-xs ${
                backgroundFillMode === "blur"
                  ? "border-primary bg-primary/10 text-text-primary"
                  : "border-border bg-background-tertiary text-text-secondary hover:text-text-primary"
              }`}
            >
              {t("settings:general.fillBlur")}
            </ClickableCard>
            {BACKGROUND_SWATCHES.map((hex) => {
              const isActive =
                backgroundFillMode === "color" &&
                layoutBackgroundColor?.toLowerCase() === hex.toLowerCase();
              return (
                <ClickableCard
                  key={hex}
                  label={`Background color ${hex}`}
                  onClick={() => setCanvasBackground("color", hex)}
                  padding={0}
                  variant="transparent"
                  style={{ backgroundColor: hex }}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    isActive
                      ? "border-primary scale-110"
                      : "border-border hover:scale-105"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Auto-save */}
      <div className="space-y-4">
        <Text type="body" color="primary" className="text-sm font-medium">
          {t("settings:general.autoSaveTitle")}
        </Text>

        <div className="flex items-center justify-between">
          <div>
            <Text type="supporting" color="secondary" className="text-sm">
              {t("settings:general.autoSave")}
            </Text>
            <Text type="supporting" color="secondary" className="mt-0.5 text-xs">
              {t("settings:general.autoSaveDescription")}
            </Text>
          </div>
          <ToolcraftSwitchControl
            ariaLabel={t("settings:general.autoSave")}
            checked={autoSave}
            onCheckedChange={setAutoSave}
            showLabel={false}
          />
        </div>

        {autoSave && (
          <div className="flex items-center gap-3">
            <Text type="supporting" color="secondary" className="whitespace-nowrap text-sm">
              {t("settings:general.saveEvery")}
            </Text>
            <Selector
              label={t("settings:general.saveEvery")}
              isLabelHidden
              size="md"
              width={150}
              value={String(autoSaveInterval)}
              onChange={(value) => setAutoSaveInterval(Number(value))}
              options={[
                { label: t("settings:general.intervals.1"), value: "1" },
                { label: t("settings:general.intervals.2"), value: "2" },
                { label: t("settings:general.intervals.5"), value: "5" },
                { label: t("settings:general.intervals.10"), value: "10" },
                { label: t("settings:general.intervals.15"), value: "15" },
                { label: t("settings:general.intervals.30"), value: "30" },
              ]}
            />
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* AI connections */}
      <div className="space-y-4">
        <Text type="body" color="primary" className="text-sm font-medium">
          {t("settings:general.aiConnections")}
        </Text>
        <Text type="supporting" color="secondary" className="text-xs">
          {t("settings:general.aiConnectionsDescription")}
        </Text>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text type="supporting" color="secondary" className="text-sm">
              {t("settings:general.ttsProvider")}
            </Text>
            <Selector
              label={t("settings:general.ttsProvider")}
              isLabelHidden
              size="md"
              width={180}
              value={defaultTtsProvider}
              onChange={(value) => setDefaultTtsProvider(value as TtsProvider)}
              options={ttsProviders.map((s) => ({ label: s.label, value: s.id }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Text type="supporting" color="secondary" className="text-sm">
              {t("settings:general.llmFormat")}
            </Text>
            <Selector
              label={t("settings:general.llmFormat")}
              isLabelHidden
              size="md"
              width={180}
              value={defaultLlmProvider ?? ""}
              onChange={(value) =>
                setDefaultLlmProvider((value || null) as LlmProvider | null)
              }
              options={[
                { label: t("settings:general.chooseApiFormat"), value: "" },
                ...llmProviders.map((s) => ({ label: s.label, value: s.id })),
              ]}
            />
          </div>

          {defaultLlmProvider ? (
            <div className="space-y-3 rounded-lg border border-border bg-background-tertiary p-3">
              <div>
                <Text type="supporting" color="secondary" className="text-sm font-medium">
                  {defaultLlmProvider === "anthropic-compatible"
                    ? t("settings:general.anthropicEndpoint")
                    : t("settings:general.openAiEndpoint")}
                </Text>
                <Text type="supporting" color="secondary" className="mt-0.5 block text-xs">
                  {t("settings:general.endpointDescription")}
                </Text>
              </div>
              <TextInput
                label={t("settings:general.baseUrl")}
                value={llmBaseUrl}
                onChange={setLlmBaseUrl}
                placeholder={
                  defaultLlmProvider === "anthropic-compatible"
                    ? "https://gateway.example/v1"
                    : "http://localhost:11434/v1"
                }
                width="100%"
              />
              <TextInput
                label={t("settings:general.modelId")}
                value={llmModel}
                onChange={setLlmModel}
                placeholder={t("settings:general.modelIdPlaceholder")}
                width="100%"
              />
              <Text type="supporting" color="secondary" className="block text-[11px] leading-relaxed">
                {t("settings:general.modelDiscoveryHelp")}
              </Text>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-background-tertiary p-3">
              <Text type="supporting" color="secondary" className="block text-xs">
                {t("settings:general.chooseApiFormat")}
              </Text>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Text type="supporting" color="secondary" className="text-sm">
                {t("settings:general.aiAggregator")}
              </Text>
              <Text type="supporting" color="secondary" className="mt-0.5 text-xs">
                {t("settings:general.aiAggregatorDescription")}
              </Text>
            </div>
            <Selector
              label={t("settings:general.aiAggregator")}
              isLabelHidden
              size="md"
              width={180}
              value={defaultAggregator}
              onChange={(value) => setDefaultAggregator(value as AggregatorProvider)}
              options={aggregatorProviders.map((s) => ({ label: s.label, value: s.id }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
