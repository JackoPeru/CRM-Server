const dgram = require('dgram');
const os = require('os');

const DISCOVERY_PORT = 41234;
const BROADCAST_ADDR = '255.255.255.255';

class Discovery {
  constructor(serverPort) {
    this.serverPort = serverPort;
    this.peers = new Set();
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.on('message', (message, rinfo) => {
      const msg = JSON.parse(message.toString());
      if (msg.type === 'crm-marmeria-discovery' && msg.port !== this.serverPort) {
        const peer = `${rinfo.address}:${msg.port}`;
        if (!this.peers.has(peer)) {
          this.peers.add(peer);
          console.log(`Discovered peer: ${peer}`);
          // Optionally, send a response back
          this.sendMessage({ type: 'crm-marmeria-response', port: this.serverPort }, rinfo.address, rinfo.port);
        }
      }
    });

    this.socket.on('listening', () => {
      const address = this.socket.address();
      console.log(`Discovery socket listening ${address.address}:${address.port}`);
      this.socket.setBroadcast(true);
      this.broadcast();
    });

    this.socket.bind(DISCOVERY_PORT);

    setInterval(() => this.broadcast(), 60000); // Broadcast every minute
  }

  broadcast() {
    const message = Buffer.from(JSON.stringify({ type: 'crm-marmeria-discovery', port: this.serverPort }));
    this.socket.send(message, 0, message.length, DISCOVERY_PORT, BROADCAST_ADDR, (err) => {
      if (err) console.error('Broadcast error:', err);
      else console.log('Discovery message broadcasted');
    });
  }

  sendMessage(msg, host, port) {
    const message = Buffer.from(JSON.stringify(msg));
    this.socket.send(message, 0, message.length, port, host, (err) => {
      if (err) console.error(`Error sending message to ${host}:${port}`, err);
    });
  }

  getPeers() {
    return Array.from(this.peers);
  }
}

module.exports = Discovery;