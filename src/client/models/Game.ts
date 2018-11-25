import socketIO from "socket.io-client"
import { observable, action} from "mobx";
import * as Majavashakki from "../../common/GamePieces"
import GameEntity from "../../server/entities/Game"
import Board from "../models/Board";
import ApiService from "../common/ApiService";

// TODO: Extend /src/common/Game
export default class Game implements Majavashakki.IGame {
    @observable
    public title: string
    @observable
    public currentTurn: Majavashakki.PieceColor
    @observable
    public playerIdWhite: string
    @observable
    public playerIdBlack: string
    @observable
    public board: Board
    @observable
    public isLoading: boolean
    @observable
    public currentUser: global.IUserContract
    @observable
    public error: string

    private socket: SocketIOClient.Socket

    constructor() {
        this.isLoading = true
    }

    @action
    public loadGame = async (gameName: string) => {
        this.isLoading = true

        this.currentUser = await ApiService.read.user();
        const gameEntity = await ApiService.read.game(gameName);

        const game = GameEntity.MapFromDb(gameEntity)
        this.title = game.title
        this.currentTurn = game.currentTurn
        this.playerIdBlack = game.playerIdBlack
        this.playerIdWhite = game.playerIdWhite
        this.board = game.board as Board

        this.isLoading = false
    }

    public connectSocket = () => {
        this.socket = socketIO()

        this.socket.on("move_result", this.onMoveResult)
    }

    @action
    public move = (start, destination): void => {
        if (!this.doesUserOwnPiece(start)) {
            this.error = "Oi! This is not your piece!"
            return
        }

        if (!this.isUsersTurn()) {
            this.error = "Wait for your turn."
            return
        }

        const result = this.board.move(start, destination)

        if (result.status === Majavashakki.MoveStatus.Success) {
            this.socket.emit("move", {
                gameName: this.title,
                from: start,
                dest: destination,
            });
            this.error = ""
            this.changeTurn()
        } else {
            this.error = result.error
        }
    }

    private getUserColor() {
        if (this.playerIdWhite === this.currentUser.id) return Majavashakki.PieceColor.White
        return Majavashakki.PieceColor.Black
    }

    private doesUserOwnPiece(position: Majavashakki.IPosition) {
        const piece = this.board.getPiece(position)
        if (piece) {
            return this.getUserColor() === piece.color
        }
        return false
    }

    private isUsersTurn() {
        return this.currentTurn === this.getUserColor()
    }

    private changeTurn() {
        if (this.currentTurn === Majavashakki.PieceColor.White) {
            this.currentTurn = Majavashakki.PieceColor.Black
        } else {
            this.currentTurn = Majavashakki.PieceColor.White
        }
    }

    ///
    // Socket methods
    ///

    @action
    private onMoveResult = (move: Majavashakki.IMoveResponse) => {
        if (move.status === Majavashakki.MoveStatus.Success) {
            console.log("Server sent successfull move")
            this.board.move(move.start, move.destination)
            this.error = ""
            this.changeTurn()
        } else {
            this.error = move.error
        }
    }
}