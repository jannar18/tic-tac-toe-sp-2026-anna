export type Player = "X" | "O";

export type Cell = Player | null;

// Board is a 3x3 grid, represented as a 9-element array.
// Indices map to positions:
//  0 | 1 | 2
//  ---------
//  3 | 4 | 5
//  ---------
//  6 | 7 | 8
export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];

export type GameState = {
  board: Board;
  currentPlayer: Player;
  id: string;
};

export function createGame(id: string): GameState {
  return {
    id:id,
    board: [null, null, null, null, null, null, null, null, null],
    currentPlayer: "X",
  };
}

export function makeMove(gameState: GameState, position: number,): GameState {
  if (!Number.isInteger(position)){
    throw new Error("Position must be an integer")
  }
  if (position < 0 || position > 8) {
    throw new Error("Position must be between 0 and 8")
  }
  if (gameState.board[position] !==null) {
    throw new Error("Position is already occupied")}
  if (getWinner(gameState) !== null){
    throw new Error("Game is already over")
  }
  const newBoard = [...gameState.board]
  newBoard[position] = gameState.currentPlayer
  const nextPlayer = gameState.currentPlayer === "X" ? "O" : "X"  
  return {
    id: gameState.id,
    board: newBoard as Board, 
    currentPlayer: nextPlayer,
  }
}

export function getWinner(gameState: GameState): Player | null {

const winningCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], 
  [0, 3, 6], [1, 4, 7], [2, 5, 8], 
  [0, 4, 8], [2, 4, 6],
]

for (const combo of winningCombos) {
  const a = gameState.board[combo[0]]
  const b = gameState.board[combo[1]]
  const c = gameState.board[combo[2]]

  if (a !== null && a === b && b === c ){
    return a
  }
}

  return null;
}
