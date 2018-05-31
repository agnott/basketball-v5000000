const seedrandom = require('seedrandom');
const QueryProxy = require('./proxies/QueryProxy');
const PlayerListProxy = require('./proxies/PlayerListProxy');
const Random = require('./Random');
const PlayerCard = require('./PlayerCard');
const comps = require('./lib/comparators');
const reducers = require('./lib/reducers');
const seed = Date.now();

app = require('express')();

app.get('/api/players/new', (req, res) => {
  const cards = QueryProxy.create([]);
  for (let i = 0; i < 0; i++) {
    cards.push(new PlayerCard());
  }

  console.log('COMMON   :', cards.query(c => c.rarity, comps.eq('common')).length);
  console.log('UNCOMMON :', cards.query(c => c.rarity, comps.eq('uncommon')).length);
  console.log('RARE     :', cards.query(c => c.rarity, comps.eq('rare')).length);
  console.log('EPIC     :', cards.query(c => c.rarity, comps.eq('epic')).length);
  console.log('LEGENDARY:', cards.query(c => c.rarity, comps.eq('legendary')).length);
  res.send(new PlayerCard());
});

app.listen(3000, () => console.log('Running'));
