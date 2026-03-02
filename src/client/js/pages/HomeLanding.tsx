import React from 'react';
import { useTranslation } from 'react-i18next';
import {Container, Row, Col} from 'react-bootstrap';
import ContactForm from '../components/ContactForm';

export default function HomeLanding(props) {
  const { t, i18n } = useTranslation();
  return(
    <div>
      <Container className="hero" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.9rem' }}>
          <button
            type="button"
            onClick={() => i18n.changeLanguage('zh')}
            style={{ marginRight: 8, fontWeight: i18n.language === 'zh' ? 700 : 400 }}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => i18n.changeLanguage('en')}
            style={{ fontWeight: i18n.language === 'en' ? 700 : 400 }}
          >
            English
          </button>
        </div>
        <h1>{t('home.hero')}</h1>
        <div>
          <ContactForm />
        </div>
      </Container>
    </div>
  )
}
