const seedrandom = require('seedrandom');
const QueryProxy = require('./QueryProxy');
const Random = require('./Random');
const Player = require('./Player');
const comps = require('./lib/comparators');
const seed = Date.now();
console.log(seed);
// seedrandom(321, { global: true });

class FreeAgentPool {
  constructor(size) {
    this.internal = { players: [] };
    this.players = QueryProxy.create(this.internal.players);
    this.addPlayers(size);
  }

  addPlayers(amount = 10) {
    for (let i = 0; i < amount; i++) this.internal.players.push(new Player());
  }
}

class Team {
  constructor() {
    this.internal = { players: [] };
    this.players = QueryProxy.create(this.internal.players);
  }
}

const fa = new FreeAgentPool(100);
const t = new Team();

for (let i = 0; i < 10; i++) t.players.push(new Player());

console.log('PG', fa.players.query(p => p.position.primary, comps.eq('PG')).length);
console.log('SG', fa.players.query(p => p.position.primary, comps.eq('SG')).length);
console.log('SF', fa.players.query(p => p.position.primary, comps.eq('SF')).length);
console.log('PF', fa.players.query(p => p.position.primary, comps.eq('PF')).length);
console.log('C ', fa.players.query(p => p.position.primary, comps.eq('C')).length);
fa.players
.query(p => p.attributes.overall(), comps.gteq(85))
.map((p) => {
  console.log(p.name.full, ':', p.attributes.overall());
});

const app = require('express')();

app.get('/api/freeagents', (req, res) => {
  // res.send(fa.players.map(p => p.toPlainObject()));
  res.send(
    fa.players.random()
  );
});

app.listen(3000, () => console.log('Running'));


// let p, o, v, avg = 0, count = 400;
// const outputs = {};
// for(let i = 0; i < count; i++) {
//   p = new Player();
//   o = Math.floor(p.attributes.overall());
//   v = outputs[o];
//   avg += o / count;
//   outputs[o] = v ? v + 1 : 1;
// }
// console.log(outputs);
// console.log(avg);
