import React from 'react';
import { Button, ButtonGroup } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ms', label: 'Bahasa Melayu' },
] as const;

function isActiveLanguage(current: string, code: string): boolean {
  return current === code || current.startsWith(`${code}-`);
}

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <ButtonGroup segmented>
      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
        <Button
          key={code}
          pressed={isActiveLanguage(i18n.language, code)}
          onClick={() => i18n.changeLanguage(code)}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );
}
