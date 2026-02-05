import { useState, useEffect } from "react";
import { createGame , getWinner } from "./tic-tac-toe";



function App() {
  let [gameState, setGameState] = useState(getInitialGame())

  useEffect(() => {
    fetch("/game")
      .then((res) => res.json())
      .then((data) => setGameState(data));
  }, []);

 const winningmessageColor = getWinner(gameState) === "X" ? "#D4785A" : getWinner(gameState) === "O" ? "#0C4B4A" :"#7A6B3A"
 const messageColor = gameState.currentPlayer === "X" ? "#D4785A" : gameState.currentPlayer === "O" ? "#0C4B4A" :"#7A6B3A"

  return <div style={{
              display: "flex", 
              flexDirection:"column", 
              alignItems: "center", 
              justifyContent: "center", 
              height: "100vh", 
              fontFamily: "Courier New", 
              color: "#7A6B3A", 
              fontSize: "30px"}}>
    {!getWinner(gameState) && !gameState.board.every((cell) => cell !== null) && <p style={{color:messageColor}}>Current player: {gameState.currentPlayer} </p>}
    {getWinner(gameState) && <p style={{color:winningmessageColor}}>{getWinner(gameState)} wins! Woo!</p>}
    {!getWinner(gameState) && gameState.board.every((cell) => cell !== null) && <p style={{color:winningmessageColor}}>Wahh it's a tie...</p> }
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
                      body: JSON.stringify({ position }),
                    })
                      .then((res) => res.json())
                      .then((data) => setGameState(data));
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
      {(getWinner(gameState) || gameState.board.every((cell) => cell !== null)) && 
      <button 
      style={{
        backgroundColor: "#DBBCB4",
        padding: "20px, 40px",
        margin: "40px"
        }}
      
      onClick={() => {
        fetch("/reset", { method: "POST" })
          .then((res) => res.json())
          .then((data) => setGameState(data));
      }}>Play Again!</button>
      }
    </div>;
}

function getInitialGame() {
  let initialGameState = createGame()
  return initialGameState
}

export default App;
