const Messenger = require('messenger-node');

const CONFIG = {
  page_token: process.env.PAGE_ACCESS_TOKEN,
  app_token: process.env.APP_ID,
  api_version: 'v2.11',
}

const standardResponses = require('../services/response')

const SERVER_URL = process.env.APP_URL || '';

const ResponseTemplates = {
  Introduction: name => `Hey there ${name || ''}, let\'s get you started with ordering. Please type the #mhash (Merchant Hash Code Eg. #1122)?`,
  ShowListOfMerchants: `Here's a list of available Merchants near you`,
  WhenToPickupQuickReply: {
    quickReplies: [
      {
        content_type: 'text',
        title: 'In 15 minutes',
        payload: 15,
      },
      {
        content_type: 'text',
        title: 'In 30 minutes',
        payload: 30,
      },
      {
        content_type: 'text',
        title: 'In 45 minutes',
        payload: 45,
      },
      {
        content_type: 'text',
        title: 'In 1 hour',
        payload: 60,
      }
    ],
    text: 'When would you like to pickup your order?',
  },
  AskMobilePhoneQuickReply: {
    text: 'Just incase the merchant store needs to contact you about your order, would you mind providing your mobile number?',
    quickReplies: [
      {
        content_type: 'user_phone_number',
      }
    ],
  },
  AskPaymentMethodQuickReply: {
    text: 'How would you like to pay?',
    quickReplies: [
      {
        content_type: 'text',
        title: 'Facebook Pay',
        payload: 'facebook_pay',
      },
      {
        content_type: 'text',
        title: 'In Store',
        payload: 'in_store',
      },
    ],
  },
  AskForOrderConfirmation: {
    text: `Confirm the order?`,
    quickReplies: [
      {
        content_type: 'text',
        title: 'Yes',
        payload: 'yes',
      },
      {
        content_type: 'text',
        title: 'No',
        payload: 'no',
      },
    ],
  },
  OrderHasBeenPlaced: (orderId, minutes) => `Your order #${orderId} has been placed. Should ready for pickup in ${minutes} minutes`,
  OrderAccepted: (orderId, merchantName) => `Your order #${orderId} is has been accepted by ${merchantName}!`,
  OrderIsBeingPrepared: orderId => `Your order #${orderId} is being prepared!`,
  OrderIsReadyForPickup: orderId => `Your order #${orderId} is now ready for pickup!`,
  ViewReceipt: (name, receiptId) => standardResponses.genButtonTemplate(
    `Hey there ${name}, here is your receipt!`,
    {
      type: 'web_url',
      title: 'View Receipt',
      url: `${SERVER_URL}/receipts/${receiptId}`,
      webview_height_ratio: 'tall',
      messenger_extensions: true,
    }
  ),
}

const Client = new Messenger.Client(CONFIG);

/**
 * @arwa Let's put all the messenge sending logic to FB messenger here
 *
 */

async function introduction(psid, customer) {
  // @todo Sends the introduction message when Customers first initiate chat
  const recipient = {'id': psid};
  const results = await Client.sendText(recipient, ResponseTemplates.Introduction(customer.name));
  console.log('results from introduction >> ', results);
}

async function respondWithMerchantMenu(psid, merchant, uuid) {
  const recipient = {'id': psid};
  try {
    const elements = [{
      // @todo: use actual orderUuid from database
      // const uuid = '0fc6535c-0700-4926-8504-76c8b1c24fb4';
      title: `#${merchant.id} - ${merchant.business_name}`,
      image_url: 'https://i.imgur.com/d1QQU8T.jpg',
      subtitle: merchant.description || '',
      default_action: {
        type: 'web_url',
        url: `${SERVER_URL}/orders/${uuid}/menus`,
        webview_height_ratio: 'FULL',
      },
      buttons: [
        {
          type: 'web_url',
          url: `${SERVER_URL}/orders/${uuid}/menus`,
          title: 'View Menu',
          webview_height_ratio: 'FULL',
        }
      ],
    }];
    const template = {
      template_type: 'generic',
      elements,
    };
  
    // console.log('results from responseWithNearbyLocations >> ', results);
    return await Client.sendTemplate(recipient, template);
  } catch(err) {
    Client.sendText(recipient, `We're having some error finding this merchant and menu? Care to try another #mhash?`);
  }
}

async function askAboutPickupTimes(customer, lineItems) {
  let totalItemsAdded = 0;
  let totalPriceCents = 0;
  lineItems.forEach(line => {
    totalItemsAdded += line.quantity;
    totalPriceCents += parseInt(line.price_cents);
  });

  // console.log(totalItemsAdded, totalPriceCents);

  const recipient = {'id': customer.psid};
  const {quickReplies, text} = ResponseTemplates.WhenToPickupQuickReply;
  await Client.sendText(recipient, `Great! We've added ${totalItemsAdded} items to your order cart subtotaling about ${(totalPriceCents/100).toFixed(2)}`);
  setTimeout(async () => await Client.sendQuickReplies(recipient, quickReplies, text), 1000);
}

async function askOrVerifyMobile(customer, order) {
  const recipient = {'id': customer.psid};
  const {quickReplies, text} = ResponseTemplates.AskMobilePhoneQuickReply;
  await Client.sendText(recipient, `Sounds good! We got you down to pick up in ${order.pickup_in} minutes`);
  await Client.sendQuickReplies(recipient, quickReplies, text);
}

async function askForPaymentMethod(customer) {
  const recipient = {'id': customer.psid};
  await Client.sendText(recipient, `Thanks ${customer.name}!`);

  const {quickReplies, text} = ResponseTemplates.AskPaymentMethodQuickReply;
  await Client.sendQuickReplies(recipient, quickReplies, text);
}

async function unableToUpdatePaymentMethod(psid) {
  const recipient = {'id': psid};
  await Client.sendText(recipient, `We couldn't update the payment method. Try again?`);
  const {quickReplies, text} = ResponseTemplates.AskPaymentMethodQuickReply;
  await Client.sendQuickReplies(recipient, quickReplies, text);
}

async function askForOrderConfirmation(psid, {subTotal, totalWithTax}) {
  const recipient = {'id': psid};

  await Client.sendText(recipient, `Your order subtotal is $${(subTotal/100).toFixed(2) || '$subTotal'}`);
  await Client.sendText(recipient, `Your order total with tax is $${(totalWithTax/100).toFixed(2) || 'totalWithTax'}`);

  const {quickReplies, text} = ResponseTemplates.AskForOrderConfirmation;
  await Client.sendQuickReplies(recipient, quickReplies, text);
}

async function respondWithReceipt(psid, receiptId, customer) {
  // @todo Sends the receipt to customer, opened in a Webview
  // we already have the Receipt implmented in PR: https://github.com/adrienshen/facebook-bizchat-hackathon/pull/13/files
  const recipient = {'id': psid};
  Client.sendTemplate(recipient, ResponseTemplates.ViewReceipt(customer.name,receiptId));
}

async function genericResponseText(psid, message) {
  // @todo regular text messages from our backend to Messenger
}

async function fallbackResponse(psid) {
  const recipient = {'id': psid};
  await Client.sendText(recipient, `Hmm... not sure what you meant by that.`);
}

module.exports = {
  introduction,
  genericResponseText,
  respondWithMerchantMenu,
  askAboutPickupTimes,
  askOrVerifyMobile,
  askForOrderConfirmation,
  askForPaymentMethod,
  unableToUpdatePaymentMethod,
  fallbackResponse,
}
