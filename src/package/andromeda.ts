import makeWASocket, {
  AnyMessageContent,
  Contact,
  DisconnectReason,
  proto,
  useMultiFileAuthState,
  UserFacingSocketConfig,
  downloadMediaMessage,
  WAPresence
} from "../Core/src";
import { Boom } from '@hapi/boom';
import {
  AndromedaProps,
  IAndromeda,
  IDocumentContent,
  IExistenceOnWhatsApp,
  IListMessageDefinitions
} from "./Dtos/interface";
import MAINLOGGER from './logger';
import Qrcode from 'qrcode';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 } from 'uuid';
import { AndromedaStorage } from "./andromeda_storage";
import mime from 'mime-types';
import knex, { Knex } from "knex";
import jimp from 'jimp';
import ffmpeg from 'fluent-ffmpeg';

export let database_connection = {} as Knex<any, unknown[]>;

const logger = MAINLOGGER.child({});
logger.level = 'silent';

const normalPrefix = '@s.whatsapp.net';

const verify_connection_database = async (): Promise<boolean> => {
  return new Promise(async (resolve) => {

    if (!Object.keys(database_connection).length) return resolve(false);

    database_connection.raw('select 1+1 as result')
      .then(() => resolve(true))
      .catch(() => resolve(false))

  })
}

export const Andromeda = async (initializerProps: AndromedaProps): Promise<IAndromeda> => {

  let IS_CONNECTED = false;
  initializerProps.onStatusChange('WaitinLogin');

  let StorageInitializer: AndromedaStorage;
  const haveConnectionProps = Object.keys(initializerProps.connectionStorage || {}).length;

  const database_is_connected = await verify_connection_database();

  if (!database_is_connected) {

    database_connection = knex({
      client: 'mysql2',
      connection: {
        host: initializerProps?.connectionStorage?.host || '',
        password: initializerProps?.connectionStorage?.pass || '',
        database: initializerProps?.connectionStorage?.dbname || '',
        user: initializerProps?.connectionStorage?.user || ''
      }
    });

  }

  if (Object.keys(initializerProps.connectionStorage || {}).length) {

    StorageInitializer = new AndromedaStorage({
      pathStorage: initializerProps.TemporaryStoragePath
    });

  }

  const { state, saveCreds } = await useMultiFileAuthState(
    path.join('sessions', `SessionAndromeda_${initializerProps.sessionName}`)
  );

  const presetToSocket: UserFacingSocketConfig = {
    printQRInTerminal: initializerProps.qrCodeInTerminal,
    logger: logger,
    auth: state,
    defaultQueryTimeoutMs: undefined,
    browser: [initializerProps.agentName ? initializerProps.agentName : 'Andromeda', 'MacOS', '3.0']
  };

  let socket = makeWASocket(presetToSocket);

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('presence.update', json => {
    if (typeof initializerProps.onPresenceUpdate === 'function') {
      initializerProps.onPresenceUpdate(json)
    }
  })

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
          const messageType = Object.keys(message.messages[0].message?.documentWithCaptionMessage?.message || message.messages[0]?.message || {})[0];

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

            const mimetypeFile = message.messages[0].message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype || message.messages[0].message?.[messageType as keyof proto.IMessage]?.['mimetype' as keyof {}] as unknown as string;

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

      const message_content = filename.length ? { ...message, fileNameDownloaded: filename } : message;

      initializerProps.onMessage(message_content);

      if (haveConnectionProps) StorageInitializer.saveMessageInStorage(message_content);

    }

  });

  // for this work on system -> sudo apt install ffmpeg
  const generate_video_thumbnail = async (archive_path: string): Promise<string> => {
    return new Promise((resolve) => {
      const file_name = `${v4()}.jpeg`;
      ffmpeg(archive_path).screenshot({
        count: 1,
        timestamps: ['00:00.000'],
        size: '40x72',
        folder: initializerProps.downloadMediaPath,
        filename: file_name
      }).on('end', () => resolve(file_name))
    })
  }

  const aspectRatio = (width_value: number, width: number, height: number) => {

    const isHorizontal = width > height;
    const aspect_ratio = isHorizontal ? width / height : height / width;
    const height_apect_ratio = isHorizontal ? width_value / aspect_ratio : width_value * aspect_ratio;

    return {
      width: width_value,
      height: height_apect_ratio
    }

  }

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

        fs.rmSync(path.resolve(__dirname, '..', '..', 'sessions', `SessionAndromeda_${initializerProps.sessionName}`), { force: true, recursive: true });
        fs.rmSync(path.resolve(__dirname, '..', '..', '..', '..', 'sessions', `SessionAndromeda_${initializerProps.sessionName}`), { force: true, recursive: true });

        initializerProps.onDisconnected();

      }

      if (connection === 'open') {

        IS_CONNECTED = true;
        initializerProps.onStatusChange('Connected');

        resolve({

          async disconnect_database(): Promise<void> {

            await database_connection.destroy()

          },

          async presenceUpdate(type: WAPresence, toJid?: string): Promise<boolean> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' }

              await socket.sendPresenceUpdate(type, `${toJid}${normalPrefix}`)

              return true;

            } catch { return false };

          },

          async read_message(data: proto.IMessageKey[]): Promise<boolean> {

            try {

              if (!IS_CONNECTED) throw { message: 'Connection is closed.' }

              const messages = data.map(remotes => ({ ...remotes, remoteJid: `${remotes.remoteJid}${normalPrefix}` }));

              await socket.readMessages(messages);

              return true;

            } catch { return false };

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

              const generate_videothumb = await generate_video_thumbnail(mediaPath);
              const thumbnail_path = `${initializerProps.downloadMediaPath}/${generate_videothumb}`;

              const optionsMedia: AnyMessageContent = {
                video: fs.readFileSync(mediaPath),
                jpegThumbnail: fs.readFileSync(thumbnail_path, { encoding: 'base64' })
              }

              if (isGif) optionsMedia.gifPlayback = true;

              if ((content || '').length) optionsMedia.caption = content;

              const sendMediaMessage = await socket.sendMessage(`${number}${normalPrefix}`, optionsMedia);

              if (typeof sendMediaMessage === 'undefined') throw { message: 'Not was possible send video or gif now.' }

              if (haveConnectionProps) StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendMediaMessage] });

              fs.unlinkSync(path.resolve(thumbnail_path));

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

            } catch { return {} as proto.WebMessageInfo }

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

              const thumb_image_data = await jimp.read(imagePath);

              const apspect_ratio = aspectRatio(40, thumb_image_data.getWidth(), thumb_image_data.getHeight());

              thumb_image_data.resize(apspect_ratio.width, apspect_ratio.height);
              const thumbnail_complete = await thumb_image_data.getBase64Async('image/jpeg');

              const optionsSenMessage: AnyMessageContent = {
                image: {
                  url: imagePath,
                },
                jpegThumbnail: thumbnail_complete.split(',')[1]
              };

              if ((content || '').length) optionsSenMessage.caption = content;

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

          async subscribe_precense(number: string): Promise<void> {

            await socket.presenceSubscribe(`${number}${normalPrefix}`);

          }

        })

      }

    });

  });

}