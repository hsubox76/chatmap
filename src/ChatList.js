import React, { useState, useEffect } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import { Link, navigate } from "@reach/router";

const ChatList = ({ user }) => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    firebase
      .firestore()
      .collection("chats")
      .where("participantIds", "array-contains", user.uid)
      .get()
      .then(querySnap => {
        if (querySnap && !querySnap.empty) {
          let chatList = [];
          querySnap.forEach(docSnap => {
            chatList.push(Object.assign(docSnap.data(), { id: docSnap.id }));
          });
          setChats(chatList);
        }
      });
  }, [user.uid]);

  function createChat(e) {
    e.preventDefault();
    firebase
      .firestore()
      .collection("chats")
      .add({
        commentCount: 0,
        participantIds: [user.uid],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(docRef => {
        navigate(`/chat/${docRef.id}`);
      })
      .catch(e => console.error(e));
  }

  return (
    <div className="chat-list-container">
      {chats.map(chat => (
        <div key={chat.id}>
          {chat.id} <Link to={`/chat/${chat.id}`}>go</Link>
        </div>
      ))}
      <button onClick={createChat}>Start New Chat</button>
    </div>
  );
};

export default ChatList;
