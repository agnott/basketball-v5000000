const comps = require('../lib/comparators');
const QueryProxy = require('./QueryProxy');

const PlayerListProxy = {
  create(obj) {
    return new Proxy(QueryProxy.create(obj), this.handlers());
  },
  position(target) {
    return (pos, primary = false, secondary = false) => {
      if ((!primary && !secondary) || (primary && secondary))
        return this.create(target.query(p => [p.position.primary, p.position.secondary], comps.includes(pos)));
      if (primary)
        return this.create(target.query(p => p.position.primary, comps.eq(pos)));
      if (secondary)
        return this.create(target.query(p => p.position.secondary, comps.eq(pos)));
      return this.create([]);
    }
  },
  level(target) {
    return (level) => {
      switch (level) {
        case 'benchwarmer': return this.create(target.query(p => p.attributes.overall, comps.lt(60)));
        case 'backup': return this.create(target.query(p => p.attributes.overall, comps.betweenLeftInclusive(60, 70)));
        case 'roleplayer': return this.create(target.query(p => p.attributes.overall, comps.betweenLeftInclusive(70, 75)));
        case 'starter': return this.create(target.query(p => p.attributes.overall, comps.betweenLeftInclusive(75, 80)));
        case 'star': return this.create(target.query(p => p.attributes.overall, comps.betweenLeftInclusive(80, 85)));
        case 'allstar': return this.create(target.query(p => p.attributes.overall, comps.betweenLeftInclusive(85, 90)));
        case 'superstar': return this.create(target.query(p => p.attributes.overall, comps.betweenLeftInclusive(90, 95)));
        case 'legend': return this.create(target.query(p => p.attributes.overall, comps.gteq(95)));
      }
      return this.create([]);
    };
  },
  potential(target) {
    return (comp) => target.query(p => p.attributes.potential, comp);
  },
  get(target, property) {
    if (property === 'potential') return this.potential(target);
    if (property === 'position') return this.position(target);
    if (property === 'level') return this.level(target);
    return target[property];
  },
  handlers() {
    return {
      get: this.get.bind(this),
    };
  },
};

module.exports = PlayerListProxy;
