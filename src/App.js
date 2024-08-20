import React, { useState } from 'react';
import './App.css';
import Grid from './components/Grid';
import InputName from './components/InputName';

function App() {
  const [username, setUsername] = useState();
  return (
    <div className="App">
      <h1>PixelWars</h1>
      <InputName username={username} setUsername={setUsername}/>
      <Grid username={username} size={10} />

    </div>
  );
}

export default App;
