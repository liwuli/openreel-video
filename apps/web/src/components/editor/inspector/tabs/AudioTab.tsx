import React from "react";
import { useProjectStore } from "../../../../stores/project-store";
import {
  AutoCutSilenceSection,
  AudioTextSyncPanel,
  NoiseReductionSection,
  AudioEffectsSection,
  AudioDuckingSection,
} from "../";
import { InspectorSection } from "../shell/InspectorSection";
import { PropertySlider } from "../shell/PropertySlider";
import { useTranslation } from "../../../../i18n";

export interface AudioTabProps {
  clipId: string;
  clipType: string | null;
  showAudioEffects: boolean;
  noiseReductionSectionTitle: string;
  selectedNoiseReductionEffect: unknown;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  clipId,
  clipType,
  showAudioEffects,
  noiseReductionSectionTitle,
  selectedNoiseReductionEffect,
}) => {
  const { t } = useTranslation("inspector");
  const clip = useProjectStore((state) =>
    state.project.timeline.tracks
      .flatMap((track) => track.clips)
      .find((candidate) => candidate.id === clipId),
  );

  const updateAudio = React.useCallback(
    (type: "audio/setVolume" | "audio/setFade", params: Record<string, unknown>) => {
      void useProjectStore.getState().executeAction({
        type,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        params: { clipId, ...params },
      });
    },
    [clipId],
  );

  return (
    <>
      {showAudioEffects && clip && (
        <InspectorSection
          title={t("inspector:audio.clipAudio", "Clip Audio")}
          sectionId="clip-audio"
          defaultOpen
        >
          <div className="space-y-4">
            <PropertySlider
              label={t("inspector:audio.volume", "Volume")}
              value={clip.volume * 100}
              onChange={(value) => updateAudio("audio/setVolume", { volume: value / 100 })}
              min={0}
              max={400}
              step={1}
              formatValue={(value) => `${Math.round(value)}%`}
            />
            <PropertySlider
              label={t("inspector:audio.fadeIn", "Fade in")}
              value={clip.fade?.fadeIn ?? 0}
              onChange={(fadeIn) => updateAudio("audio/setFade", { fadeIn })}
              min={0}
              max={Math.max(0, clip.duration / 2)}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}s`}
            />
            <PropertySlider
              label={t("inspector:audio.fadeOut", "Fade out")}
              value={clip.fade?.fadeOut ?? 0}
              onChange={(fadeOut) => updateAudio("audio/setFade", { fadeOut })}
              min={0}
              max={Math.max(0, clip.duration / 2)}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}s`}
            />
          </div>
        </InspectorSection>
      )}
      {showAudioEffects && (
        <InspectorSection
          title={t("inspector:audio.autoCutSilence", "Auto Cut Silence")}
          sectionId="auto-cut-silence"
          defaultOpen={false}
        >
          <AutoCutSilenceSection clipId={clipId} />
        </InspectorSection>
      )}
      {clipType === "audio" && (
        <InspectorSection
          title={t("inspector:audio.beatSync", "Beat Sync")}
          sectionId="beat-sync"
          defaultOpen={false}
        >
          <AudioTextSyncPanel clipId={clipId} />
        </InspectorSection>
      )}
      {showAudioEffects && (
        <InspectorSection
          title={noiseReductionSectionTitle || t("inspector:audio.backgroundNoiseRemoval", "Background Noise Removal")}
          sectionId="background-noise-removal"
          defaultOpen={Boolean(selectedNoiseReductionEffect)}
        >
          <NoiseReductionSection clipId={clipId} />
        </InspectorSection>
      )}
      {showAudioEffects && (
        <>
          <InspectorSection
            title={t("inspector:audio.audioEffects", "Audio Effects")}
            sectionId="audio-effects"
            defaultOpen={false}
          >
            <AudioEffectsSection clipId={clipId} />
          </InspectorSection>
        </>
      )}
      {showAudioEffects && (
        <InspectorSection
          title={t("inspector:audio.audioDucking", "Audio Ducking")}
          sectionId="audio-ducking"
          defaultOpen={false}
        >
          <AudioDuckingSection clipId={clipId} />
        </InspectorSection>
      )}
    </>
  );
};
