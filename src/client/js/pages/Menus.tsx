import React, { useState, useEffect } from "react";
import { useTranslation, withTranslation, WithTranslation } from "react-i18next";
import { Card, Row, Col, Modal, Container, Button, OverlayTrigger, Popover } from "react-bootstrap";

import {
  getCustomerOrderMenu,
  createLineItem,
  completeAddingLineItems,
} from "../api/index";

import "../../css/pages/Menus.css";
import appleImage from "../../assets/images/apple-placeholder.jpg";

class MenuInner extends React.Component<WithTranslation> {
  constructor(props) {
    super(props);
    this.state = {
      orderUuid: null,
      menuItems: null,
      cart: null,
      order: null
    };
  }

  async componentDidMount() {
    const { orderUuid } = this.props.match.params;
    console.log("order uuid >> ", orderUuid);

    const results = await getCustomerOrderMenu(orderUuid);
    console.log("results from api ", results);

    if (!orderUuid || !results.menuItems || !results.cart || !results.order) {
      throw Error('No order for this UUID');
    }

    this.setState({
      orderUuid,
      menuItems: results.menuItems,
      cart: results.cart,
      order: results.order
    });
  }

  async showCartItems() {

  }

  render() {
    const { orderUuid, menuItems, order, cart } = this.state;
    const { t } = this.props;
    if (menuItems === null) {
      return <h1>{t('menus.loading')}</h1>;
    }
    return (
      <>
        <header className="Menu__header">
          <div className="Menu__branding">
            <i>
              <span>yum</span>chat.io
            </i>
            <CartPopover
              menuItems={menuItems}
              cart={cart} />
          </div>
          <div className="Menu__merchant-meta">
            <h2>$MERCHANT</h2>
            <p className="mb-0">10:00am - 10:00pm</p>
          </div>
        </header>

        <Container>
          <section style={{ padding: "1rem" }} className="Menu__menu-items">
            {menuItems.map((item, i) => (
              <MenuItem
                key={i}
                orderUuid={orderUuid}
                item={item}
              />
            ))}
          </section>
        </Container>

        <PageActions orderUuid={orderUuid} t={t} />
      </>
    );
  }
}

export default withTranslation()(MenuInner);

function MenuItem({ orderUuid, item }) {
  const [showOptions, setShowOptions] = useState(false);

  const handleClose = () => setShowOptions(false);
  const handleShow = () => setShowOptions(true);

  return (
    <Row>
      <MenuItemOptions
        orderUuid={orderUuid}
        menuItem={item}
        handleClose={handleClose}
        show={showOptions}
      />
      <Card onClick={handleShow} style={{ width: "90%" }} className="mb-2">
        {item.image && (
          <Card.Img width="90%" height="180" variant="top" src={appleImage} />
        )}
        <Card.Body>
          <Card.Title>{item.name}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            ${item.price_cents / 100}
          </Card.Subtitle>
          <Card.Text>{item.description.substr(10)}...</Card.Text>
        </Card.Body>
      </Card>
    </Row>
  );
}

function PageActions({orderUuid, t}) {
  const [comments, setComments] = useState('');

  const closeWebView = () => {
    completeAddingLineItems(orderUuid, comments);
  }

  return <footer className="MenuPageActions">
    <div>
      <span className="MenuPageActions__price">{t('menus.orderTotal')}: $99.99</span>
    </div>
    <div className="MenuPageActions__comments">
      <input
        type="text"
        placeholder="Special instructions or notes..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        className="MenuPageActions__comments-input"
      />
    </div>
    <div>
      <Button
        onClick={closeWebView}
        className="MenuPageActions__confim">{t('menus.confirmOrder')}</Button>
    </div>
  </footer>
}

function MenuItemOptions({ orderUuid, menuItem, handleClose, show }) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [addItemProgress, setAddItemProgress] = useState(false);

  async function handleAddItem() {
    setAddItemProgress(true);

    // Call API endpoint
    const res = await createLineItem({
      orderUuid,
      menuItemId: menuItem.id,
      quantity,
    });

    // After adding item
    setTimeout(() => {
      if (!res) {
        setAddItemProgress(false);
        return;
      }
  
      setQuantity(1);
      setAddItemProgress(false);
      handleClose();
      location.reload();
    }, 1000);
  }

  function handleSetQuantity(value) {
    if (!Number(value) || value > 10 || value < 1) {
      return;
    }

    setQuantity(value);
  }

  const priceHumanReadable =
    "$" + ((quantity * menuItem.price_cents) / 100).toFixed(2);

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{menuItem.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{menuItem.description}</Modal.Body>
        <Modal.Footer>
          <SelectQuantity
            handleSetQuantity={handleSetQuantity}
            quantity={quantity}
          />
          <Button disabled={addItemProgress} variant="primary" onClick={handleAddItem}>
            {t('menus.addToCart')} - {priceHumanReadable}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function SelectQuantity({ handleSetQuantity, quantity }) {
  return (
    <div className="QuantitySelector">
      <button
        onClick={() => handleSetQuantity(quantity - 1)}
        className="QuantitySelector__btn"
      >
        -
      </button>
      <input
        value={quantity}
        onChange={e => handleSetQuantity(e.target.value)}
        type="number"
        className="QuantitySelector__input"
      />
      <button
        onClick={() => handleSetQuantity(quantity + 1)}
        className="QuantitySelector__btn"
      >
        +
      </button>
    </div>
  );
}

function CartPopover({menuItems, cart}) {
  const { t } = useTranslation();
  if (!menuItems || !menuItems.length || !cart) {
    return null;
  }
  const findMenuItem = id => menuItems.find(i => i.id === id);
  const getTotalItems = cart && cart.lineItems.length
    ? cart.lineItems.reduce((sum, cur) => ({quantity: sum.quantity + cur.quantity}))
    : 0;
  const place = 'bottom';
    return <>
      <OverlayTrigger
        trigger="click"
        key={place}
        placement={place}
        overlay={
          <Popover className="CartItems__list"
            id={`popover-positioned-${place}`}>
            <Popover.Title as="h3">{t('menus.currentOrder')}</Popover.Title>
            <Popover.Content>
              <ul>
                {cart.lineItems.map(i => {
                  return <li>
                    <span>{t('common.item')}: {findMenuItem(i.menu_item_id).name}</span><br/>
                    <span>{t('common.qty')}: {i.quantity}</span>
                  </li>
                })}
              </ul>
            </Popover.Content>
          </Popover>
        }
      >
        <Button
          variant="secondary"
          className="Menu__cart-icon">
          {t('menus.cart')} <span>({getTotalItems.quantity})</span>
        </Button>
      </OverlayTrigger>{' '}
    </>
}
