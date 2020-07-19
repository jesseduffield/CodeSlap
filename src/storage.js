// the point of this file is to ensure that we create the config directory whenver we need to read/write a file.

const homeDir = require('home-dir');

const fs = require('fs');

const configDir = homeDir('/.codeslap');
const configPath = path => `${configDir}/${path}`;

// no harm in making this synchronous because it only runs on startup
const setupConfigDir = () => {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
};

module.exports = { setupConfigDir, configPath };
