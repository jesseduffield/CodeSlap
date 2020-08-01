const applescript = require('applescript');

const pollFrontmostApp = callback => {
  // would be good to make this platform agnostic
  const script =
    'tell application "System Events" to get name of first application process whose frontmost is true';

  applescript.execString(script, (err, rtn) => {
    let message;

    if (err) {
      console.warn(err);

      message = `Writing to: (unknown)`;
    } else {
      message = `Writing to: ${rtn}`;
    }

    callback(message);

    setTimeout(() => pollFrontmostApp(callback), 1000);
  });
};

const setupFrontAppPoller = () => {
  const targetAppLine = document.getElementById('targetAppLine');

  // TODO: work out why this thing is so slow in the built app
  // pollFrontmostApp(message => {
  //   targetAppLine.innerHTML = message;
  // });
};

module.exports = { setupFrontAppPoller };
