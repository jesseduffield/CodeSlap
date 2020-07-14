const { ipcRenderer, remote } = require('electron');
const robot = require('robotjs');
const CodeMirror = require('codemirror');
const History = require('./history');
let allWords = require('./words.json');
const extractFrequentWords = require('./extractFrequentWords');

const { Menu } = remote;
const win = remote.getCurrentWindow();

require('codemirror/keymap/sublime');
require('codemirror/mode/ruby/ruby');
require('codemirror/addon/hint/show-hint');

const editor = CodeMirror(document.body, {
  theme: 'monokai',
  tabSize: 2,
  lineWrapping: true,
  mode: 'ruby',
  keyMap: 'sublime',
  indentWithTabs: false,
});

editor.focus();

robot.setKeyboardDelay(0);

const menu = Menu.buildFromTemplate([]);
Menu.setApplicationMenu(menu);

const history = new History();

let textToWrite = '';

win.on('blur', () => {
  const start = new Date().getTime();
  if (textToWrite === '') {
    return;
  }
  robot.typeString(textToWrite);
  textToWrite = '';

  console.log('just typed string', new Date().getTime() - start);
  robot.keyTap('enter');
  console.log('just hit enter', new Date().getTime() - start);

  win.show();
  console.log('just showed window', new Date().getTime() - start);
});

const submit = () => {
  const start = new Date().getTime();
  console.log('entered submit function', new Date().getTime() - start);

  event.preventDefault();

  const text = editor.getValue();
  textToWrite = text.replace(/\s+\./g, '.');

  history.push(text);
  editor.setValue('');

  // ipcRenderer.send('dismiss');
  // win.hide();
  Menu.sendActionToFirstResponder('hide:');
  console.log('just dismissed window', new Date().getTime() - start);
};

document.addEventListener('keydown', event => {
  // I prefer using metaKey here but it seems to cause crashes
  if (event.key === 'Enter' && event.shiftKey) {
    submit();
  } else if (event.key === 'j' && event.metaKey) {
    editor.setValue(history.previous());
  } else if (event.key === 'k' && event.metaKey) {
    editor.setValue(history.next());
  }
});

editor.on('change', function() {
  const wordRange = editor.findWordAt(editor.getCursor());
  const currentWord = editor.getRange(wordRange.anchor, wordRange.head);

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
