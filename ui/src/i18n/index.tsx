import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "date-fns";
import { vi as dateLocaleVi, enUS as dateLocaleEn } from "date-fns/locale";
import { vi } from "./vi";
import { en } from "./en";

export type Lang = "vi" | "en";

export function normalizeLang(value: unknown): Lang {
  if (value === "en") return "en";
  return "vi";
}

export const dictionaries: Record<Lang, Record<string, string>> = {
  vi,
  en,
};

export function dateLocale(lang: Lang): Locale {
  return lang === "en" ? dateLocaleEn : dateLocaleVi;
}

interface I18nContextValue {
  lang: Lang;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

const I18nContext = createContext<I18nContextValue>({
  lang: "vi",
  t: (key, params) => formatMessage(dictionaries.vi[key] || key, params),
});

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const normalized = normalizeLang(lang);
  const dict = dictionaries[normalized];

  const value = useMemo<I18nContextValue>(() => {
    return {
      lang: normalized,
      t: (key: string, params?: Record<string, string | number>) => {
        const template = dict[key] ?? key;
        return formatMessage(template, params);
      },
    };
  }, [normalized, dict]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export function useT(): (key: string, params?: Record<string, string | number>) => string {
  return useContext(I18nContext).t;
}

export function useLang(): Lang {
  return useContext(I18nContext).lang;
}

