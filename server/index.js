const seedrandom = require('seedrandom');
// seedrandom('test', { global: true });

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

class Random {
  constructor() {
    this.defaults = {
      min: 0,
      max: 100,
      mode: 50,
    };
  }

  random() {
    return Math.random();
  }

  float(min = this.defaults.min, max = this.defaults.max) {
    // Namespaced methods
    this.float.triangular = (...args) => this.triangular(...args);

    return min + this.random() * (max - min);
  }

  int(min = this.defaults.min, max = this.defaults.max) {
    // Namespaced methods
    this.int.triangular = (...args) => Math.floor(this.triangular(...args));

    return Math.floor(this.float(min, max));
  }

  triangular(min = this.defaults.min, max = this.defaults.max, mode = this.defaults.mode) {
    const u = this.random();
    if (u === 0) return 0;
    const c = (mode - min) / (max - min);
    if (!Number.isFinite(c)) return min;
    if ( u < c ) {
      return min + (u * (max - min) * (mode - min)) ** 0.5;
    } else {
      return max - ((1 - u) * (max - min) * (max - mode)) ** 0.5;
    }
  }

  choice(iter) {
    return iter[this.int(0, iter.length)];
  }
}

const random = new Random();

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
      this.object[attr] = random.triangular(0, 100, 50);
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
      this.object[attr] = random.triangular(0, 100, 50);
    });
  }
}

class Name {
  constructor() {
    this.first = random.choice(['TIM', 'JIM', 'MARK', 'MIKE', 'TOM', 'JOHN']);
    this.last = random.choice(['SMITH', 'JONES', 'JAMES', 'OCEAN', 'PITT', 'JACKSON']);
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

const QueryProxy = {
  create(obj) {
    return new Proxy(obj, this.handlers());
  },
  difference(target) {
    return (other) => {
      const fromTarget = target.filter(v => !other.includes(v));
      const fromOther = other.filter(v => !target.includes(v));
      return new Proxy(fromTarget.concat(fromOther), this.handlers());
    };
  },
  intersection(target) {
    return (other) => {
      return new Proxy(target.filter(v => other.includes(v)), this.handlers());
    };
  },
  union(target) {
    return (other) => {
      const targetSet = new Set(target);
      return new Proxy(other.filter(v => targetSet.has(v)), this.handlers());
    };
  },
  query(target) {
    return (acc, cmp) => new Proxy(target.filter(v => cmp(acc(v))), this.handlers());
  },
  sort(target) {
    return (...args) => {
      const compare = (...args) => {
        switch (args.length) {
          case 1:
            return (a, b) => args[0](a, b);
          default:
            return (a, b) => args[0](a, b) || compare(...(args.slice(1)))(a, b);
        }
      };
      return new Proxy(target.slice(0).sort(compare(...args)), this.handlers());
    };
  },
  get(target, property) {
    if (property === 'intersection') return this.intersection(target);
    if (property === 'difference') return this.difference(target);
    if (property === 'union') return this.union(target);
    if (property === 'query') return this.query(target);
    if (property === 'sort') return this.sort(target);
    return target[property];
  },
  handlers() {
    return {
      get: this.get.bind(this),
    };
  }
};

class Team {
  constructor() {
    this.internal = { players: [] };
    this.players = QueryProxy.create(this.internal.players);
  }
}

const t = new Team();

for (let i = 0; i < 20; i++) t.players.push(new Player());

const ordered = t.players.sort((p1, p2) => p2.attributes.overall() - p1.attributes.overall());
ordered.forEach((p) => {
  console.log(`${p.name.full}: ${p.attributes.overall()}`);
});
const avg = t.players.map(p => p.attributes.overall()).reduce(reducers.sum) / t.players.length;
console.log('-----');
console.log(avg)


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
