const { ipcRenderer, remote } = require('electron');
const robot = require('robotjs');
const CodeMirror = require('codemirror');
const History = require('./history');
let allWords = require('./words.json');
const extractFrequentWords = require('./extractFrequentWords');
const applescript = require('applescript');

const fs = require('fs');

const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const { Menu } = remote;
const win = remote.getCurrentWindow();
const hideWindow = () => {
  Menu.sendActionToFirstResponder('hide:');
};

require('codemirror/keymap/sublime');
require('codemirror/mode/meta');
require('codemirror/mode/ruby/ruby');

console.log(CodeMirror.modeInfo);

const modes = CodeMirror.modeInfo.map(info => info.mode);

// this takes a bit of time to load. Perhaps we should do this asynchronously and only when the settings page is opened.
modes.forEach(mode => {
  if (mode === 'null') {
    return;
  }
  require(`codemirror/mode/${mode}/${mode}`);
});

require('codemirror/addon/hint/show-hint');

const getConfig = async () => {
  let defaultConfig = {
    stripWhitespaceBeforePeriod: false,
    singleLine: true,
    frequentWordsGlob: '',
  };

  const savedConfig = await readFileAsync('./config.json');

  let config = { ...defaultConfig, ...JSON.parse(savedConfig) };

  const save = async () => {
    await writeFileAsync('./config.json', JSON.stringify(config));
  };

  return {
    load: async () => {
      const savedConfig = await readFileAsync('./config.json');

      config = { ...config, ...JSON.parse(savedConfig) };
    },
    update: async (key, value) => {
      config[key] = value;

      await save();
    },
    get: key => {
      return config[key];
    },
  };
};

const run = async () => {
  const config = await getConfig();

  const editor = CodeMirror(document.body, {
    theme: 'monokai',
    tabSize: 2,
    lineWrapping: true,
    mode: 'ruby',
    keyMap: 'sublime',
    indentWithTabs: false,
    extraKeys: { Enter: !config.get('singleLine') },
  });

  editor.focus();

  robot.setKeyboardDelay(0);

  const history = new History();

  const submit = () => {
    const start = new Date().getTime();

    event.preventDefault();

    const text = editor.getValue();
    const textToWrite = config.get('stripWhitespaceBeforePeriod')
      ? text.replace(/\s+\./g, '.')
      : text;

    history.push(text);
    editor.setValue('');

    hideWindow();

    robot.typeString(textToWrite);

    robot.keyTap('enter');

    win.show();
  };

  const moveCursorToEndOfLine = () => {
    const currentLine = editor.getCursor().line;
    editor.setCursor({
      line: currentLine,
      ch: editor.getLine(currentLine).length,
    });
  };

  const previousCommand = () => {
    editor.setValue(history.previous());
    moveCursorToEndOfLine();
  };

  const nextCommand = () => {
    editor.setValue(history.next());
    moveCursorToEndOfLine();
  };

  const handleEditorEvent = event => {
    // I prefer using metaKey here but it seems to cause crashes
    if (event.key === 'Enter' && event.shiftKey) {
      submit();
      return true;
    } else if (config.get('singleLine') && event.key === 'Enter') {
      submit();
      return true;
    } else if (config.get('singleLine') && event.key === 'ArrowUp') {
      previousCommand();
      return true;
    } else if (config.get('singleLine') && event.key === 'ArrowDown') {
      nextCommand();
      return true;
    } else if (event.key === 'j' && event.metaKey) {
      previousCommand();
      return true;
    } else if (event.key === 'k' && event.metaKey) {
      nextCommand();
      return true;
    } else if (event.key === 'u' && event.ctrlKey) {
      editor.setValue('');
    }

    return false;
  };

  editor.on('keydown', (_, event) => {
    if (handleEditorEvent(event)) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    return false;
  });

  const settings = document.getElementById('settings');
  const settingsButton = document.getElementById('settingsButton');
  const syncButton = document.getElementById('syncButton');
  const frequentWordsGlob = document.getElementById('frequentWordsGlob');
  const syncLoader = document.getElementById('syncLoader');
  const wordsSynced = document.getElementById('wordsSynced');
  const singleLineCheckbox = document.getElementById('singleLineCheckbox');
  const singleLineContainer = document.getElementById('singleLineContainer');
  const stripWhitespaceCheckbox = document.getElementById(
    'stripWhitespaceBeforePeriod'
  );
  const stripWhitespaceContainer = document.getElementById(
    'stripWhitespaceContainer'
  );
  const codeMirrorWrapper = document.getElementsByClassName('CodeMirror')[0];
  const targetAppLine = document.getElementById('targetAppLine');

  const applyConfig = () => {
    singleLineCheckbox.checked = config.get('singleLine');
    stripWhitespaceCheckbox.checked = config.get('stripWhitespaceBeforePeriod');
    frequentWordsGlob.value = config.get('frequentWordsGlob');
    editor.setOption('extraKeys', { Enter: !config.get('singleLine') });
  };

  applyConfig();

  editor.on('change', function() {
    const wordRange = editor.findWordAt(editor.getCursor());
    const currentWord = editor.getRange(wordRange.anchor, wordRange.head);

    if (editor.getCursor().ch !== wordRange.to().ch) {
      // only show hint if you're at the end of the word
      return;
    }

    if (currentWord.length === 0) {
      return;
    }

    const list = allWords.filter(
      word => word.startsWith(currentWord) && word !== currentWord
    );

    if (list.length === 1 && list[0] === currentWord) {
      return;
    }

    editor.showHint({
      completeSingle: false,
      hint: function() {
        return {
          from: wordRange.anchor,
          to: wordRange.head,
          list: list,
        };
      },
    });
  });

  settingsButton.addEventListener('click', event => {
    event.stopPropagation();

    settings.classList.toggle('settingsShow');
    codeMirrorWrapper.classList.toggle('settingsShow');
    targetAppLine.classList.toggle('settingsShow');
  });

  const setStatus = status => {
    wordsSynced.innerHTML = status;
  };

  setStatus(`${allWords.length} words synced`);

  syncButton.addEventListener('click', async event => {
    event.stopPropagation();

    syncLoader.classList.add('syncing');
    frequentWordsGlob.classList.add('syncing');
    allWords = await extractFrequentWords(frequentWordsGlob.value, setStatus);
    frequentWordsGlob.classList.remove('syncing');
    syncLoader.classList.remove('syncing');
    config.update('frequentWordsGlob', frequentWordsGlob.value);
  });

  singleLineContainer.addEventListener('click', async event => {
    console.log('singleLineCheckbox.checked', singleLineCheckbox.checked);
    config.update('singleLine', !singleLineCheckbox.checked);
    applyConfig(config);
  });

  stripWhitespaceContainer.addEventListener('click', async event => {
    config.update(
      'stripWhitespaceBeforePeriod',
      !stripWhitespaceCheckbox.checked
    );
    applyConfig(config);
  });

  setInterval(() => {
    const script =
      'tell application "System Events" to get name of first application process whose frontmost is true';

    applescript.execString(script, (err, rtn) => {
      let str = '';
      if (err) {
        console.warn(err);

        str = `Writing to: unknown`;
      } else {
        str = `Writing to: ${rtn}`;
      }
      if (targetAppLine.innerHTML !== str) {
        // not sure if it actually matters to reassign the same value here
        // in terms of performance, but chrome devtools was flashing angrily at me
        targetAppLine.innerHTML = str;
      }
    });
  }, 500);
};

run();
