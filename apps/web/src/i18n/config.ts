import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, type SupportedLanguage } from "./types";

// English resources
import commonEn from "./locales/en/common.json";
import railEn from "./locales/en/rail.json";
import settingsEn from "./locales/en/settings.json";
import welcomeEn from "./locales/en/welcome.json";
import timelineEn from "./locales/en/timeline.json";
import toolbarEn from "./locales/en/toolbar.json";
import inspectorEn from "./locales/en/inspector.json";
import exportEn from "./locales/en/export.json";
import aiEn from "./locales/en/ai.json";
import assetsEn from "./locales/en/assets.json";
import previewEn from "./locales/en/preview.json";
import shortcutsEn from "./locales/en/shortcuts.json";
import searchEn from "./locales/en/search.json";
import motionEn from "./locales/en/motion.json";
import chatEn from "./locales/en/chat.json";
import desktopEn from "./locales/en/desktop.json";
import shareEn from "./locales/en/share.json";
import presetsEn from "./locales/en/presets.json";
import messagesEn from "./locales/en/messages.json";

// Chinese resources
import commonZh from "./locales/zh-CN/common.json";
import railZh from "./locales/zh-CN/rail.json";
import settingsZh from "./locales/zh-CN/settings.json";
import welcomeZh from "./locales/zh-CN/welcome.json";
import timelineZh from "./locales/zh-CN/timeline.json";
import toolbarZh from "./locales/zh-CN/toolbar.json";
import inspectorZh from "./locales/zh-CN/inspector.json";
import exportZh from "./locales/zh-CN/export.json";
import aiZh from "./locales/zh-CN/ai.json";
import assetsZh from "./locales/zh-CN/assets.json";
import previewZh from "./locales/zh-CN/preview.json";
import shortcutsZh from "./locales/zh-CN/shortcuts.json";
import searchZh from "./locales/zh-CN/search.json";
import motionZh from "./locales/zh-CN/motion.json";
import chatZh from "./locales/zh-CN/chat.json";
import desktopZh from "./locales/zh-CN/desktop.json";
import shareZh from "./locales/zh-CN/share.json";
import presetsZh from "./locales/zh-CN/presets.json";
import messagesZh from "./locales/zh-CN/messages.json";

export const resources = {
  en: {
    common: commonEn,
    rail: railEn,
    settings: settingsEn,
    welcome: welcomeEn,
    timeline: timelineEn,
    toolbar: toolbarEn,
    inspector: inspectorEn,
    export: exportEn,
    ai: aiEn,
    assets: assetsEn,
    preview: previewEn,
    shortcuts: shortcutsEn,
    search: searchEn,
    motion: motionEn,
    chat: chatEn,
    desktop: desktopEn,
    share: shareEn,
    presets: presetsEn,
    messages: messagesEn,
  },
  "zh-CN": {
    common: commonZh,
    rail: railZh,
    settings: settingsZh,
    welcome: welcomeZh,
    timeline: timelineZh,
    toolbar: toolbarZh,
    inspector: inspectorZh,
    export: exportZh,
    ai: aiZh,
    assets: assetsZh,
    preview: previewZh,
    shortcuts: shortcutsZh,
    search: searchZh,
    motion: motionZh,
    chat: chatZh,
    desktop: desktopZh,
    share: shareZh,
    presets: presetsZh,
    messages: messagesZh,
  },
} as const;

/**
 * Detect the initial language from persisted settings or browser preference.
 */
function getInitialLanguage(): SupportedLanguage {
  try {
    const persisted = localStorage.getItem("openreel-settings");
    if (persisted) {
      const parsed = JSON.parse(persisted) as { state?: { language?: string } };
      const savedLang = parsed?.state?.language;
      if (savedLang === "zh-CN" || savedLang === "en") {
        return savedLang;
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  // In automated test environments without explicit preference, default to "en" for test assertions
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return "en";
  }

  return DEFAULT_LANGUAGE;
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: ["zh-CN", "en"],
    defaultNS: "common",
    ns: [
      "common",
      "rail",
      "settings",
      "welcome",
      "timeline",
      "toolbar",
      "inspector",
      "export",
      "ai",
      "assets",
      "preview",
      "shortcuts",
      "search",
      "motion",
      "chat",
      "desktop",
      "share",
      "presets",
      "messages",
    ],
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
    react: {
      useSuspense: false, // Avoid blocking render with suspense
    },
  });

export default i18n;
