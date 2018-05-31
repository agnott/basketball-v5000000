const fs = require('fs');
const Random = require('./Random');

const CONFIG = {
  RARITY: {
    LABELS: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    WEIGHTS: [300, 200, 100, 50, 25]
  },
  NAMES: {
    FIRST: fs.readFileSync('./data/first-names.txt').toString().split('\n'),
    LAST: fs.readFileSync('./data/last-names.txt').toString().split('\n')
  },
  ATTRIBUTES: ['speed', 'rebound', 'block', 'steal', 'three', 'mid', 'short', 'dunk', 'pass', 'clutch'],
};

class SetArray {
  constructor(base) {
    this.array = base;
    this.set = new Set(this.array);
  }

  has(k) {
    return this.set.has(k);
  }

  add(k) {
    if (!this.set.has(k)) this.array.push(k);
    return this.set.add(k);
  }

  delete(k) {
    if (this.has(k)) this.array.splice(this.array.indexOf(k), 1);
    return this.set.delete(k);
  }

  values() {
    return this.array;
  }
}


class PlayerCard {
  constructor(config = {}) {
    this.rarity = Random.choiceWeighted(CONFIG.RARITY.LABELS, CONFIG.RARITY.WEIGHTS);
    this.name = {
      first: Random.choice(CONFIG.NAMES.FIRST),
      last: Random.choice(CONFIG.NAMES.LAST),
    };

    this.attributes = this.generateAttributes();
    this.position = this.generatePositions();
  }

  generateAttributes() {
    const availableAttributes = new SetArray(CONFIG.ATTRIBUTES);
    const attributes = {};
    availableAttributes.values().forEach((k) => {
      attributes[k] = 1;
    });

    let attribute;
    const base = 15;
    const variance = Math.floor(Random.triangular(-3, 3, 0));
    const availablePoints = base + variance + CONFIG.RARITY.LABELS.indexOf(this.rarity) * 6;

    for (let i = 0; i < availablePoints; i++) {
      attribute = Random.choice(availableAttributes.values());
      if (++attributes[attribute] >= 10) availableAttributes.delete(attribute);
    }

    return attributes;
  }

  generatePositions() {
    const attrs = this.attributes;
    const positionRankings = [{
      position: 'PG',
      ranking: 3 * attrs['pass'] + 2 * attrs['speed'] + attrs['steal'],
    }, {
      position: 'SG',
      ranking: 3 * attrs['three'] + 2 * attrs['mid'] + attrs['speed'],
    }, {
      position: 'SF',
      ranking: 3 * attrs['mid'] + 2 * attrs['short'] + attrs['dunk'],
    }, {
      position: 'PF',
      ranking: 3 * attrs['dunk'] + 2 * attrs['rebound'] + attrs['short'],
    }, {
      position: 'C',
      ranking: 3 * attrs['rebound'] + 2 * attrs['block'] + attrs['dunk'],
    }].sort((a, b) => b.ranking - a.ranking);

    console.log(positionRankings);

    return {
      primary: positionRankings[0].position,
      secondary: positionRankings[1].position,
    };
  }
}

module.exports = PlayerCard;
