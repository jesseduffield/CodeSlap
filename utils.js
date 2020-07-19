const fromPairs = arr => arr.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

module.exports = { fromPairs };
