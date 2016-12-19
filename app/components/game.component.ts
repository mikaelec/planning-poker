import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GameState } from '../../DTO/gameState';
import { PlayerPublic } from '../../DTO/playerPublic';
import { SocketService } from '../services/socket.service';
import { UserService } from '../services/user.service';

@Component({
  templateUrl: 'views/game',
  styles: [`.vote {
              display: inline-block;
              margin: 10px;
              padding: 10px;
              text-align: center;
              border-radius: 5px;
            }

            div.user, div.user div.poker-card {
              border-color: #357ebd;
              color: #357ebd;
            }

            .user:hover, .pickable:hover {
              background-color: #f5f5f5;
              cursor:  pointer;
            }

            div.poker-card {
              box-shadow: 2px 2px 4px #bbbbbb;
              margin: auto;
              padding-top: 50%;
              width: 70px;
              height: 100px;
              font-size: 28px;
              text-align: center;
              border: 2px solid black;
              border-radius: 5px;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }

            .selected div.poker-card {
              border-color: #357ebd;
              color: #357ebd;
              font-weight: bold;
            }`]
})
export class GameComponent implements OnInit {
  get gameId() { return this._gameId; }
  get userPid() { return this.user.userPid; }
  get hostPid() { return this._hostPid; }
  get playersList() {
    return Object.keys(this.players)
      .map(pid => this.players[pid])
      .sort((a, b) => this.strcmp(a.user.userName, b.user.userName));
  }
  get isVoting() { return this.state === GameState.Voting; }
  state: GameState = GameState.Waiting;

  private _gameId: string;
  private players: { [id: string]: PlayerPublic } = {};
  private _hostPid: string = '';

  constructor(private route: ActivatedRoute, private socket: SocketService, private user: UserService) {
    
  }

  ngOnInit() {
    this._gameId = this.route.snapshot.params['id'];

    this.socket.emit('join-game', { gameId: this._gameId }, (error, data) => {
      if (error)
        console.info(error);
      else {
        this.players = data.players;
        this._hostPid = data.hostPid;
        console.info('Requested game: %o', data);
      }
    });

    this.socket.on('user:join-game', (player: PlayerPublic) => {
      this.players[player.user.pid] = player;
      console.info('Player joined: %o', player);
    });
  }

  private strcmp(a: string, b: string) {
    return (a == b) ? 0 : ((a > b) ? 1 : -1);
  }
}