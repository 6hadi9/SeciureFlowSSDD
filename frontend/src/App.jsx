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
      .catch((err) => console.error("Template load error:", err));
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

  // FIXED TEMPLATE LOADING
  const handleLoadTemplate = (template) => {
    setProjectId(null);
    setProjectName(template.name);
    const idMap = {};
    const loadedNodes = (template.nodes || []).map((node, index) => {
      const newId = crypto.randomUUID();
      idMap[node.id] = newId;
      return hydrateNode({ ...node, id: newId }, index);
    });
    const loadedEdges = (template.edges || []).map((edge) => {
      return hydrateEdge({
        ...edge,
        id: crypto.randomUUID(),
        source: idMap[edge.source] || edge.source,
        target: idMap[edge.target] || edge.target,
      });
    });
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setThreats([]);
  };

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
    return { x: 120 + (index % 4) * 220, y: 80 + Math.floor(index / 4) * 160 };
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
          node.id === selected.id ? { ...node, data: { ...node.data, [field]: value } } : node
        )
      );
      setSelected((prev) => ({ ...prev, data: { ...prev.data, [field]: value } }));
    } else if (selected.kind === "edge") {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selected.id ? { ...edge, data: { ...edge.data, [field]: value } } : edge
        )
      );
      setSelected((prev) => ({ ...prev, data: { ...prev.data, [field]: value } }));
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
      socket.emit("update", { room: projectId || "default", clientId, nodes, edges, projectName });
    }, 300);
    return () => clearTimeout(timeout);
  }, [nodes, edges, projectName, projectId, clientId]);

  const nodesWithRisk = nodes.map((node) => {
    const relatedEdges = edges.filter((e) => e.source === node.id || e.target === node.id);
    const severityScore = relatedEdges.reduce((total, edge) => {
      const ts = threatByEdge[edge.id] || [];
      return total + ts.reduce((sum, t) => sum + (t.severity === "High" ? 3 : t.severity === "Medium" ? 2 : 1), 0);
    }, 0);
    const trustLevel = node.data?.trustLevel || "Internal";
    const colors = { External: "#f2d7cf", DMZ: "#fff3d6", Internal: "#e8f6ef", Restricted: "#f1e8ff" };
    let heat = "#e8f6ef";
    if (severityScore >= 9) heat = "#f04438";
    else if (severityScore >= 6) heat = "#f79009";
    else if (severityScore >= 3) heat = "#f2c94c";
    return { ...node, style: { ...node.style, border: `2px solid ${colors[trustLevel] || "#e7ddd4"}`, background: heat } };
  });

  const edgesWithRisk = edges.map((edge) => {
    const ts = threatByEdge[edge.id] || [];
    const hasHigh = ts.some((t) => t.severity === "High");
    const hasAny = ts.length > 0;
    const src = nodes.find((n) => n.id === edge.source);
    const tgt = nodes.find((n) => n.id === edge.target);
    const cross = src?.data?.trustLevel !== tgt?.data?.trustLevel;
    return {
      ...edge,
      style: { stroke: hasHigh ? "#f04438" : cross ? "#f2c94c" : hasAny ? "#f79009" : "#12b76a", strokeWidth: 2, strokeDasharray: cross ? "6 4" : "0" },
      label: ts.length ? `${ts.length}` : "",
      labelBgStyle: { fill: hasHigh ? "#f04438" : hasAny ? "#f79009" : "#12b76a" },
    };
  });

  const handleSave = () => {
    const payload = { name: projectName, nodes, edges, threats };
    const action = projectId ? updateProject(projectId, payload) : createProject(payload);
    action.then((res) => setProjectId(res.data.project.id)).catch(() => null);
  };

  const handleLoadProjects = () => {
    listProjects().then((res) => {
      const first = res.data.items?.[0];
      if (!first) return;
      setProjectId(first.id);
      setProjectName(first.name);
      setNodes((first.nodes || []).map((n, i) => hydrateNode(n, i)));
      setEdges((first.edges || []).map((e) => hydrateEdge(e)));
      setThreats(first.threats || []);
    }).catch(() => null);
  };

  const handleExport = () => exportPdf("export-area", `${projectName}.pdf`, { projectName, score, threats, attackPaths, recommendations });

  const handleAuthSubmit = async (payload) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await (authMode === "login" ? login(payload) : register(payload));
      localStorage.setItem("sf_token", res.data.token);
      setToken(res.data.token);
    } catch (e) {
      setAuthError(e?.response?.data?.error || "Auth failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem("sf_token"); setToken(null); };

  if (!token) return <AuthDialog mode={authMode} onSubmit={handleAuthSubmit} onSwitch={() => setAuthMode(authMode === "login" ? "register" : "login")} error={authError} isSubmitting={authLoading} />;

  return (
    <div className="app" id="export-area">
      <Toolbar projectName={projectName} onProjectNameChange={setProjectName} onAnalyze={runAnalysis} onSave={handleSave} onLoadProjects={handleLoadProjects} onExport={handleExport} onLogout={handleLogout} onToggleFocus={handleToggleFocus} focusMode={focusMode} />
      <div className={`main ${leftCollapsed ? "left-collapsed" : ""} ${rightCollapsed ? "right-collapsed" : ""}`}>
        <LeftPanel templates={templates} onLoadTemplate={handleLoadTemplate} onAddComponent={handleAddComponent} isCollapsed={leftCollapsed} onToggleCollapse={handleToggleLeft} />
        <Canvas nodes={nodesWithRisk} edges={edgesWithRisk} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver} onSelectNode={(node) => setSelected({ kind: "node", id: node.id, data: node.data })} onSelectEdge={(edge) => setSelected({ kind: "edge", id: edge.id, data: edge.data })} />
        <RightPanel selected={selected} onUpdateSelected={updateSelected} threats={threats} score={score} attackPaths={attackPaths} attackTimeline={attackTimeline} recommendations={recommendations} ScoreCard={SecurityScoreCard} AttackPathsPanel={AttackPathsPanel} AttackTimeline={AttackTimeline} RecommendationsPanel={RecommendationsPanel} StrideDashboard={StrideDashboard} isCollapsed={rightCollapsed} onToggleCollapse={handleToggleRight} />
      </div>
    </div>
  );
};

export default App;
