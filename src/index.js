

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import Login from "./pages/login";
import ProtectedRoute from "./ProtectedRoute";

const router1 = [
  {
    path: "/",
    element: <Login />,
  },

  {
    path: "/e-track",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  
];

const routers = [...router1];

const browser_router = createBrowserRouter(routers);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={browser_router} />);

reportWebVitals();
