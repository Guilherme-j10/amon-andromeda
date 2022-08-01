import { Andromeda } from "./package/andromeda";
import path from 'path';

(async () => {

  const SessionName = 'SpiderMan';

  const clientOne = await Andromeda({
    sessionName: SessionName,
    TemporaryStoragePath: path.resolve(__dirname, '..', 'storage'),
    connectionStorage: {
      dbname: 'andromeda',
      host: 'localhost',
      pass: '1234',
      user: 'guilherme'
    },
    qrCodeInTerminal: true,
    qrcodoPath: path.resolve(__dirname, '..', 'image', `${SessionName}_qrcode.png`),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onStatusChange: (connectionStatus) => console.log(connectionStatus),
    onMessage: (message) => {

      console.log(JSON.stringify(message, undefined, 2));

    },
  });

  console.log(clientOne.getDeviceInformation());

})();