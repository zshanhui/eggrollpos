import React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import {Card, Row, Col, ListGroup, Container} from 'react-bootstrap';

class ReceiptInner extends React.Component<{ id: string } & WithTranslation> {
  state = { receipt: null as any, lineItems: null as any };

  componentDidMount () {
    const id = this.props.id;
    fetch(`/r/${id}`)
      .then(res => res.json())
      .then(receipt => this.setState(receipt));
  }

  formatCentsToDollars(value) {
    value = (value + '').replace(/[^\d.-]/g, '');
    value = parseFloat(value);
    return value ? value / 100 : 0;
  }

  render(){
      const { t } = this.props;
      if(this.state.receipt === null || this.state.lineItems === null){
        return (
          <h1>{t('receipts.loading')}</h1>
          )
      } else {
        return (
          <Container className="border rounded" style={{boxShadow: "1.5px 1.5px grey",backgroundColor:"white"}}>
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
                <h3 className="mr-2 text-muted">#{this.state.receipt.id}</h3>
              </Col>
            </Row>
            <Row>
              <Col>
                <p>{(new Date(this.state.receipt.created_at)).toLocaleString()}</p>
              </Col>
            </Row>
            <hr/>
            <Row>
              <Col className="text-center my-3 font-italic">
                {this.state.receipt.business_name}
              </Col>
            </Row>
            <hr/>
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
            {this.state.lineItems.map((item,i) =>
              <Row key={i} className="my-4">
                <Col xs={6}>
                  <Row>
                    <Col>
                      <p><span className="font-weight-bold">{item.name}</span></p>
                    </Col>
                  </Row>
                </Col>
                <Col xs={3} className="text-center">
                  {item.quantity}
                </Col>
                <Col xs={3} className="text-right">
                  <span className="mr-2">{this.formatCentsToDollars(item.price_cents)}</span>
                </Col>
              </Row>
            )}
            <Row className="my-3">
              <Col xs={9}>
                <h5 className="font-weight-bold">{t('common.total')}</h5>
              </Col>
              <Col xs={3} className="text-right">
                {this.formatCentsToDollars(this.state.receipt.total_cents)}
              </Col>
            </Row>
            <hr/>
            <Row>
              <Col className="text-center">
                <p>{t('receipts.serviceBy')}</p>
              </Col>
            </Row>
          </Container>
        );
      }
  }
}

const Receipt = withTranslation()(ReceiptInner);

export default function ReceiptsPage(props) {
  return(
    <section>
      <Container fluid={true} style={{backgroundColor:'#FB8B8B'}}>
        <Row className="py-5">
          <Col md={{span:6,offset:3}}>
            <Receipt id={props.match.params.id} />
          </Col>
        </Row>
      </Container>
    </section>
  );
}
