export const SUPPORTED_LANGUAGES = [
  { code: "zh-CN", label: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "en", label: "English", nativeName: "English" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: SupportedLanguage = "zh-CN";

export const NAMESPACES = [
  "common",
  "rail",
  "settings",
  "welcome",
  "timeline",
  "toolbar",
  "inspector",
  "export",
  "ai",
] as const;

export type I18nNamespace = (typeof NAMESPACES)[number];
