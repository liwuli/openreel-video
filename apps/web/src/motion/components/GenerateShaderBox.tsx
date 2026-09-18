import type { JSX } from "react";
import { useState } from "react";
import { Sparkles } from "@/icons/lucide-compat";
import type { MotionShaderCategory, MotionShaderDef } from "@openreel/core";
import { ToolcraftText } from "@openreel/ui";
import i18n, { useTranslation } from "../../i18n";
import { generateAiShader, type LlmMessage } from "../../services/ai-shader";
import { makeBYOKClient } from "../../services/agent/llm-transport";
import { getSecret, isSessionUnlocked } from "../../services/secure-storage";
import { useProjectStore } from "../../stores/project-store";
import { useSettingsStore, type LlmProvider } from "../../stores/settings-store";
import { Button, Field, TextInput } from "./primitives";

interface GenerateShaderBoxProps {
  category: MotionShaderCategory;
  onGenerated: (def: MotionShaderDef) => void;
}

type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "generating" }
  | { readonly kind: "error"; readonly message: string };

const configureProviderMessage = (): string =>
  i18n.t(
    "motion:shaderBox.configureProvider",
    "Configure an AI provider in settings",
  );

function isDesktop(): boolean {
  return typeof window !== "undefined" && window.openreel?.platform === "desktop";
}

function resolveModel(): {
  provider: LlmProvider | null;
  model: string;
  baseUrl: string;
} {
  const settings = useSettingsStore.getState();
  return {
    provider: settings.defaultLlmProvider,
    model: settings.llmModel.trim(),
    baseUrl: settings.llmBaseUrl,
  };
}

async function resolveApiKey(provider: LlmProvider): Promise<string | null> {
  if (isDesktop()) return "";
  const optionalKey =
    !useSettingsStore.getState().configuredServices.includes(provider);
  if (optionalKey && !isSessionUnlocked()) return "";
  if (!isSessionUnlocked()) return null;
  try {
    const key = await getSecret(provider);
    return key ?? (optionalKey ? "" : null);
  } catch {
    return null;
  }
}

export function GenerateShaderBox({
  category,
  onGenerated,
}: GenerateShaderBoxProps): JSX.Element {
  const { t } = useTranslation("motion");
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const busy = phase.kind === "generating";

  const runGenerate = async (): Promise<void> => {
    const trimmed = prompt.trim();
    if (trimmed === "" || busy) return;

    setPhase({ kind: "generating" });

    const { provider, model, baseUrl } = resolveModel();
    if (!provider || !model || !baseUrl.trim()) {
      setPhase({ kind: "error", message: configureProviderMessage() });
      return;
    }
    const apiKey = await resolveApiKey(provider);
    if (apiKey === null) {
      setPhase({ kind: "error", message: configureProviderMessage() });
      return;
    }

    const client = makeBYOKClient({ provider, model, apiKey, baseUrl });
    const send = async (messages: readonly LlmMessage[]): Promise<string> => {
      const response = await client.complete({
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        tools: [],
      });
      return response.text;
    };

    let result;
    try {
      result = await generateAiShader(trimmed, category, { send });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("motion:shaderBox.generationFailed", "Shader generation failed");
      setPhase({ kind: "error", message });
      return;
    }

    if (!result.ok) {
      setPhase({ kind: "error", message: result.error });
      return;
    }

    const { def } = result;
    const dispatched = await useProjectStore.getState().executeAction({
      type: "project/registerGeneratedShader",
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      params: { def },
    });
    if (!dispatched.success) {
      setPhase({
        kind: "error",
        message:
          dispatched.error?.message ??
          t("motion:shaderBox.saveFailed", "Could not save the shader"),
      });
      return;
    }

    setPrompt("");
    setPhase({ kind: "idle" });
    onGenerated(def);
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border bg-bg-2 p-3">
      <ToolcraftText
        as="span"
        type="label"
        color="primary"
        weight="semibold"
        className="flex items-center gap-1.5"
      >
        <Sparkles size={13} />
        {t("motion:shaderBox.generateWithAi", "Generate with AI")}
      </ToolcraftText>
      <Field label={t("motion:shaderBox.promptLabel", "Shader prompt")}>
        <TextInput
          value={prompt}
          onChange={setPrompt}
          placeholder={t(
            "motion:shaderBox.promptPlaceholder",
            "Describe a shader, e.g. holographic foil",
          )}
          disabled={busy}
        />
      </Field>
      <Button
        label={t("motion:shaderBox.generate", "Generate shader")}
        variant="solid"
        onClick={() => void runGenerate()}
        disabled={busy || prompt.trim() === ""}
      />
      {phase.kind === "generating" ? (
        <ToolcraftText type="supporting" color="secondary">
          {t("motion:shaderBox.generating", "Generating shader...")}
        </ToolcraftText>
      ) : null}
      {phase.kind === "error" ? (
        <span className="block text-[11px] leading-relaxed text-status-error">
          {phase.message}
        </span>
      ) : null}
    </div>
  );
}
