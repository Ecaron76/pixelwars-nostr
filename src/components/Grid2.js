
import React, { useState, useEffect, useRef } from 'react';
import { SimplePool } from 'nostr-tools/pool'
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import CryptoJS from 'crypto-js';
import { countScoreByUser } from '../utils';
import InputAnswer from './InputAnswer';

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

const Grid2 = ({ size, username }) => {
const [answer, setAnswer] = useState("")
const time = useRef( Math.floor(Date.now() / 1000))
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
                            "#t": ["cesipixelwar"],
                            since: time.current
                        },
                    ],
                    {
                        onevent(event) {
                            
                           
                            if( event.tags[0].length === 4 && event.created_at > time.current ){

                                console.log("OKIIIIIIIIIII")
                                setPixels(Array(size).fill().map(() => Array(size).fill({ color: '#000099', timestamp: 0 })))
                                time.current = Math.floor(Date.now() / 1000)
                                
                            }
                                
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
               
                            //   if(x ==0 && y ==0){
                            //     console.log(event.tags[0][2])
                            //   }
                              let _color = color
                              if(event.pubkey === pk) _color = "transparent"
                                const newPixels = [...pixels];
                                newPixels[x][y] = { color: _color, timestamp: eventTimestamp, username: event.tags[0][2], pubkey: pk};
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

const checkAnswer = () => {
    if(answer === "london") {
       
        const tags = [ ["t", "cesipixelwar", username, "london"] ]
        sendMessage(tags, {message: username })
   
    }
}
const sendMessage = async(tags, content) => {
    const eventTemplate = {
        pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags,
        content: JSON.stringify(content),
      };
    
      const signedEvent = finalizeEvent(eventTemplate, sk);
      
      try {
        await relay.publish(signedEvent);
      } catch (err) {
        console.error('Failed to publish event:', err);
      }

}
    const handlePixelClick = async (x, y) => {
    
   
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
       //  timeoutRef.current = setTimeout(async () => {
          const timestamp = Math.floor(Date.now() / 1000)
            const newPixels = [...pixels];
            newPixels[x][y] = {color: "transparent", timestamp}; // Par exemple, couleur choisie pour la coloration
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
                ["t", "cesipixelwar", username]
              ],
              content: JSON.stringify({ x, y, color: userColor}),
            };
          
           
            
            const signedEvent = finalizeEvent(eventTemplate, sk);
        
            
            try {
              await relay.publish(signedEvent);

            } catch (err) {
              console.error('Failed to publish event:', err);
            }
            timeoutRef.current = null;
         // }, 10); 
    };

    const getPixelCounts = (_pixels) => {
      const t = _pixels.reduce((acc, row, index)=> {
            row.forEach((cel) => {
              const user = cel.pubkey
              if(!acc[user])acc[user] = {count: 0, color: cel.color, username: cel.username, pk :cel.pubkey}
              acc[user].count = acc[user].count + 1
            })
            return acc
        }, {})
        // console.log(t)
        return t
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

      <div className="grid2">
        {pixels.map((row, x) =>
          row.map((pixel, y) => (
            <div
              key={`${x}-${y}`}
              className="pixel"
              style={{zIndex: 1, backgroundColor: pixel.color, width: '20px', height: '20px', border: '1px solid #ddd' }}
              onClick={() => handlePixelClick(x, y)}
            />
          ))
        )}
            <div style={{position: "absolute",   
                            top: 0, zIndex: 0, 
                            left: "50%", 
                            width: "200px", 
                            height: "200px", 
                            backgroundColor: "red", 
                            transform: "translateX(-50%)",
                            backgroundImage: 'url(/londres.jpeg)', // L'image est accessible depuis la racine du domaine
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'}}/>
      </div>
      <InputAnswer answer={answer} setAnswer={setAnswer} onSubmit={checkAnswer}/>
    </div>
    );
  }

export default Grid2;
