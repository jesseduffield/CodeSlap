const CodeMirror = require('codemirror');
const { newHistory } = require('./History');
const { getConfig } = require('./config');
const { fromPairs } = require('./utils');

require('codemirror/mode/meta');

const modes = CodeMirror.modeInfo.map(info => info.mode);

const elementIds = [
  'settings',
  'settingsButton',
  'syncButton',
  'frequentWordsGlob',
  'syncLoader',
  'wordsSynced',
  'singleLineCheckbox',
  'singleLineContainer',
  'stripWhitespaceCheckbox',
  'stripWhitespaceContainer',
  'targetAppLine',
  'modeSelect',
];

const getElements = () =>
  fromPairs(elementIds.map(id => [id, document.getElementById(id)]));

const setupSettings = ({ config, hintWords }) => {
  const {
    settings,
    settingsButton,
    syncButton,
    frequentWordsGlob,
    syncLoader,
    wordsSynced,
    singleLineCheckbox,
    singleLineContainer,
    stripWhitespaceCheckbox,
    stripWhitespaceContainer,
    targetAppLine,
    modeSelect,
  } = getElements();
  const codeMirrorWrapper = document.getElementsByClassName('CodeMirror')[0];

  // populate select with options
  modes.forEach(mode => {
    modeSelect.options.add(new Option(mode, mode));
  });

  const setStatus = status => {
    wordsSynced.innerHTML = status;
  };

  settingsButton.addEventListener('click', event => {
    event.stopPropagation();

    [settings, codeMirrorWrapper, targetAppLine].forEach(el => {
      el.classList.toggle('settingsShow');
    });

    setStatus(`${hintWords.words().length} words synced`);
  });

  syncButton.addEventListener('click', async event => {
    event.stopPropagation();

    const elementsWithSyncingState = [
      syncLoader,
      syncButton,
      frequentWordsGlob,
    ];

    elementsWithSyncingState.forEach(el => {
      el.classList.add('syncing');
    });

    await hintWords.sync(frequentWordsGlob.value, setStatus);

    elementsWithSyncingState.forEach(el => {
      el.classList.remove('syncing');
    });

    config.set('frequentWordsGlob', frequentWordsGlob.value);
  });
  config.onChange('frequentWordsGlob', value => {
    frequentWordsGlob.value = value;
  });

  singleLineContainer.addEventListener('click', async event => {
    config.set('singleLine', !singleLineCheckbox.checked);
  });
  config.onChange('singleLine', value => {
    singleLineCheckbox.checked = value;
  });

  stripWhitespaceContainer.addEventListener('click', async event => {
    config.set('stripWhitespaceBeforePeriod', !stripWhitespaceCheckbox.checked);
  });
  config.onChange('stripWhitespaceBeforePeriod', value => {
    stripWhitespaceCheckbox.checked = value;
  });

  modeSelect.addEventListener('change', async event => {
    config.set('mode', event.target.value);
  });
  config.onChange('mode', value => {
    modeSelect.value = value;
  });

  config.apply();
};

module.exports = { setupSettings };
