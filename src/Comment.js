import React from "react";
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
  onOpenReply
}) => {
  // Outer container style (dimensions & position)
  const style = {
    width: width
  };
  if (offset) {
    style.marginLeft = offset;
  }

  // Reply button handler
  function handleReplyClick(e) {
    e.preventDefault();
    onOpenReply(commentId);
  }

  // Varying inner contents
  let innards = null;
  if (commentId === 'new') {
    innards = (
      <div>
        <div>{user.displayName}</div>
        <Reply parentId={comment.parent} user={user} chatId={chatId} />
      </div>
    );
  } else {
    innards = (
      <div>
        <div>{author ? author.displayName : "-"}: {comment.content}</div>
        <div>created at {format(comment.createdAt.toDate(), 'MM/DD/YYYY h:mm a')}</div>
        <button onClick={handleReplyClick}>Reply</button>
      </div>
    );
  }

  return (
    <div className="comment-container" key={commentId} style={style}>
      <div className="comment-box">
        { innards }
        { !comment.isHead && <div className="connector-line" style={{ left: width / 2 }}></div> }
      </div>
    </div>
  );
};

export default Comment;
