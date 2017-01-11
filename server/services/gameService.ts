import { GameCollection, UserCollection } from '../model';
import { SocketService } from '../services';
import * as Dto from '../../shared/dto';
import { Mapper } from '../utils/mapper';

export class GameService {
    constructor(private io: SocketIO.Server, private socket: SocketIO.Socket, private socketService: SocketService,
        private users: UserCollection, private games: GameCollection) {
        this.initialize();
    }

    private initialize() {
        this.socketService.on<null, Dto.GamePublic>('create-game', request => {
            var user = this.users.getUserById(this.socket.id);

            try {
                var game = this.games.addGame(user);
                return Mapper.mapGameToPublic(game);
            } catch (error) {
                throw error;
            }
        });

        this.socketService.on<Dto.JoinGame, Dto.GamePublic>('join-game', request => {
            var game = this.games.getGameById(request.data.gameId);
            if (!game) {
                throw (`Game doesn\'t exist with id: ${request.data.gameId}`);
            }
            this.socketService.join(request.data.gameId);

            var hideCards = game.state === Dto.GameState.Voting;

            if (!request.data.spectate) {
                var user = this.users.getUserById(this.socket.id);

                if (!game.getPlayerByPid(user.pid)) {
                    game.addPlayer(user);
                    this.socketService.emitAllInRoomExceptSender('user:join-game', Mapper.mapPlayerToPublic(game.getPlayerByPid(user.pid), hideCards), game.id);
                }
            }

            return Mapper.mapGameToPublic(game);
        });

        this.socketService.on<Dto.ChangeGameState, null>('change-game-state', request => {
            var user = this.users.getUserById(this.socket.id);
            var game = this.games.getGameById(request.data.gameId);

            if (game.host.user.sid !== user.sid) {
                throw 'Only host can change game state';
            }

            game.state = request.data.gameState;

            if (game.state === Dto.GameState.Voting)
                game.resetCards();

            this.socketService.emitAllInRoom('host:change-game-state', Mapper.mapGameToPublic(game), game.id);

            return null;
        });

        this.socketService.on<Dto.ChooseCard, null>('choose-card', request => {
            var user = this.users.getUserById(this.socket.id);
            var game = this.games.getGameById(request.data.gameId);

            if (game.state !== Dto.GameState.Voting) {
                throw 'Cards can only be chosen in voting state';
            }

            var player = game.getPlayerByPid(user.pid);
            player.currentCard = request.data.newCard;

            this.socketService.emitAllInRoomExceptSender('user:choose-card', Mapper.mapPlayerToPublic(player, true), game.id);

            return null;
        });
    }
}