import React, { useEffect, useRef } from "react";
import Reply from "./Reply";
import { format } from "date-fns";

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

  const boxClasses = ["comment-box"];
  const boxRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!boxRef.current || !containerRef.current) return;
    const box = boxRef.current.getBoundingClientRect();
    const container = containerRef.current.getBoundingClientRect();
    setLineData(commentId, {
      topDot: {
        x: container.left + container.width / 2,
        y: container.top + 10
      },
      bottomDot: {
        x: container.left + container.width / 2,
        y: container.top + box.height + 10
      }
    });
  }, [boxRef, containerRef, commentId, setLineData]);

  // Varying inner contents
  let innards = null;
  if (commentId === "new") {
    boxClasses.push("comment-reply-box");
    innards = (
      <div>
        <div className="comment-author">{user.displayName}</div>
        <Reply
          parentId={comment.parent}
          user={user}
          chatId={chatId}
          closeReplyBox={() => setReply(null)}
        />
      </div>
    );
  } else {
    const authorClasses = ["comment-author"];
    if (user && user.uid === comment.authorId) boxClasses.push("is-me");
    innards = (
      <div>
        <div className="comment-header">
          <div className={authorClasses.join(" ")}>
            {author ? author.displayName : "-"}
          </div>
          <div className="comment-meta">
            {format(comment.createdAt.toDate(), "M/DD h:mma")}
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
    <div
      className="comment-container"
      key={commentId}
      style={style}
      ref={containerRef}
    >
      <div className={boxClasses.join(" ")} ref={boxRef}>
        {innards}
      </div>
    </div>
  );
};

export default Comment;
