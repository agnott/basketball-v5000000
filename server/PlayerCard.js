const fs = require('fs');
const Random = require('./Random');
const SVG = require('./lib/svg/svg');

const CONFIG = {
  RARITY: {
    LABELS: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    WEIGHTS: [300, 200, 100, 50, 20]
  },
  NAMES: {
    FIRST: fs.readFileSync('./data/first-names.txt').toString().split('\n'),
    LAST: fs.readFileSync('./data/last-names.txt').toString().split('\n')
  },
  ATTRIBUTES: ['speed', 'rebound', 'block', 'steal', 'three', 'mid', 'short', 'dunk', 'pass', 'clutch'],
};

class SetArray {
  constructor(base = []) {
    this.array = [...base];
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
    this.rarity = (CONFIG.RARITY.LABELS.includes(config.rarity)) ?
      config.rarity : Random.choiceWeighted(CONFIG.RARITY.LABELS, CONFIG.RARITY.WEIGHTS);
    this.name = {
      first: Random.choice(CONFIG.NAMES.FIRST),
      last: Random.choice(CONFIG.NAMES.LAST),
    };

    this.attributes = this.generateAttributes();
    this.position = this.generatePositions();
    this.svg = this.generateSvg();
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
      attribute = Random.choiceWeighted(availableAttributes.values(), availableAttributes.values().map(v => attributes[v] ** 0.5));
      if (++attributes[attribute] >= 10) availableAttributes.delete(attribute);
    }

    return attributes;
  }

  generatePositions() {
    const attrs = this.attributes;
    const scaledSpeed = attrs['speed'] - 2.9;
    const positionRankings = [{
      position: 'PG',
      ranking: 5 * attrs['pass']
        + 4 * attrs['steal']
        + 3 * attrs['three']
        + 2 * attrs['mid']
        + attrs['short']
        + 4 * scaledSpeed,
    }, {
      position: 'SG',
      ranking: 5.75 * attrs['three']
        + 4 * attrs['mid']
        + 3 * attrs['steal']
        + 2 * attrs['pass']
        + attrs['short']
        + 2 * scaledSpeed,
    }, {
      position: 'SF',
      ranking: 6 * attrs['mid']
        + 4 * attrs['short']
        + 3 * attrs['dunk']
        + 2 * attrs['three']
        + attrs['pass']
        + 1 * scaledSpeed,
    }, {
      position: 'PF',
      ranking: 5.75 * attrs['short']
        + 4 * attrs['dunk']
        + 3 * attrs['rebound']
        + 2 * attrs['block']
        + attrs['mid']
        - 2 * scaledSpeed,
    }, {
      position: 'C',
      ranking: 5 * attrs['rebound']
        + 4 * attrs['block']
        + 3 * attrs['dunk']
        + 2 * attrs['short']
        + attrs['mid']
        - 4 * scaledSpeed,
    }].sort((a, b) => b.ranking - a.ranking);

    return {
      primary: positionRankings[0].position,
      secondary: positionRankings[1].position,
    };
  }

  generateSvg() {
    const svg = new SVG(1000, 1000);

    const group = SVG.Group(null, { thingProp: 575, });
    group.add(SVG.Circle(10, 10, 4));

    svg.add(group);

    return svg.render();
  }
}

module.exports = PlayerCard;
