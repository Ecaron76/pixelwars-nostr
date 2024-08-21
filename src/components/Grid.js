
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
  const scores = useRef({})
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
                            "#t": ["cesipixelwar5"],
                        },
                    ],
                    {
                        onevent(event) {
                            const { x, y, color } = JSON.parse(event.content);
                            const eventTimestamp = event.created_at;
                            const pixel = pixels[x][y];
                         
                            const newScores = {...scores}

                            // const user = event.pubkey
                            // if(!scores.current[user]) {
                            //   scores.current[user] = {count: 0, color}
                            // }
                            // scores.current[user].count = scores.current[user].count + 1

                            // Met à jour le pixel seulement si l'événement est plus récent
                            if (eventTimestamp > pixel.timestamp) {
                              if(x ==0 && y ==0){
                                console.log(event.tags[0][2])
                              }
                                const newPixels = [...pixels];
                                newPixels[x][y] = { color, timestamp: eventTimestamp, username: event.tags[0][2]};
                                setPixels(newPixels);
                            }
                        },
                        oneose() {
                            // Handle close event
                            console.log("ALERTTTTTTTTTTTTTTTTTTTTTT")
                            console.log(scores)
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
       //  timeoutRef.current = setTimeout(async () => {
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
                ["t", "cesipixelwar5", "geoff"]
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
         // }, 10); 
    };

    const getPixelCounts = (_pixels) => {
       return _pixels.reduce((acc, row, index)=> {
            row.forEach((cel) => {
              const user = cel.color
              if(!acc[user])acc[user] = {count: 0, color: cel.color, username: cel.username}
              acc[user].count = acc[user].count + 1
            })
            return acc
        }, {})
    }
    
return( 
        
        <div>
                  
{Object.entries(getPixelCounts(pixels)).map(([user, values]) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
    <div style={{ backgroundColor: values.color, width: '20px', height: '20px', border: '1px solid #ddd', marginRight: '5px' }}></div>
    <span style={{ fontSize: '16px', fontWeight: 'bold' }}> {values.username} score: {values.count}</span>
    <span style={{ fontSize: '16px', fontWeight: 'bold' }}></span>
  </div>
))}
        
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
