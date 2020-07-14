const glob = require('glob-promise');
const fs = require('fs');

const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const minimumFrequency = 10;
const minimumLength = 7;

const extractFrequentWords = async (globStr, setStatus) => {
  setStatus('finding files');

  const wordFrequencies = {};

  const filenames = await glob(globStr, {});
  setStatus(`${filenames.length} files to process`);

  const wordsInFiles = await Promise.all(
    filenames.map(async (filename, index) => {
      const fileContent = await readFileAsync(filename, 'utf8');

      const matches = fileContent.match(/\w+/g) || [];

      setStatus(`${index + 1}/${filenames.length} files processed`);
      return matches;
    })
  );

  setStatus(`processing results`);

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

  wordsInFiles.forEach(wordArray => {
    wordArray.forEach(word => {
      if (!validWord(word)) {
        return false;
      }
      if (word in wordFrequencies) {
        wordFrequencies[word]++;
      } else {
        wordFrequencies[word] = 1;
      }
    });
  });

  const wordsOrderedByFrequency = Object.entries(wordFrequencies)
    .filter(([key, value]) => value > minimumFrequency)
    .sort(([key1, value1], [key2, value2]) => {
      if (value1 !== value2) {
        return value1 < value2;
      }
      return key1.length > key2.length;
    })
    .map(([key, _]) => key);

  setStatus(`saving result`);
  await writeFileAsync('./words.json', JSON.stringify(wordsOrderedByFrequency));

  setStatus(`${wordsOrderedByFrequency.length} words synced`);

  return wordsOrderedByFrequency;
};

module.exports = extractFrequentWords;
