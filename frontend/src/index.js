// src/index.js
import React from "react";
import { createRoot } from "react-dom/client"; // New import for React 18
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import App from "./App";

// Create a root element
const container = document.getElementById("root");
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);