import { useState, useEffect, type CSSProperties, useRef, useCallback } from "react";
import { type GameState, getWinner } from "./tic-tac-toe";


function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameList, setGameList] = useState<GameState[]>([])
  const hasConnected = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
    
  const containerStyle: CSSProperties = {
    display: "flex",                                                        
    flexDirection: "column",                                                
    alignItems: "center",                                                   
    justifyContent: "center",                                               
    height: "100vh",                                                        
    fontFamily: "Courier New",                                              
    color: "#7A6B3A",                                                       
    fontSize: "30px"
  }

  useEffect(() => {
    if (gameState === null) {
      fetch("/games")
        .then((res) => res.json())
        .then((data) => setGameList(data));
    }
  }, [gameState]);

    const connectWebSocket = useCallback(() => {
    
      if (gameState ===null) return;
      if (hasConnected.current) return;
    
    hasConnected.current = true;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new 
    WebSocket(`${protocol}//${window.location.host}/game/${gameState.id}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Client joined game:", gameState.id);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    ws.onmessage = (event) => {
      const updateGame = JSON.parse(event.data);
      setGameState(updateGame);
    };
  }, [gameState?.id]);

    useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
      }
      hasConnected.current = false;
    };
  }, [connectWebSocket]);

  if (gameState === null) {
    return (
      <div style={containerStyle}>

      {/* LOBBY */} 
      <h1>Tic Tac Toe</h1>
      {gameList.length > 0 && (
        <div style={{
        display: "flex",                                                            
        flexDirection: "column",                                                    
        alignItems: "center",                                                       
        gap: "10px",                                                                
        marginTop: "20px"
      }}>
          <h2>Join a game:</h2>
          {gameList
            .filter((game) => !getWinner(game) && !game.board.every((cell) => cell !== null))
            .map((game) => (
            <button 
              key={game.id}
              style={{ margin: "5px", padding: "10px 20px"}}
              onClick={() => setGameState(game)}
            >
              {game.id}
            </button>
          ))}
        </div>
      )} 
            <button 
              style={{ margin: "5px", padding: "10px 20px"}}
              onClick={() => {
                fetch("/create", { method: "POST" })
                  .then((res) => res.json())
                  .then((data) => setGameState(data));
              }}>New Game</button>
      </div>
    );
  }

  const winningmessageColor = getWinner(gameState) === "X" ? "#D4785A" : getWinner(gameState) === "O" ? "#0C4B4A" :"#7A6B3A"
  const messageColor = gameState.currentPlayer === "X" ? "#D4785A" : gameState.currentPlayer === "O" ? "#0C4B4A" :"#7A6B3A"
  
    return (
      <div style={containerStyle}>

      {!getWinner(gameState) && !gameState.board.every((cell) => cell !== null) && <p style={{color:messageColor}}>Current player: {gameState.currentPlayer} </p>}
      {getWinner(gameState) && <p style={{color:winningmessageColor}}>{getWinner(gameState)} wins! Woo!</p>}
      {!getWinner(gameState) && gameState.board.every((cell) => cell !== null) && <p style={{color:winningmessageColor}}>Wahh it's a tie...</p> }
      
      {/* GAME BOARD */}
      <table style={{border: "1px solid #DBBCB4", borderCollapse: "collapse" }}>
        <tbody>
        {[0, 3, 6].map((rowStart) => (
          <tr key={rowStart}>
            {[0, 1, 2].map((col) => {
              const position = rowStart + col 
              return (
                <td 
                  key={position}
                  style={{
                    border:"1px solid #DBBCB4",
                    width: "150px", height: "150px", 
                    textAlign: "center", 
                    fontFamily: "Courier New", 
                    color: gameState.board[position] === "X" ? "#D4785A":"#0C4B4A",
                    fontSize: "80px",
                  }}
                  onClick={() => {
                    if (gameState.board[position] === null && !getWinner(gameState)) {
                      fetch("/move", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gameId: gameState.id, position }),
                      })
                        .then((res) => {
                          if (!res.ok) return null; 
                          return res.json();
                        })
                        .then((data) => {
                          if (data) setGameState(data);
                        });
          
                    }
                  }}
                >
                  {gameState.board[position]}
                </td>
              )
            })}
          </tr>
        ))}
        </tbody>
      </table>

        <button 
          style={{
          backgroundColor: "#DBBCB4",
          padding: "20px 40px",
          margin: "40px"
          }}
          onClick={() => setGameState(null)}>Head Back to Lobby
        </button>
  </div>
);
}

export default App;
