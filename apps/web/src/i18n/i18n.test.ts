import { describe, it, expect, beforeEach } from "vitest";
import i18n, { DEFAULT_LANGUAGE } from "./index";
import { useSettingsStore } from "../stores/settings-store";

describe("i18n internationalization system", () => {
  beforeEach(async () => {
    await i18n.changeLanguage(DEFAULT_LANGUAGE);
    useSettingsStore.setState({ language: DEFAULT_LANGUAGE });
  });

  it("defaults to Simplified Chinese (zh-CN)", () => {
    expect(DEFAULT_LANGUAGE).toBe("zh-CN");
    expect(i18n.language).toBe("zh-CN");
    expect(i18n.t("common:save")).toBe("保存");
    expect(i18n.t("common:cancel")).toBe("取消");
    expect(i18n.t("settings:general.language")).toBe("界面语言");
    expect(i18n.t("rail:home")).toBe("返回主页");
  });

  it("switches to English and translates accurately", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.language).toBe("en");
    expect(i18n.t("common:save")).toBe("Save");
    expect(i18n.t("common:cancel")).toBe("Cancel");
    expect(i18n.t("settings:general.language")).toBe("Interface Language");
    expect(i18n.t("rail:home")).toBe("Back to home");
  });

  it("syncs settings-store setLanguage with i18n instance", async () => {
    expect(useSettingsStore.getState().language).toBe("zh-CN");

    useSettingsStore.getState().setLanguage("en");
    expect(useSettingsStore.getState().language).toBe("en");
    expect(i18n.language).toBe("en");
    expect(i18n.t("common:undo")).toBe("Undo");

    useSettingsStore.getState().setLanguage("zh-CN");
    expect(useSettingsStore.getState().language).toBe("zh-CN");
    expect(i18n.language).toBe("zh-CN");
    expect(i18n.t("common:undo")).toBe("撤销");
  });

  it("falls back gracefully when a key is missing", () => {
    const missingKey = "common:nonExistentKeyxyz";
    expect(i18n.t(missingKey)).toBe("nonExistentKeyxyz");
  });
});
