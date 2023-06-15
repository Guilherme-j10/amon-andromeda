import { Andromeda } from "../../index";
import path from 'path';

(async () => {

  const SessionName = 'teste';

  // const video_path = path.resolve(__dirname, '.', 'media', 'a5c4f99c6bb24e60ec28c35a9a21618e (1).mp4');
  // const image_path = path.resolve(__dirname, '.', 'image', 'teste_qrcode.png');
  // const audio_path = path.resolve(__dirname, '.', 'media', '50795482-43b3-4288-a842-18ccc36a5c05.mp3');
  // const text_document_path = path.resolve(__dirname, '.', 'media', 'text.txt');

  const clientOne = await Andromeda({
    sessionName: SessionName,
    TemporaryStoragePath: path.resolve(__dirname, '.', 'storage'),
    downloadMediaPath: path.resolve(__dirname, '.', 'media'),
    qrCodeInTerminal: true,
    agentName: SessionName,
    // connectionStorage: {
    //   dbname: 'cloudchat_development' as 'andromeda',
    //   host: 'localhost',
    //   pass: 'M3g4_c0n3c74',
    //   user: 'root'
    // },
    qrcodoPath: path.resolve(__dirname, '.', 'image', `${SessionName}_qrcode.png`),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onStatusChange: (connectionStatus) => console.log(connectionStatus),
    onPresenceUpdate: (presence) => console.log(presence),
    onMessage: (message) => console.log(JSON.stringify(message, undefined, 2)),
    onDisconnected: () => console.log('disconectou')
  });

  //await clientOne.read_message([{ remoteJid: '5511993335309', id: 'F4D0A47B10BCB5950791BC2E0FC0A539' }])
  //await clientOne.presenceUpdate('paused', '5511993335309');

  // await clientOne.sendSimpleMessage('ola mundo', '551170707070');

  // await clientOne.subscribe_precense('551170707070');
  // await clientOne.subscribe_precense('551170707070');

  // await clientOne.sendArchive({
  //   location_path: text_document_path,
  //   file_name: 'fala mundo'
  // }, 'phone_number');

  //await clientOne.sendSimpleMessage('asdf', 'phone_number');

  // console.log(content);

  // await clientOne.sendImage(image_path, 'phone_number', 'mesma coisa so que com conteudo')

  // await clientOne.sendGifOrVideoMessage(video_path, 'phone_number', undefined, false)

  //await clientOne.sendAudioMedia(audio_path, 'phone_number', false)

  const calculate_message_time = (text: string): number => {

    const message = text.split('');

    return message.reduce((accumulator) => {

      accumulator += 500;

      return accumulator;

    }, 0)

  }

  const delay_time = (timer: number): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), timer);
    })
  }

  const send_message = async (message: string, phone_number: string): Promise<void> => {

    const time_to_send_message = calculate_message_time(message);
    let counter_limit = 0;

    while (counter_limit <= time_to_send_message) {

      await clientOne.sendPresence('composing', phone_number);

      delay_time(1);
      counter_limit++;

    }

    await clientOne.sendPresence('available', phone_number);
    await clientOne.sendSimpleMessage(message, phone_number);

  }

  await send_message('ola guilherme tudo bem com vc meu chapa', '5511983547629');

})()