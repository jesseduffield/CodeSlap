const glob = require('glob-promise');
const { flatten } = require('./utils');
const { configPath } = require('./storage');

const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const minimumFrequency = 10;
const minimumLength = 7;

const findWordsInFiles = async filenames =>
  // for each filename we're returning an array of words
  flatten(
    await Promise.all(
      filenames.map(async (filename, index) => {
        try {
          const fileContent = await readFileAsync(filename, 'utf8');

          return fileContent.match(/\w+/g) || [];
        } catch (e) {
          // silently erroring for now
          console.error(e);

          return [];
        }
      })
    )
  );

const getWordFrequencyMap = wordsInFiles => {
  const wordFrequencyMap = {};

  wordsInFiles.forEach(word => {
    if (!validWord(word)) {
      return false;
    }
    if (word in wordFrequencyMap) {
      wordFrequencyMap[word]++;
    } else {
      wordFrequencyMap[word] = 1;
    }
  });

  return wordFrequencyMap;
};

const validWord = word => {
  if (word.length < minimumLength) {
    return false;
  }

  if (/^\d+$/.test(word)) {
    // ignoring numbers
    return false;
  }

  if (word.startsWith('_')) {
    return false;
  }

  return true;
};

const orderWordsByFrequency = wordFrequencyMap =>
  Object.entries(wordFrequencyMap)
    .filter(([key, value]) => value > minimumFrequency)
    .sort(([key1, value1], [key2, value2]) => {
      if (value1 !== value2) {
        return value1 < value2;
      }
      return key1.length > key2.length;
    })
    .map(([key, _]) => key);

const wordsPath = configPath('words.json');

const getHintWords = () => {
  let words = [];

  return {
    words() {
      return words;
    },

    async load() {
      try {
        const fileContent = await readFileAsync(wordsPath, 'utf8');

        words = JSON.parse(fileContent);
      } catch (e) {
        if (e.code !== 'ENOENT') {
          alert(e);
        }
      }
    },

    async sync(globStr, setStatus) {
      if (!globStr) {
        setStatus('cannot sync with blank glob string');
        return;
      }

      setStatus('finding files');

      const filenames = await glob(globStr, {});
      setStatus(`${filenames.length} files to process`);

      const wordsInFiles = await findWordsInFiles(filenames);

      setStatus(`processing results`);

      const wordFrequencyMap = getWordFrequencyMap(wordsInFiles);
      words = orderWordsByFrequency(wordFrequencyMap);

      setStatus(`saving result`);

      try {
        await writeFileAsync(wordsPath, JSON.stringify(words));
      } catch (e) {
        alert(e);
      }

      setStatus(`${words.length} words synced`);
    },
  };
};

module.exports = { getHintWords };
