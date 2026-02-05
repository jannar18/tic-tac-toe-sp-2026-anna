import express from "express";
import ViteExpress from "vite-express";
import { type GameState, createGame, makeMove, } from "./src/tic-tac-toe.ts"
import { humanId } from "human-id";

const app = express();
app.use(express.json());

let games: Record<string, GameState> = {};

//Test endpoint

app.get("/message", (_, res) => res.send("Hello from express!"));

// Game endpoints

app.get("/game/:id", (req,res) => { 
    const id = req.params.id;
    const game = games[id];

    if (!game) {
        res.status(404).json({ error: "Game not found"});
        return;
    }
    res.json(game); 
});

app.post("/create", (_,res) => {
    const id = humanId();
    const game = createGame(id);
    games[id] = game;
    res.json(game);
});

app.get("/games", (_,res) => {
    const ids = Object.keys(games);
    res.json(ids);
})

app.post("/move", (req,res) => {
    const { gameId, position } = req.body;
    const game = games[gameId]

    if (!game) {
        res.status(404).json({ error: "Game not found"});
        return;
    }

    try {
        games[gameId] = makeMove(game, position);
        res.json(games[gameId]);
    } 
    catch (error) {
        res.status(400).json({ error: (error as Error).message})
    }
});

app.post("/reset-all", (_,res) => {
    games = {};
    res.json({success: true});
});

ViteExpress.listen(app, 3000, () => console.log("Server is listening..."));

export default app;