const Random = require('../Random');
const ArrayUtilsProxy = require('./ArrayUtilsProxy');

const QueryProxy = {
  create(obj) {
    return new Proxy(ArrayUtilsProxy.create(obj), this.handlers());
  },
  difference(target) {
    return (other) => {
      const fromTarget = target.filter(v => !other.includes(v));
      const fromOther = other.filter(v => !target.includes(v));
      return this.create(fromTarget.concat(fromOther));
    };
  },
  intersection(target) {
    return (other) => {
      const otherSet = new Set(other);
      return this.create(target.filter(v => otherSet.has(v)));
    };
  },
  union(target) {
    return (other) => {
      const targetSet = new Set(target);
      return this.create(target.concat(other.filter(v => !targetSet.has(v))));
    };
  },
  query(target) {
    return (acc, cmp) => this.create(target.filter(v => cmp(acc(v))));
  },
  first(target) {
    return () => target.length > 0 ? target[0] : null;
  },
  last(target) {
    return () => target.length > 0 ? target[target.length - 1] : null;
  },
  at(target) {
    return (i) => target.length > i + 1 ? target[i] : null;
  },
  find(target) {
    return (id) => {
      const fromTarget = target.filter(v => v.id === id);
      return fromTarget.length > 0 ? fromTarget[0] : null;
    }
  },
  get(target, property) {
    if (property === 'intersection') return this.intersection(target);
    if (property === 'difference') return this.difference(target);
    if (property === 'union') return this.union(target);
    if (property === 'query') return this.query(target);
    if (property === 'first') return this.first(target);
    if (property === 'last') return this.last(target);
    if (property === 'find') return this.find(target);
    if (property === 'at') return this.at(target);
    return target[property];
  },
  handlers() {
    return {
      get: this.get.bind(this),
    };
  }
};

module.exports = QueryProxy;
