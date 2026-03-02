import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.yaml";
import zh from "../locales/zh.yaml";

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

const DEFAULT_LANG = "zh";
const savedLng = typeof localStorage !== "undefined" ? localStorage.getItem("i18nextLng") : null;

i18n.use(initReactI18next).init({
  resources,
  lng: savedLng || DEFAULT_LANG,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

i18n.on("languageChanged", (lng) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("i18nextLng", lng);
  }
});

export default i18n;
