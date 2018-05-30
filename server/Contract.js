class Contract {
  constructor(config = {}) {
    this.years = config.years;
    this.payments = config.payments;
    this.noTrade = config.noTrade || false;

    this.yearsRemaining = this.years;
    this.paymentsRemaining = this.payments;
  }

  update() {
    this.yearsRemaining--;
    this.paymentsRemaining = this.paymentsRemaining.slice(1, this.paymentsRemaining.length);
  }
}

module.exports = Contract;
