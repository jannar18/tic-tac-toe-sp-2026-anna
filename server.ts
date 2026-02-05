import express from "express";
import ViteExpress from "vite-express";
import { GameState, createGame, makeMove, getWinner } from "./src/tic-tac-toe.ts"

const app = express();
app.use(express.json());

let gameState: GameState = createGame();

//Test endpoint

app.get("/message", (_, res) => res.send("Hello from express!"));

// Game endpoints

app.get("/game", (req,res) => { 
    res.json(gameState); 
});
app.post("/move", (req,res) => {
    const { position } = req.body;
    gameState = makeMove(gameState, position);
    res.json(gameState);
});
app.post("/reset", (req,res) => {
    gameState = createGame();
    res.json(gameState);
});

ViteExpress.listen(app, 3000, () => console.log("Server is listening..."));

