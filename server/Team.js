const QueryProxy = require('./proxies/QueryProxy');
const PlayerListProxy = require('./proxies/PlayerListProxy');

class Team {
  constructor() {
    this.internal = { players: [] };
    this.players = PlayerListProxy.create(QueryProxy.create(this.internal.players));
  }


}

module.exports = Team;
