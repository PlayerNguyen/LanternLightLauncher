import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import "./Index.css";
import store from "./Store";

const container = document.getElementById("app") as HTMLElement;
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </Provider>
);
