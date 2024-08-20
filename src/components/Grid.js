import React, { useState, useEffect } from 'react';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import CryptoJS from 'crypto-js';


const privateKey = generateSecretKey();
const publicKey = getPublicKey(privateKey);

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
    newPixels[x][y] = '#FF9900'; // Par exemple, couleur choisie pour la coloration
    setPixels(newPixels);

    
    const eventTemplate = {
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [
        ["t", "cesipixelwar"] // Correct format for a tag
      ],
      content: JSON.stringify({ x, y, color: newPixels[x][y] }),
      other: {}
    };
  
    eventTemplate.id = CryptoJS.SHA256(JSON.stringify(eventTemplate)).toString();
    
    const signedEvent = finalizeEvent(eventTemplate, privateKey);

    
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
