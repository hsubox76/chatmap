import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import firebase from "firebase/app";

const config = {
  apiKey: "AIzaSyDPlZ9YEmrVqFesR2CUKxCQpDW-rrgbyjE",
  authDomain: "chatmap-ff77a.firebaseapp.com",
  databaseURL: "https://chatmap-ff77a.firebaseio.com",
  projectId: "chatmap-ff77a",
  storageBucket: "chatmap-ff77a.appspot.com",
  messagingSenderId: "48538250948"
};

firebase.initializeApp(config);

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
