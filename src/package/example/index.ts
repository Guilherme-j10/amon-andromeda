import { Andromeda } from "../andromeda";
import path from 'path';

(async () => {

  const SessionName = 'SpiderMan';

  const clientOne = await Andromeda({
    sessionName: SessionName,
    TemporaryStoragePath: path.resolve(__dirname, '..', '..', '..', 'storage'),
    downloadMediaPath: path.resolve(__dirname, '..', 'media'),
    connectionStorage: {
      dbname: 'andromeda',
      host: 'localhost',
      pass: 'pass',
      user: 'user'
    },
    qrCodeInTerminal: true,
    qrcodePath: path.resolve(__dirname, '..', '..', '..', 'image', `${SessionName}_qrcode.png`),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onDisconnected: () => console.log(''),
    onStatusChange: (connectionStatus) => console.log(connectionStatus),
    onMessage: (message) => {

      console.log(JSON.stringify(message, undefined, 2));
      console.log(message);

    },
  });

  try {
    
    // sending a message
    console.log(
      JSON.stringify(
        (await clientOne.sendSimpleMessage('Vai curitintians', '5511930224168')),
        undefined, 2
      )
    );
      
    //replying a message
    console.log(
      JSON.stringify(
        (await clientOne.replyMessage('5511983547629', 'Ola mundo', 'BAE57B9147270DE0')), 
        undefined, 2
      )
    );
      
    //verifieng the existence of a number
    console.log(
      (await clientOne.verifyExistenceNumber('5516992995989'))
    );
    
    //sending a video or gif
    console.log(
      JSON.stringify(
        (await clientOne.sendGifOrVideoMessage(path.resolve(__dirname, '..', 'media', 'video.mp4'), '5511983547629', 'Enviando um video com conteudo', true)),
        undefined, 2
      )
    );
      
    //sending a image
    console.log(
      JSON.stringify(
        (await clientOne.sendImage(path.resolve(__dirname, '..', 'media', 'image.jpeg'), '5511983547629', 'Imagem com conteudo'))
        , undefined, 2
      )
    );
    
    //sending a audio file or voice message
    console.log(
      JSON.stringify(
        (await clientOne.sendAudioMedia(path.resolve(__dirname, '..', 'media', 'music.mp3'), '5511983547629', false)), 
        undefined, 2
      )
    );
    
    //sending a list
    const sendListMessage = await clientOne.sendListMessage('5511983547629', {
      text: 'este é o texto',
      buttonText: 'este é o texto do botão',
      title: 'Este é o titulo',
      sections: [
        {
          title: 'titulo da primeira opção',
          rows: [
            {
              title: 'linha um',
              rowId: 'linhaUm',
              description: 'Content node'
            }
          ]
        }
      ]
    });

    console.log(sendListMessage);

  } catch (error: any) {
    
    console.log(error.message);

  }

})();