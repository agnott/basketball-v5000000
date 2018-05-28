const Random = require('../Random');

const ArrayUtilsProxy = {
  create(obj) {
    return new Proxy(obj, this.handlers());
  },
  each(target) {
    return (...args) => target.forEach(...args);
  },
  count(target) {
    return () => target.length;
  },
  random(target) {
    return () => Random.choice(target);
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
      return this.create(target.slice(0).sort(compare(...args)));;
    };
  },
  get(target, property) {
    if (property === 'each') return this.each(target);
    if (property === 'count') return this.count(target);
    if (property === 'random') return this.random(target);
    if (property === 'sort') return this.sort(target);
    return target[property];
  },
  handlers() {
    return {
      get: this.get.bind(this),
    };
  },
};

module.exports = ArrayUtilsProxy;
