const fs = require('fs');
const Random = require('./Random');
const reducers = require('./lib/reducers');

class Attributes {
  constructor() {
    this.array = [
      'speed',
      'rebound',
      'block',
      'steal',
      'three',
      'mid',
      'short',
      'dunk',
      'pass',
      'stamina',
      'clutch',
    ];
    this.object = {};
    this.array.forEach((attr) => {
      this.object[attr] = Random.triangular(0, 100, 50);
    });
  }

  overall() {
    const v = Object.values(this.object);
    const exp = 0.675;
    const s = v.map((val) => val ** exp).reduce(reducers.sum);
    return Math.min(99, s / ((100 ** exp) * v.length) * 100 + 15);
  }

  *[Symbol.iterator]() {
    for (let pair of Object.entries(this.object)) yield pair;
  }
}

class Personality {
  constructor() {
    this.array = ['cooperativeness', 'expressiveness', 'greediness'];
    this.object = {};
    this.array.forEach((attr) => {
      this.object[attr] = Random.triangular(0, 100, 50);
    });
  }
}

const CONFIG = {
  HEIGHT: { MIN: 69, MAX: 88, MODE: 81 },
  WEIGHT: { MIN: 150, MAX: 300, MODE: 240 },
  NAMES: {
    FIRST: fs.readFileSync('./data/first-names.txt').toString().split('\n'),
    LAST: fs.readFileSync('./data/last-names.txt').toString().split('\n')
  }
}

class Height {
  constructor() {
    this.min = CONFIG.HEIGHT.MIN;
    this.max = CONFIG.HEIGHT.MAX;
    this.mode = CONFIG.HEIGHT.MODE;

    this.height = Random.triangular(this.min, this.max, this.mode);
    if (this.height === this.min) this.height += 0.1;
    this.scaled = (this.height - this.min) / (this.max - this.min);
  }

  get display() {
    const feet = Math.floor(this.height / 12);
    const inches = Math.floor(this.height % 12);
    return `${feet}-${inches}`;
  }
}

class Weight {
  constructor(height) {
    this.min = CONFIG.WEIGHT.MIN,
    this.max = CONFIG.WEIGHT.MAX,
    this.mode = CONFIG.WEIGHT.MODE,

    this.weight = Random.triangular(
      this.min + this.min * height.scaled ** 2.25,
      this.min + this.min * height.scaled ** 0.25,
      this.min + this.min * height.scaled ** 0.85,
    );
  }

  get display() {
    return this.weight;
  }
}


/*
  Determines posiion by combining particular attributes and seeing which positions
  have a viable combination
*/
class Position {
  constructor(attributes, height, weight) {
    const positions = [
      {
        name: 'PG',
        formula: [
          [3, 'speed'],
          [3, 'pass'],
          [2, 'three'],
          [1, 'steal'],
          [1, 'mid'],
        ],
        height: 73,
      },
      {
        name: 'SG',
        formula: [
          [2, 'speed'],
          [2, 'pass'],
          [2, 'three'],
          [1, 'mid'],
          [1, 'short'],
          [1, 'dunk'],
          [1, 'steal'],
        ],
        height: 76,
      },
      {
        name: 'SF',
        formula: [
          [1, 'speed'],
          [2, 'rebound'],
          [1, 'three'],
          [1, 'mid'],
          [2, 'short'],
          [2, 'dunk'],
          [1, 'pass'],
        ],
        height: 79,
      },
      {
        name: 'PF',
        formula: [
          [1, 'speed'],
          [3, 'rebound'],
          [2, 'block'],
          [2, 'short'],
          [2, 'dunk'],
        ],
        height: 82,
      },
      {
        name: 'C',
        formula: [
          [4, 'rebound'],
          [3, 'block'],
          [2, 'dunk'],
          [1, 'short'],
        ],
        height: 85,
      },
    ];

    // Calculates the viability at each position
    const rankings = positions
    .map((pos) => {
      let rating = pos.formula.map((form) => form[0] * attributes[form[1]]).reduce(reducers.sum);
      const diff = Math.abs(pos.height - height.height);
      const calculated = 2 * (-15 * diff + 100) ** 3 / 20 ** 3;
      rating += calculated || 0;
      return {
        position: pos.name,
        rating,
      };
    })
    .sort((a, b) => b.rating - a.rating);

    this.primary = rankings[0].position;
    this.secondary = rankings[1].position;
  }
}

class Name {
  constructor() {
    this.first = Random.choice(CONFIG.NAMES.FIRST);
    this.last = Random.choice(CONFIG.NAMES.LAST);
  }
  get full() {
    return `${this.first} ${this.last}`;
  }
}

class Player {
  constructor() {
    this.name = new Name();
    this.attributes = new Proxy(new Attributes(), {
      get(target, property) {
        if (!(property in target)) return target.object[property];
        return target[property]
      }
    });
    this.personality = new Personality();
    this.height = new Height();
    this.weight = new Weight(this.height);
    this.position = new Position(this.attributes, this.height, this.weight);
  }

  toPlainObject() {
    return {
      name: {
        first: this.name.first,
        last: this.name.last,
        full: this.name.full,
      },
      attributes: this.attributes.object,
      overall: this.attributes.overall(),
      personality: this.personality.object,
      height: {
        inches: this.height.height,
        scaled: this.height.scaled,
        display: this.height.display,
      },
      weight: this.weight.weight,
      position: {
        primary: this.position.primary,
        secondary: this.position.secondary,
      },
    }
  }
}

module.exports = Player;
