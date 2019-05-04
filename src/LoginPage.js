import React, { useState, useRef } from "react";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { navigate } from "@reach/router";
import "./LoginPage.css";

function isUsernameValid(username) {
  if (username.length < 3) {
    return ({ error: "is too short" });
  }
  if (username.length > 16) {
    return ({ error: "is too long" });
  }
  return username.match(/^[A-Za-z0-9]+$/) || { error: "has invalid characters" };
}

function doesUsernameExist(username) {
  return firebase
    .firestore()
    .collection("usernames")
    .doc(username)
    .get()
    .then(doc => doc.exists);
}

function signInWithPopup() {
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(userCredential => {
    const user = userCredential.user;
    const profileUpdate = user.updateProfile({
      displayName: user.displayName
    });
    const databaseUpdate = firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .set({ displayName: user.displayName });
    const usernameUpdate = firebase
      .firestore()
      .collection("usernames")
      .doc(user.displayName)
      .set({ uid: user.uid });
    Promise.all([profileUpdate, databaseUpdate, usernameUpdate]).then(() => navigate("/")).catch(e => console.log(e));
  });
}

function createUser(email, password, username) {
  return doesUsernameExist(username)
    .then(usernameExists => {
      if (usernameExists) {
        throw new Error("Username already exists.");
      }
    })
    .then(() => {
      return firebase
        .auth()
        .createUserWithEmailAndPassword(email, password);
    })
    .then(userCredential => {
      const user = userCredential.user;
      const profileUpdate = user.updateProfile({
        displayName: username
      });
      const databaseUpdate = firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .set({ displayName: username });
      const usernameUpdate = firebase
        .firestore()
        .collection("usernames")
        .doc(username)
        .set({ uid: user.uid });
      return Promise.all([profileUpdate, databaseUpdate, usernameUpdate]);
    });
}

function loginUser(email, password) {
  return firebase
    .auth()
    .signInWithEmailAndPassword(email, password);
}

const LoginPage = () => {
  const usernameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const [hasAccount, setHasAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState();

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);
    if (hasAccount) {
      loginUser(emailRef.current.value, passwordRef.current.value)
        .then(() => navigate("/"))
        .catch(e => setErrorMessage(e.message));
    } else {
      const username = usernameRef.current.value;
      const result = isUsernameValid(username);
      if (result.error) {
        setErrorMessage("username " + result.error);
        return;
      }
      createUser(
        emailRef.current.value,
        passwordRef.current.value,
        username
      ).then(() => navigate("/"))
        .catch(e => console.error(e));
      // .catch(e => setErrorMessage(e.message));
    }
  }

  function renderRow({ labelText, type = "text", ref }) {
    return (
      <div className="form-row">
        <label>{labelText}</label>
        <input ref={ref} type={type}/>
      </div>
    );

  }

  return (
    <div className="login-page-container">
      <div>{hasAccount ? "log in" : "create an account"}</div>
      <div>
        <button onClick={() => setHasAccount(!hasAccount)}>
          switch to {hasAccount ? "create an account" : "log in"} page
        </button>
      </div>
      <form className="login-form">
        {!hasAccount && renderRow({ labelText: "username", ref: usernameRef })}
        {renderRow({ labelText: "email", ref: emailRef, type: "email" })}
        {renderRow({
          labelText: "password",
          ref: passwordRef,
          type: "password"
        })}
        <div className="form-row">
          <button onClick={handleSubmit}>
            {hasAccount ? "login" : "create"}
          </button>
          <button className='marginPop'
                  onClick={signInWithPopup}>{hasAccount ? "login with google" : "create with google"}</button>
        </div>
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
