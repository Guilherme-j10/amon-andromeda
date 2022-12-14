import { Andromeda } from "../andromeda";
import path from 'path';

(async () => {
  
  const SessionName = 'teste';

  const video_path = path.resolve(__dirname, '.', 'media', '2a7eef13-c77c-48b7-b5ba-8734d20723d5.mp4');
  const image_path = path.resolve(__dirname, '.', 'media', 'fd487bb1-35ed-47f7-b8ed-3670903e3cfe.jpeg');
  const audio_path = path.resolve(__dirname, '.', 'media', '50795482-43b3-4288-a842-18ccc36a5c05.mp3');
  const text_document_path = path.resolve(__dirname, '.', 'media', 'text.txt');

  const clientOne = await Andromeda({
    sessionName: SessionName,
    TemporaryStoragePath: path.resolve(__dirname, '.', 'storage'),
    downloadMediaPath: path.resolve(__dirname, '.', 'media'),
    qrCodeInTerminal: true,
    agentName: SessionName,
    qrcodoPath: path.resolve(__dirname, '.', 'image', `${SessionName}_qrcode.png`),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onStatusChange: (connectionStatus) => console.log(connectionStatus),
    onMessage: (message) => console.log(JSON.stringify(message, undefined, 2)),
    onDisconnected: () => console.log('disconectou')
  });

  // await clientOne.sendArchive({
  //   location_path: text_document_path,
  //   file_name: 'fala mundo'
  // }, '5511983547629');

  //await clientOne.sendSimpleMessage('asdf', '5511983547629');

  //await clientOne.sendImage(image_path, '5511983547629', 'mesma coisa so que com conteudo')

  //await clientOne.sendGifOrVideoMessage(video_path, '5511983547629', undefined, false)

  //await clientOne.sendAudioMedia(audio_path, '5511983547629', false)

})()