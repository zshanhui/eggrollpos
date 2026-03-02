import React from "react";
import { useTranslation } from "react-i18next";
import { Form, Button } from "react-bootstrap";

/** Contact form for merchant sign-up — frontend only, no backend submit yet */
export default function LandingContactForm() {
  const { t } = useTranslation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up backend submission later
  }

  return (
    <Form className="LandingPage__contact-form" onSubmit={handleSubmit}>
      <h3 className="mb-4">{t("home.contactTitle")}</h3>

      <Form.Group controlId="contactRestaurantName">
        <Form.Label>{t("home.contactRestaurantName")}</Form.Label>
        <Form.Control
          name="restaurant_name"
          type="text"
          placeholder={t("home.contactRestaurantNamePlaceholder")}
          required
        />
      </Form.Group>

      <Form.Group controlId="contactEmailOrWhatsApp">
        <Form.Label>{t("home.contactEmailOrWhatsApp")}</Form.Label>
        <Form.Control
          name="contact"
          type="text"
          placeholder={t("home.contactEmailOrWhatsAppPlaceholder")}
          required
        />
      </Form.Group>

      <Form.Group controlId="contactWebsite">
        <Form.Label>{t("home.contactWebsite")}</Form.Label>
        <Form.Control
          name="website"
          type="text"
          placeholder={t("home.contactWebsitePlaceholder")}
        />
        <Form.Text className="text-muted">{t("home.contactWebsiteHint")}</Form.Text>
      </Form.Group>

      <Button variant="primary" type="submit">
        {t("home.submit")}
      </Button>
    </Form>
  );
}
