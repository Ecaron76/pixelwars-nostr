import React, { useState } from 'react';

const UsernameInput = ({username, setUsername}) => {
//   const [username, setUsername] = useState('');
  const [submittedUsername, setSubmittedUsername] = useState('');

  const handleInputChange = (e) => {
    setUsername(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Nom d'utilisateur:
          <input 
            type="text" 
            value={username} 
            onChange={handleInputChange} 
            placeholder="Entrez votre nom d'utilisateur" 
          />
        </label>
        <button type="submit">Ajouter</button>
      </form>
      {submittedUsername && <p>Nom d'utilisateur ajouté: {submittedUsername}</p>}
    </div>
  );
};

export default UsernameInput;
