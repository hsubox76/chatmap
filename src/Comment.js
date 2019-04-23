import React, { useEffect, useCallback, useState } from "react";
import Reply from "./Reply";
import {format} from 'date-fns';

const Comment = ({
  comment,
  commentId,
  user,
  chatId,
  author,
  width = 1,
  offset = 0,
  setReply,
  setLineData
}) => {
  const [box, setBox] = useState();
  const [container, setContainer] = useState();

  // Outer container style (dimensions & position)
  const style = {
    width: width,
  };
  if (offset) {
    style.marginLeft = offset;
  }

  // Reply button handler
  function handleReplyClick(e) {
    e.preventDefault();
    setReply(commentId);
  }

  const boxClasses = ['comment-box'];
  const boxRef = useCallback(node => {
    if (node) {
      setBox(node.getBoundingClientRect());
    }
  }, [comment])
  const containerRef = useCallback(node => {
    if (node) {
      setContainer(node.getBoundingClientRect());
    }
  }, [comment])

  useEffect(() => {
    if (!box || !container) return;
    if (commentId === 'new') console.log('container');
    setLineData(commentId, {
      topDot: {
        x: container.left + container.width / 2,
        y: container.top + 10
      },
      bottomDot: {
        x: container.left + container.width / 2,
        y: container.top + box.height + 10
      },
    });
  }, [box, container]);

  // Varying inner contents
  let innards = null;
  if (commentId === 'new') {
    boxClasses.push('comment-reply-box');
    innards = (
      <div>
        <div className="comment-author">{user.displayName}</div>
        <Reply
          parentId={comment.parent}
          user={user}
          chatId={chatId}
          closeReplyBox={() => setReply(null)} />
      </div>
    );
  } else {
    const authorClasses = ['comment-author'];
    if (user.uid === author.uid) authorClasses.push('is-me')
    innards = (
      <div>
        <div className="comment-header">
          <div className={authorClasses.join(' ')}>
            {author ? author.displayName : "-"}
          </div>
          <div className="comment-meta">
            {format(comment.createdAt.toDate(), 'M/DD h:mma')}
          </div>
        </div>
        <div className="comment-content">{comment.content}</div>
        <div className="comment-footer">
          <button onClick={handleReplyClick}>Reply</button>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-container" key={commentId} style={style} ref={containerRef}>
      <div className={boxClasses.join(' ')} ref={boxRef}>
        { innards }
      </div>
    </div>
  );
};

export default Comment;
