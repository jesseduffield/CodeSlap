const { ipcRenderer, remote } = require('electron');
const robot = require('robotjs');
const CodeMirror = require('codemirror');
const History = require('./history');
let allWords = require('./words.json');
const extractFrequentWords = require('./extractFrequentWords');

const { Menu } = remote;
const win = remote.getCurrentWindow();
const hideWindow = () => Menu.sendActionToFirstResponder('hide:');

require('codemirror/keymap/sublime');
require('codemirror/mode/ruby/ruby');
require('codemirror/addon/hint/show-hint');

const singleLineMode = true;

const editor = CodeMirror(document.body, {
  theme: 'monokai',
  tabSize: 2,
  lineWrapping: true,
  mode: 'ruby',
  keyMap: 'sublime',
  indentWithTabs: false,
  extraKeys: { Enter: !singleLineMode },
});

editor.focus();

robot.setKeyboardDelay(0);

const history = new History();

const submit = () => {
  const start = new Date().getTime();

  event.preventDefault();

  const text = editor.getValue();
  const textToWrite = text.replace(/\s+\./g, '.');

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

editor.on('keydown', (_, event) => {
  // I prefer using metaKey here but it seems to cause crashes
  if (event.key === 'Enter' && event.shiftKey) {
    submit();
  } else if (singleLineMode && event.key === 'Enter') {
    event.stopPropagation();
    submit();
  } else if (singleLineMode && event.key === 'ArrowUp') {
    const line = history.previous();
    editor.setValue(line);
    moveCursorToEndOfLine();
  } else if (singleLineMode && event.key === 'ArrowDown') {
    const line = history.next();
    editor.setValue(line);
    moveCursorToEndOfLine();
  } else if (event.key === 'j' && event.metaKey) {
    editor.setValue(history.previous());
    moveCursorToEndOfLine();
  } else if (event.key === 'k' && event.metaKey) {
    editor.setValue(history.next());
    moveCursorToEndOfLine();
  }

  // this might actually need to return false. Depends on whether we want to stop propagation or not
  return true;
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

const settings = document.getElementById('settings');
const settingsButton = document.getElementById('settingsButton');
const codeMirrorWrapper = document.getElementsByClassName('CodeMirror')[0];
const syncButton = document.getElementById('syncButton');
const frequentWordsGlob = document.getElementById('frequentWordsGlob');
const syncLoader = document.getElementById('syncLoader');
const wordsSynced = document.getElementById('wordsSynced');

settingsButton.addEventListener('click', event => {
  event.stopPropagation();

  settings.classList.toggle('settingsShow');
  codeMirrorWrapper.classList.toggle('settingsShow');
});

const updateWordsSyncedMsg = () => {
  wordsSynced.innerHTML = `${allWords.length} words synced`;
};

syncButton.addEventListener('click', async event => {
  event.stopPropagation();

  syncLoader.classList.add('syncing');
  frequentWordsGlob.classList.add('syncing');
  allWords = await extractFrequentWords(frequentWordsGlob.value);
  frequentWordsGlob.classList.remove('syncing');
  syncLoader.classList.remove('syncing');

  updateWordsSyncedMsg();
});

updateWordsSyncedMsg();
