const glob = require('glob-promise');
const fs = require('fs');

const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const dir = INSERT_HERE;

const run = async () => {
  const wordFrequencies = {};

  const filenames = await glob(`${dir}/**/*.rb`, {});

  const wordsInFiles = await Promise.all(
    filenames.map(async filename => {
      const fileContent = await readFileAsync(filename, 'utf8');

      return fileContent.match(/\w+/g);
    })
  );

  wordsInFiles.slice(0, 100).forEach(wordArray => {
    wordArray.forEach(word => {
      if (word.length < 7) {
        return;
      }
      if (word in wordFrequencies) {
        wordFrequencies[word]++;
      } else {
        wordFrequencies[word] = 1;
      }
    });
  });

  const wordsOrderedByFrequency = Object.entries(wordFrequencies)
    .filter(([key, value]) => value > 1)
    .sort(([key1, value1], [key2, value2]) => {
      if (value1 !== value2) {
        return value1 < value2;
      }
      return key1.length > key2.length;
    })
    .map(([key, _]) => key);

  // console.log(JSON.stringify(wordsOrderedByFrequency, null, 4));

  await writeFileAsync('./words.json', JSON.stringify(wordsOrderedByFrequency));
};

run();
