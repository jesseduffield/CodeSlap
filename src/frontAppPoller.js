const applescript = require('applescript');

// passing in a callback here to set the innerHTML of an element is likely overkill
// but I'm preparing for turning this back into a worker if it turns out that's
// what we need to do, after which we'll swap out `callback` for `postMessage`
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
  const connectionStatus = document.getElementById('connectionStatus');

  // TODO: work out why this thing is so slow in the built app
  // pollFrontmostApp(message => {
  //   connectionStatus.innerHTML = message;
  // });
};

module.exports = { setupFrontAppPoller };
