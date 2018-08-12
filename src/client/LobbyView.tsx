import * as React from "react";
import { withRouter } from "react-router-dom";
import TextField from "material-ui/TextField";
import {List, ListItem} from "material-ui/List";
import Divider from "material-ui/Divider";
import * as request from "request-promise";

class LobbyView extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            newRoomName: "",
            rooms: [],
        };

        // Remove game from list when it becomes full
        this.props.socket.on("game-full", fullRoom => {
            this.setState({
                rooms: this.state.rooms.filter(room => room !== fullRoom),
            });
        });

        this.props.socket.on("game-joined", () => {
          this.props.history.push("/game");
        });
    }

    public componentDidMount() {
        getOpenGames().then((games) => {
            this.setState({
                rooms: games,
            });
        });
    }

    public onSubmitNewRoom(event) {
        event.preventDefault();
        const gameName = this.cleanInput(this.state.newRoomName);
        if (gameName) {
            createGame(gameName).then((game) => {
                this.setState({
                    rooms: [...this.state.rooms, game.title],
                });
                joinGame(game.title);
            });
        }
    }

    public cleanInput(input: string): string {
        return input.trim().replace("<", "").replace(">", "");
    }

    public onInputChange({target}) {
        this.setState({[target.name]: target.value});
    }

    public onRoomClick(gameName: string) {
        joinGame(gameName);
    }

    public render() {

        const onInputChange = this.onInputChange.bind(this);
        const onRoomClick = room => () => this.onRoomClick(room);
        const onSubmitNewRoom = this.onSubmitNewRoom.bind(this);

        return (
            <div className="room page">
                <h2 id="roomWelcome">
                    Hello! Welcome to Majavashakki.
                    Please, join existing game or create a new one.
                </h2>
                <List>
                    {this.state.rooms.map(room => [<ListItem key={room} onClick={onRoomClick(room)}>{room}</ListItem>, <Divider key={"divider-" + room} />])}
                </List>
                {this.state.error && <p>Error: {this.state.error}</p>}
                <div className="newRoomArea">
                    <form onSubmit={onSubmitNewRoom}>
                        Create new room:
                        <TextField
                            name="newRoomName"
                            hintText="Room name"
                            onChange={onInputChange}
                        />
                    </form>
                </div>
            </div>
        );
    }
}

function getOpenGames() {
    return request({
        method: "GET",
        url: window.location.origin + "/api/games",
        json: true,
    });
}

function createGame(name) {
    return request({
        method: "POST",
        url: window.location.origin + "/api/games",
        body: {name},
        json: true,
    });
}

function joinGame(name) {
    return request({
        method: "POST",
        url: window.location.origin + "/api/games/join",
        body: {name},
        json: true,
    });
}

export default withRouter(LobbyView);
