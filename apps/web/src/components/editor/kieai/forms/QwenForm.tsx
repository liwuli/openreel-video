import { ToolcraftButton as Button } from "@openreel/ui";
import { ToolcraftSelectControl as Selector } from "@openreel/ui";
import { ToolcraftSliderControl } from "@openreel/ui";
import { ToolcraftText as Text } from "@openreel/ui";
import { ToolcraftTextAreaControl } from "@openreel/ui";
import type { QwenInput } from "../../../../services/kieai/image-generation";
import { useTranslation } from "../../../../i18n";

interface Props {
  value: QwenInput;
  onChange: (v: QwenInput) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function QwenForm({ value, onChange, onSubmit, isLoading }: Props) {
  const { t } = useTranslation("ai");
  const strength = value.strength ?? 0.8;

  return (
    <div className="space-y-4">
      <ToolcraftTextAreaControl
        label={t("kieai.form.prompt", "Prompt")}
        isRequired
        value={value.prompt}
        onChange={(prompt) => onChange({ ...value, prompt })}
        placeholder={t(
          "kieai.form.promptPlaceholder",
          "Describe the image you want to generate...",
        )}
        maxLength={2000}
        rows={4}
        width="100%"
      />

      <div className="space-y-1.5">
        <Text type="supporting" color="secondary" weight="bold" display="block">
          {t("kieai.form.strengthValue", "Strength — {{value}}", {
            value: strength.toFixed(1),
          })}
          <Text type="supporting" color="secondary" className="ml-2">
            {t(
              "kieai.form.strengthHint",
              "(0 = preserve original, 1 = full remake)",
            )}
          </Text>
        </Text>
        <ToolcraftSliderControl
          label={t("kieai.form.strength", "Strength")}
          isLabelHidden
          min={0}
          max={1}
          step={0.05}
          value={strength}
          onChange={(nextStrength: number) =>
            onChange({ ...value, strength: nextStrength })
          }
          valueDisplay="none"
        />
        <div className="flex justify-between">
          <Text type="supporting" color="secondary" className="text-[10px]">
            {t("kieai.form.preserve", "Preserve")}
          </Text>
          <Text type="supporting" color="secondary" className="text-[10px]">
            {t("kieai.form.remake", "Remake")}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Selector
          label={t("kieai.form.format", "Format")}
          value={value.output_format ?? "png"}
          onChange={(output_format) =>
            onChange({ ...value, output_format: output_format as QwenInput["output_format"] })
          }
          options={[
            { value: "png", label: "PNG" },
            { value: "jpeg", label: "JPEG" },
          ]}
          size="sm"
          width="100%"
        />

        <Selector
          label={t("kieai.form.acceleration", "Acceleration")}
          value={value.acceleration ?? "regular"}
          onChange={(acceleration) =>
            onChange({ ...value, acceleration: acceleration as QwenInput["acceleration"] })
          }
          options={[
            {
              value: "none",
              label: t("kieai.form.accelerationNone", "None (best quality)"),
            },
            {
              value: "regular",
              label: t("kieai.form.accelerationRegular", "Regular"),
            },
            {
              value: "high",
              label: t("kieai.form.accelerationHigh", "High (fastest)"),
            },
          ]}
          size="sm"
          width="100%"
        />
      </div>

      <ToolcraftTextAreaControl
        label={t("kieai.form.negativePrompt", "Negative Prompt (optional)")}
        value={value.negative_prompt ?? ""}
        onChange={(negative_prompt) =>
          onChange({ ...value, negative_prompt: negative_prompt || undefined })
        }
        placeholder={t(
          "kieai.form.negativePromptPlaceholder",
          "Describe what you don't want in the result...",
        )}
        maxLength={500}
        rows={2}
        width="100%"
      />

      <Button
        label={
          isLoading
            ? t("kieai.form.generating", "Generating...")
            : t("kieai.form.generateWithQwen", "Generate with Qwen")
        }
        onClick={onSubmit}
        isDisabled={isLoading || !value.prompt.trim()}
        variant="primary"
        className="w-full"
      />
    </div>
  );
}
