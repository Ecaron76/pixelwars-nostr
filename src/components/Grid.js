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
        const relay = await Relay.connect('wss://relay.damus.io'); // Remplacez par l'URL de votre relais
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
  }, [pixels]);

  const handlePixelClick = async (x, y) => {
    const newPixels = [...pixels];
    newPixels[x][y] = '#000000';
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

    try {
      const relay = await Relay.connect('wss://relay.damus.io');
      console.log('Event published:', signedEvent);
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
