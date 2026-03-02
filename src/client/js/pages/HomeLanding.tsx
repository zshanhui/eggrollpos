import React from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col } from "react-bootstrap";
import LandingContactForm from "../components/LandingContactForm";
import "../../css/pages/HomeLanding.css";

const SCREENSHOTS = {
  ordersList: "/screenshots/merchant-orders-list-desktop.png",
  orderDetail: "/screenshots/merchant-order-detail-mobile.png",
  menuItems: "/screenshots/merchant-menu-items-list-mobile.png",
};

export default function HomeLanding() {
  const { t, i18n } = useTranslation();

  return (
    <div className="LandingPage">
      <header className="LandingPage__header d-flex justify-content-end align-items-center">
        <div className="LandingPage__lang">
          <button
            type="button"
            onClick={() => i18n.changeLanguage("zh")}
            data-active={i18n.language === "zh"}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => i18n.changeLanguage("en")}
            data-active={i18n.language === "en"}
          >
            English
          </button>
        </div>
      </header>

      <section className="LandingPage__hero">
        <h1 className="LandingPage__hero-title">{t("home.hero")}</h1>
        <p className="LandingPage__hero-sub">{t("home.heroSub")}</p>
      </section>

      <section className="LandingPage__benefits">
        <h2 className="LandingPage__section-title">{t("home.benefitsTitle")}</h2>
        <div className="LandingPage__benefits-grid">
          <div className="LandingPage__benefit">
            <img
              src={SCREENSHOTS.ordersList}
              alt={t("home.benefitOnlineOrderingAlt")}
              className="LandingPage__benefit-img"
            />
            <h3 className="LandingPage__benefit-title">{t("home.benefitOnlineOrderingTitle")}</h3>
            <p className="LandingPage__benefit-desc">{t("home.benefitOnlineOrderingDesc")}</p>
          </div>
          <div className="LandingPage__benefit">
            <img
              src={SCREENSHOTS.orderDetail}
              alt={t("home.benefitKitchenDisplayAlt")}
              className="LandingPage__benefit-img"
            />
            <h3 className="LandingPage__benefit-title">{t("home.benefitKitchenDisplayTitle")}</h3>
            <p className="LandingPage__benefit-desc">{t("home.benefitKitchenDisplayDesc")}</p>
          </div>
          <div className="LandingPage__benefit">
            <img
              src={SCREENSHOTS.menuItems}
              alt={t("home.benefitWhatsAppAlt")}
              className="LandingPage__benefit-img"
            />
            <h3 className="LandingPage__benefit-title">{t("home.benefitWhatsAppTitle")}</h3>
            <p className="LandingPage__benefit-desc">{t("home.benefitWhatsAppDesc")}</p>
          </div>
        </div>
      </section>

      <section className="LandingPage__pricing">
        <h2 className="LandingPage__section-title">{t("home.pricingTitle")}</h2>
        <div className="LandingPage__pricing-grid">
          <div className="LandingPage__plan LandingPage__plan--featured">
            <div className="LandingPage__plan-name">{t("home.planFreeName")}</div>
            <div className="LandingPage__plan-price">
              $0 <span>{t("home.planPerMonth")}</span>
            </div>
            <p className="LandingPage__plan-desc">{t("home.planFreeDesc")}</p>
          </div>
          <div className="LandingPage__plan">
            <div className="LandingPage__plan-name">{t("home.planPaidName")}</div>
            <div className="LandingPage__plan-price">
              $12 <span>{t("home.planPerMonth")}</span>
            </div>
            <p className="LandingPage__plan-desc">{t("home.planPaidDesc")}</p>
          </div>
        </div>
      </section>

      <section className="LandingPage__contact">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={10} lg={8}>
              <div className="LandingPage__contact-inner">
                <LandingContactForm />
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
