import { describe, it, expect, beforeEach } from "vitest";
import request from 'supertest';
import app from "../server";

beforeEach(async () => {
    await request(app).post("/reset-all")
});

// POST /create - Creating a game returns a game with an ID and creates a new game (empty board and player X first) 
describe("POST /create", () => {
    it("returns a game with an ID", async () => {
        const response = await request(app)
        .post("/create")
        .expect(200);

        expect(response.body.id).toBeDefined();
    });

    it("returns a new game with an empty board", async () => {
            const response = await request(app)
            .post("/create")
            .expect(200);

            expect(response.body.board).toEqual([null,null,null,null,null,null,null,null,null]);
            expect(response.body.currentPlayer).toBe("X");
    });

    it("creates games with unique IDs", async () => {                             
      const response1 = await request(app).post("/create");                     
      const response2 = await request(app).post("/create");                     
                                                                                
      expect(response1.body.id).not.toBe(response2.body.id);                    
  });                                                                           
                                                                                
  it("created game appears in /games list", async () => {                       
      const createResponse = await request(app).post("/create");                
      const gameId = createResponse.body.id;                                    
                                                                                
      const response = await request(app).get("/games");                   
                                                                                
      expect(response.body).toContain(gameId);                             
  });
    
});



// GET /games - Returns a list of all IDS or games
describe("GET /games", () => {
    it("returns a list of all active games", async () => {
        const response = await request(app)
        .get("/games")
        .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it("returns an empty list when no games exist", async() => {
        const response = await request(app)
        .get("/games")
        .expect(200);
       
        expect(response.body).toEqual([]);
    });

    it("returns correct count after creating multiple games", async () => {       
      await request(app).post("/create");                                       
      await request(app).post("/create");                                       
      await request(app).post("/create");                                       
                                                                                
      const response = await request(app).get("/games").expect(200);                        
                                                                                
      expect(response.body.length).toBe(3);                                     
  });
})

// GET /games:id - Returns game with specific ID or returns 404 for non-existent ID
describe("GET /game/:id", () => {
    it("returns the game with that ID", async () => {
        const createResponse = await request(app)
        .post("/create")
        .expect(200)

        const gameId = createResponse.body.id;

        const response = await request(app).get(`/game/${gameId}`);

        expect(response.body.id).toBe(gameId);
        expect(response.body.board).toBeDefined();
    });

    it("returns 404 for a non-existent ID", async() => {
        const response = await request(app)
            .get("/game/non-existent-id")
            .expect(404);
        
        expect(response.body).toEqual({error: "Game not found"});
    });
});


// POST /move - Making a move updates the correct game and Returns error if game ID doesn't exist
describe("POST /move", () => {                                         
      it("updates the correct game", async () => {                       
          // Create a game first                                         
          const createResponse = await request(app)
          .post("/create");     
          const gameId = createResponse.body.id;                         
                                                                         
          // Make a move (position 0, top-left)                          
          const response = await request(app)                            
              .post("/move")                                       
              .send({ gameId: gameId, position: 0 })
              .expect(200);                    
                                                                                                     
          expect(response.body.board[0]).toBe("X");                      
          expect(response.body.currentPlayer).toBe("O");                 
      });                                                                
                                                                         
      it("returns 404 if game ID does not exist", async () => {          
          const response = await request(app)                            
              .post("/move")                                             
              .send({ gameId: "non-existent-id", position: 0 })
              .expect(404);            
                                                                                                    
          expect(response.body).toEqual({ error: "Game not found" });    
      });
      
      it("alternates players correctly", async () => {                          
          const createResponse = await request(app).post("/create");            
          const gameId = createResponse.body.id;                                
                                                                                
          await request(app)                                                    
              .post("/move")                                                    
              .send({ gameId: gameId, position: 0 });                           
                                                                                
          const response = await request(app).get(`/game/${gameId}`);           
                                                                                
          expect(response.body.currentPlayer).toBe("O");                        
      });                                                                        
                                                                                
      it("rejects move on occupied position", async () => {                     
          const createResponse = await request(app).post("/create");            
          const gameId = createResponse.body.id;                                
                                                                                
          await request(app)                                                    
              .post("/move")                                                    
              .send({ gameId: gameId, position: 0 });                           
                                                                                
          const response = await request(app)                                   
              .post("/move")                                                    
              .send({ gameId: gameId, position: 0 })                            
              .expect(400);                                                     
                                                                                
          expect(response.body.error).toBeDefined();                            
      });                                                                        
                                                                                
      it("rejects move with invalid position", async () => {                    
          const createResponse = await request(app).post("/create");            
          const gameId = createResponse.body.id;                                
                                                                                
          const response = await request(app)                                   
              .post("/move")                                                    
              .send({ gameId: gameId, position: 9 })                            
              .expect(400);                                                     
                                                                                
          expect(response.body.error).toBeDefined(); 
  });

});

describe("Game isolation", () => {                                            
      it("multiple games can be played independently", async () => {            
          const createResponse1 = await request(app).post("/create");           
          const createResponse2 = await request(app).post("/create");           
          const gameId1 = createResponse1.body.id;                              
          const gameId2 = createResponse2.body.id;                              
                                                                                
          // Play moves on game1                                                
          await request(app).post("/move").send({ gameId: gameId1, position: 0  
  });                                                                           
          await request(app).post("/move").send({ gameId: gameId1, position: 3  
  });                                                                           
          await request(app).post("/move").send({ gameId: gameId1, position: 1  
  });                                                                           
                                                                                
          // Play different moves on game2                                      
          await request(app).post("/move").send({ gameId: gameId2, position: 4  
  });                                                                           
                                                                                
          const response1 = await request(app).get(`/game/${gameId1}`);         
          const response2 = await request(app).get(`/game/${gameId2}`);         
                                                                                
          // Game 1: X at 0,1 and O at 3                                        
          expect(response1.body.board).toEqual(["X","X",null,"O",null,null,null,
  null,null]);                                                                  
                                                                                
          // Game 2: X at 4 only                                                
          expect(response2.body.board).toEqual([null,null,null,null,"X",null,null,null,null]);                                                                
      });                                                                       
  }); 