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

module.exports = new Random();
