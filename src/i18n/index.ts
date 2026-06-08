import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import sw from "./locales/sw.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";
import ar from "./locales/ar.json";
import am from "./locales/am.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", rtl: false },
  { code: "sw", label: "Kiswahili", rtl: false },
  { code: "fr", label: "Français", rtl: false },
  { code: "pt", label: "Português", rtl: false },
  { code: "ar", label: "العربية", rtl: true },
  { code: "am", label: "አማርኛ", rtl: false },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sw: { translation: sw },
      fr: { translation: fr },
      pt: { translation: pt },
      ar: { translation: ar },
      am: { translation: am },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "preferred_language",
    },
  });

// Sync HTML lang/dir
i18n.on("languageChanged", (lng) => {
  const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
});

export default i18n;
