import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

//import fontawesome icons
import '@fortawesome/fontawesome-free/css/all.min.css';
//import bootstrap 
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);