import React, { useState, useEffect } from 'react';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils' // already an installed dependency

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

    console.log(privateKey); 

    return { sk: privateKey, pk: publicKey };
};
  
const { sk, pk } = loadOrGenerateKeys();
const getColorFromPubkey = (pubkey) => {
    const hash = CryptoJS.SHA256(pubkey).toString(); // Hash de la clé publique
    // Utiliser les 6 premiers caractères du hash pour la couleur
    return `#${hash.slice(0, 6)}`;
  };

  const userColor = getColorFromPubkey(pk);
console.log(userColor)

const Grid = ({ size, username }) => {
  const [relay, setRelay] = useState()

  const [pixels, setPixels] = useState(
    Array(size).fill().map(() => Array(size).fill('#FFFFFF'))
  );
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
              const newPixels = [...pixels];
              newPixels[x][y] = color;
              setPixels(newPixels);
              console.log(event)
            },
            oneose() {
              // sub.close();
            },
          }
        );

        setRelay(_relay)
      } catch (error) {
        console.error("Failed to connect to the relay:", error.message);
      }
    };

    connectRelay();
  }, []);

  const handlePixelClick = async (x, y) => {
    // Vérifie si le pixel est déjà colorié
    if (pixels[x][y] !== '#FFFFFF') { // Supposant que #FFFFFF est la couleur par défaut non coloriée
      console.log('Ce pixel est déjà colorié.');
      return; // Sortir de la fonction sans faire de changement
    }
  
    // Si le pixel n'est pas colorié, continue avec le processus
    const newPixels = [...pixels];
    newPixels[x][y] = userColor; // Par exemple, couleur choisie pour la coloration
    setPixels(newPixels);

    
    const eventTemplate = {
      pubkey: pk,
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [
        ["t", "cesipixelwar"] // Correct format for a tag
      ],
      content: JSON.stringify({ x, y, color: newPixels[x][y] }),
      other: {}
    };
  
    // eventTemplate.id = CryptoJS.SHA256(JSON.stringify(eventTemplate)).toString();
    
    const signedEvent = finalizeEvent(eventTemplate, sk);
    console.log(signedEvent)
    
    try {
      await relay.publish(signedEvent);
      console.log('Event published:', signedEvent);
    } catch (err) {
      console.error('Failed to publish event:', err);
    }
  };
  

  return (
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
  );
};

export default Grid;
