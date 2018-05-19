const seedrandom = require('seedrandom');
const QueryProxy = require('./QueryProxy');
const Random = require('./Random');
seedrandom('test', { global: true });

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
        return x => args[0](x) && this.or(...(args.slice(1)))(x);
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
    this.array = ['clutchness', 'cooperativeness', 'expressiveness', 'greediness'];
    this.object = {};
    this.array.forEach((attr) => {
      this.object[attr] = Random.triangular(0, 100, 50);
    });
  }
}

class Name {
  constructor() {
    this.first = Random.choice(['TIM', 'JIM', 'MARK', 'MIKE', 'TOM', 'JOHN']);
    this.last = Random.choice(['SMITH', 'JONES', 'JAMES', 'OCEAN', 'PITT', 'JACKSON']);
  }
  get full() {
    return `${this.first} ${this.last}`;
  }
}

class Player {
  constructor() {
    this.name = new Name();
    this.attributes = new Attributes();
    this.personality = new Personality();
  }
}

class Team {
  constructor() {
    this.internal = { players: [] };
    this.players = QueryProxy.create(this.internal.players);
  }
}

const t = new Team();

for (let i = 0; i < 20; i++) t.players.push(new Player());

const ordered = t.players.map(p => p.name.full);
console.log(ordered);
console.log(t.players.random());


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
