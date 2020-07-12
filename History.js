class History {
  constructor() {
    this.history = [];
    // when historyIdx === history.length we just show a blank string
    this.index = 0;
  }

  previous() {
    if (this.index > 0) {
      this.index--;
    }

    return this.history[this.index];
  }

  next() {
    if (this.index < this.history.length - 1) {
      this.index++;
      return this.history[this.index];
    } else if (this.index === this.history.length - 1) {
      this.index++;
      return '';
    }
  }

  push(value) {
    this.history.push(value);
    this.index = this.history.length;
  }
}

module.exports = History;
