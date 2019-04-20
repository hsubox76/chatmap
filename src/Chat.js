import React, { useState, useEffect, useMemo } from "react";
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
  const [replyState, setReplyState] = useState();

  const commentTree = useMemo(() => {
    if (!comments || !chatData) return;
    const queue = [];
    const rows = [];
    const widths = {};
    const starts = {};
    const offsets = {};
    let counter = 200;
    let depth = 0;

    let tempComments = Object.assign({}, comments);
    if (replyState) {
      tempComments['new'] = { id: 'new', parent: replyState.parentId };
      console.log(tempComments[replyState.parentId]);
      if (!tempComments[replyState.parentId].replies) {
        tempComments[replyState.parentId].replies = [];
      }
      tempComments[replyState.parentId].replies.push('new');
    }
    const head = tempComments[chatData.head];
    queue.push(head);
    queue.push(null);

    // build rows with breadth first traversal
    while (queue.length > 1 && counter > 0) {
      counter--;
      const current = queue.shift();
      if (!current) {
        depth++;
        queue.push(null);
        continue;
      }
      widths[current.id] = 0;
      if (!rows[depth]) rows[depth] = [];
      rows[depth].push(Object.assign({}, current, { depth }));
      // if (replyState && current.id === replyState.parentId) {
      //   // reply dummy
      //   queue.push({
      //     id: 'new'
      //   });
      // }
      if (current.replies && current.replies.length) {
        current.replies.forEach(replyId => {
          queue.push(tempComments[replyId]);
        });
      }
    }

    console.log(rows);

    // calculate widths from bottom up
    for (let row = rows.length - 1; row >= 0; row--) {
      rows[row].forEach(comment => {
        widths[comment.id] = 0;
        if (!comment.replies || !comment.replies.length) {
          widths[comment.id] = 1;
        } else {
          comment.replies.forEach(replyId => {
            widths[comment.id] += widths[replyId];
          });
        }
        // if (replyState && comment.id === replyState.parentId) {
        //   widths[comment.id] += 1;
        // }
      });
    }

    // calculate starts from top down
    rows.forEach(row => {
      let start = 0;
      let parentStart = 0;
      let parent = null;
      let widthSoFar = 0;
      row.forEach(comment => {
        if (parent !== comment.parent) {
          parent = comment.parent;
          parentStart = starts[parent] ? starts[parent] : 0;
          start = 0;
        }
        starts[comment.id] = start + parentStart;
        offsets[comment.id] = starts[comment.id] - widthSoFar;
        console.log(comment.id, 'start', starts[comment.id], 'offset', offsets[comment.id], 'wsf', widthSoFar)
        start += widths[comment.id];
        widthSoFar += widths[comment.id];
      });
    });

    console.log(widths);

    return {rows, widths, starts, offsets};
  }, [comments, replyState]);

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

  function renderCommentTree() {
    const {rows, widths, starts, offsets} = commentTree;
    return rows.map((row, index) => {
      return <div className="comment-row" key={index}>{row.map(comment => <Comment
        key={comment.id}
        width={widths[comment.id]}
        start={starts[comment.id]}
        offset={offsets[comment.id]}
        comment={comment}
        commentId={comment.id}
        chatId={chatId}
        author={users[comment.authorId]}
        user={user}
        onOpenReply={handleOpenReply}
        />)}</div>
    });
  }

  return (
    <div className="chat-container">
      {commentTree && renderCommentTree()}
      {!comments && <Reply chatId={chatId} user={user} />}
    </div>
  );
};

export default Chat;
