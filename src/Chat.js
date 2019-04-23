import React, { useState, useEffect, useMemo } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import Comment from "./Comment";
import Reply from "./Reply";
import { useWindowWidth, generateCommentTree } from './ChatHooks';

const MIN_COMMENT_WIDTH = 250;
const MIN_CHAT_AREA_WIDTH = 600;

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
  const [replyState, setReplyState] = useState();

  const windowWidth = useWindowWidth();

  const commentTree = useMemo(
    () => generateCommentTree(comments, chatData, replyState),
    [comments, chatData, replyState]
  );

  function handleOpenReply(parentId) {
    setReplyState({ parentId });
  }

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

  // Get comment and chat area widths based on window width.
  const baseCommentWidth = commentTree
    ? Math.max(MIN_COMMENT_WIDTH, windowWidth / commentTree.maxWidth)
    : MIN_COMMENT_WIDTH;

  const chatAreaWidth = commentTree
    ? commentTree.maxWidth * baseCommentWidth
    : MIN_CHAT_AREA_WIDTH;

  function renderRow(row, baseCommentWidth) {
    return row.map(comment => (
      <Comment
          key={comment.id}
          width={baseCommentWidth * comment.width}
          start={comment.startPos}
          offset={baseCommentWidth * comment.offset}
          comment={comment}
          commentId={comment.id}
          chatId={chatId}
          author={users[comment.authorId]}
          user={user}
          onOpenReply={handleOpenReply}
          />

    ));
  }

  function renderCommentTree() {
    return commentTree.rows.map((row, index) => {
      return (
        <div className="comment-row" key={index}>
          {renderRow(row, baseCommentWidth)}
        </div>
        );
    });
  }

  return (
    <div className="chat-container">
      <div className="chat-area" style={{ width: chatAreaWidth }}>
        {commentTree && renderCommentTree()}
        {!comments && <Reply chatId={chatId} user={user} />}
      </div>
    </div>
  );
};

export default Chat;
