import React, { useState } from "react";

const AuthDialog = ({ mode, onSubmit, onSwitch, error, isSubmitting }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <div className="auth-overlay">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : mode === "login" ? "Login" : "Register"}
        </button>
        <button type="button" className="ghost" onClick={onSwitch}>
          {mode === "login" ? "Need an account?" : "Have an account?"}
        </button>
      </form>
    </div>
  );
};

export default AuthDialog;
