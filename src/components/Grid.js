import React, { useState, useEffect } from 'react';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import CryptoJS from 'crypto-js';

const privateKey = generateSecretKey();
const publicKey = getPublicKey(privateKey);

const Grid = ({ size }) => {
  const [pixels, setPixels] = useState(
    Array(size).fill().map(() => Array(size).fill('#FFFFFF'))
  );

  useEffect(() => {
    const connectRelay = async () => {
      try {
        const relay = await Relay.connect('wss://nostr.stakey.net'); // Remplacez par l'URL de votre relais
        console.log(`Connected to ${relay.url}`);

        const sub = relay.subscribe(
          [
            {
              kinds: [1], 
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
              sub.close();
            },
          }
        );

        return relay;
      } catch (error) {
        console.error("Failed to connect to the relay:", error);
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
      tags: [],
      content: JSON.stringify({ x, y, color: newPixels[x][y] }),
    };
  
    eventTemplate.id = CryptoJS.SHA256(JSON.stringify(eventTemplate)).toString();
    
    const signedEvent = finalizeEvent(eventTemplate, privateKey);
    console.log(signedEvent)
    
    try {
      const relay = await Relay.connect('wss://nostr.stakey.net');
      await relay.publish(signedEvent);
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
