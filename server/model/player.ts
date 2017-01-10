import { User } from './user';
import { PokerCard } from '../../dto/pokerCard';

export class Player {
  get user() { return this._user; }
  get currentCard() { return this._currentCard; }
  set currentCard(value) { this._currentCard = value; }

  private _user: User;
  private _currentCard: PokerCard = PokerCard.NotPicked;
  
  constructor(user: User) {
    this._user = user;
  }
}