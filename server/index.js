const seedrandom = require('seedrandom');
const QueryProxy = require('./proxies/QueryProxy');
const PlayerListProxy = require('./proxies/PlayerListProxy');
const Random = require('./Random');
const PlayerCard = require('./PlayerCard');
const { eq } = require('./lib/comparators');
const reducers = require('./lib/reducers');
const seed = Date.now();

app = require('express')();

const cards = QueryProxy.create([]);
for (let i = 0; i < 1000; i++) {
  cards.push(new PlayerCard());
}

console.log('COMMON   :', cards.query(c => c.rarity, eq('common')).length);
console.log('UNCOMMON :', cards.query(c => c.rarity, eq('uncommon')).length);
console.log('RARE     :', cards.query(c => c.rarity, eq('rare')).length);
console.log('EPIC     :', cards.query(c => c.rarity, eq('epic')).length);
console.log('LEGENDARY:', cards.query(c => c.rarity, eq('legendary')).length);

console.log('--------');
console.log('PG  :', cards.query(c => c.position.primary, eq('PG')).length);
console.log('SG  :', cards.query(c => c.position.primary, eq('SG')).length);
console.log('SF  :', cards.query(c => c.position.primary, eq('SF')).length);
console.log('PF  :', cards.query(c => c.position.primary, eq('PF')).length);
console.log('C   :', cards.query(c => c.position.primary, eq('C')).length);

app.get('/api/players/new', (req, res) => {
  res.send(new PlayerCard());
});

app.listen(3000, () => console.log('Running'));
