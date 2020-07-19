const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const getConfig = async defaultConfig => {
  const savedConfig = await readFileAsync('./config.json');

  const config = { ...defaultConfig, ...JSON.parse(savedConfig) };

  const save = async () => {
    await writeFileAsync('./config.json', JSON.stringify(config));
  };

  const onChangeCallbacks = {};

  return {
    async set(key, value) {
      config[key] = value;

      if (onChangeCallbacks[key]) {
        onChangeCallbacks[key].forEach(cb => cb(value));
      }

      await save();
    },

    get(key) {
      return config[key];
    },

    onChange(key, callback) {
      if (onChangeCallbacks[key] === undefined) {
        onChangeCallbacks[key] = [];
      }
      onChangeCallbacks[key].push(callback);
    },

    apply() {
      Object.entries(onChangeCallbacks).forEach(([key, callbacks]) => {
        callbacks.forEach(cb => cb(config[key]));
      });
    },
  };
};

module.exports = { getConfig };
