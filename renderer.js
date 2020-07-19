const { ipcRenderer, remote } = require('electron');
const robot = require('robotjs');
const CodeMirror = require('codemirror');
const { newHistory } = require('./history');
let allWords = require('./words.json');
const extractFrequentWords = require('./extractFrequentWords');
const applescript = require('applescript');
const { getConfig } = require('./config');

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
require('codemirror/addon/hint/show-hint');

const modes = CodeMirror.modeInfo.map(info => info.mode);

const run = async () => {
  const config = await getConfig({
    stripWhitespaceBeforePeriod: false,
    singleLine: true,
    frequentWordsGlob: '',
    mode: 'ruby',
  });

  const editor = CodeMirror(document.body, {
    theme: 'monokai',
    tabSize: 2,
    lineWrapping: true,
    keyMap: 'sublime',
    indentWithTabs: false,
  });

  editor.focus();

  robot.setKeyboardDelay(0);

  const history = newHistory();

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

  const modeSelect = document.getElementById('modeSelect');

  // populate select with options
  modes.forEach(mode => {
    modeSelect.options.add(new Option(mode, mode));
  });

  config.onChange('mode', value => {
    if (value !== 'null') {
      // these are a little expensive to load so we're only requiring them when we need them
      require(`codemirror/mode/${value}/${value}`);
    }

    modeSelect.value = value;
    editor.setOption('mode', value);
  });

  config.onChange('singleLine', value => {
    singleLineCheckbox.checked = value;
    editor.setOption('extraKeys', { Enter: !value });
  });

  config.onChange('stripWhitespaceBeforePeriod', value => {
    stripWhitespaceCheckbox.checked = value;
  });

  config.onChange('frequentWordsGlob', value => {
    frequentWordsGlob.value = value;
  });

  config.apply();

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

    [settings, codeMirrorWrapper, targetAppLine].forEach(el => {
      el.classList.toggle('settingsShow');
    });
  });

  const setStatus = status => {
    wordsSynced.innerHTML = status;
  };

  setStatus(`${allWords.length} words synced`);

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

    allWords = await extractFrequentWords(frequentWordsGlob.value, setStatus);

    elementsWithSyncingState.forEach(el => {
      el.classList.remove('syncing');
    });

    config.set('frequentWordsGlob', frequentWordsGlob.value);
  });

  singleLineContainer.addEventListener('click', async event => {
    config.set('singleLine', !singleLineCheckbox.checked);
  });

  stripWhitespaceContainer.addEventListener('click', async event => {
    config.set('stripWhitespaceBeforePeriod', !stripWhitespaceCheckbox.checked);
  });

  modeSelect.addEventListener('change', async event => {
    config.set('mode', event.target.value);
  });

  setInterval(() => {
    // would be good to make this platform agnostic
    const script =
      'tell application "System Events" to get name of first application process whose frontmost is true';

    applescript.execString(script, (err, rtn) => {
      if (err) {
        console.warn(err);

        targetAppLine.innerHTML = `Writing to: (unknown)`;
      } else {
        targetAppLine.innerHTML = `Writing to: ${rtn}`;
      }
    });
  }, 500);
};

run();
