import express from "express";
import expressWs from "express-ws";
import ViteExpress from "vite-express";
import { type GameState, createGame, makeMove, } from "./src/tic-tac-toe.ts"
import { humanId } from "human-id";
import type { WebSocket } from "ws";
import { createServer } from "http";

const app = express();
const server = createServer(app);
expressWs(app, server);

app.use(express.json());

let games: Record<string, GameState> = {};

const gameConnections = new Map<string, Set<WebSocket>>();

function broadcastGameUpdate(gameId: string, gameState: GameState) {
    const clients = gameConnections.get(gameId);
    if (clients) {
        const message = JSON.stringify(gameState);
        for (const client of clients) {
            client.send(message);
        }
    }
}

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
    const allGames = Object.values(games);
    res.json(allGames);
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
        broadcastGameUpdate(gameId, games[gameId]);
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

// WebSocket endpoints

app.ws("/game/:id/ws", (ws, req) => {
    const gameId = req.params.id as string;

    if (!gameConnections.has(gameId)) {
        gameConnections.set(gameId, new Set());
    }

        gameConnections.get(gameId)!.add(ws);
        console.log(`Client joined game: ${gameId}`)

    ws.on("close", () => {
        gameConnections.get(gameId)?.delete(ws);
        console.log(`Client left game: ${gameId}`);
    });

    ws.on("error", (error) => {
        console.error(`WebSocket error for game ${gameId}:`, error);
    });
});


ViteExpress.bind(app, server).then(() => {
    server.listen(process.env.PORT || 3000,() => console.log("Server is listening..."));
});

export default app;