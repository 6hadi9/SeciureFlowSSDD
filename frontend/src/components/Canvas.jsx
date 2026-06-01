import React, { useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

const Canvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
  onSelectNode,
  onSelectEdge,
}) => {
  const handleNodeClick = useCallback(
    (_, node) => onSelectNode(node),
    [onSelectNode]
  );

  const handleEdgeClick = useCallback(
    (_, edge) => onSelectEdge(edge),
    [onSelectEdge]
  );

  return (
    <div className="canvas" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background gap={18} size={1} />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
