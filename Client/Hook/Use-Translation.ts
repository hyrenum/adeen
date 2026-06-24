import { useApp } from "Client/Context/App";
import { getTranslation, isRtlLanguage, TranslationKeys } from "Client/I18n";

export function useTranslation() {
  const { currentLanguage } = useApp();
  
  const t = getTranslation(currentLanguage);
  const isRtl = isRtlLanguage(currentLanguage);
  const dir = isRtl ? "rtl" : "ltr";
  
  return {
    t,
    isRtl,
    dir,
    currentLanguage,
  };
}

export type { TranslationKeys };
