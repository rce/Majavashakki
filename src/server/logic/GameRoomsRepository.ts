import GameEntity from "../entities/Game";
import { Game , IGameDocument } from "../models/Game";

export class GameRoomsRepository {
    public static getInstance(): GameRoomsRepository {
        return GameRoomsRepository.instance;
    }
    private static instance: GameRoomsRepository = new GameRoomsRepository();

    private constructor() {
        if (GameRoomsRepository.instance) {
            throw new Error("The GameRoomRepository is a singleton class and cannot be created!");
        }
        GameRoomsRepository.instance = this;
    }

    // TODO make sense into different game interfaces (one too many? move some of the Game class logic into IGameDocument?)
    // also don't pass around sockets, too late too lazy
    public async joinRoom(doc: IGameDocument, socket: any, userId: string): Promise<IGameDocument> {
        const game = GameEntity.MapFromDb(doc.toObject());
        if (game.containsUser(userId)) return doc;

        if (game.isFull()) throw new Error(`User '${userId}' is trying to join game '${doc.id}' which is already full!`);

        game.addPlayer(userId);
        return await Game.updateOrCreate(game);
    }
}
