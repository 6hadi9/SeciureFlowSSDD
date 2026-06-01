import React from "react";

const Toolbar = ({
  projectName,
  onProjectNameChange,
  onAnalyze,
  onSave,
  onExport,
  onLoadProjects,
  onLogout,
  onToggleFocus,
  focusMode,
}) => (
  <header className="toolbar">
    <div className="brand">SecureFlow</div>
    <input
      className="project-input"
      value={projectName}
      onChange={(event) => onProjectNameChange(event.target.value)}
      placeholder="Project name"
    />
    <div className="toolbar-actions">
      <button className="ghost" onClick={onToggleFocus}>
        {focusMode ? "Exit Focus" : "Focus Canvas"}
      </button>
      <button onClick={onAnalyze}>Analyze</button>
      <button onClick={onSave}>Save</button>
      <button onClick={onLoadProjects}>Load</button>
      <button onClick={onExport}>Export PDF</button>
      <button className="ghost" onClick={onLogout}>Logout</button>
    </div>
  </header>
);

export default Toolbar;
