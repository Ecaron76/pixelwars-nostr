// import React, { useState, useEffect } from 'react';
// import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
// import { Relay } from 'nostr-tools/relay';
// import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
// import CryptoJS from 'crypto-js';

// const loadOrGenerateKeys = () => {
//     let privateKeyHex = localStorage.getItem('privateKey');
//     let privateKey;

//     if (!privateKeyHex) {
//         privateKey = generateSecretKey();
//         privateKeyHex = bytesToHex(privateKey);
//         localStorage.setItem('privateKey', privateKeyHex);
//     } else {
//         privateKey = hexToBytes(privateKeyHex);
//     }

//     const publicKey = getPublicKey(privateKey);

//     return { sk: privateKey, pk: publicKey };
// };
  
// const { sk, pk } = loadOrGenerateKeys();

// const getColorFromPubkey = (pubkey) => {
//     const hash = CryptoJS.SHA256(pubkey).toString(); // Hash de la clé publique
//     return `#${hash.slice(0, 6)}`;
// };

// const userColor = getColorFromPubkey(pk);
// console.log(userColor);

// const Grid = ({ username, size }) => {
//   const [relay, setRelay] = useState(null);
//   const [pixels, setPixels] = useState(
//     Array(size).fill().map(() => Array(size).fill('#FFFFFF'))
//   );
//   const [playerCells, setPlayerCells] = useState(0);

//   useEffect(() => {
//     const connectRelay = async () => {
//       try {
//         const _relay = await Relay.connect('wss://relay.damus.io');
//         _relay.subscribe(
//           [
//             {
//               kinds: [1], 
//               "#t": ["cesipixelwar"],
//             },
//           ],
//           {
//             onevent(event) {
//               const { x, y, color } = JSON.parse(event.content);
//               setPixels(prevPixels => {
//                 const newPixels = [...prevPixels];
//                 newPixels[x][y] = color;
//                 return newPixels;
//               });
//               console.log(event);
//             },
//             oneose() {
//               console.log('Subscription closed');
//             },
//           }
//         );

//         setRelay(_relay);
//       } catch (error) {
//         console.error("Failed to connect to the relay:", error.message);
//       }
//     };

//     connectRelay();
//   }, []);

//   const handlePixelClick = async (x, y) => {
//     if (pixels[x][y] !== '#FFFFFF') {
//       console.log('Ce pixel est déjà colorié.');
//       return;
//     }

//     const newPixels = [...pixels];
//     newPixels[x][y] = userColor;
//     setPixels(newPixels);

//     setPlayerCells(prev => prev + 1);

//     const eventTemplate = {
//       pubkey: pk,
//       created_at: Math.floor(Date.now() / 1000),
//       kind: 1,
//       tags: [
//         ["t", "cesipixelwar"]
//       ],
//       content: JSON.stringify({ x, y, color: newPixels[x][y] }),
//     };

//     const signedEvent = finalizeEvent(eventTemplate, sk);
//     console.log(signedEvent);

//     try {
//       await relay.publish(signedEvent);
//       console.log('Event published:', signedEvent);
//     } catch (err) {
//       console.error('Failed to publish event:', err);
//     }
//   };

//   return (
//     <div>
//       <h3>Joueur connecté : {username}</h3>
//       <div className="grid">
//         {pixels.map((row, x) =>
//           row.map((color, y) => (
//             <div
//               key={`${x}-${y}`}
//               className="pixel"
//               style={{ backgroundColor: color, width: '20px', height: '20px', border: '1px solid #ddd' }}
//               onClick={() => handlePixelClick(x, y)}
//             />
//           ))
//         )}
//       </div>
//       <div className="player-info">
//         <p>
//           Cases remplies : {playerCells}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Grid;

import React, { useState, useEffect } from 'react';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import CryptoJS from 'crypto-js';

const loadOrGenerateKeys = () => {
    let privateKeyHex = localStorage.getItem('privateKey');
    let privateKey;

    if (!privateKeyHex) {
        privateKey = generateSecretKey();
        privateKeyHex = bytesToHex(privateKey);
        localStorage.setItem('privateKey', privateKeyHex);
    } else {
        privateKey = hexToBytes(privateKeyHex);
    }

    const publicKey = getPublicKey(privateKey);

    return { sk: privateKey, pk: publicKey };
};
  
const { sk, pk } = loadOrGenerateKeys();

const getColorFromPubkey = (pubkey) => {
    const hash = CryptoJS.SHA256(pubkey).toString(); // Hash de la clé publique
    return `#${hash.slice(0, 6)}`;
};

const userColor = getColorFromPubkey(pk);
console.log(userColor);

const Grid = ({ username, size }) => {
  const [relay, setRelay] = useState(null);
  const [pixels, setPixels] = useState(
    Array(size).fill().map(() => Array(size).fill('#FFFFFF'))
  );
  const [playerCells, setPlayerCells] = useState(() => {
    // Charger le nombre de cases remplies depuis le Local Storage
    return parseInt(localStorage.getItem('playerCells'), 10) || 0;
  });

  useEffect(() => {
    const connectRelay = async () => {
      try {
        const _relay = await Relay.connect('wss://relay.damus.io');
        _relay.subscribe(
          [
            {
              kinds: [1], 
              "#t": ["cesipixelwar"],
            },
          ],
          {
            onevent(event) {
              const { x, y, color } = JSON.parse(event.content);
              setPixels(prevPixels => {
                const newPixels = [...prevPixels];
                newPixels[x][y] = color;
                return newPixels;
              });
              console.log(event);
            },
            oneose() {
              console.log('Subscription closed');
            },
          }
        );

        setRelay(_relay);
      } catch (error) {
        console.error("Failed to connect to the relay:", error.message);
      }
    };

    connectRelay();
  }, []);

  const handlePixelClick = async (x, y) => {
    if (pixels[x][y] !== '#FFFFFF') {
      console.log('Ce pixel est déjà colorié.');
      return;
    }

    const newPixels = [...pixels];
    newPixels[x][y] = userColor;
    setPixels(newPixels);

    // Incrémenter le compteur de cases cochées par l'utilisateur connecté et sauvegarder dans le localStorage
    setPlayerCells(prev => {
      const newCount = prev + 1;
      localStorage.setItem('playerCells', newCount); // Sauvegarder dans le localStorage
      return newCount;
    });

    const eventTemplate = {
      pubkey: pk,
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [
        ["t", "cesipixelwar"]
      ],
      content: JSON.stringify({ x, y, color: newPixels[x][y] }),
    };

    const signedEvent = finalizeEvent(eventTemplate, sk);
    console.log(signedEvent);

    try {
      await relay.publish(signedEvent);
      console.log('Event published:', signedEvent);
    } catch (err) {
      console.error('Failed to publish event:', err);
    }
  };

  return (
    <div>
      <h3>Joueur connecté : {username}</h3>
      <div className="grid">
        {pixels.map((row, x) =>
          row.map((color, y) => (
            <div
              key={`${x}-${y}`}
              className="pixel"
              style={{ backgroundColor: color, width: '20px', height: '20px', border: '1px solid #ddd' }}
              onClick={() => handlePixelClick(x, y)}
            />
          ))
        )}
      </div>
      <div className="player-info">
        <p>
          Cases remplies : {playerCells}
        </p>
      </div>
    </div>
  );
};

export default Grid;
