const { ipcRenderer } = require('electron');
const robot = require('robotjs');
const CodeMirror = require('codemirror');
const History = require('./history');
const allWords = require('./words');

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

const history = new History();

const submit = () => {
  event.preventDefault();
  ipcRenderer.send('dismiss');

  const text = editor.getValue();

  history.push(text);

  editor.setValue('');

  normalisedText = text.replace(/\s+\./g, '.');

  robot.typeString(normalisedText);
  robot.keyTap('enter');
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

  const list = allWords.filter(word => word.startsWith(currentWord));

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

settingsButton.addEventListener('click', event => {
  event.stopPropagation();

  settings.classList.toggle('settingsShow');
  codeMirrorWrapper.classList.toggle('settingsShow');
});
