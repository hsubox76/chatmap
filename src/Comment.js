import React from "react";
import Reply from "./Reply";
import {format} from 'date-fns';

const WIDTH = 250;
const MARGIN = 5;

const Comment = ({ comment, commentId, user, chatId, author, width = 1, start = 0, offset = 0, onOpenReply }) => {
  const pixelWidth = WIDTH * width + (MARGIN * 2 * (width - 1));
  const pixelOffset = WIDTH * offset + (MARGIN * 2 * offset) + MARGIN;
  const style = {
    width: pixelWidth
  };
  if (offset) {
    style.marginLeft = pixelOffset;
  }
  function handleReplyClick(e) {
    e.preventDefault();
    onOpenReply(commentId);
  }
  if (commentId === 'new') {
    return (
      <div className="comment-container" key={commentId} style={style}>
        <div>{comment.content || ''}</div>
        <Reply parentId={commentId} user={user} chatId={chatId} />
        { !comment.isHead && <div className="connector-line" style={{ left: pixelWidth / 2 }}></div> }
        <div>{start} {offset}</div>
      </div>
    );
  }
  return (
    <div className="comment-container" key={commentId} style={style}>
      <div>{author ? author.displayName : "-"}: {comment.content}</div>
      <div>created at {format(comment.createdAt.toDate(), 'MM/DD/YYYY h:mm a')}</div>
      <button onClick={handleReplyClick}>Reply</button>
        <div>{start} {offset}</div>
      { !comment.isHead && <div className="connector-line" style={{ left: pixelWidth / 2 }}></div> }
    </div>
  );
};

export default Comment;
