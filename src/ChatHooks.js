import { useState, useEffect } from "react";

export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  return width;
}

export function generateCommentTree(comments, chatData, replyState) {
  console.log('generateCommentTree');
  if (!comments || !chatData) return;
  const queue = [];
  const rows = [];
  let counter = 200;
  let depth = 0;

  let treeLookup = {};
  let connections = [];

  // Deep copy a comment tree and fill out ID string "children" with nodes
  function copyTree(node) {
    let newNode = Object.assign({}, node);
    treeLookup[node.id] = newNode;
    if (node.replies) {
      newNode.children = [];
      node.replies.forEach(replyId => {
        connections.push([node.id, replyId]);
        newNode.children.push(copyTree(comments[replyId]));
      });
      newNode.replies = undefined;
    }
    return newNode;
  }

  let tree = copyTree(comments[chatData.head]);

  // Add reply placeholder comment box if needed.
  if (replyState) {
    let newId = "new";
    treeLookup[newId] = { id: newId, parent: replyState.parentId };
    if (!treeLookup[replyState.parentId].children) {
      treeLookup[replyState.parentId].children = [];
    }
    connections.push([replyState.parentId, newId]);
    treeLookup[replyState.parentId].children.push(treeLookup[newId]);
  }

  // Build rows with breadth first traversal
  queue.push(tree);
  queue.push(null);
  while (queue.length > 1 && counter > 0) {
    counter--;
    const current = queue.shift();
    if (!current) {
      depth++;
      // Use null to mark ends of rows.
      queue.push(null);
      continue;
    }
    current.width = 0;
    if (!rows[depth]) rows[depth] = [];
    current.depth = depth;
    rows[depth].push(current);
    if (current.children && current.children.length) {
      current.children.forEach(child => {
        queue.push(child);
      });
    }
  }

  // Calculate widths from bottom up
  for (let row = rows.length - 1; row >= 0; row--) {
    rows[row].forEach(comment => {
      comment.width = 0;
      if (!comment.children || !comment.children.length) {
        comment.width = 1;
      } else {
        comment.children.forEach(child => {
          comment.width += child.width;
        });
      }
    });
  }

  // Use known widths to calculate start positions (depth first)
  function propagateStartPositions(node, startPos = 0) {
    node.startPos = startPos;
    if (!node.children) return;
    node.children.forEach(child => {
      propagateStartPositions(child, startPos);
      startPos += child.width;
    });
  }
  propagateStartPositions(tree);

  let maxWidth = 0;

  // Get offsets based on start positions.
  rows.forEach(function doOffsets(row) {
    let pos = 0;
    row.forEach(comment => {
      comment.offset = comment.startPos - pos;
      pos += comment.width + comment.offset;
    });
    if (pos > maxWidth) {
      maxWidth = pos;
    }
  });

  return { rows, maxWidth, connections };
}
