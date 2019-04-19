import React from "react";
import Reply from "./Reply";
import {format} from 'date-fns';

const Comment = ({ comment, commentId, author, user, chatId }) => {
  return (
    <div className="comment-container" key={commentId}>
      <div>{author ? author.displayName : "-"}: {comment.content}</div>
      <div>created at {format(comment.createdAt.toDate(), 'MM/DD/YYYY h:mm a')}</div>
      <Reply parentId={commentId} user={user} chatId={chatId} />
    </div>
  );
};

export default Comment;
