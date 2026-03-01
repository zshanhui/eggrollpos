// Entry file for client react-app

import "./i18n";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

const root = document.getElementById("app-root");
if (root.hasChildNodes()) {
  ReactDOM.hydrate(<App />, root);
} else {
  ReactDOM.render(<App />, root);
}
