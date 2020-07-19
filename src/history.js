const newHistory = () => {
  const history = [];
  // when index === history.length we just show a blank string
  let index = 0;

  return {
    previous() {
      if (index > 0) {
        index--;
      }

      return history[index];
    },

    next() {
      if (index < history.length - 1) {
        index++;
        return history[index];
      } else if (index === history.length - 1) {
        index++;
        return '';
      }
    },

    push(value) {
      if (value !== history[history.length - 1]) {
        history.push(value);
      }
      index = history.length;
    },
  };
};

module.exports = { newHistory };
