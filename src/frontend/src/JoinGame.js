import React from "react";
import { withRouter } from 'react-router';

class JoinGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clientId: props.clientId,
            stompClient: props.stompClient,
            username: props.username,
            lobbyId: ""
        };
        console.log("props" + JSON.stringify(this.props));

        this.handleLobbyIdChange = this.handleLobbyIdChange.bind(this);
        this.joinGame = this.joinGame.bind(this);
    }

    joinGame(event) {
        event.preventDefault();
        this.props.history.push('/lobby/' + this.state.lobbyId);
    }

    handleLobbyIdChange(event) {
        event.preventDefault();
        this.setState({lobbyId: event.target.value})
    }

    render() {
        return (
            <div id="join-game-content">
                <div id="logo">
                    <img src="logo.svg" alt="logo" />
                </div>
                Welcome {this.state.username}, input the lobby ID you were given then click join!
                <div>
                    <input type="text" name="lobbyId" placeholder="Lobby ID" onChange={this.handleLobbyIdChange} />
                </div>
                <form onSubmit={this.joinGame}>
                    <input type="submit" value="Join game" />
                </form>
            </div>
        );
    }
}

export default withRouter(JoinGame)