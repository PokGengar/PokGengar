import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';

const setupSSHServer = (server) => {
  const wss = new WebSocketServer({ server });
  
  console.log('WebSocket server initializing...');

  wss.on('connection', (ws) => {
    console.log('New client connected');
    let sshClient = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received message type:', data.type);

        if (data.type === 'connect') {
          console.log('Attempting to connect to:', data.host);
          sshClient = new Client();
          
          sshClient.on('ready', () => {
            console.log('SSH connection established');
            sshClient.shell((err, stream) => {
              if (err) {
                console.error('Shell error:', err);
                ws.send('\r\n*** SSH Shell 错误: ' + err.message + '\r\n');
                return;
              }

              stream.on('data', (data) => {
                ws.send(data.toString('utf-8'));
              });

              stream.on('close', () => {
                console.log('Stream closed');
                ws.close();
              });

              ws.on('message', (message) => {
                const data = JSON.parse(message);
                if (data.type === 'data') {
                  stream.write(data.data);
                }
              });
            });
          });

          sshClient.on('error', (err) => {
            console.error('SSH connection error:', err);
            ws.send('\r\n*** SSH 连接错误: ' + err.message + '\r\n');
          });

          sshClient.connect({
            host: data.host,
            port: data.port,
            username: data.username,
            password: data.password,
            readyTimeout: 5000,
            keepaliveInterval: 10000
          });
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (sshClient) {
        sshClient.end();
      }
    });
  });

  console.log('WebSocket server initialized');
};

export default setupSSHServer;
