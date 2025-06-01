import { Room, ExtendedWebSocket, EliminationResult, Difficulty } from '../types';
export declare class GameStateManager {
    private rooms;
    private playerConnections;
    createRoom(hostName: string): Room;
    joinRoom(roomCode: string, playerName: string): Room | null;
    removePlayer(roomCode: string, playerName: string): Room | null;
    getRoom(roomCode: string): Room | null;
    startGame(roomCode: string, difficulty?: Difficulty): Room | null;
    startTurn(roomCode: string): Room | null;
    endTurn(roomCode: string, selectedLetter: string): Room | null;
    eliminatePlayer(roomCode: string): EliminationResult | null;
    endRound(roomCode: string): EliminationResult | null;
    cleanupRooms(): void;
    saveRoom(room: Room): Promise<void>;
    loadRoom(roomCode: string): Promise<Room | null>;
    saveGameEvent(roomCode: string, event: any): Promise<void>;
    getPlayerConnection(playerName: string): ExtendedWebSocket | undefined;
    setPlayerConnection(playerName: string, ws: ExtendedWebSocket): void;
    removePlayerConnection(playerName: string): void;
}
//# sourceMappingURL=GameStateManager.d.ts.map