import React, { useState, useEffect, useCallback } from "react";
import { Plug, Eye, EyeOff, Copy, RefreshCw, Wifi } from "@/icons/lucide-compat";
import { ToolcraftSwitchControl } from "@openreel/ui";
import { ToolcraftButton as Button } from "@openreel/ui";
import { ToolcraftIconButton as IconButton } from "@openreel/ui";
import { ToolcraftText as Text } from "@openreel/ui";
import { useSettingsStore } from "../../../stores/settings-store";
import { toast } from "../../../stores/notification-store";
import type { OpenReelMcpStatus } from "../../../types/global";
import { useTranslation } from "../../../i18n";

const isDesktop = (): boolean =>
  typeof window !== "undefined" && window.openreel?.platform === "desktop";

function clientConfigSnippet(shimPath: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        openreel: {
          command: "node",
          args: [shimPath || "<path to openreel-mcp shim>"],
        },
      },
    },
    null,
    2,
  );
}

export const McpPanel: React.FC = () => {
  const { t } = useTranslation("settings");
  const mcpAutoAllow = useSettingsStore((s) => s.mcpAutoAllowTrustedLocal);
  const setMcpAutoAllow = useSettingsStore((s) => s.setMcpAutoAllowTrustedLocal);

  const [status, setStatus] = useState<OpenReelMcpStatus | null>(null);
  const [toolCount, setToolCount] = useState<number | null>(null);
  const [revealToken, setRevealToken] = useState(false);
  const [testing, setTesting] = useState(false);

  const copy = useCallback(async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("mcp.labelCopied", "{{label}} copied", { label }));
    } catch {
      toast.error(t("mcp.copyFailed", "Copy failed"), t("mcp.clipboardUnavailable", "Clipboard is unavailable."));
    }
  }, [t]);

  const refresh = useCallback(async () => {
    const bridge = window.openreel?.mcp;
    if (!bridge) return;
    try {
      const nextStatus = await bridge.getStatus();
      setStatus(nextStatus);
      if (nextStatus.running) {
        const connection = await bridge.testConnection();
        setToolCount(connection.ok ? (connection.toolCount ?? 0) : null);
      } else {
        setToolCount(null);
      }
    } catch {
      setStatus(null);
      setToolCount(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRotate = useCallback(async () => {
    const bridge = window.openreel?.mcp;
    if (!bridge) return;
    try {
      setStatus(await bridge.rotateToken());
      toast.success(t("mcp.tokenRotated", "Token rotated"), t("mcp.tokenRotatedDesc", "Update your MCP clients with the new token."));
    } catch (err) {
      toast.error(t("mcp.rotateFailed", "Rotate failed"), err instanceof Error ? err.message : "Unknown error");
    }
  }, [t]);

  const handleTest = useCallback(async () => {
    const bridge = window.openreel?.mcp;
    if (!bridge) return;
    setTesting(true);
    try {
      const result = await bridge.testConnection();
      if (result.ok) {
        setToolCount(result.toolCount ?? 0);
        toast.success(
          t("mcp.connectionOk", "Connection OK"),
          t("mcp.connectionOkDesc", "Server responded with {{count}} tools.", { count: result.toolCount ?? 0 }),
        );
      } else {
        setToolCount(null);
        toast.error(t("mcp.connectionFailed", "Connection failed"), result.message ?? "No response");
      }
    } catch (err) {
      toast.error(t("mcp.connectionFailed", "Connection failed"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTesting(false);
    }
  }, [t]);

  if (!isDesktop()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Plug size={28} className="mb-3 text-text-muted" />
        <Text type="body" color="primary" className="text-sm font-medium">
          {t("mcp.desktopOnlyTitle", "Desktop only")}
        </Text>
        <Text type="supporting" color="secondary" className="mt-1 max-w-sm text-xs">
          {t("mcp.desktopOnlyDesc", "The MCP server runs inside the OpenReel desktop app, letting external AI clients (Claude Desktop, Cursor, Cline) edit your project. Open OpenReel on desktop to configure it.")}
        </Text>
      </div>
    );
  }

  const tokenDisplay = status?.token
    ? revealToken
      ? status.token
      : "•".repeat(32)
    : "—";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Text type="body" color="primary" className="text-sm font-medium">
            {t("mcp.serverTitle", "MCP Server")}
          </Text>
          <Text type="supporting" color="secondary" className="mt-0.5 text-xs">
            {t("mcp.serverDesc", "A local Model Context Protocol server lets AI clients drive this editor through the same tools as the built-in chat. It listens on loopback only and requires the bearer token below.")}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Text type="supporting" color="secondary" className="w-20 shrink-0 text-xs">
            {t("mcp.status", "Status")}
          </Text>
          <Text
            type="supporting"
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              status?.running ? "text-status-success" : "text-text-muted"
            }`}
          >
            <i
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                status?.running ? "bg-status-success" : "bg-text-muted"
              }`}
            />
            {status?.running ? t("mcp.running", "Running") : t("mcp.stopped", "Stopped")}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Text type="supporting" color="secondary" className="w-20 shrink-0 text-xs">
            {t("mcp.tools", "Tools")}
          </Text>
          <Text type="supporting" color="secondary" className="text-xs">
            {toolCount === null
              ? status?.running
                ? t("mcp.checkingCatalog", "Checking catalog…")
                : "—"
              : t("mcp.toolsAvailable", "{{count}} available", { count: toolCount })}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Text type="supporting" color="secondary" className="w-20 shrink-0 text-xs">
            {t("mcp.url", "URL")}
          </Text>
          <code className="flex-1 font-mono text-xs bg-background rounded px-3 py-2 text-text-secondary truncate">
            {status?.url || "—"}
          </code>
          <IconButton
            label={t("mcp.copyUrl", "Copy URL")}
            onClick={() => status?.url && copy(status.url, t("mcp.url", "URL"))}
            variant="ghost"
            size="sm"
            icon={<Copy size={14} aria-hidden />}
            className="text-text-muted hover:bg-background-tertiary hover:text-text-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Text type="supporting" color="secondary" className="w-20 shrink-0 text-xs">
            {t("mcp.token", "Token")}
          </Text>
          <code className="flex-1 font-mono text-xs bg-background rounded px-3 py-2 text-text-secondary truncate">
            {tokenDisplay}
          </code>
          <IconButton
            label={revealToken ? t("mcp.hideToken", "Hide token") : t("mcp.showToken", "Show token")}
            onClick={() => setRevealToken((v) => !v)}
            variant="ghost"
            size="sm"
            icon={revealToken ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
            className="text-text-muted hover:bg-background-tertiary hover:text-text-primary"
          />
          <IconButton
            label={t("mcp.copyToken", "Copy token")}
            onClick={() => status?.token && copy(status.token, t("mcp.token", "Token"))}
            variant="ghost"
            size="sm"
            icon={<Copy size={14} aria-hidden />}
            className="text-text-muted hover:bg-background-tertiary hover:text-text-primary"
          />
          <IconButton
            label={t("mcp.rotateToken", "Rotate token")}
            onClick={handleRotate}
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} aria-hidden />}
            className="text-text-muted hover:bg-background-tertiary hover:text-text-primary"
          />
        </div>

        <Button
          label={testing ? t("mcp.testing", "Testing...") : t("mcp.testConnection", "Test connection")}
          size="sm"
          variant="secondary"
          onClick={handleTest}
          isDisabled={testing}
          icon={<Wifi size={14} aria-hidden />}
        />
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-3">
        <div>
          <Text type="body" color="primary" className="text-sm font-medium">
            {t("mcp.availableWorkflows", "Available Workflows")}
          </Text>
          <Text type="supporting" color="secondary" className="mt-0.5 text-xs">
            {t("mcp.workflowsDesc", "The live catalog includes focused tools for each desktop workspace.")}
          </Text>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              key: "videoEditor",
              label: t("mcp.workflows.videoEditor.label", "Video Editor"),
              description: t("mcp.workflows.videoEditor.desc", "Tracks, clips, effects, transitions, audio and subtitles"),
            },
            {
              key: "motionCreator",
              label: t("mcp.workflows.motionCreator.label", "Motion Creator"),
              description: t("mcp.workflows.motionCreator.desc", "Layers, animation, shaders, masks, effects and render queue"),
            },
            {
              key: "creation3d",
              label: t("mcp.workflows.creation3d.label", "Creation & 3D"),
              description: t("mcp.workflows.creation3d.desc", "Scenes, products, materials, cameras, rigging and previews"),
            },
            {
              key: "projectOps",
              label: t("mcp.workflows.projectOps.label", "Project Operations"),
              description: t("mcp.workflows.projectOps.desc", "Inspect, import, save, undo, export and diagnostics"),
            },
          ].map((wf) => (
            <div key={wf.key} className="rounded-md border border-border bg-background px-3 py-2.5">
              <Text type="supporting" color="primary" className="text-xs font-medium">
                {wf.label}
              </Text>
              <Text type="supporting" color="secondary" className="mt-1 text-[11px] leading-4">
                {wf.description}
              </Text>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <div>
          <Text type="body" color="primary" className="text-sm font-medium">
            {t("mcp.clientSetup", "Client Setup")}
          </Text>
          <Text type="supporting" color="secondary" className="mt-0.5 text-xs">
            {t("mcp.clientSetupDesc", "Add this to your MCP client config (Claude Desktop, Cursor, Cline). The shim connects to the running app automatically.")}
          </Text>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto rounded bg-background px-3 py-2 font-mono text-[11px] text-text-secondary">
            {clientConfigSnippet(status?.shimPath ?? "")}
          </pre>
          <IconButton
            label={t("mcp.copyConfig", "Copy config")}
            onClick={() =>
              copy(clientConfigSnippet(status?.shimPath ?? ""), t("mcp.copyConfig", "Config"))
            }
            variant="ghost"
            size="sm"
            icon={<Copy size={14} aria-hidden />}
            className="absolute right-2 top-2 text-text-muted hover:bg-background-tertiary hover:text-text-primary"
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <Text type="body" color="primary" className="text-sm font-medium">
          {t("mcp.trustedLocal", "Trusted Local")}
        </Text>
        <div className="flex items-center justify-between">
          <div>
            <Text type="supporting" color="secondary" className="text-sm">
              {t("mcp.autoAllow", "Auto-allow destructive actions")}
            </Text>
            <Text type="supporting" color="secondary" className="mt-0.5 max-w-md text-xs">
              {t("mcp.autoAllowDesc", "When off, destructive or expensive tool calls over MCP are refused with a confirmation-required notice. Turn on only if you trust every connected local client.")}
            </Text>
          </div>
          <ToolcraftSwitchControl
            ariaLabel={t("mcp.autoAllow", "Auto-allow destructive actions")}
            checked={mcpAutoAllow}
            onCheckedChange={setMcpAutoAllow}
            showLabel={false}
          />
        </div>
      </div>
    </div>
  );
};
