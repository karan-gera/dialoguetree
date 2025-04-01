import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

function App() {
  const [dialogueData, setDialogueData] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newNodeText, setNewNodeText] = useState("");
  const [newNodeSpeaker, setNewNodeSpeaker] = useState("");
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [edgeLabel, setEdgeLabel] = useState("");

  const fetchDialogueData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching dialogue data...");
      const response = await fetch("http://localhost:3001/alessandro1.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Received dialogue data:", data);
      setDialogueData(data);
      createVisualization(data);
    } catch (error) {
      console.error("Error loading dialogue data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDialogueData();
  }, [fetchDialogueData]);

  const createVisualization = (data) => {
    if (!data || !data.start) {
      console.error("Invalid dialogue data structure:", data);
      setError("Invalid dialogue data structure");
      return;
    }

    const newNodes = [];
    const newEdges = [];
    let yOffset = 0;
    const processedNodes = new Set(); // Track processed nodes

    const processNode = (nodeId, nodeData, x = 0) => {
      if (!nodeData) {
        console.error(`Missing node data for ID: ${nodeId}`);
        return;
      }

      // Skip if we've already processed this node
      if (processedNodes.has(nodeId)) {
        return;
      }
      processedNodes.add(nodeId);

      // Create the dialogue node with saved position or default position
      const node = {
        id: nodeId,
        type: "dialogueNode",
        position: nodeData.position || { x, y: yOffset },
        data: {
          ...nodeData,
          label: nodeData.text,
        },
        style: {
          width: 300,
          padding: "20px",
          fontSize: "16px",
          lineHeight: "1.5",
        },
      };
      newNodes.push(node);

      // Process choices as edges
      if (nodeData.choices && Array.isArray(nodeData.choices)) {
        nodeData.choices.forEach((choice, index) => {
          if (!choice || !choice.text) {
            console.error(
              `Invalid choice at index ${index} for node ${nodeId}`
            );
            return;
          }

          if (choice.next && data[choice.next]) {
            // Create the next dialogue node if it doesn't exist
            const nextNodeId = choice.next;
            if (!processedNodes.has(nextNodeId)) {
              const nextNodeData = data[nextNodeId];
              const nextNode = {
                id: nextNodeId,
                type: "dialogueNode",
                position: nextNodeData.position || {
                  x: x + 400,
                  y: yOffset + index * 200,
                },
                data: {
                  ...nextNodeData,
                  label: nextNodeData.text,
                },
                style: {
                  width: 300,
                  padding: "20px",
                  fontSize: "16px",
                  lineHeight: "1.5",
                },
              };
              newNodes.push(nextNode);
            }

            // Create the edge with the choice text and arrow
            newEdges.push({
              id: `${nodeId}-${nextNodeId}`,
              source: nodeId,
              target: nextNodeId,
              label: choice.text,
              type: "straight",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#9c27b0",
                width: 20,
                height: 20,
              },
              style: { stroke: "#9c27b0", strokeWidth: 2 },
              labelStyle: {
                fill: "#9c27b0",
                fontSize: "14px",
                fontWeight: "bold",
                background: "white",
                padding: "4px 8px",
                borderRadius: "4px",
              },
            });

            // Process the next node
            processNode(nextNodeId, data[nextNodeId], x + 400);
          }
        });
      }

      yOffset += 200;
    };

    processNode("start", data.start);
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const onConnect = (params) => {
    const newEdge = {
      ...params,
      type: "straight",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#9c27b0",
        width: 20,
        height: 20,
      },
      style: { stroke: "#9c27b0", strokeWidth: 2 },
      labelStyle: {
        fill: "#9c27b0",
        fontSize: "14px",
        fontWeight: "bold",
        background: "white",
        padding: "4px 8px",
        borderRadius: "4px",
      },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  };

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    setIsEditing(true);
    setSelectedEdge(null);
  };

  const handleEdgeClick = (event, edge) => {
    setSelectedEdge(edge);
    setEdgeLabel(edge.label || "");
    setIsEditing(true);
    setSelectedNode(null);
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsEditing(false);
    setIsCreatingNode(false);
  };

  const handleSaveAll = async () => {
    try {
      const updatedData = { ...dialogueData };

      // Update dialogue data with current node states
      nodes.forEach((node) => {
        if (node.type === "dialogueNode") {
          // Update node content and position
          updatedData[node.id] = {
            ...updatedData[node.id],
            speaker: node.data.speaker,
            text: node.data.text,
            position: {
              x: node.position.x,
              y: node.position.y,
            },
          };

          // Find all edges where this node is the source
          const outgoingEdges = edges.filter((edge) => edge.source === node.id);

          // Update choices based on edges
          outgoingEdges.forEach((edge) => {
            const targetId = edge.target;
            const existingChoice = updatedData[node.id].choices?.find(
              (c) => c.next === targetId
            );

            if (existingChoice) {
              existingChoice.text = edge.label || "Continue";
            } else {
              if (!updatedData[node.id].choices) {
                updatedData[node.id].choices = [];
              }
              updatedData[node.id].choices.push({
                speaker: "Player",
                text: edge.label || "Continue",
                next: targetId,
              });
            }
          });
        }
      });

      const response = await fetch("http://localhost:3001/api/save-dialogue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setDialogueData(updatedData);
      }
    } catch (error) {
      console.error("Error saving dialogue:", error);
    }
  };

  const handleSave = async () => {
    if (selectedNode) {
      const updatedData = { ...dialogueData };
      const nodeId = selectedNode.id;

      if (selectedNode.type === "dialogueNode") {
        // Update node content
        updatedData[nodeId] = {
          ...updatedData[nodeId],
          speaker: selectedNode.data.speaker,
          text: selectedNode.data.text,
        };

        // Update choices based on edges
        const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
        outgoingEdges.forEach((edge) => {
          const targetId = edge.target;
          const existingChoice = updatedData[nodeId].choices?.find(
            (c) => c.next === targetId
          );

          if (existingChoice) {
            existingChoice.text = edge.label || "Continue";
          } else {
            if (!updatedData[nodeId].choices) {
              updatedData[nodeId].choices = [];
            }
            updatedData[nodeId].choices.push({
              speaker: "Player",
              text: edge.label || "Continue",
              next: targetId,
            });
          }
        });
      }

      try {
        const response = await fetch(
          "http://localhost:3001/api/save-dialogue",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedData),
          }
        );

        if (response.ok) {
          setDialogueData(updatedData);
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Error saving dialogue:", error);
      }
    } else if (selectedEdge) {
      // Update the edge label
      setEdges((eds) =>
        eds.map((ed) => {
          if (ed.id === selectedEdge.id) {
            return { ...ed, label: edgeLabel };
          }
          return ed;
        })
      );

      // Update the corresponding choice in the dialogue data
      const updatedData = { ...dialogueData };
      const [sourceId, targetId] = selectedEdge.id.split("-");
      if (updatedData[sourceId] && updatedData[sourceId].choices) {
        const existingChoice = updatedData[sourceId].choices.find(
          (c) => c.next === targetId
        );
        if (existingChoice) {
          existingChoice.text = edgeLabel;
        }
      }

      try {
        const response = await fetch(
          "http://localhost:3001/api/save-dialogue",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedData),
          }
        );

        if (response.ok) {
          setDialogueData(updatedData);
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Error saving dialogue:", error);
      }
    }
  };

  const handleNodeChange = (changes) => {
    onNodesChange(changes);
  };

  const handleEdgeChange = (changes) => {
    onEdgesChange(changes);
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;

    // Remove all edges connected to this node
    const updatedEdges = edges.filter(
      (edge) =>
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
    );

    // Remove the node
    const updatedNodes = nodes.filter((node) => node.id !== selectedNode.id);

    // Update the dialogue data
    const updatedData = { ...dialogueData };
    delete updatedData[selectedNode.id];

    // Remove any choices that point to this node
    Object.keys(updatedData).forEach((nodeId) => {
      if (updatedData[nodeId].choices) {
        updatedData[nodeId].choices = updatedData[nodeId].choices.filter(
          (choice) => choice.next !== selectedNode.id
        );
      }
    });

    try {
      const response = await fetch("http://localhost:3001/api/save-dialogue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setDialogueData(updatedData);
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        setSelectedNode(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  };

  const handleDeleteEdge = async () => {
    if (!selectedEdge) return;

    // Remove the edge
    const updatedEdges = edges.filter((edge) => edge.id !== selectedEdge.id);

    // Update the dialogue data
    const updatedData = { ...dialogueData };
    const [sourceId, targetId] = selectedEdge.id.split("-");

    if (updatedData[sourceId] && updatedData[sourceId].choices) {
      updatedData[sourceId].choices = updatedData[sourceId].choices.filter(
        (choice) => choice.next !== targetId
      );
    }

    try {
      const response = await fetch("http://localhost:3001/api/save-dialogue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setDialogueData(updatedData);
        setEdges(updatedEdges);
        setSelectedEdge(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error deleting edge:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading">Loading dialogue tree...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">
          Error loading dialogue tree: {error}
          <button onClick={fetchDialogueData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div style={{ width: "100vw", height: "100vh" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodeChange}
          onEdgesChange={handleEdgeChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <Panel position="top-left">
            <button
              onClick={handleSaveAll}
              className="save-button"
              style={{
                marginRight: "10px",
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
            {selectedNode && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsCreatingNode(true);
                }}
                className="add-node-button"
              >
                Add Connected Node
              </button>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {isCreatingNode && selectedNode && (
        <div className="edit-panel">
          <h3>Create Connected Node</h3>
          <div>
            <label>Speaker:</label>
            <input
              type="text"
              value={newNodeSpeaker}
              onChange={(e) => setNewNodeSpeaker(e.target.value)}
              placeholder="Enter speaker name"
            />
          </div>
          <div>
            <label>Text:</label>
            <textarea
              value={newNodeText}
              onChange={(e) => setNewNodeText(e.target.value)}
              placeholder="Enter dialogue text"
            />
          </div>
          <div>
            <label>Choice Text:</label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              placeholder="Enter choice text"
            />
          </div>
          <button
            onClick={() => {
              if (!newNodeText.trim()) return;

              const newNodeId = `node_${Date.now()}`;
              const newNode = {
                id: newNodeId,
                type: "dialogueNode",
                position: {
                  x: selectedNode.position.x + 400,
                  y: selectedNode.position.y + 200,
                },
                data: {
                  text: newNodeText,
                  speaker: newNodeSpeaker,
                  label: newNodeText,
                },
                style: {
                  width: 300,
                  padding: "20px",
                  fontSize: "16px",
                  lineHeight: "1.5",
                },
              };

              const newEdge = {
                id: `${selectedNode.id}-${newNodeId}`,
                source: selectedNode.id,
                target: newNodeId,
                label: edgeLabel || "Continue",
                type: "straight",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: "#9c27b0",
                  width: 20,
                  height: 20,
                },
                style: { stroke: "#9c27b0", strokeWidth: 2 },
                labelStyle: {
                  fill: "#9c27b0",
                  fontSize: "14px",
                  fontWeight: "bold",
                  background: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                },
              };

              const updatedData = { ...dialogueData };
              updatedData[newNodeId] = {
                speaker: newNodeSpeaker,
                text: newNodeText,
                choices: [],
              };

              // Add the choice to the source node
              if (!updatedData[selectedNode.id].choices) {
                updatedData[selectedNode.id].choices = [];
              }
              updatedData[selectedNode.id].choices.push({
                speaker: "Player",
                text: edgeLabel || "Continue",
                next: newNodeId,
              });

              setDialogueData(updatedData);
              setNodes((nds) => [...nds, newNode]);
              setEdges((eds) => [...eds, newEdge]);
              setNewNodeText("");
              setNewNodeSpeaker("");
              setEdgeLabel("");
              setIsCreatingNode(false);
            }}
          >
            Create Node
          </button>
          <button
            onClick={() => {
              setIsCreatingNode(false);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {isEditing && selectedNode && (
        <div className="edit-panel">
          <h3>Edit Node</h3>
          <div>
            <label>Node ID:</label>
            <input
              type="text"
              value={selectedNode.id}
              disabled
              style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
            />
          </div>
          <div>
            <label>Speaker:</label>
            <input
              type="text"
              value={selectedNode.data.speaker || ""}
              onChange={(e) => {
                setSelectedNode({
                  ...selectedNode,
                  data: { ...selectedNode.data, speaker: e.target.value },
                });
              }}
            />
          </div>
          <div>
            <label>Text:</label>
            <textarea
              value={selectedNode.data.text || ""}
              onChange={(e) => {
                setSelectedNode({
                  ...selectedNode,
                  data: { ...selectedNode.data, text: e.target.value },
                });
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave}>Save Changes</button>
            <button
              onClick={handleDeleteNode}
              style={{ backgroundColor: "#dc3545" }}
            >
              Delete Node
            </button>
          </div>
        </div>
      )}

      {isEditing && selectedEdge && (
        <div className="edit-panel">
          <h3>Edit Connection</h3>
          <div>
            <label>Choice Text:</label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => {
                setEdgeLabel(e.target.value);
              }}
              placeholder="Enter choice text"
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave}>Save Changes</button>
            <button
              onClick={handleDeleteEdge}
              style={{ backgroundColor: "#dc3545" }}
            >
              Delete Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
