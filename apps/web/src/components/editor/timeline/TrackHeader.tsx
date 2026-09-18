import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Volume2, VolumeX, Lock, Trash2, Pencil, AlignLeft, Link2, Unlink } from "@/icons/lucide-compat";
import {
  ToolcraftContextMenu as ContextMenu,
  type ToolcraftContextMenuOption as ContextMenuOption,
} from "@openreel/ui";
import { ToolcraftTextInputControl } from "@openreel/ui";
import type { Track } from "@openreel/core";
import {
  getTrackItems,
  trackHasAudioItems,
  trackHasVisualItems,
} from "@openreel/core";
import { useProjectStore } from "../../../stores/project-store";
import { useTimelineStore } from "../../../stores/timeline-store";
import { useTranslation } from "../../../i18n";
import { getTrackInfo } from "./utils";

interface TrackHeaderProps {
  track: Track;
  index: number;
  onDragStart: (e: React.DragEvent, trackId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetTrackId: string) => void;
  onDragEnd: () => void;
  keyframeCount?: number;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const { t } = useTranslation(["timeline", "common"]);
  const {
    lockTrack,
    hideTrack,
    muteTrack,
    soloTrack,
    removeTrack,
    renameTrack,
    consolidateTrack,
    groupTracks,
    project,
  } = useProjectStore();
  const { getTrackHeight } = useTimelineStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(track.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const trackInfo = getTrackInfo(track, index);
  const isVisual = trackHasVisualItems(project, track.id);
  const isAudio = trackHasAudioItems(project, track.id);
  const hasSoloedAudioTrack = project.timeline.tracks.some(
    (candidate) =>
      trackHasAudioItems(project, candidate.id) && candidate.solo,
  );
  const effectivelyMuted =
    isAudio && (track.muted || (hasSoloedAudioTrack && !track.solo));
  const groupCandidates = project.timeline.tracks.filter(
    (candidate) =>
      candidate.id !== track.id &&
      candidate.groupId !== track.groupId,
  );

  const handleRemoveTrack = async () => {
    await removeTrack(track.id);
  };

  const handleRemoveGaps = async () => {
    await consolidateTrack(track.id);
  };

  // Only enable "Remove Gaps" if there's actually a gap on this track.
  const hasGaps = React.useMemo(() => {
    const sorted = getTrackItems(project, track.id);
    if (sorted.length === 0) return false;
    if (sorted[0].startTime > 0.0001) return true;
    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = sorted[i - 1].startTime + sorted[i - 1].duration;
      if (sorted[i].startTime - prevEnd > 0.0001) return true;
    }
    return false;
  }, [project, track.id]);

  const startRename = () => {
    setRenameValue(track.name);
    setIsRenaming(true);
  };

  const commitRename = () => {
    renameTrack(track.id, renameValue || track.name);
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(track.name);
    setIsRenaming(false);
  };

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const menuItems: ContextMenuOption[] = [
    {
      label: t("timeline:trackMenu.renameTrack", "Rename Track"),
      icon: <Pencil size={14} aria-hidden />,
      onClick: startRename,
    },
    {
      label: t("timeline:trackMenu.removeGaps", "Remove Gaps"),
      icon: <AlignLeft size={14} aria-hidden />,
      isDisabled: !hasGaps,
      onClick: handleRemoveGaps,
    },
    ...(track.groupId
      ? [
          {
            label: t("timeline:trackMenu.ungroupTrack", "Ungroup Track"),
            icon: <Unlink size={14} aria-hidden />,
            onClick: () => groupTracks(track.id),
          } satisfies ContextMenuOption,
        ]
      : []),
    ...(groupCandidates.length > 0
      ? [
          {
            type: "section" as const,
            title: t("timeline:trackMenu.groupSection", "Move & trim together"),
            items: groupCandidates.map((candidate) => ({
              label: t("timeline:trackMenu.groupWith", { name: candidate.name, defaultValue: `Group with ${candidate.name}` }),
              icon: <Link2 size={14} aria-hidden />,
              onClick: () => groupTracks(track.id, candidate.id),
            })),
          } satisfies ContextMenuOption,
        ]
      : []),
    { type: "divider" },
    {
      label: t("timeline:trackMenu.deleteTrack", "Delete Track"),
      icon: <Trash2 size={14} aria-hidden />,
      onClick: handleRemoveTrack,
    },
  ];

  return (
    <ContextMenu items={menuItems} menuWidth={180} size="sm">
      <div
        draggable={!isRenaming}
        onDragStart={(e) => onDragStart(e, track.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, track.id)}
        onDragEnd={onDragEnd}
        style={{ height: getTrackHeight(track.id, track.type) }}
        className={`border-b border-border flex items-center gap-2.5 px-4 relative group transition-colors cursor-grab active:cursor-grabbing ${
          track.hidden || effectivelyMuted ? "opacity-60" : ""
        } ${
          track.locked ? "bg-bg-2/50" : "bg-bg-1"
        }`}
      >
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <ToolcraftTextInputControl
                ref={inputRef}
                label={t("timeline:trackHeader.name", "Track name")}
                isLabelHidden
                size="sm"
                width="100%"
                value={renameValue}
                onChange={setRenameValue}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") cancelRename();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="block truncate text-[13px] font-semibold text-fg-2 cursor-grab active:cursor-grabbing"
                onDoubleClick={startRename}
              >
                {track.name || trackInfo.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {track.groupId && (
              <Link2
                size={13}
                className="text-accent"
                aria-label={t("timeline:trackHeader.grouped", "Track is grouped")}
              />
            )}
            {isVisual && (
              <button
                type="button"
                aria-label={
                  track.hidden
                    ? t("timeline:trackHeader.showTrack", "Show track")
                    : t("timeline:trackHeader.hideTrack", "Hide track")
                }
                className="text-fg-muted hover:text-fg-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  hideTrack(track.id, !track.hidden);
                }}
              >
                {track.hidden ? (
                  <EyeOff size={15} strokeWidth={1.7} aria-hidden />
                ) : (
                  <Eye size={15} strokeWidth={1.7} aria-hidden />
                )}
              </button>
            )}
            {isAudio && (
              <>
                <button
                  type="button"
                  aria-label={
                    track.muted
                      ? t("timeline:trackHeader.unmuteTrackName", {
                          name: track.name,
                          defaultValue: "Unmute {{name}}",
                        })
                      : t("timeline:trackHeader.muteTrackName", {
                          name: track.name,
                          defaultValue: "Mute {{name}}",
                        })
                  }
                  aria-pressed={track.muted}
                  title={
                    track.muted
                      ? t("timeline:trackHeader.unmuteTrack", "Unmute track")
                      : t("timeline:trackHeader.muteTrack", "Mute track")
                  }
                  className={`transition-colors ${
                    track.muted ? "text-destructive" : "text-fg-muted hover:text-fg-2"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    muteTrack(track.id, !track.muted);
                  }}
                >
                  {track.muted ? (
                    <VolumeX size={15} strokeWidth={1.7} aria-hidden />
                  ) : (
                    <Volume2 size={15} strokeWidth={1.7} aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={
                    track.solo
                      ? t("timeline:trackHeader.clearSoloName", {
                          name: track.name,
                          defaultValue: "Clear solo {{name}}",
                        })
                      : t("timeline:trackHeader.soloTrackName", {
                          name: track.name,
                          defaultValue: "Solo {{name}}",
                        })
                  }
                  aria-pressed={track.solo}
                  title={
                    track.solo
                      ? t("timeline:trackHeader.clearSolo", "Clear solo")
                      : t("timeline:trackHeader.soloTrack", "Solo track")
                  }
                  className={`flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[9px] font-black transition-colors ${
                    track.solo
                      ? "bg-status-warning text-black"
                      : "text-fg-muted hover:bg-hover hover:text-fg-2"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    soloTrack(track.id, !track.solo);
                  }}
                >
                  S
                </button>
              </>
            )}
            <button
              type="button"
              aria-label={
                track.locked
                  ? t("timeline:trackHeader.unlock", "Unlock")
                  : t("timeline:trackHeader.lock", "Lock")
              }
              className={`transition-colors ${
                track.locked ? "text-fg-2" : "text-fg-muted hover:text-fg-2"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                lockTrack(track.id, !track.locked);
              }}
            >
              <Lock size={13} strokeWidth={1.8} aria-hidden />
            </button>
          </div>
      </div>
    </ContextMenu>
  );
};
