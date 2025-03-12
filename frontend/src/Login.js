// src/Login.js
import React, { useState } from "react";
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import zxcvbn from "zxcvbn"; // Password strength checker

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null); // Track password strength

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    if (isSignUp && passwordStrength.score < 3) {
      alert("Password is too weak. Please choose a stronger password.");
      return;
    }
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (error) {
      console.error("Error with email/password authentication:", error.message);
      alert(error.message);
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (isSignUp) {
      // Check password strength only during sign-up
      setPasswordStrength(zxcvbn(newPassword));
    }
  };

  const getPasswordStrengthColor = (score) => {
    switch (score) {
      case 0:
        return "red";
      case 1:
        return "orange";
      case 2:
        return "yellow";
      case 3:
        return "lightgreen";
      case 4:
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>{isSignUp ? "Sign Up" : "Sign In"}</h2>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailPasswordAuth} style={{ marginBottom: "20px" }}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "10px", fontSize: "16px", marginBottom: "10px", width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            required
            style={{ padding: "10px", fontSize: "16px", marginBottom: "10px", width: "100%", boxSizing: "border-box" }}
          />
          {isSignUp && passwordStrength && (
            <div style={{ marginTop: "10px", textAlign: "left" }}>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                  borderRadius: "5px",
                }}
              ></div>
              <p style={{ fontSize: "14px", color: getPasswordStrengthColor(passwordStrength.score) }}>
                Password Strength: {passwordStrength.score}/4
              </p>
              {passwordStrength.feedback.suggestions.length > 0 && (
                <ul style={{ fontSize: "12px", color: "gray", paddingLeft: "20px" }}>
                  {passwordStrength.feedback.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>

      {/* Toggle between Sign Up and Sign In */}
      <p>
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      {/* Google Sign-In Button */}
      <h3>Or</h3>
      <button
        onClick={handleGoogleSignIn}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#db4437",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}

export default Login;