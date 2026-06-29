import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Button } from 'react-bootstrap';
import ContactForm from '../components/ContactForm';

const ORANGE = '#ff6b35';
const BLACK = '#0a0a0a';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1588416820614-f8d6ac6cea56?w=1600&q=80';

const heroStyle: React.CSSProperties = {
  background: `linear-gradient(rgba(0,0,0,0.65), rgba(10,10,10,0.85)), url('${HERO_IMAGE}') center/cover no-repeat`,
  color: '#fff',
  padding: '120px 0 100px',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'rgba(255,255,255,0.65)',
  maxWidth: 600,
  margin: '0 auto 32px',
  lineHeight: 1.7,
};

const featuresSectionStyle: React.CSSProperties = {
  background: '#fafafa',
  padding: '80px 0',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  height: '100%',
};

const pricingSectionStyle: React.CSSProperties = {
  background: '#fff',
  padding: '56px 0',
};

const pricingCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  border: '2px solid #e9ecef',
  padding: '28px 20px',
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const ctaSectionStyle: React.CSSProperties = {
  background: BLACK,
  color: '#fff',
  padding: '80px 0',
};

const iconCardBodyStyle: React.CSSProperties = {
  padding: '28px 16px',
  textAlign: 'center',
};

const iconStyle: React.CSSProperties = {
  fontSize: 36,
  marginBottom: 12,
};

const orangeBtnStyle: React.CSSProperties = {
  fontWeight: 700,
  background: ORANGE,
  borderColor: ORANGE,
  color: '#fff',
};

const pricingTiers = [
  {
    titleKey: 'home.pricingFreeTitle',
    ordersKey: 'home.pricingFreeOrders',
    ctaKey: 'home.pricingFreeCta',
  },
  {
    titleKey: 'home.pricingGrowthTitle',
    ordersKey: 'home.pricingGrowthOrders',
    ctaKey: 'home.pricingGrowthCta',
  },
];

const includedFeatures = [
  'home.pricingFeature1',
  'home.pricingFeature2',
  'home.pricingFeature3',
  'home.pricingFeature4',
  'home.pricingFeature5',
  'home.pricingFeature6',
];

const iconCards = [
  {
    icon: '📊',
    titleKey: 'home.feature1Title',
    descKey: 'home.feature1Desc',
  },
  {
    icon: '📋',
    titleKey: 'home.feature2Title',
    descKey: 'home.feature2Desc',
  },
  {
    icon: '🛒',
    titleKey: 'home.feature3Title',
    descKey: 'home.feature3Desc',
  },
  {
    icon: '💬',
    titleKey: 'home.feature4Title',
    descKey: 'home.feature4Desc',
  },
  {
    icon: '💳',
    titleKey: 'home.feature5Title',
    descKey: 'home.feature5Desc',
  },
  {
    icon: '🧾',
    titleKey: 'home.feature6Title',
    descKey: 'home.feature6Desc',
  },
  {
    icon: '📱',
    titleKey: 'home.feature7Title',
    descKey: 'home.feature7Desc',
  },
  {
    icon: '🌐',
    titleKey: 'home.feature8Title',
    descKey: 'home.feature8Desc',
  },
  {
    icon: '🔓',
    titleKey: 'home.feature9Title',
    descKey: 'home.feature9Desc',
  },
];

const footerStyle: React.CSSProperties = {
  background: '#111',
  color: 'rgba(255,255,255,0.45)',
  padding: '20px 0',
  textAlign: 'center',
  fontSize: '0.8rem',
  letterSpacing: '0.02em',
};

function scrollToContact() {
  const el = document.getElementById('contact');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export default function HomeLanding() {
  const { t, i18n } = useTranslation();
  const appVersion = window.__VARS__?.serverData?.appVersion;

  return (
    <div>
      {/* Language switcher */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, fontSize: '0.85rem', display: 'flex', gap: 8 }}>
        {([
          { code: 'en', flag: '🇬🇧', label: 'English' },
          { code: 'zh', flag: '🇨🇳', label: '中文' },
          { code: 'ms', flag: '🇲🇾', label: 'Bahasa Melayu' },
        ]).map(({ code, flag, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            style={{
              fontWeight: i18n.language === code ? 700 : 400,
              background: i18n.language === code ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${i18n.language === code ? ORANGE : 'rgba(255,255,255,0.2)'}`,
              color: i18n.language === code ? ORANGE : 'rgba(255,255,255,0.8)',
              padding: '5px 14px',
              borderRadius: 4,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {flag} {label}
          </button>
        ))}
      </div>

      {/* ── Hero ── */}
      <div style={heroStyle}>
        <Container>
          <h1 style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            marginBottom: 20,
            backgroundImage: 'linear-gradient(90deg, #00c6ff, #ff6bb5)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {t('home.hero')}
          </h1>
          <p style={subtitleStyle}>{t('home.heroSubtext')}</p>
          <Button
            size="lg"
            onClick={scrollToContact}
            style={{ ...orangeBtnStyle, padding: '14px 40px', fontSize: '1.1rem' }}
          >
            {t('home.heroCTA')}
          </Button>
        </Container>
      </div>

      {/* ── Features ── */}
      <div style={featuresSectionStyle}>
        <Container>
          <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 40, color: BLACK, fontSize: '1.5rem', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
            {t('home.featuresTitle')}
          </h2>

          <Row>
            {iconCards.map((f, i) => (
              <Col md={4} key={i} className="mb-4">
                <div style={cardStyle}>
                  <div style={iconCardBodyStyle}>
                    <div style={iconStyle}>{f.icon}</div>
                    <h6 style={{ fontWeight: 700, color: BLACK, fontSize: '0.95rem', marginBottom: 6 }}>{t(f.titleKey)}</h6>
                    <p style={{ color: '#6c757d', marginBottom: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>{t(f.descKey)}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* ── About / Mission ── */}
      <div style={{
        background: BLACK,
        color: '#fff',
        padding: '80px 0',
        textAlign: 'center',
      }}>
        <Container>
          <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
            <span style={{
              position: 'absolute',
              top: -24,
              left: -12,
              fontSize: '5rem',
              lineHeight: 1,
              color: 'rgba(255,255,255,0.30)',
              fontFamily: 'Georgia, serif',
            }}>"</span>
            <p style={{
              fontSize: '1.15rem',
              lineHeight: 2,
              margin: '0 auto',
              color: 'rgba(255,255,255,0.75)',
              fontStyle: 'italic',
            }}>
              {t('home.aboutQuote')}
            </p>
            <span style={{
              position: 'absolute',
              bottom: -48,
              right: -12,
              fontSize: '5rem',
              lineHeight: 1,
              color: 'rgba(255,255,255,0.30)',
              fontFamily: 'Georgia, serif',
            }}>"</span>
          </div>
        </Container>
      </div>

      {/* ── Pricing ── */}
      <div style={pricingSectionStyle}>
        <Container>
          <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 8, color: BLACK }}>
            {t('home.pricingTitle')}
          </h2>
          <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: 28, fontSize: '1.05rem' }}>
            {t('home.pricingSubtext')}
          </p>

          <Row className="justify-content-center">
            {pricingTiers.map((tier, i) => (
              <Col md={5} key={i} className="mb-3">
                <div style={pricingCardStyle}>
                  <h3 style={{ fontWeight: 700, marginBottom: 10, color: BLACK, fontSize: '1.4rem' }}>{t(tier.titleKey)}</h3>
                  <p
                    style={{ fontSize: '1.05rem', color: '#495057', marginBottom: 16, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: t(tier.ordersKey) }}
                  />
                  <button
                    type="button"
                    onClick={scrollToContact}
                    style={{
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      textDecoration: 'underline',
                      textDecorationColor: ORANGE,
                      textUnderlineOffset: 4,
                      color: ORANGE,
                      padding: '6px 0',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                    }}
                  >
                    {t(tier.ctaKey)}
                  </button>
                </div>
              </Col>
            ))}
          </Row>

          <h5 style={{ textAlign: 'center', fontWeight: 700, marginTop: 24, marginBottom: 12, color: BLACK, fontSize: '1.05rem' }}>
            {t('home.pricingIncludes')}
          </h5>
          <Row className="justify-content-center">
            <Col md={8}>
              <Row>
                {includedFeatures.map((key, i) => (
                  <Col sm={6} key={i} className="mb-1">
                    <div style={{ padding: '2px 0', color: '#495057', fontSize: '0.92rem' }}>
                      <span style={{ color: ORANGE, fontWeight: 700 }}>✓</span> {t(key)}
                    </div>
                  </Col>
                ))}
              </Row>
              <p style={{ textAlign: 'center', color: '#adb5bd', fontSize: '0.82rem', marginTop: 12, marginBottom: 0 }}>
                {t('home.pricingHardwareNote')}
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ── Contact CTA ── */}
      <div id="contact" style={ctaSectionStyle}>
        <Container>
          <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 40, color: '#fff' }}>
            {t('home.betaTitle')}
          </h2>
          <ContactForm />
        </Container>
      </div>

      <footer style={footerStyle}>
        eggroll pos {appVersion ? `v${appVersion}` : ''}
      </footer>
    </div>
  );
}
