import React from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

export default class Lobby extends React.Component {
    constructor(props) {
        super(props);
        const pathname = window.location.pathname.split("/");

        this.state = {
            username: localStorage.getItem("username"),
            lobbyId: pathname[pathname.length - 1],
            joined: false
        };

        this.startGame = this.startGame.bind(this);
        this.setUsername = this.setUsername.bind(this);
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
    }

    componentDidMount() {
        this.connect();
    }

    connect() {
        let socket = new SockJS("/websocket");
        let stompClient = Stomp.over(socket);
        let me = this;

        stompClient.connect({}, function(frame) {
            me.setState({stompClient: stompClient});
            let disconnect = e => stompClient.disconnect();
            window.addEventListener("beforeunload", disconnect.bind(me));

            stompClient.subscribe("/topic/lobby." + me.state.lobbyId, function(response) {
                let responseObj = JSON.parse(response.body);
                const responseType = responseObj.responseType;
                if(responseType === "START_GAME") {
                    me.setState({
                        gameState: responseObj.gameState,
                        game: responseObj.game
                    });
                } else if(responseType === "JOIN_GAME") {
                    me.setState({ joined: me.state.clickedSetUsername,
                                  gameState: responseObj.lobby.gameState,
                                  lobby: responseObj.lobby
                                });
                }
            });
        }, function(frame) {
            console.log("error connecting! " + JSON.stringify(frame))
        });
    }

    startGame(event) {
        event.preventDefault();
        this.state.stompClient.send("/app/lobby." + this.state.lobbyId + ".startGame", {},
            JSON.stringify({username: localStorage.getItem("username")}));
    }

    setUsername(event) {
        event.preventDefault()
        this.setState({ clickedSetUsername: true });
        this.state.stompClient.send("/app/lobby." + this.state.lobbyId + ".joinGame", {}, this.state.username);
    }

    handleUsernameChange(event) {
        this.setState({username: event.target.value});
        localStorage.setItem("username", event.target.value);
    }

    render() {
        if(!this.state.stompClient) {
            return (
                <div>
                    Connecting to lobby, please wait...
                </div>
            );
        }else if(!this.state.joined) {
            return (
                <div id="set-user-info-content">
                    <div id="logo">
                        <img src="../../logo.svg" alt="logo" />
                    </div>
                    <div>
                        <input type="text" name="username" placeholder="Name" onChange={this.handleUsernameChange} value={this.state.username} />
                    </div>
                    <form onSubmit={this.setUsername}>
                        <input type="submit" value="Set username" />
                    </form>
                </div>
            );
        } else if(this.state.lobby && this.state.gameState === "GATHERING_PLAYERS") {
            let players = this.state.lobby.players.map(player => <li>{player}</li>);
             return (
                 <div id="lobby-content">
                     <div id="logo">
                         <img src="../../logo.svg" alt="logo" />
                     </div>
                     Players:
                     <div>
                         <ul>
                             {players}
                         </ul>
                     </div>
                    { this.state.lobby.creator === this.state.username &&
                         <form onSubmit={this.startGame}>
                             <input type="submit" value="Start game" />
                         </form>
                    }
                 </div>
             );
         } else if(this.state.gameState === "PLAYING") {
             let lobby = this.state.lobby;
            let players = lobby.players.map(player => <li>{player}</li>);
            let stories = lobby.game.liveStories[this.state.username];
            let currentStory = stories[0].messages.join(" ");

            return (
                <div id="lobby-content">
                    You are playing a game with:
                    <div>
                        <ul>
                            {players}
                        </ul>
                    </div>
                    <div>
                        You have {stories.size} stories in queue.
                    </div>
                    <div>

                    </div>

                </div>
            );
        }
    }
}
