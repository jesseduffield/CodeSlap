const fromPairs = arr => arr.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

const flatten = arr => {
  return [].concat(...arr);
};

module.exports = { fromPairs, flatten };
