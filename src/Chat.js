import React, { useState, useEffect } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import Comment from "./Comment";
import Reply from "./Reply";

function getComment(id) {
  return firebase
    .firestore()
    .collection("comments")
    .doc(id)
    .get()
    .then(snap => {
      if (snap) {
        let replyPromises = [Promise.resolve(Object.assign(snap.data(), { id: snap.id }))];
        if (snap.data().replies) {
          const childPromises = snap.data().replies.map(replyId => getComment(replyId))
          replyPromises = replyPromises.concat(childPromises);
        }
        return Promise.all(replyPromises).then(results => {
          return results.flat();
        });
      }
    });
}

const Chat = ({ user, chatId }) => {
  const [chatData, setChatData] = useState();
  const [comments, setComments] = useState();
  const [users, setUsers] = useState({});

  // get top level chat data
  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection("chats")
      .doc(chatId)
      .onSnapshot(snap => {
        if (snap) {
          setChatData(snap.data());
        }
      });
    return unsub;
  }, [chatId]);

  // get comments recursively
  useEffect(() => {
    if (!chatData || !chatData.head) return;

    getComment(chatData.head).then(results => {
      const commentMap = {};
      results.forEach(result => {
        commentMap[result.id] = result;
      });
      setComments(commentMap);
    });
  }, [chatData]);

  // get users based on ids in top level chat data
  useEffect(() => {
    if (!chatData) return;
    let unsubs = [];
    chatData.participantIds.forEach(userId => {
      unsubs.push(
        firebase
          .firestore()
          .collection("users")
          .doc(userId)
          .onSnapshot(snap => {
            if (snap) {
              setUsers(Object.assign({}, users, { [userId]: snap.data() }));
            }
          })
      );
    });
    return () => unsubs.forEach(unsub => unsub());
  }, [chatData]);

  return (
    <div className="chat-container">
      {comments &&
        Object.keys(comments).map((key) => (
          <Comment
            key={key}
            comment={comments[key]}
            commentId={key}
            chatId={chatId}
            author={users[comments[key].authorId]}
            user={user}
            />
        ))}
      {!comments && <Reply chatId={chatId} user={user} />}
    </div>
  );
};

export default Chat;
