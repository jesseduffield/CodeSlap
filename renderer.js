const { ipcRenderer, remote } = require('electron');
const robot = require('robotjs');
const CodeMirror = require('codemirror');
const { newHistory } = require('./history');
let allWords = require('./words.json');
const applescript = require('applescript');
const { getConfig } = require('./config');
const { setupSettings } = require('./settings');

const { Menu } = remote;
const win = remote.getCurrentWindow();
const hideWindow = () => {
  Menu.sendActionToFirstResponder('hide:');
};

require('codemirror/keymap/sublime');
require('codemirror/addon/hint/show-hint');

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

  config.onChange('mode', value => {
    if (value !== 'null') {
      // these are a little expensive to load so we're only requiring them when we need them
      require(`codemirror/mode/${value}/${value}`);
    }

    editor.setOption('mode', value);
  });

  config.onChange('singleLine', value => {
    editor.setOption('extraKeys', { Enter: !value });
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

  setupSettings(config);
};

run();
