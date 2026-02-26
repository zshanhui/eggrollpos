require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const ReactRouter = require("./routes/index");
const leadsRouter = require("./routes/leads");
const merchantsRouter = require("./routes/merchants");
const ordersRouter = require("./routes/orders");

const Actions = require("./services/actions");
const Dialog = require("./services/dialog");
const { PaymentMethods } = require("../shared/payments");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Serve static files from Vite build output
app.use("/dist", express.static(path.join(__dirname, "../../dist")));
// Serve assets from Vite build output
app.use("/assets", express.static(path.join(__dirname, "../../dist/assets")));

app.use("/api/contact", leadsRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/orders", ordersRouter);

/* entrypoint for messenger webhook */
app.post("/webhook", async (req, res) => {
  let body = req.body;

  if (body.object === "page") {
    // iterates over each entry
    for (const entry of body.entry) {
      let webhook_event = entry.messaging[0];

      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      console.log("NLP entities >> ", webhook_event.message.nlp.entities);

      if (webhook_event.message) {
        await handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        await handlePostback(sender_psid, webhook_event.postback);
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

async function handleMessage(psid, message) {
  if (message.text) {
    if (isFirstContact(message)) {
      console.log("Confident is first contact... ", psid);
      return Actions.startOrderingChat(psid);
    }
    if (isMerchantHashCode(message)) {
      console.log("Is merchant hash code ", message.text);
      return Actions.initOrderProcess(psid, message.text);
    }
    if (isPickupMinutes(message)) {
      console.log("Confident is a pickup time message >> ", message);
      if (!message.quick_reply) return;
      return Actions.updateOrderPickupTime({
        psid,
        time: message.quick_reply.payload,
      });
    }
    if (isCustomerProvidedMobileNumber(message)) {
      console.log("Confident is mobile number >> ", message);
      return Actions.storePhoneNumber(psid, message.quick_reply.payload);
    }
    if (isPaymentMethodReply(message)) {
      console.log("Confident is payment method reponse >> ", message);
      return Actions.updatePaymentMethod(psid, {
        payment_method: message.payload,
      });
    }
    await Dialog.fallbackResponse(psid);
  }
}

function isFirstContact(message) {
  const m = message.text.toLowerCase().trim();
  if (m.indexOf("start") > -1) return true;
  if (m.indexOf("order") > -1) return true;
  if (m.indexOf("hey") > -1) return true;
  if (m.indexOf("hungry") > -1) return true;
  return false;
}

function isMerchantHashCode(message) {
  if (message.text.indexOf("#") !== 0 && message.text.length !== 5) {
    return false;
  }
  return true;
}

function isZipCode(possibleZip) {
  const min = 10000;
  const max = 999999;
  return Number(possibleZip) >= min && Number(possibleZip) <= max;
}

function isPickupMinutes(message) {
  // console.log('MESSAGE >> ', message);
  const { text, quick_reply, nlp } = message;

  if (!quick_reply || !Number(quick_reply.payload)) {
    return false;
  }

  const minutesRegex = /(i|I)n.+(15|30|45|60).+minutes/gi;
  if (!minutesRegex.test(text)) {
    return false;
  }

  console.log("NLP entities >> ", nlp.entities.datetime);
  if (
    !nlp &&
    !nlp.entities &&
    !nlp.entities.datetime &&
    !nlp.entities.datetime.confidence > 0.9
  ) {
    return false;
  }

  return true;
}

function isCustomerProvidedMobileNumber({ quick_reply, text, nlp }) {
  // console.log('NLP >> ', nlp);
  if (!text || !quick_reply || !quick_reply.payload) return false;
  if (!nlp.entities || !nlp.entities.phone_number) return false;
  return true;
}

function isPaymentMethodReply(message) {
  const { quick_reply } = message;
  if (
    (quick_reply && quick_reply.payload === PaymentMethods.IN_STORE) ||
    quick_reply.payload === PaymentMethods.FACEBOOK_PAY
  ) {
    return true;
  }
  return false;
}

/* Adds support for GET requests to our webhook */
app.get("/webhook", (req, res) => {
  // parse query params
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden if verify tokens do not match'
      res.sendStatus(403);
    }
  }
});

app.get("/r/:receiptId", async (req, res) => {
  const receiptId = req.params.receiptId;
  const receipts = await Actions.getReceipt({ receiptId });
  const orderId = receipts.order_id;
  const lineItems = await Actions.getLineItems({ orderId });
  res.json({ receipt: receipts, lineItems: lineItems });
});

/* This should come after all other routes */
app.use("/*", ReactRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
