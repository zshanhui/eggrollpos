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

export default function LangSwitcher() {
  const { i18n } = useTranslation();
  return (
    <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('zh')}
        style={btnStyle(i18n.language === 'zh')}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('en')}
        style={{ ...btnStyle(i18n.language === 'en'), marginRight: 0 }}
      >
        EN
      </button>
    </span>
  );
}
