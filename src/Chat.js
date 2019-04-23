import React, { useState, useEffect, useMemo, useReducer } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import Comment from "./Comment";
import Reply from "./Reply";
import "./Chat.css";
import { useWindowWidth, generateCommentTree } from './ChatHooks';

const MIN_COMMENT_WIDTH = 250;
const MAX_COMMENT_WIDTH = 400; // (Max base width)
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

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return Object.assign({}, state, { [action.commentId]: action.commentLinesData });
    default:
      throw new Error('what');
  }
}

const Chat = ({ user, chatId }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [chatData, setChatData] = useState();
  const [comments, setComments] = useState();
  const [users, setUsers] = useState({});
  const [replyState, setReplyState] = useState();
  const [lines, dispatch] = useReducer(reducer, {});

  const windowWidth = useWindowWidth() - 15;

  const commentTree = useMemo(
    () => generateCommentTree(comments, chatData, replyState),
    [comments, chatData, replyState]
  );

  function handleSetReply(parentId) {
    if (parentId) {
      setReplyState({ parentId });
    } else {
      setReplyState(null);
    }
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
    if (!chatData) return;

    if (!chatData.head) {
      setIsLoaded(true);
      return;
    }

    getComment(chatData.head).then(results => {
      const commentMap = {};
      results.forEach(result => {
        commentMap[result.id] = result;
      });
      setIsLoaded(true);
      setComments(commentMap);
    });
  }, [chatData]);

  useEffect(() => {
    if (!chatData) return;
    const idsToGet = chatData.participantIds.filter(id => !Object.keys(users).includes(id));
    const userFetches =
      idsToGet
        .map(id => firebase.firestore().collection("users").doc(id).get());
    Promise.all(userFetches).then(docs => {
      const userMap = {};
      docs.forEach(doc => userMap[doc.id] = Object.assign(doc.data(), { uid: doc.id} ));
      setUsers(userMap);
    });
  }, [chatData]);

  // Get comment and chat area widths based on window width.
  let baseCommentWidth = commentTree
    ? Math.max(MIN_COMMENT_WIDTH, windowWidth / commentTree.maxWidth)
    : MIN_COMMENT_WIDTH;

  if (baseCommentWidth > MAX_COMMENT_WIDTH) {
    baseCommentWidth = MAX_COMMENT_WIDTH;
  }

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
          setReply={handleSetReply}
          setLineData={(commentId, commentLinesData) => dispatch({ type: 'add', commentId, commentLinesData })}
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

  function renderLines() {
    if (!commentTree || !lines || Object.keys(lines).length === 0) return;
    return commentTree.connections.map(connection => {
      // child is a reply node?
      if (!lines[connection[1]]) return null;
      const from = lines[connection[0]].bottomDot;
      const to = lines[connection[1]].topDot;
      const width = from.x === to.x ? 4 : Math.abs(from.x - to.x);
      const height = to.y - from.y;
      const left = from.x === to.x ? from.x - 2 : Math.min(from.x, to.x);
      const style = {
        position: 'absolute',
        top: from.y - 32,
        left,
        height,
        width
      };
      let x1, x2;
      if (from.x - to.x > 0) {
        x1 = from.x - to.x;
        x2 = 0;
      } else if (from.x - to.x < 0) {
        x1 = 0;
        x2 = to.x - from.x;
      } else {
        x1 = x2 = 2;
      }
      return (
        <svg style={style} key={connection[0] + '-' + connection[1]}>
          <line
            x1={x1}
            y1={0}
            x2={x2}
            y2={to.y - from.y}
            stroke="#333"
            strokeWidth={2}
          />
        </svg>
      );
    });
  }

  return (
    <div className="chat-container">
      <div className="chat-area" style={{ width: chatAreaWidth }}>
        {!isLoaded && <div>LOADING</div>}
        {commentTree && renderCommentTree()}
        {lines && renderLines()}
        {isLoaded && !comments && <Reply chatId={chatId} user={user} />}
      </div>
    </div>
  );
};

export default Chat;
