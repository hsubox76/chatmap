import React, { useState, useRef, useEffect } from "react";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "./App.css";
import { Router } from "@reach/router";
import Chat from "./Chat.js";
import ChatList from "./ChatList.js";
import LoginPage from "./LoginPage.js";

// function createProfileIfNotFound(user) {
//   firebase
//     .firestore()
//     .collection("users")
//     .doc(user.uid)
//     .get()
//     .then(snap => {
//       if (!snap || snap.empty) {
//         firebase
//           .firestore()
//           .collection("users")
//           .doc(user.uid)
//           .set({
//             displayName: user.displayName
//           });
//       }
//     });
// }

function updateProfile(user, newName) {
  const oldName = user.displayName;
  user.updateProfile({
    displayName: newName
  });
  firebase
    .firestore()
    .collection("users")
    .doc(user.uid)
    .update({ displayName: newName });
  firebase
    .firestore()
    .collection("usernames")
    .doc(newName)
    .set({ uid: user.uid });
  firebase
    .firestore()
    .collection("usernames")
    .doc(oldName)
    .delete();
}

function Header({ user }) {
  const usernameRef = useRef();
  const userDisplayString = user ? `${user.displayName}:${user.email}` : 'no user';
  const loginButton = user
    ? (<button onClick={() => firebase.auth().signOut()}>sign out</button>)
    : (<a href="/login">log in</a>);
  return (
    <div className="header-container">
      <div>
        user: {userDisplayString}
      </div>
      <input type="text" ref={usernameRef} />
      {user && <button onClick={() => updateProfile(user, usernameRef.current.value)}>
        update profile
      </button>}
      {loginButton}
    </div>
  );
}

function App() {
  const [user, setUser] = useState();
  const [authChecked, setAuthChecked] = useState(false);

  firebase.auth().onAuthStateChanged(authUser => {
    if (authUser === user) return;
    setUser(authUser);
    // authUser && createProfileIfNotFound(authUser);
    setAuthChecked(true);
  });

  useEffect(() => {
    if (!user) return;
    const unsub = firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .onSnapshot(snap => {
        if (snap && user.displayName !== snap.data().displayName) {
          setUser(Object.assign({}, user, snap.data()));
        }
      });
    return unsub;
  }, [user]);

  // Auth check has not finished.
  if (!authChecked || (user && !user.displayName)) {
    return <div>loading page...</div>;
  }

  return (
    <div className="app-container">
      <Header user={user} />
      <Router className="content-container">
        <ChatList path="/" user={user} />
        <Chat path="/chat/:chatId" user={user} />
        <LoginPage path="/login" />
      </Router>
    </div>
  );
}

export default App;