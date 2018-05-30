const seedrandom = require('seedrandom');
const QueryProxy = require('./proxies/QueryProxy');
const PlayerListProxy = require('./proxies/PlayerListProxy');
const Random = require('./Random');
const Player = require('./Player');
const Contract = require('./Contract');
const Team = require('./Team');
const comps = require('./lib/comparators');
const reducers = require('./lib/reducers');
const seed = Date.now();
console.log(seed);
seedrandom(1527123079171, { global: true });

const inchesToFeetInches = (inputInches) => {
  const feet = Math.floor(inputInches / 12);
  const inches = inputInches % 12;
  return `${feet}-${inches}`;
};

class FreeAgentPool {
  constructor(size) {
    this.internal = { players: [] };
    this.players = PlayerListProxy.create(this.internal.players);
    this.addPlayers(size);
  }

  addPlayers(amount = 10) {
    for (let i = 0; i < amount; i++) this.internal.players.push(new Player());
  }
}

class DraftProspectPool {
  constructor(size) {
    this.internal = { players: [] };
    this.players = PlayerListProxy.create(this.internal.players);

    this.addPlayers(size);
  }

  addPlayers(amount = 10) {
    for (let i = 0; i < amount; i++) this.internal.players.push(new Player({ age: Random.triangular(18, 24, 20) }));
  }
}

const fa = new FreeAgentPool(450);
const dp = new DraftProspectPool(50);

console.log('- FREE AGENTS ----------------------------------------');
['PG', 'SG', 'SF', 'PF', 'C'].forEach((pos) => {
  const players = fa.players.query(p => p.position.primary, comps.eq(pos));
  if (!players.length) return;
  const avgHeight = inchesToFeetInches(players.map(p => p.height.height).reduce(reducers.sum) / players.length);
  const avgRebounding = players.map(p => p.attributes.object.rebound).reduce(reducers.avg, 0);

  console.log(pos, players.length, avgHeight, avgRebounding);
});

console.log('Overall: ', fa.players.map(p => p.attributes.overall).reduce(reducers.avg, 0));
console.log('Retired: ', fa.players.map(p => p.retiring()).reduce(reducers.sum));

console.log('Young: ', fa.players.query(p => p.age.age, comps.lteq(25)).map(p => p.attributes.overall).reduce(reducers.avg, 0));
console.log('Old: ', fa.players.query(p => p.age.age, comps.gteq(35)).map(p => p.attributes.overall).reduce(reducers.avg, 0));


['benchwarmer', 'backup', 'roleplayer', 'starter', 'star', 'allstar', 'superstar', 'legend'].forEach((level) => {
  const players = fa.players.level(level);
  console.log(level, ':' , players.count());
});
//
// console.log('- DRAFT PROSPECTS ----------------------------------------');
// ['PG', 'SG', 'SF', 'PF', 'C'].forEach((pos) => {
//   const players = dp.players.query(p => p.position.primary, comps.eq(pos));
//   if (!players.length) return;
//   const avgHeight = inchesToFeetInches(players.map(p => p.height.height).reduce(reducers.sum) / players.length);
//   const avgRebounding = players.map(p => p.attributes.object.rebound).reduce(reducers.avg, 0);
//
//   console.log(pos, players.length, avgHeight, avgRebounding);
// });
//
// console.log('Overall: ', dp.players.map(p => p.attributes.overall).reduce(reducers.avg, 0));
// console.log('Retired: ', dp.players.map(p => p.retiring()).reduce(reducers.sum));
//
// console.log('Young: ', dp.players.query(p => p.age.age, comps.lteq(25)).map(p => p.attributes.overall).reduce(reducers.avg, 0));
// console.log('Old: ', dp.players.query(p => p.age.age, comps.gteq(35)).map(p => p.attributes.overall).reduce(reducers.avg, 0));
//
//
// ['benchwarmer', 'backup', 'roleplayer', 'starter', 'star', 'allstar', 'superstar', 'legend'].forEach((level) => {
//   const players = dp.players.level(level);
//   console.log(level, ':' , players.count());
// });
//
// console.log(dp.players.potential(comps.gteq(90)).length);
// console.log(dp.players.potential(comps.lteq(60)).length);

// console.log('Distributions\n-------------');
// for (var i = 0; i < 20; i++) {
//   const min = i * 5;
//   const max = (i + 1) * 5;
//   const players = fa.players.query(p => p.attributes.overall, comps.between(min, max));
//   console.log(`[${min}, ${max}]`, players.length, players.map(p => p.age.age).reduce(reducers.avg, 0));
// }

// const p = new Player({ age: 18 });
// console.log('---------');
// console.log('Peak: ', p.attributes.peakAge);
// console.log('---------');
// for (let i = 0; i < 20; i++) {
//   console.log(p.age.age, p.age.scaled, p.attributes.overall);
//   p.progress();
// }
// console.log(p.age.age, p.age.scaled, p.attributes.overall);

const p = new Player();

p.offer(new Contract({ years: 3, payments: [12, 14, 15] }));
p.offer(new Contract({ years: 2, payments: [20, 22], noTrade: true }));

p.chooseOffer();

const app = require('express')();

const playerFilter = (players) => (req, res) => {
  const position = req.query.position && req.query.position.toUpperCase();
  const primaryPostion = req.query.primaryPosition && req.query.primaryPosition.toUpperCase();
  const secondaryPosition = req.query.secondaryPosition && req.query.secondaryPosition.toUpperCase();

  const fullName = req.query.fullName && req.query.fullName.toUpperCase();
  const firstName = req.query.firstName && req.query.firstName.toUpperCase();
  const lastName = req.query.lastName && req.query.lastName.toUpperCase();

  const level = req.query.level && req.query.level.toLowerCase();

  let list = players;

  if (primaryPostion)
    list = list.position(primaryPostion, true);
  if (secondaryPosition)
    list = list.position(secondaryPosition, false, true);
  if (position)
    list = list.position(position);

  if (fullName)
    list = list.query(p => p.name.full, comps.eq(fullName));
  if (firstName)
    list = list.query(p => p.name.first, comps.eq(firstName));
  if (lastName)
    list = list.query(p => p.name.last, comps.eq(lastName));

  if (level)
    list = list.level(level);

  return list;
};

const freeAgentFilter = playerFilter(fa.players);

app.get('/api/freeagents', (req, res) => {
  res.send(freeAgentFilter(req, res));
});
app.get('/api/freeagents/random', (req, res) => {
  res.send(freeAgentFilter(req, res).random());
});

app.listen(3000, () => console.log('Running'));
