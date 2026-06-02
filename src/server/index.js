require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const ReactRouter = require("./routes/index");
const leadsRouter = require("./routes/leads");
const merchantsRouter = require("./routes/merchants");
const ordersRouter = require("./routes/orders").default;
const { publicRouter: menusPublicRouter } = require("./routes/menus");

const Actions = require("./services/actions");
const db = require("../../db/knex");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Serve static files from Vite build output
app.use("/dist", express.static(path.join(__dirname, "../../dist")));
// Serve assets from Vite build output
app.use("/assets", express.static(path.join(__dirname, "../../dist/assets")));

app.get("/health", async function (req, res) {
  try {
    await db.raw("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    res.status(503).json({ status: "error", message: "database unavailable" });
  }
});

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
