const fs = require('fs');
const Random = require('./Random');
const reducers = require('./lib/reducers');
const math = require('./lib/math');

const CONFIG = {
  AGE: { MIN: 18, MAX: 44, MODE: 27 },
  HEIGHT: { MIN: 69, MAX: 87, MODE: 81 },
  WEIGHT: { MIN: 150, MAX: 300 },
  NAMES: {
    FIRST: fs.readFileSync('./data/first-names.txt').toString().split('\n'),
    LAST: fs.readFileSync('./data/last-names.txt').toString().split('\n')
  }
};

let ID_BASE = 0;
const identifier = () => `${Date.now()}-${ID_BASE++}`;

class Attributes {
  constructor(player) {
    const offsetHeight = (CONFIG.HEIGHT.MODE - CONFIG.HEIGHT.MIN) / (CONFIG.HEIGHT.MAX - CONFIG.HEIGHT.MIN);
    const shiftedHeight = (player.height.scaled - offsetHeight) / offsetHeight;
    const shiftedWeight = player.weight.scaled - 0.50 / 0.50;

    this.array = [
      {
        name: 'speed',
        adjustment: -20 * shiftedHeight - 10 * shiftedWeight,
      },
      {
        name: 'rebound',
        adjustment: 20 * shiftedHeight + 5 * (shiftedWeight),
      },
      {
        name: 'block',
        adjustment: 20 * shiftedHeight,
      },
      {
        name: 'steal',
        adjustment: -5 * shiftedWeight,
      },
      {
        name: 'three',
        adjustment: -10 * shiftedHeight,
      },
      {
        name: 'mid',
        adjustment: -5 * shiftedHeight,
      },
      {
        name: 'short',
        adjustment: 10 * shiftedHeight + 5 * shiftedWeight,
      },
      {
        name: 'dunk',
        adjustment: 15 * shiftedHeight + 5 * shiftedWeight,
      },
      {
        name: 'pass',
        adjustment: 0,
      },
      {
        name: 'stamina',
        adjustment: -5 * shiftedHeight - 15 * shiftedWeight,
      },
      {
        name: 'clutch',
        adjustment: 0,
      },
    ];
    this.peakAge = Random.triangular(CONFIG.AGE.MODE - 8, CONFIG.AGE.MODE + 5, CONFIG.AGE.MODE);
    this.peaks = {};
    this.object = {};

    this.array.forEach((attr) => {
      this.peaks[attr.name] = Random.triangular(0, 100, 60 + attr.adjustment);
    });

    this.getCurrentStats(player);
    this.getOverall();
    this.getPotential();
  }

  getCurrentStats(player) {
    const shiftedAge = Math.abs(player.age.age - this.peakAge) / Math.max(CONFIG.AGE.MAX - this.peakAge, CONFIG.AGE.MODE - this.peakAge);
    for (let [k, v] of Object.entries(this.peaks)) {
      this.object[k] = math.clamp(v * (1 - Random.triangular(shiftedAge * 0.7, shiftedAge * 1.3, shiftedAge)), 1, 100);
    }
  }

  update(age) {
    this.getCurrentStats(age);
    this.getOverall();
  }

  getPotential() {
    const v = Object.values(this.peaks);
    const exp = 0.60;
    const s = v.map((val) => val ** exp).reduce(reducers.sum);
    const peakOverall = s / ((100 ** exp) * v.length) * 100 + 15;
    this.potential = math.clamp(peakOverall + Random.triangular(-20, 15, 0), 1, 100);
  }

  getOverall() {
    const v = Object.values(this.object);
    const exp = 0.60;
    const s = v.map((val) => val ** exp).reduce(reducers.sum);
    this.overall = math.clamp(s / ((100 ** exp) * v.length) * 100 + 15, 1, 100);
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

class Height {
  constructor() {
    this.min = CONFIG.HEIGHT.MIN;
    this.max = CONFIG.HEIGHT.MAX;
    this.mode = CONFIG.HEIGHT.MODE;

    const generated = Random.triangular(this.min, this.max, this.mode);
    this.height = (generated === this.min) ? this.min + 0.001 : generated;

    this.display = this.getDisplay();
    this.scaled = this.getScaled();
  }

  getScaled() {
    return (this.height - this.min) / (this.max - this.min);
  }

  getDisplay() {
    const feet = Math.floor(this.height / 12);
    const inches = Math.floor(this.height % 12);
    return `${feet}-${inches}`;
  }
}

class Weight {
  constructor(height) {
    this.min = CONFIG.WEIGHT.MIN;
    this.max = CONFIG.WEIGHT.MAX;

    this.weight = Random.triangular(
      this.min + (this.max - this.min) * height.scaled ** 2.25,
      this.min + (this.max - this.min) * height.scaled ** 0.35,
      this.min + (this.max - this.min) * height.scaled ** 0.85,
    );

    this.display = this.getDisplay();
    this.scaled = this.getScaled();
  }

  getScaled() {
    return (this.weight - this.min) / (this.max - this.min);
  }

  getDisplay() {
    return `${Math.round(this.weight)} lb`;
  }
}

class Age {
  constructor(age) {
    this.min = CONFIG.AGE.MIN;
    this.max = CONFIG.AGE.MAX;
    this.mode = CONFIG.AGE.MODE;

    this.age = age || Random.triangular(this.min, this.max, this.mode);
    this.scaled = this.getScaled();
  }

  increment() {
    this.age++;
    this.scaled = this.getScaled();
  }

  getScaled() {
    return (this.age - this.min) / (this.max - this.min);
  }
}

/*
  Determines posiion by combining particular attributes and seeing which positions
  have a viable combination
*/
class Position {
  constructor(player) {
    this.update(player);
  }

  getPositionForumlas() {
    return [
      {
        name: 'PG',
        formula: [
          [3, 'speed'],
          [3, 'pass'],
          [2, 'three'],
          [1, 'steal'],
          [1, 'mid'],
        ],
        height: 73.75,
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
        height: 77.5,
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
        height: 79.5,
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
        height: 81.5,
      },
      {
        name: 'C',
        formula: [
          [4, 'rebound'],
          [3, 'block'],
          [2, 'dunk'],
          [1, 'short'],
        ],
        height: 83.5,
      },
    ];
  }

  update(player) {
    // Calculates the viability at each position
    const rankings = this.getPositionForumlas()
      .map((pos) => {
        let rating = pos.formula.map((form) => form[0] * player.attributes.object[form[1]]).reduce(reducers.sum);
        const diff = Math.abs(pos.height - player.height.height);
        const calculated = 5 * (-15 * diff + 100) ** 3 / 20 ** 3;
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
    this.full = `${this.first} ${this.last}`;
  }
}

class Player {
  constructor(config = {}) {
    this.id = identifier();
    this.age = new Age(config.age);
    this.name = new Name();
    this.personality = new Personality();
    this.height = new Height();
    this.weight = new Weight(this.height);
    this.attributes = new Attributes(this);
    this.position = new Position(this);
    this.retired = false;
    this.contract = null;
    this.offers = [];
  }

  progress(toAge) {
    this.age.increment();
    this.attributes.update(this);
    this.position.update(this);
  }

  retiring() {
    if (this.retired) return true;
    const r = Random.random();
    const isPastPrime = this.age.age > this.attributes.peakAge * Random.float(1.25, 1.5);
    const isBad = this.attributes.overall < Random.triangular(45, 65, 50);
    const isOld = this.age.age > Random.triangular(30, 40, 36);
    const isReallyOld = this.age.age > Random.triangular(36, 44, 40);
    const isUnderContract = this.contract;

    this.retired = !isUnderContract && r > 0.5 && (isReallyOld || isPastPrime || (isOld && isBad));
    return this.retired;
  }

  offer(contract) {
    this.offers.push(contract);
  }

  chooseOffer() {
    console.log(this.attributes.overall);
    const ranks = this.offers.map((o) => {
      const { greediness } = this.personality.object;
      const shiftedGreed = (greediness - 50) / 50;
      const { years, payments, noTrade } = o;
      const totalAmount = payments.reduce(reducers.sum);
      const yearlyAmount = totalAmount / years;
      const minYearlyAmount = Math.max(0.5, 5 * shiftedGreed + 25 * ((this.attributes.overall - 50) ** 2 / 50 ** 2));

      if (yearlyAmount < minYearlyAmount) return 0;
      return (totalAmount / 10) + (noTrade ? 1 : 0) + years;
    });
    console.log(ranks);
  }

  toPlainObject() {
    return {
      name: {
        first: this.name.first,
        last: this.name.last,
        full: this.name.full,
      },
      age: {
        age: this.age.age,
        scaled: this.age.scaled,
      },
      attributes: this.attributes.object,
      overall: this.attributes.overall,
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
