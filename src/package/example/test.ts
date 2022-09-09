import { Andromeda } from "../andromeda";
import path from 'path';

(async () => {
  
  const SessionName = 'teste';

  const clientOne = await Andromeda({
    sessionName: SessionName,
    TemporaryStoragePath: path.resolve(__dirname, '..', '..', '..', 'storage'),
    downloadMediaPath: path.resolve(__dirname, '..', '..', '..', 'media'),
    qrCodeInTerminal: true,
    agentName: SessionName,
    qrcodoPath: path.resolve(__dirname, '..', '..', '..', 'image', `${SessionName}_qrcode.png`),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onStatusChange: (connectionStatus) => console.log(connectionStatus),
    onMessage: (message) => console.log(JSON.stringify(message, undefined, 2)),
    onDisconnected: () => console.log('disconectou')
  });

  setInterval(async () => {

    try {
      
      console.log((await clientOne.verifyExistenceNumber('5511930224168')));

    } catch (error: any) {
      
      console.log('error', error.message);

    }

  }, 2000);

})()