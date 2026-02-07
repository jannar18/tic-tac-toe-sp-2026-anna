import { useState, useEffect, useRef, useCallback } from "react";
import { type GameState, getWinner } from "./tic-tac-toe";

function PixelIcon({ src, alt, size = "w-16 h-16 md:w-24 md:h-24" }: { src: string; alt: string; size?: string }) {
  return <img src={src} alt={alt} className={`${size} inline-block object-contain`} style={{ imageRendering: "pixelated" }} />;
}

function symbolFor(cell: string | null, size?: string): React.ReactNode {
  if (cell === "X") return <PixelIcon src="/snail.png" alt="Snail" size={size} />;
  if (cell === "O") return <PixelIcon src="/flower.png" alt="Flower" size={size} />;
  return null;
}

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameList, setGameList] = useState<GameState[]>([]);
  const hasConnected = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (gameState === null) {
      fetch("/games")
        .then((res) => res.json())
        .then((data) => setGameList(data));
    }
  }, [gameState]);

  const connectWebSocket = useCallback(() => {
    if (gameState === null) return;
    if (hasConnected.current) return;

    hasConnected.current = true;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/game/${gameState.id}/ws`
    );
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
      <div className="flex flex-col items-center justify-center min-h-screen font-pixel text-main-teal text-xs md:text-base px-4">
        {/* LOBBY */}
        <h1 className="text-sm md:text-2xl font-bold mb-4 flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center">
          <div className="flex items-center gap-2">
            <PixelIcon src="/snail.png" alt="Snail" size="w-10 h-10 md:w-16 md:h-16" />
            <PixelIcon src="/flower.png" alt="Flower" size="w-10 h-10 md:w-16 md:h-16" />
          </div>
          Snails vs Garden
        </h1>
        {gameList.length > 0 && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <h2 className="text-xs md:text-sm">Join a game:</h2>
            {gameList
              .filter(
                (game) =>
                  !getWinner(game) &&
                  !game.board.every((cell) => cell !== null)
              )
              .map((game) => (
                <button
                  key={game.id}
                  className="m-1 px-4 py-2 bg-board-border/30 border border-board-border rounded-lg hover:bg-board-border/50 transition-colors cursor-pointer text-main-teal text-[8px] md:text-xs"
                  onClick={() => setGameState(game)}
                >
                  {game.id}
                </button>
              ))}
          </div>
        )}
        <button
          className="m-1 mt-6 px-6 py-3 md:px-8 md:py-4 bg-main-teal text-white rounded-lg hover:bg-main-teal/80 transition-colors cursor-pointer text-xs md:text-sm font-bold"
          onClick={() => {
            fetch("/create", { method: "POST" })
              .then((res) => res.json())
              .then((data) => setGameState(data));
          }}
        >
          New Game
        </button>
      </div>
    );
  }

  const winner = getWinner(gameState);
  const isTie =
    !winner && gameState.board.every((cell) => cell !== null);
  const isGameOver = !!winner || isTie;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-pixel text-main-teal text-xs md:text-base px-4">
      {/* STATUS MESSAGE */}
      {!isGameOver && (
        <p
          className={
            gameState.currentPlayer === "X"
              ? "text-olive"
              : "text-garden-pink"
          }
        >
          <span className="flex items-center gap-2">
            Current player: {symbolFor(gameState.currentPlayer, "w-6 h-6 md:w-10 md:h-10")}{" "}
            {gameState.currentPlayer === "X" ? "Snails" : "Garden"}
          </span>
        </p>
      )}
      {winner === "X" && (
        <p className="text-olive text-[10px] md:text-sm font-bold animate-winner-bounce flex items-center gap-2 text-center">
          Oh no! The snails took over the garden! <PixelIcon src="/snail.png" alt="Snail" size="w-6 h-6 md:w-8 md:h-8" />
        </p>
      )}
      {winner === "O" && (
        <p className="text-garden-pink text-[10px] md:text-sm font-bold animate-winner-bounce flex items-center gap-2 text-center">
          Yay! The garden is flourishing! <PixelIcon src="/flower.png" alt="Flower" size="w-6 h-6 md:w-8 md:h-8" />
        </p>
      )}
      {isTie && (
        <p className="text-main-teal text-[10px] md:text-sm text-center">
          The snails and flowers share the garden... it's a tie!
        </p>
      )}

      {/* GAME BOARD */}
      <table className="border border-board-border border-collapse mt-4">
        <tbody>
          {[0, 3, 6].map((rowStart) => (
            <tr key={rowStart}>
              {[0, 1, 2].map((col) => {
                const position = rowStart + col;
                const cellValue = gameState.board[position];

                return (
                  <td
                    key={position}
                    className="border border-board-border w-[100px] h-[100px] md:w-[150px] md:h-[150px] text-center cursor-pointer hover:bg-board-border/10 transition-colors"
                    onClick={() => {
                      if (
                        gameState.board[position] === null &&
                        !winner
                      ) {
                        fetch("/move", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            gameId: gameState.id,
                            position,
                          }),
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
                    {winner ? (
                      <span
                        className="animate-winner-pop inline-block"
                        style={{
                          animationDelay: `${position * 0.12}s`,
                          opacity: 0,
                        }}
                      >
                        {symbolFor(winner)}
                      </span>
                    ) : (
                      symbolFor(cellValue)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="mt-6 md:mt-10 px-6 py-3 md:px-10 md:py-5 bg-board-border rounded-lg hover:bg-board-border/70 transition-colors cursor-pointer text-main-teal text-[8px] md:text-xs font-bold"
        onClick={() => setGameState(null)}
      >
        Head Back to Lobby
      </button>
    </div>
  );
}

export default App;
