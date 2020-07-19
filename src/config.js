const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const { configPath } = require('./storage');

const path = configPath('config.json');

const getConfig = async defaultConfig => {
  let config = defaultConfig;

  try {
    const savedConfig = await readFileAsync(path);

    config = { ...defaultConfig, ...JSON.parse(savedConfig) };
  } catch (e) {
    if (e.code !== 'ENOENT') {
      alert(e);
    }
  }

  const save = async () => {
    try {
      await writeFileAsync(path, JSON.stringify(config));
    } catch (e) {
      alert(e);
    }
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
