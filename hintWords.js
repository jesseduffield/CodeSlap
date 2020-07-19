const glob = require('glob-promise');
const fs = require('fs');

const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const minimumFrequency = 10;
const minimumLength = 7;

const flatten = arr => {
  return [].concat(...arr);
};

const findWordsInFiles = async filenames =>
  // for each filename we're returning an array of words
  flatten(
    await Promise.all(
      filenames.map(async (filename, index) => {
        const fileContent = await readFileAsync(filename, 'utf8');

        return fileContent.match(/\w+/g) || [];
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

const wordsFilename = './words.json';

const getHintWords = () => {
  let words = [];

  return {
    words() {
      return words;
    },

    async load() {
      const fileContent = await readFileAsync(wordsFilename, 'utf8');
      words = JSON.parse(fileContent);
    },

    async sync(globStr, setStatus) {
      setStatus('finding files');

      const filenames = await glob(globStr, {});
      setStatus(`${filenames.length} files to process`);

      const wordsInFiles = await findWordsInFiles(filenames);

      setStatus(`processing results`);

      const wordFrequencyMap = getWordFrequencyMap(wordsInFiles);
      words = orderWordsByFrequency(wordFrequencyMap);

      setStatus(`saving result`);
      await writeFileAsync(wordsFilename, JSON.stringify(words));

      setStatus(`${words.length} words synced`);
    },
  };
};

module.exports = { getHintWords };
