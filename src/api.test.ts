import { describe, it, expect, } from "vitest";
import request from 'supertest';
import app from "../server";

// POST /create - Creating a game returns a game with an ID and creates a new game (empty board and player X first) 
describe("POST /create", () => {
    it("returns a game with an ID", async () => {
        const response = await request(app).post("/create");
        expect(response.body.id).toBeDefined();
    
    });

    it("returns a new game with an empty board", async () => {
            const response = await request(app).post("/create").expect(200);
            expect(response.body.board).toEqual([null,null,null,null,null,null,null,null,null]);
            expect(response.body.currentPlayer).toBe("X");
    });
});


// GET /games - Returns a list of all IDS or games
describe("GET /games", () => {
    it("returns a list of all active games", async () => {
        const response = await request(app).get("/games").expect(200);
        expect(Array.isArray(response.body)).toBe(true);
    })

    it("returns an empty list when no games exist", async() => {
        const response = await request(app).get("/games").expect(200);
        expect(response.body).toEqual([]);
    })
})

// GET /games:id - Returns game with specific ID or returns 404 for non-existent ID
describe("GET /game/:id", () => {
    it("returns the game with that ID", async () => {
        const createResponse = await request(app).post("/create")
        const gameId = createResponse.body.id;

        const response = await request(app).get(`/game/${gameId}`);

        expect(response.body.id).toBe(gameId);
        expect(response.body.board).toBeDefined();
    })

    it("returns 404 for a non-existent ID", async() => {
        const response = await request(app).get("/game/non-existent-id").expect(404);
        
        expect(response.body).toEqual({error: "Game not found"});
    })
})


// POST /move - Making a move updates the correct game 

//POST /move - Returns error if game ID doesn't exist