import React from "react";
import type { Clip } from "@openreel/core";
import { SpeedSection, StabilizationSection, SpeedRampSection } from "../";
import { InspectorSection } from "../shell/InspectorSection";
import { useTranslation } from "../../../../i18n";

interface SpeedTabClip {
  id: string;
  mediaId: string;
}

export interface SpeedTabProps {
  showVideoControls: boolean;
  selectedClip: SpeedTabClip | null;
}

export const SpeedTab: React.FC<SpeedTabProps> = ({
  showVideoControls,
  selectedClip,
}) => {
  const { t } = useTranslation("inspector");

  return (
    <>
      {showVideoControls &&
        selectedClip &&
        !selectedClip.mediaId.startsWith("text-") &&
        !selectedClip.mediaId.startsWith("shape-") &&
        !selectedClip.mediaId.startsWith("svg-") &&
        !selectedClip.mediaId.startsWith("sticker-") && (
          <>
            <InspectorSection
              title={t("inspector:speed.speedDirection", "Speed & Direction")}
              sectionId="speed"
              defaultOpen={false}
            >
              <SpeedSection clip={selectedClip as Clip} />
            </InspectorSection>
          </>
        )}
      {showVideoControls &&
        selectedClip &&
        !selectedClip.mediaId.startsWith("text-") &&
        !selectedClip.mediaId.startsWith("shape-") &&
        !selectedClip.mediaId.startsWith("svg-") &&
        !selectedClip.mediaId.startsWith("sticker-") && (
          <InspectorSection
            title={t("inspector:speed.stabilization", "Stabilization")}
            sectionId="stabilization"
            defaultOpen={false}
          >
            <StabilizationSection clip={selectedClip as Clip} />
          </InspectorSection>
        )}
      {showVideoControls &&
        selectedClip &&
        !selectedClip.mediaId.startsWith("text-") &&
        !selectedClip.mediaId.startsWith("shape-") &&
        !selectedClip.mediaId.startsWith("svg-") &&
        !selectedClip.mediaId.startsWith("sticker-") && (
          <InspectorSection
            title={t("inspector:speed.speedCurves", "Speed Curves")}
            sectionId="speed-curves"
            defaultOpen={false}
          >
            <SpeedRampSection clip={selectedClip as Clip} />
          </InspectorSection>
        )}
    </>
  );
};
