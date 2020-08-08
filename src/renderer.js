const { getConfig } = require('./config');
const { getHintWords } = require('./hintWords');
const { setupSettings } = require('./settings');
const { setupEditor } = require('./editor');
const { setupFrontAppPoller } = require('./frontAppPoller');

(async () => {
  const config = await getConfig('config', {
    stripWhitespaceBeforePeriod: false,
    singleLine: true,
    frequentWordsGlob: '',
    mode: 'ruby',
  });

  const hintWords = getHintWords();
  hintWords.load();

  setupEditor({ config, hintWords });
  setupSettings({ config, hintWords });
  setupFrontAppPoller();
})();
