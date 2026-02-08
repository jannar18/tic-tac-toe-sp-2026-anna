import express from "express";
import expressWs from "express-ws";
import ViteExpress from "vite-express";
import { type GameState, createGame, makeMove, getWinner } from "./src/tic-tac-toe.ts"
import { humanId } from "human-id";
import type { WebSocket } from "ws";
import { createServer } from "http";

const app = express();
const server = createServer(app);
expressWs(app, server);

app.use(express.json());

let games: Record<string, GameState> = {};

const gameConnections = new Map<string, Set<WebSocket>>();
const lobbyConnections = new Set<WebSocket>();

function broadcastLobby(message: object) {
    const data = JSON.stringify(message);
    for (const client of lobbyConnections) {
        client.send(data);
    }
}

const STALE_GAME_MS = 30 * 60 * 1000; // 30 minutes

function cleanupStaleGames() {
    const now = Date.now();
    for (const [id, game] of Object.entries(games)) {
        const age = now - (game.createdAt || 0);
        const isFinished = !!getWinner(game) || game.board.every((c) => c !== null);
        if (isFinished || age > STALE_GAME_MS) {
            delete games[id];
            gameConnections.delete(id);
        }
    }
}

setInterval(cleanupStaleGames, 60 * 1000);

function broadcast(gameId: string, message: object) {
    const clients = gameConnections.get(gameId);
    if (clients) {
        const data = JSON.stringify(message);
        for (const client of clients) {
            client.send(data);
        }
    }
}

function broadcastGameUpdate(gameId: string, gameState: GameState) {
    broadcast(gameId, { type: "gameState", payload: gameState });
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

app.post("/create", (req,res) => {
    const { playerName } = req.body || {};
    const id = humanId();
    const game = createGame(id);
    if (playerName) {
        game.players = { X: playerName, O: null };
    }
    games[id] = game;
    res.json(game);
});

app.post("/join", (req,res) => {
    const { gameId, playerName } = req.body;
    const game = games[gameId];

    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }

    if (!game.players) {
        game.players = { X: null, O: null };
    }

    let role: "X" | "O" | "spectator";
    if (game.players.X === playerName) {
        role = "X";
    } else if (game.players.O === playerName) {
        role = "O";
    } else if (game.players.X === null) {
        game.players.X = playerName;
        role = "X";
    } else if (game.players.O === null) {
        game.players.O = playerName;
        role = "O";
    } else {
        role = "spectator";
    }

    broadcastGameUpdate(gameId, game);
    res.json({ gameState: game, role });
});

app.get("/games", (_,res) => {
    cleanupStaleGames();
    const allGames = Object.values(games);
    res.json(allGames);
})

app.post("/move", (req,res) => {
    const { gameId, position, playerName } = req.body;
    const game = games[gameId]

    if (!game) {
        res.status(404).json({ error: "Game not found"});
        return;
    }

    if (playerName && game.players) {
        const expectedPlayer = game.players[game.currentPlayer];
        if (expectedPlayer && playerName !== expectedPlayer) {
            res.status(403).json({ error: "It's not your turn" });
            return;
        }
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

    ws.on("message", (raw) => {
        try {
            const msg = JSON.parse(String(raw));
            if (msg.type === "chat" && typeof msg.text === "string" && msg.text.trim()) {
                broadcast(gameId, {
                    type: "chat",
                    payload: {
                        playerName: msg.playerName || "Anonymous",
                        text: msg.text.trim(),
                        timestamp: Date.now(),
                    },
                });
            }
        } catch {
            // ignore malformed messages
        }
    });

    ws.on("close", () => {
        gameConnections.get(gameId)?.delete(ws);
        console.log(`Client left game: ${gameId}`);
    });

    ws.on("error", (error) => {
        console.error(`WebSocket error for game ${gameId}:`, error);
    });
});


// Lobby WebSocket for chat
app.ws("/lobby/ws", (ws, _req) => {
    lobbyConnections.add(ws);
    console.log("Client joined lobby chat");

    ws.on("message", (raw) => {
        try {
            const msg = JSON.parse(String(raw));
            if (msg.type === "chat" && typeof msg.text === "string" && msg.text.trim()) {
                broadcastLobby({
                    type: "chat",
                    payload: {
                        playerName: msg.playerName || "Anonymous",
                        text: msg.text.trim(),
                        timestamp: Date.now(),
                    },
                });
            }
        } catch {
            // ignore malformed messages
        }
    });

    ws.on("close", () => {
        lobbyConnections.delete(ws);
        console.log("Client left lobby chat");
    });

    ws.on("error", (error) => {
        console.error("Lobby WebSocket error:", error);
    });
});

ViteExpress.bind(app, server).then(() => {
    server.listen(process.env.PORT || 3000,() => console.log("Server is listening..."));
});

export default app;