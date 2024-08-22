


import React, { useState, useEffect } from 'react';
import './App.css';
import Grid from "./components/Grid";
import Grid2 from "./components/Grid2";
import UsernameInput from "./components/InputName";

function App() {
  const [username, setUsername] = useState(() => {
    // Charger le nom d'utilisateur depuis le Local Storage au chargement
    return localStorage.getItem('username') || '';
  });

  const [submittedUsername, setSubmittedUsername] = useState(() => {
    // Charger le nom d'utilisateur soumis depuis le Local Storage
    return localStorage.getItem('username') || '';
  });

  const handleUsernameSubmit = (username) => {
    setSubmittedUsername(username);
    localStorage.setItem('username', username); // Sauvegarder le nom d'utilisateur dans le Local Storage
  };

  return (
    <div className="App">
      <h1>PixelWars</h1>
      {!submittedUsername ? (
        <UsernameInput username={username} setUsername={setUsername} onSubmit={handleUsernameSubmit} />
      ) : (
        <Grid username={submittedUsername} size={10} />
      )}
      <Grid2 username={submittedUsername} size={10}/>
    </div>
  );
}

export default App;
