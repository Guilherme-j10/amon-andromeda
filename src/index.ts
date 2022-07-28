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

  //console.log(JSON.stringify((await clientOne.sendSimpleMessage('Vai curitintians', '5511983547629')), undefined, 2))
  //console.log(JSON.stringify((await clientOne.replyMessage('5511983547629', 'Ola mundo', 'BAE57B9147270DE0')), undefined, 2))
  //console.log((await clientOne.verifyExistenceNumber('5516992995989')));
  //console.log(JSON.stringify((await clientOne.sendGifOrVideoMessage(path.resolve(__dirname, '..', 'media', 'video.mp4'), '5511983547629', 'Enviando um video com conteudo', true)), undefined, 2))
  //console.log(JSON.stringify((await clientOne.sendImage(path.resolve(__dirname, '..', 'media', 'image.jpeg'), '5511983547629', 'Imagem com conteudo')), undefined, 2));
  console.log(JSON.stringify((await clientOne.sendAudioMedia(path.resolve(__dirname, '..', 'media', 'music.opus'), '5511983547629')), undefined, 2));

})();