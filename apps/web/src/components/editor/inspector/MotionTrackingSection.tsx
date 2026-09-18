import React, { useState, useEffect, useCallback } from "react";
import { ToolcraftButton as Button } from "@openreel/ui";
import { ToolcraftCard as Card } from "@openreel/ui";
import { ToolcraftCheckboxInput as CheckboxInput } from "@openreel/ui";
import { ToolcraftIconButton as IconButton } from "@openreel/ui";
import { ToolcraftNumberInputControl } from "@openreel/ui";
import { ToolcraftText as Text } from "@openreel/ui";
import { PropertySlider } from "./shell/PropertySlider";
import {
  Target,
  X,
  Check,
  AlertTriangle,
  Move,
  RotateCcw,
  Maximize2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "@/icons/lucide-compat";
import {
  getMotionTrackingBridge,
  type MotionTrackingState,
} from "../../../bridges/motion-tracking-bridge";
import type { Rectangle } from "@openreel/core";
import { useTranslation } from "../../../i18n";

interface MotionTrackingSectionProps {
  clipId: string;
}

type TrackingAlgorithm = "correlation" | "optical-flow" | "feature";

const ALGORITHMS: {
  id: TrackingAlgorithm;
  nameKey: string;
  name: string;
  descriptionKey: string;
  description: string;
}[] = [
  {
    id: "correlation",
    nameKey: "inspector:motionTracking.algoCorrelation",
    name: "Correlation",
    descriptionKey: "inspector:motionTracking.algoCorrelationDescription",
    description: "Best for high-contrast objects",
  },
  {
    id: "optical-flow",
    nameKey: "inspector:motionTracking.algoOpticalFlow",
    name: "Optical Flow",
    descriptionKey: "inspector:motionTracking.algoOpticalFlowDescription",
    description: "Good for smooth motion",
  },
  {
    id: "feature",
    nameKey: "inspector:motionTracking.algoFeatureMatch",
    name: "Feature Match",
    descriptionKey: "inspector:motionTracking.algoFeatureMatchDescription",
    description: "Works with complex textures",
  },
];

const RegionInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <ToolcraftNumberInputControl
    label={label}
    size="sm"
    width="100%"
    value={value}
    onChange={onChange}
    step={1}
  />
);

export const MotionTrackingSection: React.FC<MotionTrackingSectionProps> = ({
  clipId,
}) => {
  const { t } = useTranslation("inspector");
  const [state, setState] = useState<MotionTrackingState>({
    isTracking: false,
    progress: 0,
    currentJob: null,
    trackingData: null,
    lostFrames: [],
    error: null,
  });

  const [region, setRegion] = useState<Rectangle>({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
  });

  const [algorithm, setAlgorithm] = useState<TrackingAlgorithm>("correlation");
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [applyScale, setApplyScale] = useState(true);
  const [applyRotation, setApplyRotation] = useState(true);
  const [smoothing, setSmoothing] = useState(0);
  const [isApplied, setIsApplied] = useState(false);

  const bridge = getMotionTrackingBridge();

  useEffect(() => {
    const unsubscribe = bridge.subscribe(setState);
    const existingData = bridge.getTrackingDataForClip(clipId);
    if (existingData.length > 0) {
      setState((prev) => ({
        ...prev,
        trackingData: existingData[existingData.length - 1],
      }));
    }
    return unsubscribe;
  }, [bridge, clipId]);

  const handleStartTracking = useCallback(async () => {
    try {
      await bridge.startTracking(clipId, region, {
        frameRate: 30,
        startFrame: 0,
        endFrame: 150,
        algorithm,
        confidenceThreshold: confidenceThreshold / 100,
      });
    } catch (error) {
      console.error("Failed to start tracking:", error);
    }
  }, [bridge, clipId, region, algorithm, confidenceThreshold]);

  const handleCancelTracking = useCallback(() => {
    if (state.currentJob) {
      bridge.cancelTracking(state.currentJob.id);
    }
  }, [bridge, state.currentJob]);

  const handleApplyTracking = useCallback(() => {
    const success = bridge.applyTrackingToClip(clipId, {
      x: offsetX,
      y: offsetY,
    });
    if (success) {
      bridge.setApplyScale(clipId, applyScale);
      bridge.setApplyRotation(clipId, applyRotation);
      setIsApplied(true);
    }
  }, [bridge, clipId, offsetX, offsetY, applyScale, applyRotation]);

  const handleRemoveTracking = useCallback(() => {
    bridge.removeAttachment(clipId);
    setIsApplied(false);
  }, [bridge, clipId]);

  const handleOffsetChange = useCallback(
    (axis: "x" | "y", value: number) => {
      if (axis === "x") {
        setOffsetX(value);
      } else {
        setOffsetY(value);
      }
      if (isApplied) {
        bridge.setTrackingOffset(clipId, {
          x: axis === "x" ? value : offsetX,
          y: axis === "y" ? value : offsetY,
        });
      }
    },
    [bridge, clipId, isApplied, offsetX, offsetY],
  );

  const hasTrackingData =
    state.trackingData !== null || bridge.hasTrackingData(clipId);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/30">
        <Target size={16} className="text-primary" />
        <div className="flex flex-1 flex-col gap-0.5">
          <Text type="supporting" color="primary" weight="medium">
            {t("inspector:motionTracking.title", "Motion Tracking")}
          </Text>
          <Text type="supporting" color="secondary" className="text-[9px]">
            {t("inspector:motionTracking.subtitle", "Track objects to attach elements")}
          </Text>
        </div>
      </div>

      {!state.isTracking && !hasTrackingData && (
        <>
          <div className="space-y-2">
            <Text type="supporting" color="secondary" weight="medium">
              {t("inspector:motionTracking.trackingRegion", "Tracking Region")}
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <RegionInput
                label={t("inspector:motionTracking.xPosition", "X Position")}
                value={region.x}
                onChange={(x) => setRegion({ ...region, x })}
              />
              <RegionInput
                label={t("inspector:motionTracking.yPosition", "Y Position")}
                value={region.y}
                onChange={(y) => setRegion({ ...region, y })}
              />
              <RegionInput
                label={t("inspector:motionTracking.width", "Width")}
                value={region.width}
                onChange={(width) => setRegion({ ...region, width })}
              />
              <RegionInput
                label={t("inspector:motionTracking.height", "Height")}
                value={region.height}
                onChange={(height) => setRegion({ ...region, height })}
              />
            </div>
            <Text type="supporting" color="secondary" className="text-center text-[9px]">
              {t(
                "inspector:motionTracking.drawRegionHint",
                "Draw region in preview or enter coordinates",
              )}
            </Text>
          </div>

          <Button
            label={t("inspector:motionTracking.advancedOptions", "Advanced Options")}
            size="sm"
            variant="ghost"
            icon={showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center gap-2 py-1.5 text-[10px] text-fg-2 hover:text-fg transition-colors"
          />

          {showAdvanced && (
            <Card variant="muted" padding={3} className="space-y-3">
              <div className="space-y-1.5">
                <Text type="supporting" color="secondary" weight="medium">
                  {t("inspector:motionTracking.algorithm", "Algorithm")}
                </Text>
                <div className="space-y-1">
                  {ALGORITHMS.map((algo) => (
                    <Button
                      key={algo.id}
                      label={t(
                        "inspector:motionTracking.algorithmOption",
                        "{{name}}: {{description}}",
                        {
                          name: t(algo.nameKey, algo.name),
                          description: t(algo.descriptionKey, algo.description),
                        },
                      )}
                      size="sm"
                      variant={algorithm === algo.id ? "primary" : "secondary"}
                      onClick={() => setAlgorithm(algo.id)}
                      className="w-full justify-start"
                    />
                  ))}
                </div>
              </div>

              <PropertySlider
                label={t("inspector:motionTracking.confidenceThreshold", "Confidence Threshold")}
                min={30}
                max={95}
                step={5}
                value={confidenceThreshold}
                onChange={setConfidenceThreshold}
                formatValue={(value) => `${value}%`}
                description={t(
                  "inspector:motionTracking.confidenceThresholdDescription",
                  "Higher = more accurate but may lose track easier",
                )}
              />

              <PropertySlider
                label={t("inspector:motionTracking.pathSmoothing", "Path Smoothing")}
                min={0}
                max={10}
                step={1}
                value={smoothing}
                onChange={setSmoothing}
                formatValue={(value) => String(value)}
                description={t(
                  "inspector:motionTracking.pathSmoothingDescription",
                  "Reduces jitter in tracking path",
                )}
              />
            </Card>
          )}

          <Button
            label={t("inspector:motionTracking.startTracking", "Start Tracking")}
            size="md"
            variant="primary"
            icon={<Target size={14} />}
            onClick={handleStartTracking}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover rounded-lg text-[11px] font-medium text-white flex items-center justify-center gap-2 transition-colors"
          />
        </>
      )}

      {state.isTracking && (
        <div className="space-y-3 p-3 bg-bg-2 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <Text type="supporting" color="primary" weight="medium">
                {t("inspector:motionTracking.trackingInProgress", "Tracking in Progress")}
              </Text>
            </div>
            <IconButton
              label={t("inspector:motionTracking.cancelTracking", "Cancel Tracking")}
              icon={<X size={14} />}
              size="sm"
              variant="ghost"
              onClick={handleCancelTracking}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <Text type="supporting" color="secondary">
                {t("inspector:motionTracking.analyzingFrames", "Analyzing frames...")}
              </Text>
              <Text type="supporting" color="primary" className="font-mono">
                {Math.round(state.progress)}%
              </Text>
            </div>
            <div className="w-full h-2 bg-bg-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>

          {state.lostFrames.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400">
              <AlertTriangle size={12} />
              {t("inspector:motionTracking.lostTracking", "Lost tracking on {{count}} frame(s)", {
                count: state.lostFrames.length,
              })}
            </div>
          )}
        </div>
      )}

      {state.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400">
          <div className="flex items-center gap-2 font-medium mb-1">
            <AlertTriangle size={12} />
            {t("inspector:motionTracking.trackingFailed", "Tracking Failed")}
          </div>
          <Text type="supporting" className="text-[9px] text-red-300/80">
            {state.error}
          </Text>
        </div>
      )}

      {hasTrackingData && !state.isTracking && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Check size={14} className="text-green-400" />
            <div className="flex flex-1 flex-col gap-0.5">
              <Text type="supporting" weight="medium" className="text-[10px] text-green-400">
                {t("inspector:motionTracking.trackingComplete", "Tracking Complete")}
              </Text>
              {state.trackingData && (
                <Text type="supporting" className="text-[9px] text-green-300/70">
                  {t(
                    "inspector:motionTracking.keyframesCaptured",
                    "{{count}} keyframes captured",
                    { count: state.trackingData.keyframes.length },
                  )}
                  {state.trackingData.lostFrames.length > 0 &&
                    ` • ${t("inspector:motionTracking.framesLost", "{{count}} frames lost", {
                      count: state.trackingData.lostFrames.length,
                    })}`}
                </Text>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Text
              type="supporting"
              color="secondary"
              weight="medium"
              className="flex items-center gap-2"
            >
              <Move size={12} />
              {t("inspector:motionTracking.positionOffset", "Position Offset")}
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <RegionInput
                label={t("inspector:motionTracking.xOffset", "X Offset")}
                value={offsetX}
                onChange={(value) => handleOffsetChange("x", value)}
              />
              <RegionInput
                label={t("inspector:motionTracking.yOffset", "Y Offset")}
                value={offsetY}
                onChange={(value) => handleOffsetChange("y", value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Text type="supporting" color="secondary" weight="medium">
              {t("inspector:motionTracking.transformOptions", "Transform Options")}
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <CheckboxInput
                label={t("inspector:motionTracking.scale", "Scale")}
                value={applyScale}
                labelIcon={<Maximize2 size={10} aria-hidden />}
                onChange={(value) => {
                  setApplyScale(value);
                  if (isApplied) {
                    bridge.setApplyScale(clipId, value);
                  }
                }}
              />
              <CheckboxInput
                label={t("inspector:motionTracking.rotation", "Rotation")}
                value={applyRotation}
                labelIcon={<RotateCcw size={10} aria-hidden />}
                onChange={(value) => {
                  setApplyRotation(value);
                  if (isApplied) {
                    bridge.setApplyRotation(clipId, value);
                  }
                }}
              />
            </div>
          </div>

          {!isApplied ? (
            <Button
              label={t("inspector:motionTracking.applyTracking", "Apply Tracking to Clip")}
              size="md"
              variant="secondary"
              onClick={handleApplyTracking}
              className="w-full py-2.5 bg-primary/20 border border-primary/30 rounded-lg text-[11px] font-medium text-primary hover:bg-primary/30 transition-colors"
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                <Check size={12} className="text-primary" />
                <Text type="supporting" color="primary" className="text-[10px]">
                  {t("inspector:motionTracking.trackingApplied", "Tracking Applied")}
                </Text>
              </div>
              <Button
                label={t("inspector:motionTracking.removeTracking", "Remove Tracking")}
                size="sm"
                variant="destructive"
                onClick={handleRemoveTracking}
                className="w-full py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
              />
            </div>
          )}

          <Button
            label={t(
              "inspector:motionTracking.retrack",
              "Re-track with Different Settings",
            )}
            size="sm"
            variant="ghost"
            icon={<RefreshCw size={10} />}
            onClick={handleStartTracking}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-[9px] text-fg-3 hover:text-fg-2 transition-colors"
          />
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <Text type="supporting" color="secondary" className="text-center text-[9px]">
          {t(
            "inspector:motionTracking.footer",
            "Track objects to pin graphics, text, or effects",
          )}
        </Text>
      </div>
    </div>
  );
};

export default MotionTrackingSection;
