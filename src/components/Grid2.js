
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

    const [relay, setRelay] = useState();
    const [pixels, setPixels] = useState(
        Array(size).fill().map(() => Array(size).fill({ color: '#000099', timestamp: 0 }))
    );
    const timeoutRef = useRef(null);



    useEffect(() => {
        const connectRelay = async () => {
            try {
                const _relay = await Relay.connect('wss://longhorn.bgp.rodeo');
                _relay.subscribe(
                    [
                        {
                            kinds: [1],
                            "#t": ["cesipixelwarworld"],
                            since: time.current
                        },
                    ],
                    {
                        onevent(event) {
                          
                            if( event.tags[0].length === 4 && event.created_at > time.current ){

                                setPixels(Array(size).fill().map(() => Array(size).fill({ color: '#000099', timestamp: 0 })))
                                time.current = Math.floor(Date.now() / 1000)
                                
                            }
                      
                            const { x, y, color } = JSON.parse(event.content);
                            const eventTimestamp = event.created_at;
                            const pixel = pixels[x][y];
                         
                 

          
                           
        
                            if (eventTimestamp > pixel.timestamp) {
              
                              let _color = color
                              if(event.pubkey === pk) _color = "transparent"
                                const newPixels = [...pixels];
                                newPixels[x][y] = { color: _color, timestamp: eventTimestamp, username: event.tags[0][2], pubkey: pk};
                                setPixels(newPixels);
                            }
                        },
                        oneose() {
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
       
        const tags = [ ["t", "cesipixelwarworld", username, "london"] ]
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
       timeoutRef.current = setTimeout(async () => {
          const timestamp = Math.floor(Date.now() / 1000)
            const newPixels = [...pixels];
            newPixels[x][y] = {color: "transparent", timestamp}; // Par exemple, couleur choisie pour la coloration
            setPixels(newPixels);
            sendMessage(            [
              ["t", "cesipixelwarworld", username]
            ], { x, y, color: userColor})
            timeoutRef.current = null;
        }, 10); 
    };
    
return(   
      <>
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
    </>
    );
  }

export default Grid2;
