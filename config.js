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
        onChangeCallbacks[key](value);
      }

      await save();
    },

    get(key) {
      return config[key];
    },

    onChange(key, callback) {
      onChangeCallbacks[key] = callback;
    },

    apply() {
      Object.entries(onChangeCallbacks).forEach(([key, callback]) => {
        callback(config[key]);
      });
    },
  };
};

module.exports = { getConfig };
