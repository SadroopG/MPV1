import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Login from "./Login"; // Import the Login component
import { auth } from "./firebase"; // Import Firebase auth
import { signOut } from "firebase/auth"; // Import signOut

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState(""); // New state for file name
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null); // Track user authentication state
  const [audioInfo, setAudioInfo] = useState(null); // State for BPM and time signature

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user); // Update user state
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setFileName(file ? file.name : ""); // Update file name
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    setIsUploading(true);
    setError("");
    setDownloadLinks([]); // Reset previous links
    setAudioInfo(null); // Reset audio info

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      console.log("Backend response:", response.data); // Debug logging

      if (response.data.output_files) { // Updated to match backend response
        // Convert the output_files object into an array of links
        const links = Object.values(response.data.output_files);
        setDownloadLinks(links);

        // Set BPM information
        if (response.data.bpm) {
          setAudioInfo({ bpm: response.data.bpm });
        }
      } else {
        setError("Processing failed!");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Upload failed! Please try again.");
    } finally {
      setIsUploading(false);
    }
};

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    setSelectedFile(file);
    setFileName(file ? file.name : "");
  };  


  const handleDownload = async (fileUrl) => {
    try {
        const response = await axios.get(`http://127.0.0.1:8000${fileUrl}`, {
            responseType: "blob",
        });

        // Extract filename from the URL and decode it
        const filename = decodeURIComponent(fileUrl.split("/").pop());

        // Create a Blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename); // Use decoded filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error downloading file:", error);
        setError("Download failed!");
    }
};

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {user ? ( // If user is logged in, show the main app
        <>
          <h1>Music Splitter</h1>

          {/* Display user information */}
          {user && (
            <div style={{ marginTop: "10px" }}>
              <p>Welcome, {user.displayName || user.email}!</p>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  style={{ width: "50px", borderRadius: "50%" }}
                />
              )}
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
          {
            <div
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            style={{
              border: "2px dashed #ccc",
              padding: "20px",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            <p>Drag and drop a file here, or click to select</p>
            <input id="file-upload" type="file" onChange={handleFileChange} />
          </div>

          }
          {/* Custom File Upload Button */}
          <label htmlFor="file-upload" className="custom-file-upload">
            Choose File
          </label>
          <input id="file-upload" type="file" onChange={handleFileChange} />

          {/* Display Selected File Name */}
          {fileName && (
            <p style={{ marginTop: "10px" }}>
              Selected File: <strong>{fileName}</strong>
            </p>
          )}

          {/* Upload & Process Button */}
          <button onClick={handleUpload} disabled={isUploading} style={{ marginLeft: "10px" }}>
            {isUploading ? "Processing..." : "Upload & Process"}
          </button>

          {/* Loading Indicator */}
          {isUploading && (
            <div style={{ marginTop: "20px" }}>
              <p>Processing your file... Please wait.</p>
              <div className="spinner"></div> {/* Add a CSS spinner or use a library */}
            </div>
          )}



          {/* Error Message */}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* Display BPM and Time Signature */}
          {audioInfo && (
            <div style={{ marginTop: "20px" }}>
              <h2>Song Information:</h2>
              <p><strong>BPM:</strong> {audioInfo.bpm}</p>
              <p><strong>Time Signature:</strong> {audioInfo.time_signature}</p>
            </div>
          )}

          {/* Download Buttons */}
          {downloadLinks.length > 0 && (
  <div style={{ marginTop: "20px" }}>
    <h2>Download Processed Files:</h2>
    <div style={{ display: "flex", gap: "10px" }}>
      {downloadLinks.map((link, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <p>{decodeURIComponent(link.split("/").pop())}</p>
          <button onClick={() => handleDownload(link)}>Download</button>
        </div>
      ))}
    </div>
  </div>
)}
        </>
      ) : (
        // If user is not logged in, show the Login component
        <Login />
      )}
    </div>
  );
}

export default App;