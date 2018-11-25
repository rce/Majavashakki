import Board from "../../src/common/Board";
import { PieceColor, PieceType, MoveStatus, IPosition } from "../../src/common/GamePieces"
import Piece from "../../src/common/pieces/Piece";
import Pawn from "../../src/common/pieces/Pawn";
import Rook from "../../src/common/pieces/Rook";
import Bishop from "../../src/common/pieces/Bishop";
import Queen from "../../src/common/pieces/Queen";
import King from "../../src/common/pieces/King";
import Knight from "../../src/common/pieces/Knight";

export function moveSequence(board: Board, moves: string[][]) {
    const results = [];

    for (const move of moves) {
        const action = board.move(stringToPosition(move[0]), stringToPosition(move[1]));
        if (action.status === MoveStatus.Success) {
            let result: string = action.result
            if (action.isCheckmate) result += "|checkmate"
            else if (action.isCheck) result += "|check"

            results.push(result);
        } else {
            results.push(action.status);
        }
    }

    return results;
}

function stringToPosition(str): IPosition {
    if (!str || str.length !== 2) return null;

    const colIndex = Board.cols.indexOf(str.charAt(0));
    const rowIndex = Board.rows.indexOf(str.charAt(1));

    if ( colIndex === -1 || rowIndex === -1 ) return null;

    return {
        col: Board.cols[colIndex],
        row: Board.rows[rowIndex],
    };
}

export function createPiece(pos: string, type: PieceType, color: PieceColor, hasMoved: boolean, board: Board): Piece {
    let piece: Piece

    if (type === PieceType.Pawn) piece = new Pawn(color, stringToPosition(pos), board)
    else if (type === PieceType.Rook) piece = new Rook(color, stringToPosition(pos), board)
    else if (type === PieceType.Bishop) piece = new Bishop(color, stringToPosition(pos), board)
    else if (type === PieceType.Knight) piece = new Knight(color, stringToPosition(pos), board)
    else if (type === PieceType.Queen) piece = new Queen(color, stringToPosition(pos), board)
    else if (type === PieceType.King) piece = new King(color, stringToPosition(pos), board)

    piece.hasMoved = hasMoved

    return piece
}