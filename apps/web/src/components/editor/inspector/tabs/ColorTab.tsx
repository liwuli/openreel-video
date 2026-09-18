import React from "react";
import { ColorGradingSection } from "../";
import { InspectorSection } from "../shell/InspectorSection";
import { useTranslation } from "../../../../i18n";

export interface ColorTabProps {
  clipId: string;
  showColorGrading: boolean;
}

export const ColorTab: React.FC<ColorTabProps> = ({
  clipId,
  showColorGrading,
}) => {
  const { t } = useTranslation("inspector");

  return (
    <>
      {showColorGrading && (
        <>
          <InspectorSection
            title={t("inspector:color.colorGrading", "Color Grading")}
            sectionId="color-grading"
            defaultOpen={false}
          >
            <ColorGradingSection clipId={clipId} />
          </InspectorSection>
        </>
      )}
    </>
  );
};
