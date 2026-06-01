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
const { publicRouter: menusPublicRouter } = require("./routes/menus");
const whatsappConfig = require("./services/whatsapp/config");
const whatsappWebhookRouter = require("./routes/whatsapp_webhook");

const Actions = require("./services/actions");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));

// WhatsApp webhooks need the raw body for X-Hub-Signature-256 verification
if (whatsappConfig.shouldMountWebhook()) {
  app.use(
    "/api/webhooks/whatsapp",
    express.raw({ type: "application/json" }),
    whatsappWebhookRouter
  );
}

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
app.use("/api/menus", menusPublicRouter);

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
