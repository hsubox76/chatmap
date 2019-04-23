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
  setReply
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
    setReply(commentId);
  }

  const boxClasses = ['comment-box'];

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
    innards = (
      <div>
        <div className="comment-header">
          <div className="comment-author">
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
    <div className="comment-container" key={commentId} style={style}>
      <div className={boxClasses.join(' ')}>
        { innards }
        { !comment.isHead && <div className="connector-line" style={{ left: width / 2 }}></div> }
      </div>
    </div>
  );
};

export default Comment;
