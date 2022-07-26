import { Andromeda } from "./package/andromeda";
import path from 'path';

(async () => {

  const client = await Andromeda({
    sessionName: 'Receptivo',
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

})();