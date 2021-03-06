const { remote } = require('electron');
const robot = require('robotjs');
const CodeMirror = require('codemirror');
const { newHistory } = require('./History');
const { getIterm2Client } = require('./iterm2Client');

const { Menu } = remote;
const win = remote.getCurrentWindow();
const hideWindow = () => {
  Menu.sendActionToFirstResponder('hide:');
};

require('codemirror/keymap/sublime');
require('codemirror/addon/hint/show-hint');

const setupEditor = ({ config, hintWords }) => {
  const connectionStatus = document.getElementById('connectionStatus');

  let client = getIterm2Client(
    () => {
      connectionStatus.innerHTML = 'Connected to iTerm2';
    },
    () => {
      connectionStatus.innerHTML = 'Disconnected from iTerm2';
    }
  );

  const editor = CodeMirror(document.body, {
    theme: 'monokai',
    tabSize: 2,
    lineWrapping: true,
    keyMap: 'sublime',
    indentWithTabs: false,
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

    const hasItermIntegration = true;

    if (hasItermIntegration) {
      client.write(`${textToWrite}\n`);
    } else {
      hideWindow();
      robot.typeString(textToWrite);
      robot.keyTap('enter');
      win.show();
    }
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

    const list = hintWords
      .words()
      .filter(word => word.startsWith(currentWord) && word !== currentWord)
      .slice(0, 5);

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
};

module.exports = { setupEditor };
