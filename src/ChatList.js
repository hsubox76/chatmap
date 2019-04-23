import React, { useState, useEffect } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import { Link, navigate } from "@reach/router";
import {format} from 'date-fns';

const ChatList = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [usersById, setUsersById] = useState({});

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

  useEffect(() => {
    if (!chats) return;
    const idsToGet = {};
    chats.forEach(chat => chat.participantIds.forEach(id => idsToGet[id] = true));
    const userFetches =
      Object.keys(idsToGet)
        .map(id => firebase.firestore().collection("users").doc(id).get());
    Promise.all(userFetches).then(docs => {
      const userMap = {};
      docs.forEach(doc => userMap[doc.id] = doc.data());
      setUsersById(userMap);
    });
  }, [chats]);

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
      {chats.map(chat => {
        const participants =
          chat.participantIds
            .filter(id => id !== user.uid)
            .map(id => usersById[id] ? usersById[id].displayName : '-')
            .join(', ');
        return (
          <div className="chat-summary-box" key={chat.id}>
            <div><Link to={`/chat/${chat.id}`}>{chat.id}</Link></div>
            <div>Talking to: {participants || 'just you'}</div>
            <div>{chat.commentCount} comments</div>
            <div>
              created {format(chat.createdAt.toDate(), 'M/DD h:mma')}
            </div>
            <div>
              updated {format(chat.lastUpdated.toDate(), 'M/DD h:mma')}
            </div>
          </div>
        );
      }
      )}
      <button onClick={createChat}>Start New Chat</button>
    </div>
  );
};

export default ChatList;
