import makeWASocket, { AnyMessageContent, Contact, DisconnectReason, proto, useMultiFileAuthState, UserFacingSocketConfig, downloadMediaMessage } from "@adiwajshing/baileys";
import { Boom } from '@hapi/boom';
import { AndromedaProps, IAndromeda, IDocumentContent, IExistenceOnWhatsApp, IListMessageDefinitions } from "./Dtos/interface";
import MAINLOGGER from './logger';
import Qrcode from 'qrcode';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 } from 'uuid';
import { AndromedaStorage } from "./andromeda_storage";
import mime from 'mime-types';
import knex from "knex";

const logger = MAINLOGGER.child({});
logger.level = 'silent';

const normalPrefix = '@s.whatsapp.net';

export const Andromeda = async (initializerProps: AndromedaProps): Promise<IAndromeda> => {

  let IS_CONNECTED = false;
  initializerProps.onStatusChange('WaitinLogin');

  let StorageInitializer: AndromedaStorage;
  const haveConnectionProps = Object.keys(initializerProps.connectionStorage || {}).length;

  const connection_database = knex({
    client: 'mysql2',
    connection: {
      host: initializerProps?.connectionStorage?.host || '',
      password: initializerProps?.connectionStorage?.pass || '',
      database: initializerProps?.connectionStorage?.dbname || '',
      user: initializerProps?.connectionStorage?.user || ''
    }
  });;

  if (Object.keys(initializerProps.connectionStorage || {}).length) {

    StorageInitializer = new AndromedaStorage(connection_database, {
      pathStorage: initializerProps.TemporaryStoragePath
    });

  }

  const { state, saveCreds } = await useMultiFileAuthState(`SessionAndromeda_${initializerProps.sessionName}`);

  const presetToSocket: UserFacingSocketConfig = {
    printQRInTerminal: initializerProps.qrCodeInTerminal,
    logger: logger,
    auth: state,
    browser: [initializerProps.agentName ? initializerProps.agentName : 'Andromeda', 'MacOS', '3.0']
  };

  let socket = makeWASocket(presetToSocket);

  socket.ev.on('connection.update', async () => {

    await saveCreds();

  });

  socket.ev.on('messages.upsert', async (message) => {

    if (message.type === 'notify') {

      if (
        initializerProps.IgnoreServer_ACK &&
        (message.messages[0].status === 2 && (typeof message.messages[0].key.fromMe === 'boolean' && !message.messages[0].key.fromMe)) ||
        Object.keys(message.messages[0].message?.protocolMessage || {}).length
      ) return;

      if (initializerProps.IgnoreBroadCastMessages && message.messages[0].key.remoteJid?.match(/@broadcast/gi)?.length) return;

      if (initializerProps.IgnoreGroupsMessages && message.messages[0].key.remoteJid?.match(/@g.us/gi)?.length) return;

      if (message.messages[0].messageStubParameters) return;

      let filename = '';

      try {

        if (message.messages) {

          const typesMediaMessage = ['imageMessage', 'audioMessage', 'videoMessage', 'documentMessage', 'stickerMessage'];
          const messageType = Object.keys(message.messages[0]?.message as {} || {})[0];

          if (typesMediaMessage.includes(messageType)) {

            const bufferData = await downloadMediaMessage(
              message.messages[0],
              'buffer',
              {},
              {
                logger,
                reuploadRequest: socket.updateMediaMessage
              }
            );

            const thisPathExists = fs.existsSync(path.resolve(initializerProps.downloadMediaPath));

            if (!thisPathExists) {

              fs.mkdirSync(path.resolve(initializerProps.downloadMediaPath));

            }

            const mimetypeFile = message.messages[0].message?.[messageType as keyof proto.IMessage]?.['mimetype' as keyof {}] as unknown as string;

            filename = `${v4()}.${mime.extension(mimetypeFile)}`;

            writeFile(path.resolve(initializerProps.downloadMediaPath, filename), bufferData);

          }

        }

      } catch (error: any) {

        console.log({
          log: 'Not was possible download the message',
          error: error.message,
          message: JSON.stringify(message, undefined, 2)
        })

      }

      initializerProps.onMessage(filename.length ? { ...message, fileNameDownloaded: filename } : message);

      if (haveConnectionProps) StorageInitializer.saveMessageInStorage(message);

    }

  });

  // const get_mime_type_archive = (value: string): string => {

  //   console.log('MIME TYPE => ', value, mime.extension(value))

  //   const step_one = value.split(';');

  //   if(step_one.length > 1) return mime.extension(step_one[0]) as string

  //   return mime.extension(value) as string;

  //   // const split_step_one = value.split('/');
  //   // const split_step_two = split_step_one[1].split(';');

  //   // return split_step_two.length > 1 ? split_step_two[0] : split_step_one[1];

  // }

  return new Promise((resolve) => {

    socket.ev.on('connection.update', async (update) => {

      const { connection, lastDisconnect } = update;

      if (update.qr) {

        Qrcode.toFile(initializerProps.qrcodoPath, update.qr)

      }

      if (connection === 'close') {

        IS_CONNECTED = false;
        initializerProps.onStatusChange('WaitinLogin');

        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {

          const client = await Andromeda(initializerProps);
          IS_CONNECTED = true;
          resolve(client);

          return;

        }

        fs.rmSync(path.resolve(__dirname, '..', '..', `SessionAndromeda_${initializerProps.sessionName}`), { force: true, recursive: true });
        fs.rmSync(path.resolve(__dirname, '..', '..', '..', '..', `SessionAndromeda_${initializerProps.sessionName}`), { force: true, recursive: true });

        initializerProps.onDisconnected();

      }

      if (connection === 'open') {

        IS_CONNECTED = true;
        initializerProps.onStatusChange('Connected');

        resolve({

          async diconnect_database(): Promise<void> {

            await connection_database.destroy()

          },

          async replyMessage(number: string, content: string, quotedId: string): Promise<proto.WebMessageInfo> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              if (!haveConnectionProps) throw { message: 'For this method a mysql connection is required' };

              const msg = await StorageInitializer.getMessageFromFakestorage(quotedId);

              const sendReply = await socket.sendMessage(`${number}${normalPrefix}`, { text: content }, { quoted: msg });

              if (typeof sendReply === 'undefined') throw { message: 'Not was possible reply this message' }

              StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendReply] });

              return sendReply;

            } catch { return {} as proto.WebMessageInfo }

          },

          async sendGifOrVideoMessage(mediaPath: string, number: string, content?: string, isGif?: boolean): Promise<proto.WebMessageInfo> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const optionsMedia: AnyMessageContent = {
                video: fs.readFileSync(mediaPath)
              }

              if (isGif) optionsMedia.gifPlayback = true;

              if (content) optionsMedia.caption = content;

              const sendMediaMessage = await socket.sendMessage(`${number}${normalPrefix}`, optionsMedia);

              if (typeof sendMediaMessage === 'undefined') throw { message: 'Not was possible send video or gif now.' }

              if (haveConnectionProps) StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendMediaMessage] });

              return sendMediaMessage;

            } catch { return {} as proto.WebMessageInfo }

          },

          async sendArchive(document: IDocumentContent, number: string): Promise<proto.WebMessageInfo> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' }

              const prepared_content: AnyMessageContent = {
                mimetype: mime.lookup(document.location_path) as string,
                fileName: document.file_name,
                document: fs.readFileSync(document.location_path)
              }

              const send_media_message = await socket.sendMessage(`${number}${normalPrefix}`, prepared_content);

              return send_media_message as proto.WebMessageInfo;

            } catch {  return {} as proto.WebMessageInfo }

          },

          async logOut(): Promise<boolean> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              await socket.logout();

              return true;

            } catch { return false }

          },

          async sendAudioMedia(audioPath: string, number: string, isPtt?: boolean): Promise<proto.WebMessageInfo> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              if (!haveConnectionProps) throw { message: 'For this method a mysql connection is required' };

              const device = await StorageInitializer.getTypeDevice(`${number}${normalPrefix}`);

              const sendAudioMedia = await socket.sendMessage(`${number}${normalPrefix}`, {
                audio: {
                  url: audioPath
                },
                ptt: isPtt ? isPtt : false,
                mimetype: device === 'android' ? 'audio/mp4' : 'audio/mpeg'
              });

              if (typeof sendAudioMedia === 'undefined') throw { message: 'Not was possible send audio media.' }

              StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendAudioMedia] });

              return sendAudioMedia;

            } catch { return {} as proto.WebMessageInfo }

          },

          getDeviceInformation(): Contact {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              return socket.user as Contact;

            } catch { return {} as Contact }

          },

          async verifyExistenceNumber(number: string): Promise<IExistenceOnWhatsApp> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const [result] = await socket.onWhatsApp(number);

              return {
                exists: result?.exists || false,
                formatedJid: result?.jid || number
              }

            } catch { return {} as IExistenceOnWhatsApp }

          },

          async sendListMessage(number: string, listMessage: IListMessageDefinitions): Promise<proto.WebMessageInfo> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const sendListMessage = await socket.sendMessage(`${number}${normalPrefix}`, listMessage);

              if (typeof sendListMessage === 'undefined') throw { message: 'Not was possible send audio media.' }

              if (haveConnectionProps) StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendListMessage] });

              return sendListMessage;

            } catch { return {} as proto.WebMessageInfo }

          },

          async sendImage(imagePath: string, number: string, content?: string): Promise<proto.WebMessageInfo> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const optionsSenMessage: AnyMessageContent = {
                image: {
                  url: imagePath
                }
              };

              if (content) optionsSenMessage.caption = content;

              const sendImage = await socket.sendMessage(`${number}${normalPrefix}`, optionsSenMessage);

              if (typeof sendImage === 'undefined') throw { message: 'Not was possible send image' }

              if (haveConnectionProps) StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendImage] });

              return sendImage;

            } catch { return {} as proto.WebMessageInfo }

          },

          async blockContact(number: string): Promise<boolean> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              await socket.updateBlockStatus(`${number}${normalPrefix}`, 'block');

              return true;

            } catch { return false }

          },

          async unBlockContact(number: string): Promise<boolean> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              await socket.updateBlockStatus(`${number}${normalPrefix}`, 'unblock');

              return true;

            } catch { return false }

          },

          async getImageContact(number: string, isGroup: boolean): Promise<{ uri: string }> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';

              const profilePictureUrl = await socket.profilePictureUrl(`${number}${prefix}`, 'image');

              if (typeof profilePictureUrl === 'undefined') throw { message: 'Not was possible fatch the url profile of this contact.' }

              return {
                uri: profilePictureUrl as string
              };

            } catch { return { uri: '' } }

          },

          async deleteMessageForEveryone(number: string, messageId: string, isGroup?: boolean): Promise<boolean> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';

              const deleteMessage = socket.sendMessage(`${number}${prefix}`, {
                delete: {
                  remoteJid: `${number}${prefix}`,
                  id: messageId,
                }
              });

              if (typeof deleteMessage === 'undefined') throw { message: 'Not was possible delete this message' }

              return true;

            } catch { return false }

          },

          async sendSimpleMessage(content: string, number: string): Promise<proto.WebMessageInfo> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const sendMessage = await socket.sendMessage(`${number}${normalPrefix}`, { text: content });

              if (typeof sendMessage === 'undefined') throw { message: 'Not was possible send this message' }

              if (haveConnectionProps) StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendMessage] });

              return sendMessage;

            } catch { return {} as proto.WebMessageInfo; }

          },

        })

      }

    });

  });

}