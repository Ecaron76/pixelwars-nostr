
import React, { useState, useEffect, useRef } from 'react';
import { SimplePool } from 'nostr-tools/pool'
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import CryptoJS from 'crypto-js';
import { countScoreByUser } from '../utils';

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

const Grid = ({ size, username }) => {
  let relays = ['wss://relay.example.com', 'wss://relay.example2.com']
  const pool = new SimplePool()
    const [relay, setRelay] = useState();
    const [pixels, setPixels] = useState(
        Array(size).fill().map(() => Array(size).fill({ color: '#FFFFFF', timestamp: 0 }))
    );
    const timeoutRef = useRef(null);
    const [playerCells, setPlayerCells] = useState(() => {
      // Charger le nombre de cases remplies depuis le Local Storage
      return parseInt(localStorage.getItem('playerCells'), 10) || 0;
    });

    useEffect(() => {
        const connectRelay = async () => {
            try {
                const _relay = await Relay.connect('wss://longhorn.bgp.rodeo');
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
                            const eventTimestamp = event.created_at;
                            const pixel = pixels[x][y];


                            // Met à jour le pixel seulement si l'événement est plus récent
                            if (eventTimestamp > pixel.timestamp) {
                                const newPixels = [...pixels];
                                newPixels[x][y] = { color, timestamp: eventTimestamp };
                                setPixels(newPixels);
                            }
                        },
                        oneose() {
                            // Handle close event
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
         timeoutRef.current = setTimeout(async () => {
          const timestamp = Math.floor(Date.now() / 1000)
            const newPixels = [...pixels];
            newPixels[x][y] = {color: userColor, timestamp}; // Par exemple, couleur choisie pour la coloration
            setPixels(newPixels);
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
                ["t", "cesipixelwar"] // Correct format for a tag
              ],
              content: JSON.stringify({ x, y, color: newPixels[x][y].color }),
            };
          
           
            
            const signedEvent = finalizeEvent(eventTemplate, sk);
            console.log(signedEvent)
            
            try {
              await relay.publish(signedEvent);
              console.log('Event published:', signedEvent);
            } catch (err) {
              console.error('Failed to publish event:', err);
            }
            timeoutRef.current = null;
          }, 10); 
    };


return( 
        
        <div>
      <h3>Joueur connecté : {username}</h3>
      <div className="player-info">
        <p>
          Cases remplies : {playerCells}
        </p>
      </div>
      <div className="grid">
        {pixels.map((row, x) =>
          row.map((pixel, y) => (
            <div
              key={`${x}-${y}`}
              className="pixel"
              style={{ backgroundColor: pixel.color, width: '20px', height: '20px', border: '1px solid #ddd' }}
              onClick={() => handlePixelClick(x, y)}
            />
          ))
        )}
      </div>
      
    </div>
    );
  }

export default Grid;
