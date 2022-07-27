import { Andromeda } from "./package/andromeda";
import path from 'path';

(async () => {

  const clientOne = await Andromeda({
    sessionName: 'Receptivo',
    connectionStorage: {
      dbname: 'andromeda',
      host: 'localhost',
      pass: '1234',
      user: 'guilherme'
    },
    qrCodeInTerminal: true,
    qrcodoPath: path.resolve(__dirname, '..', 'image', 'Receptivo_qrcode.png'),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onMessage: (message) => {

      console.log(JSON.stringify(message, undefined, 2));
      console.log(message);

    },
  });

  const clientTwo = await Andromeda({
    sessionName: 'Suporte',
    connectionStorage: {
      dbname: 'andromeda',
      host: 'localhost',
      pass: '1234',
      user: 'guilherme'
    },
    qrCodeInTerminal: true,
    qrcodoPath: path.resolve(__dirname, '..', 'image', 'Suporte_qrcode.png'),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onMessage: (message) => {

      console.log(JSON.stringify(message, undefined, 2));
      console.log(message);

    },
  });

  console.log((clientOne.getDeviceInformation()));
  console.log((clientTwo.getDeviceInformation()));

})();