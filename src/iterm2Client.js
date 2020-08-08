const net = require('net');

const getIterm2Client = (onConnect, onDisconnect) => {
  let connected = false;
  let client = new net.Socket();

  const reconnect = () => {
    setTimeout(() => {
      client.removeAllListeners();
      connect();
    }, 1000);
  };

  const connect = () => {
    client.on('error', console.error);

    client.connect(15555, 'localhost', () => {
      connected = true;
      onConnect();
      console.log('Connected');
    });

    client.on('data', data => {
      console.log('Received: ' + data);
    });

    client.on('close', () => {
      connected = false;
      onDisconnect();
      console.log('Connection closed');
      reconnect();
    });
  };

  connect();

  return {
    write: message => {
      if (connected) {
        client.write(message, 'utf8');
      } else {
        console.error('not connected');
      }
    },
  };
};

module.exports = { getIterm2Client };
