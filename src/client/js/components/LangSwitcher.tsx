import React from 'react';
import { useTranslation } from 'react-i18next';

const btnStyle = (active: boolean) => ({
  marginRight: 4,
  padding: '2px 8px',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 4,
  color: 'inherit',
  fontSize: '0.85rem',
});

const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
  { code: 'ms', flag: '🇲🇾', label: 'BM' },
];

export default function LangSwitcher() {
  const { i18n } = useTranslation();
  return (
    <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center' }}>
      {LANGS.map(({ code, flag, label }, i) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code)}
          style={{
            ...btnStyle(i18n.language === code),
            ...(i === LANGS.length - 1 ? { marginRight: 0 } : {}),
          }}
        >
          {flag} {label}
        </button>
      ))}
    </span>
  );
}
