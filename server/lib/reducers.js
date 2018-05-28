module.exports = {
  sum(acc, val) {
    return acc + val;
  },
  avg(acc, val, ci, arr) {
    return acc + val / arr.length;
  },
};
