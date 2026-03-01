import React from "react";
import { useTranslation } from "react-i18next";
import {Container, Form, Row, Col, Button} from "react-bootstrap";

export default function ContactForm(props) {
  const { t } = useTranslation();
  return (
    <Container className="contact-form">
      <Row>
        <Col sm={12} md={8}>
          <Form method="POST" action="/api/contact">
            <h3>{t('home.betaTitle')}</h3>
            <Form.Group controlId="ContactForm.Name">
              <Form.Label>{t('home.contactName')}</Form.Label>
              <Form.Control name="name" type="text" placeholder={t('home.contactNamePlaceholder')} />
            </Form.Group>
            <Form.Group controlId="ContactForm.Email">
              <Form.Label>{t('home.contactEmail')}</Form.Label>
              <Form.Control name="email" type="email" placeholder={t('home.contactEmailPlaceholder')} />
            </Form.Group>
            <Form.Group controlId="ContactForm.Website">
              <Form.Label>{t('home.contactWebsite')}</Form.Label>
              <Form.Control name="website" type="text" placeholder={t('home.contactWebsitePlaceholder')} />
            </Form.Group>
            <Form.Group controlId="ContactForm.Description">
              <Form.Label>{t('home.contactDescription')}</Form.Label>
              <Form.Control name="description" as="textarea" rows="5" />
            </Form.Group>
            <Button variant="primary" type="submit">
              {t('home.submit')}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
