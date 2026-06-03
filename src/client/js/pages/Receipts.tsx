import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Container } from 'react-bootstrap';

function formatCentsToDollars(value: number | string) {
  const cleaned = (value + '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return num ? num / 100 : 0;
}

function Receipt({ id }: { id: string }) {
  const { t } = useTranslation();
  const [receipt, setReceipt] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any>(null);

  useEffect(() => {
    fetch(`/r/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setReceipt(data.receipt);
        setLineItems(data.lineItems);
      });
  }, [id]);

  if (receipt === null || lineItems === null) {
    return <h1>{t('receipts.loading')}</h1>;
  }

  return (
    <Container
      className="border rounded"
      style={{ boxShadow: '1.5px 1.5px grey', backgroundColor: 'white' }}
    >
      <Row className="my-5">
        <Col className="text-center">
          <p className="mb-0">{t('receipts.logo')}</p>
        </Col>
      </Row>
      <Row className="mt-4 mb-2">
        <Col xs={8}>
          <h2>{t('receipts.receipt')}</h2>
        </Col>
        <Col xs={4} className="text-right">
          <h3 className="mr-2 text-muted">#{receipt.id}</h3>
        </Col>
      </Row>
      <Row>
        <Col>
          <p>{new Date(receipt.created_at).toLocaleString()}</p>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col className="text-center my-3 font-italic">{receipt.business_name}</Col>
      </Row>
      <hr />
      <Row>
        <Col xs={6}>
          <h6 className="text-muted">{t('common.product')}</h6>
        </Col>
        <Col xs={3}>
          <h6 className="text-muted text-center">{t('common.unit')}</h6>
        </Col>
        <Col xs={3}>
          <h6 className="text-muted text-center">{t('common.price')}</h6>
        </Col>
      </Row>
      {lineItems.map((item: any, i: number) => (
        <Row key={i} className="my-4">
          <Col xs={6}>
            <Row>
              <Col>
                <p>
                  <span className="font-weight-bold">{item.name}</span>
                </p>
              </Col>
            </Row>
          </Col>
          <Col xs={3} className="text-center">
            {item.quantity}
          </Col>
          <Col xs={3} className="text-right">
            <span className="mr-2">{formatCentsToDollars(item.price_cents)}</span>
          </Col>
        </Row>
      ))}
      <Row className="my-3">
        <Col xs={9}>
          <h5 className="font-weight-bold">{t('common.total')}</h5>
        </Col>
        <Col xs={3} className="text-right">
          {formatCentsToDollars(receipt.total_cents)}
        </Col>
      </Row>
      <hr />
      <Row>
        <Col className="text-center">
          <p>{t('receipts.serviceBy')}</p>
        </Col>
      </Row>
    </Container>
  );
}

export default function ReceiptsPage(props: { match: { params: { id: string } } }) {
  return (
    <section>
      <Container fluid style={{ backgroundColor: '#FB8B8B' }}>
        <Row className="py-5">
          <Col md={{ span: 6, offset: 3 }}>
            <Receipt id={props.match.params.id} />
          </Col>
        </Row>
      </Container>
    </section>
  );
}
