import React, { useRef } from "react";
import firebase from "firebase/app";
import "firebase/firestore";

const Reply = ({ parentId, user, chatId, closeReplyBox = () => {} }) => {
  const inputRef = useRef();

  function addComment(e) {
    e.preventDefault();
    // TODO: ADD LOADING INDICATOR ON, DISABLE BUTTON, USE STATE PROBABLY
    inputRef.current.disabled = true;
    firebase
      .firestore()
      .collection("comments")
      .add({
        content: inputRef.current.value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        parent: parentId || chatId,
        authorId: user.uid,
        isHead: !parentId
      })
      .then(docRef => {
        // Update parent and/or top-level chat info.
        const downstreamPromises = [];
        // Update chat top-level info
        const chatUpdates = {
          commentCount: firebase.firestore.FieldValue.increment(1),
          participantIds: firebase.firestore.FieldValue.arrayUnion(user.uid),
          commentIds: firebase.firestore.FieldValue.arrayUnion(docRef.id),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        // If parent is another comment, update that comment.
        if (parentId) {
          const updateParent = firebase
            .firestore()
            .collection("comments")
            .doc(parentId)
            .update({
              replies: firebase.firestore.FieldValue.arrayUnion(docRef.id)
            });
          downstreamPromises.push(updateParent);
        } else {
          // Otherwise add a head field to the pending chatUpdates
          chatUpdates.head = docRef.id;
        }
        const updateChat = firebase
          .firestore()
          .collection("chats")
          .doc(chatId)
          .update(chatUpdates);
        downstreamPromises.push(updateChat);
        return Promise.all(downstreamPromises);
      })
      .then(() => {
        closeReplyBox();
      })
      .catch(e => console.error(e))
      .finally(() => {
        // TODO: ADD LOADING INDICATOR OFF
      });
  }

  return (
    <form className="reply-container" onSubmit={addComment}>
      <textarea
        className="comment-text"
        placeholder="say something"
        ref={inputRef}
      />
      <div className="button-container">
        <button>submit</button>
        <button type="button" onClick={closeReplyBox}>
          cancel
        </button>
      </div>
    </form>
  );
};

export default Reply;
