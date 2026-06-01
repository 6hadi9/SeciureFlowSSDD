import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNodesState, useEdgesState } from "reactflow";
import { io } from "socket.io-client";
import LeftPanel from "./components/LeftPanel.jsx";
import RightPanel from "./components/RightPanel.jsx";
import Toolbar from "./components/Toolbar.jsx";
import Canvas from "./components/Canvas.jsx";
import AuthDialog from "./components/AuthDialog.jsx";
import SecurityScoreCard from "./components/SecurityScoreCard.jsx";
import AttackPathsPanel from "./components/AttackPathsPanel.jsx";
import RecommendationsPanel from "./components/RecommendationsPanel.jsx";
import StrideDashboard from "./components/StrideDashboard.jsx";
import AttackTimeline from "./components/AttackTimeline.jsx";
import {
  analyze,
  createProject,
  getInsights,
  listProjects,
  listTemplates,
  login,
  register,
  updateProject,
} from "./services/api.js";
import { createEdge, createNode, hydrateEdge, hydrateNode } from "./utils/diagram.js";
import { exportPdf } from "./utils/pdf.js";

const DEFAULT_PROJECT = "SecureFlow Project";

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);
  const [threats, setThreats] = useState([]);
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT);
  const [projectId, setProjectId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [score, setScore] = useState(null);
  const [attackPaths, setAttackPaths] = useState([]);
  const [attackTimeline, setAttackTimeline] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("sf_token"));
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const socketRef = useRef(null);
  const clientId = useMemo(() => crypto.randomUUID(), []);

  const threatByEdge = useMemo(() => {
    return threats.reduce((acc, threat) => {
      if (!acc[threat.edgeId]) acc[threat.edgeId] = [];
      acc[threat.edgeId].push(threat);
      return acc;
    }, {});
  }, [threats]);

  useEffect(() => {
    if (!token) return;
    listTemplates()
      .then((response) => setTemplates(response.data.items || []))
      .catch(() => setTemplates([]));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { room: projectId || "default" });
    });

    socket.on("update", (payload) => {
      if (!payload || payload.clientId === clientId) return;
      if (payload.nodes) setNodes(payload.nodes);
      if (payload.edges) setEdges(payload.edges);
      if (payload.projectName) setProjectName(payload.projectName);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, projectId, clientId, setNodes, setEdges]);

  const onConnect = (params) => {
    const edge = createEdge(params.source, params.target);
    setEdges((eds) => [...eds, edge]);
    setSelected({ kind: "edge", id: edge.id, data: edge.data });
  };

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/secureflow");
    if (!type) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left - 80,
      y: event.clientY - bounds.top - 24,
    };
    const node = createNode(type, position);
    setNodes((nds) => [...nds, node]);
  };

  const getNextPosition = () => {
    const index = nodes.length;
    return {
      x: 120 + (index % 4) * 220,
      y: 80 + Math.floor(index / 4) * 160,
    };
  };

  const handleAddComponent = (type) => {
    const node = createNode(type, getNextPosition());
    setNodes((nds) => [...nds, node]);
    setSelected({ kind: "node", id: node.id, data: node.data });
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const updateSelected = (field, value) => {
    if (!selected) return;
    if (selected.kind === "node") {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selected.id
            ? { ...node, data: { ...node.data, [field]: value } }
            : node
        )
      );
      setSelected((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: value },
      }));
    }

    if (selected.kind === "edge") {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selected.id
            ? { ...edge, data: { ...edge.data, [field]: value } }
            : edge
        )
      );
      setSelected((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: value },
      }));
    }
  };

  const runAnalysis = async () => {
    try {
      const response = await analyze({ nodes, edges });
      const nextThreats = response.data.threats || [];
      setThreats(nextThreats);

      try {
        const insights = await getInsights({ nodes, edges, threats: nextThreats });
        const data = insights?.data || {};
        setScore(data.score || null);
        setAttackPaths(data.attackPaths || []);
        setRecommendations(data.recommendations || null);
        setAttackTimeline(data.attackTimeline || []);
      } catch (_error) {
        setScore(null);
        setAttackPaths([]);
        setRecommendations(null);
        setAttackTimeline([]);
      }
    } catch (_error) {
      setThreats([]);
    }
  };

  useEffect(() => {
    if (!edges.length) {
      setThreats([]);
      return;
    }
    runAnalysis();
  }, [edges, nodes.length]);

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    const timeout = setTimeout(() => {
      socket.emit("update", {
        room: projectId || "default",
        clientId,
        nodes,
        edges,
        projectName,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [nodes, edges, projectName, projectId, clientId]);

  const edgeThreatMap = useMemo(() => {
    return edges.reduce((acc, edge) => {
      acc[edge.id] = threatByEdge[edge.id] || [];
      return acc;
    }, {});
  }, [edges, threatByEdge]);

  const nodesWithRisk = nodes.map((node) => {
    const relatedEdges = edges.filter(
      (edge) => edge.source === node.id || edge.target === node.id
    );
    const severityScore = relatedEdges.reduce((total, edge) => {
      const threatsForEdge = edgeThreatMap[edge.id] || [];
      return (
        total +
        threatsForEdge.reduce((sum, threat) => {
          if (threat.severity === "High") return sum + 3;
          if (threat.severity === "Medium") return sum + 2;
          if (threat.severity === "Low") return sum + 1;
          return sum;
        }, 0)
      );
    }, 0);

    const trustLevel = node.data?.trustLevel || "Internal";
    const trustColors = {
      External: "#f2d7cf",
      DMZ: "#fff3d6",
      Internal: "#e8f6ef",
      Restricted: "#f1e8ff",
    };

    let heatColor = "#e8f6ef";
    if (severityScore >= 9) heatColor = "#f04438";
    else if (severityScore >= 6) heatColor = "#f79009";
    else if (severityScore >= 3) heatColor = "#f2c94c";

    return {
      ...node,
      style: {
        ...node.style,
        border: `2px solid ${trustColors[trustLevel] || "#e7ddd4"}`,
        background: heatColor,
      },
    };
  });

  const edgesWithRisk = edges.map((edge) => {
    const edgeThreats = threatByEdge[edge.id] || [];
    const hasHigh = edgeThreats.some((t) => t.severity === "High");
    const hasAny = edgeThreats.length > 0;
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);
    const boundaryCrossing =
      sourceNode?.data?.trustLevel !== targetNode?.data?.trustLevel;
    return {
      ...edge,
      style: {
        stroke: hasHigh
          ? "#f04438"
          : boundaryCrossing
          ? "#f2c94c"
          : hasAny
          ? "#f79009"
          : "#12b76a",
        strokeWidth: 2,
        strokeDasharray: boundaryCrossing ? "6 4" : "0",
      },
      label: edgeThreats.length ? `${edgeThreats.length}` : "",
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 10,
      labelStyle: {
        fill: "#1e1b18",
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: hasHigh ? "#f04438" : hasAny ? "#f79009" : "#12b76a",
        color: "#1e1b18",
      },
    };
  });

  const handleSave = () => {
    const payload = { name: projectName, nodes, edges, threats };
    const action = projectId ? updateProject(projectId, payload) : createProject(payload);
    action
      .then((response) => {
        setProjectId(response.data.project.id);
      })
      .catch(() => null);
  };

  const handleLoadProjects = () => {
    listProjects()
      .then((response) => {
        const first = response.data.items?.[0];
        if (!first) return;
        setProjectId(first.id);
        setProjectName(first.name);
        const loadedNodes = (first.nodes || []).map((node, index) =>
          hydrateNode(node, index)
        );
        const loadedEdges = (first.edges || []).map((edge) => hydrateEdge(edge));
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setThreats(first.threats || []);
      })
      .catch(() => null);
  };

  const handleExport = () => {
    exportPdf("export-area", `${projectName}.pdf`, {
      projectName,
      score,
      threats,
      attackPaths,
      recommendations,
    });
  };

  const handleAuthSubmit = async (payload) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const call = authMode === "login" ? login(payload) : register(payload);
      const response = await call;
      const newToken = response.data.token;
      localStorage.setItem("sf_token", newToken);
      setToken(newToken);
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Check the API server and try again.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sf_token");
    setToken(null);
  };

  const handleLoadTemplate = (template) => {
    setProjectId(null);
    setProjectName(template.name);
    const loadedNodes = (template.nodes || []).map((node, index) =>
      hydrateNode(node, index)
    );
    const loadedEdges = (template.edges || []).map((edge) => hydrateEdge(edge));
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setThreats([]);
  };

  const handleToggleLeft = () => {
    setLeftCollapsed((prev) => !prev);
    setFocusMode(false);
  };

  const handleToggleRight = () => {
    setRightCollapsed((prev) => !prev);
    setFocusMode(false);
  };

  const handleToggleFocus = () => {
    setFocusMode((prev) => {
      const next = !prev;
      setLeftCollapsed(next);
      setRightCollapsed(next);
      return next;
    });
  };

  if (!token) {
    return (
      <AuthDialog
        mode={authMode}
        onSubmit={handleAuthSubmit}
        onSwitch={() => setAuthMode(authMode === "login" ? "register" : "login")}
        error={authError}
        isSubmitting={authLoading}
      />
    );
  }

  return (
    <div className="app" id="export-area">
      <Toolbar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onAnalyze={runAnalysis}
        onSave={handleSave}
        onLoadProjects={handleLoadProjects}
        onExport={handleExport}
        onLogout={handleLogout}
        onToggleFocus={handleToggleFocus}
        focusMode={focusMode}
      />
      <div
        className={`main ${leftCollapsed ? "left-collapsed" : ""} ${
          rightCollapsed ? "right-collapsed" : ""
        }`}
      >
        <LeftPanel
          templates={templates}
          onLoadTemplate={handleLoadTemplate}
          onAddComponent={handleAddComponent}
          isCollapsed={leftCollapsed}
          onToggleCollapse={handleToggleLeft}
        />
        <Canvas
          nodes={nodesWithRisk}
          edges={edgesWithRisk}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onSelectNode={(node) => setSelected({ kind: "node", id: node.id, data: node.data })}
          onSelectEdge={(edge) => setSelected({ kind: "edge", id: edge.id, data: edge.data })}
        />
        <RightPanel
          selected={selected}
          onUpdateSelected={updateSelected}
          threats={threats}
          score={score}
          attackPaths={attackPaths}
          attackTimeline={attackTimeline}
          recommendations={recommendations}
          ScoreCard={SecurityScoreCard}
          AttackPathsPanel={AttackPathsPanel}
          AttackTimeline={AttackTimeline}
          RecommendationsPanel={RecommendationsPanel}
          StrideDashboard={StrideDashboard}
          isCollapsed={rightCollapsed}
          onToggleCollapse={handleToggleRight}
        />
      </div>
    </div>
  );
};

export default App;
