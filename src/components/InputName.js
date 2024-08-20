// import React, { useState } from 'react';

// const UsernameInput = ({username, setUsername}) => {
// //   const [username, setUsername] = useState('');
//   const [submittedUsername, setSubmittedUsername] = useState('');

//   const handleInputChange = (e) => {
//     setUsername(e.target.value);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <label>
//           Nom d'utilisateur:
//           <input 
//             type="text" 
//             value={username} 
//             onChange={handleInputChange} 
//             placeholder="Entrez votre nom d'utilisateur" 
//           />
//         </label>
//         <button type="submit">Ajouter</button>
//       </form>
//       {submittedUsername && <p>Nom d'utilisateur ajouté: {submittedUsername}</p>}
//     </div>
//   );
// };

// export default UsernameInput;


import React from 'react';

const UsernameInput = ({ username, setUsername, onSubmit }) => {
  const handleInputChange = (e) => {
    setUsername(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) {
      onSubmit(username);
    }
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
    </div>
  );
};

export default UsernameInput;
