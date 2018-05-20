const seedrandom = require('seedrandom');
const QueryProxy = require('./QueryProxy');
const Random = require('./Random');
const fs = require('fs');
const seed = Date.now();
console.log(seed);
// seedrandom(321, { global: true });

const reducers = {
  sum(acc, val) {
    return acc + val;
  },
};

const comparators = {
  gt(c) {
    return x => x > c;
  },
  lt(c) {
    return x => x < c;
  },
  gteq(c) {
    return x => x >= c;
  },
  lteq(c) {
    return x => x <= c;
  },
  eq(c) {
    return x => x == c;
  },
  between(a, b) {
    return x => a < x && b > x;
  },
  betweenInclusive(a, b) {
    return x => a <= x && b >= x;
  },
  outside(a, b) {
    return x => a > x || b < x;
  },
  outsideInclusive(a, b) {
    return x => a >= x || b <= x;
  },
  matches(regex) {
    return x => x.match(regex);
  },
  includes(c) {
    return x => x.includes(c);
  },
  // Composition helpers
  not(fn) {
    return x => !fn(x);
  },
  or(...args) {
    switch (args.length) {
      case 1:
        return x => args[0](x);
      default:
        return x => args[0](x) || this.or(...(args.slice(1)))(x);
    }
  },
  and(...args) {
    switch (args.length) {
      case 1:
        return x => args[0](x);
      default:
        return x => args[0](x) && this.and(...(args.slice(1)))(x);
    }
  }
};
const comps = comparators;

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
    this.rankings = positions
    .map((pos) => {
      let rating = pos.formula.map((form) => form[0] * attributes[form[1]]).reduce(reducers.sum);
      const diff = Math.abs(pos.height - height.height);
      const calculated = (-15 * diff + 100) ** 3 / 20 ** 3;
      console.log(height.height, rating, diff, calculated, rating + calculated);
      rating += calculated || 0;
      return {
        position: pos.name,
        rating,
      };
    })
    .sort((a, b) => b.rating - a.rating);

    this.primary = this.rankings[0].position;
    this.secondary = this.rankings[1].position;
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
        if (!('property' in target)) return target.object[property];
        return target[property]
      }
    });
    this.personality = new Personality();
    this.height = new Height();
    this.weight = new Weight(this.height);
    this.position = new Position(this.attributes, this.height, this.weight);
  }
}

class Team {
  constructor() {
    this.internal = { players: [] };
    this.players = QueryProxy.create(this.internal.players);
  }
}

const t = new Team();

for (let i = 0; i < 10; i++) t.players.push(new Player());

console.log('PG', t.players.query(p => p.position.primary, comps.eq('PG')).length);
console.log('SG', t.players.query(p => p.position.primary, comps.eq('SG')).length);
console.log('SF', t.players.query(p => p.position.primary, comps.eq('SF')).length);
console.log('PF', t.players.query(p => p.position.primary, comps.eq('PF')).length);
console.log('C ', t.players.query(p => p.position.primary, comps.eq('C')).length);
console.log(t.players);


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
