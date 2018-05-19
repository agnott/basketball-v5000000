const Random = require('./Random');

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
  each(target) {
    return (...args) => target.forEach(...args);
  },
  random(target) {
    return () => Random.choice(target);
  },
  get(target, property) {
    if (property === 'random') return this.random(target);
    if (property === 'intersection') return this.intersection(target);
    if (property === 'difference') return this.difference(target);
    if (property === 'union') return this.union(target);
    if (property === 'query') return this.query(target);
    if (property === 'sort') return this.sort(target);
    if (property === 'each') return this.each(target);
    return target[property];
  },
  handlers() {
    return {
      get: this.get.bind(this),
    };
  }
};

module.exports = QueryProxy;
