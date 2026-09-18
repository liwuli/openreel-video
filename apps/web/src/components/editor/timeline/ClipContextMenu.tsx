import React from "react";
import type { ToolcraftContextMenuOption as ContextMenuOption } from "@openreel/ui";
import {
  Copy,
  Layers,
  Trash2,
  Scissors,
  Music,
  Sparkles,
  Volume2,
  Film,
  Image,
  ArrowLeftToLine,
  ListChecks,
} from "@/icons/lucide-compat";
import type { Clip, Track } from "@openreel/core";
import { useProjectStore } from "../../../stores/project-store";
import { useTimelineStore } from "../../../stores/timeline-store";
import { useUIStore } from "../../../stores/ui-store";
import { useTranslation } from "../../../i18n";
import { getTimelineTrackSelection } from "../../../utils/timeline-item-actions";

interface ClipContextMenuProps {
  clip: Clip;
  track: Track;
  onClose?: () => void;
}

export function useClipContextMenuItems({
  clip,
  track,
  onClose,
}: ClipContextMenuProps): ContextMenuOption[] {
  const { t } = useTranslation(["timeline", "common"]);
  const {
    copyClips,
    duplicateClip,
    removeClip,
    rippleDeleteClip,
    splitClip,
    separateAudio,
    getMediaItem,
    copyEffects,
    pasteEffects,
    copiedEffects,
    closeGapBeforeClip,
  } = useProjectStore();
  const { playheadPosition } = useTimelineStore();
  const selectMultiple = useUIStore((state) => state.selectMultiple);

  const isPlayheadOnClip =
    playheadPosition >= clip.startTime &&
    playheadPosition <= clip.startTime + clip.duration;

  const hasGapBeforeClip = React.useMemo(() => {
    const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
    const idx = sorted.findIndex((c) => c.id === clip.id);
    if (idx < 0) return false;
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const target = prev ? prev.startTime + prev.duration : 0;
    return clip.startTime - target > 0.0001;
  }, [track.clips, clip.id, clip.startTime]);

  const mediaItem = getMediaItem(clip.mediaId);
  const clipMediaType = mediaItem?.type ?? track.type;
  const isVideo = clipMediaType === "video";
  const isAudio = clipMediaType === "audio";
  const isImage = clipMediaType === "image";
  const isVideoWithAudio =
    isVideo &&
    mediaItem?.type === "video" &&
    mediaItem?.metadata?.channels &&
    mediaItem.metadata.channels > 0;

  const hasEffects = clip.effects && clip.effects.length > 0;
  const hasCopiedEffects = copiedEffects && copiedEffects.length > 0;

  const handleCopy = () => {
    copyClips([clip.id]);
    onClose?.();
  };

  const handleDuplicate = async () => {
    await duplicateClip(clip.id);
    onClose?.();
  };

  const handleSelectTrackClips = () => {
    const project = useProjectStore.getState().getFullProject();
    selectMultiple(getTimelineTrackSelection(project, track.id));
    onClose?.();
  };

  const handleDelete = async () => {
    await removeClip(clip.id);
    onClose?.();
  };

  const handleRippleDelete = async () => {
    await rippleDeleteClip(clip.id);
    onClose?.();
  };

  const handleSplit = async () => {
    if (isPlayheadOnClip) {
      await splitClip(clip.id, playheadPosition);
    }
    onClose?.();
  };

  const handleCloseGap = async () => {
    await closeGapBeforeClip(clip.id);
    onClose?.();
  };

  const handleSeparateAudio = async () => {
    await separateAudio(clip.id);
    onClose?.();
  };

  const handleCopyEffects = () => {
    copyEffects(clip.id);
    onClose?.();
  };

  const handlePasteEffects = async () => {
    await pasteEffects(clip.id);
    onClose?.();
  };

  const getClipTypeLabel = () => {
    if (isVideo) return t("timeline:clipMenu.videoClip", "Video Clip");
    if (isAudio) return t("timeline:clipMenu.audioClip", "Audio Clip");
    if (isImage) return t("timeline:clipMenu.imageClip", "Image Clip");
    return t("timeline:clipMenu.clip", "Clip");
  };

  const getClipTypeIcon = () => {
    if (isVideo) return <Film size={14} className="text-primary" aria-hidden />;
    if (isAudio) return <Volume2 size={14} className="text-blue-400" aria-hidden />;
    if (isImage) return <Image size={14} className="text-primary" aria-hidden />;
    return null;
  };

  const items: ContextMenuOption[] = [
    {
      type: "section",
      title: getClipTypeLabel(),
      items: [
        {
          label: getClipTypeLabel(),
          icon: getClipTypeIcon() ?? undefined,
          isDisabled: true,
        },
      ],
    },
    { type: "divider" },
    {
      label: t("timeline:clipMenu.copyClip", "Copy Clip"),
      icon: <Copy size={14} aria-hidden />,
      onClick: handleCopy,
    },
    {
      label: t("timeline:clipMenu.duplicate", "Duplicate"),
      icon: <Layers size={14} aria-hidden />,
      onClick: handleDuplicate,
    },
    {
      label: t("timeline:clipMenu.selectAllOnTrack", "Select All Clips on Track"),
      icon: <ListChecks size={14} aria-hidden />,
      onClick: handleSelectTrackClips,
    },
    { type: "divider" },
    {
      label: t("timeline:clipMenu.splitAtPlayhead", "Split at Playhead"),
      icon: <Scissors size={14} aria-hidden />,
      isDisabled: !isPlayheadOnClip,
      onClick: handleSplit,
    },
    {
      label: t("timeline:clipMenu.closeGap", "Close Gap to Previous"),
      icon: <ArrowLeftToLine size={14} aria-hidden />,
      isDisabled: !hasGapBeforeClip,
      onClick: handleCloseGap,
    },
  ];

  if (isVideo || isImage) {
    items.push({
      type: "section",
      title: t("timeline:clipMenu.effects", "Effects"),
      items: [
        {
          label: t("timeline:clipMenu.copyEffects", "Copy Effects"),
          icon: <Sparkles size={14} aria-hidden />,
          isDisabled: !hasEffects,
          onClick: handleCopyEffects,
        },
        {
          label: t("timeline:clipMenu.pasteEffects", "Paste Effects"),
          icon: <Sparkles size={14} aria-hidden />,
          isDisabled: !hasCopiedEffects,
          onClick: handlePasteEffects,
        },
      ],
    });
  }

  if (isVideoWithAudio) {
    items.push({
      label: t("timeline:clipMenu.separateAudio", "Separate Audio"),
      icon: <Music size={14} aria-hidden />,
      onClick: handleSeparateAudio,
    });
  }

  if (isAudio) {
    items.push({
      type: "section",
      title: t("timeline:clipMenu.audio", "Audio"),
      items: [
        {
          label: t("timeline:clipMenu.copyAudioEffects", "Copy Audio Effects"),
          icon: <Volume2 size={14} aria-hidden />,
          isDisabled: !hasEffects,
          onClick: handleCopyEffects,
        },
        {
          label: t("timeline:clipMenu.pasteAudioEffects", "Paste Audio Effects"),
          icon: <Volume2 size={14} aria-hidden />,
          isDisabled: !hasCopiedEffects,
          onClick: handlePasteEffects,
        },
      ],
    });
  }

  items.push(
    { type: "divider" },
    {
      label: t("timeline:clipMenu.rippleDelete", "Ripple Delete"),
      icon: <Trash2 size={14} aria-hidden />,
      onClick: handleRippleDelete,
    },
    {
      label: t("timeline:clipMenu.delete", "Delete"),
      icon: <Trash2 size={14} aria-hidden />,
      onClick: handleDelete,
    },
  );

  return items;
}

export const ClipContextMenu: React.FC<ClipContextMenuProps> = (props) => {
  useClipContextMenuItems(props);
  return null;
};
