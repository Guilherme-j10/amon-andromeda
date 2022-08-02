import makeWASocket, { AnyMessageContent, Contact, DisconnectReason, proto, useMultiFileAuthState, UserFacingSocketConfig } from "@adiwajshing/baileys";
import { Boom } from '@hapi/boom';
import { AndromedaProps, IAndromeda, IExistenceOnWhatsApp, IListMessageDefinitions } from "./Dtos/interface";
import MAINLOGGER from './logger';
import Qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { AndromedaStorage } from "./andromeda_storage";

const logger = MAINLOGGER.child({ });
logger.level = 'silent';

const normalPrefix = '@s.whatsapp.net';

export const Andromeda = async (initializerProps: AndromedaProps): Promise<IAndromeda> => {

  let IS_CONNECTED = false;
  initializerProps.onStatusChange('WaitinLogin');

  const StorageInitializer = new AndromedaStorage(initializerProps.connectionStorage, {
    pathStorage: initializerProps.TemporaryStoragePath
  });

  const { state, saveCreds } = await useMultiFileAuthState(`SessionAndromeda_${initializerProps.sessionName}`);

  const presetToSocket: UserFacingSocketConfig = {
    printQRInTerminal: initializerProps.qrCodeInTerminal,
    logger: logger,
    auth: state,
    browser: ['Andromeda', 'MacOS', '3.0']
  };

  let socket = makeWASocket(presetToSocket);

  socket.ev.on('connection.update', async () => {
  
    await saveCreds();

  });

  socket.ev.on('messages.upsert', async (message) => {

    if(message.type === 'notify'){

      if(initializerProps.IgnoreServer_ACK && message.messages[0].status === 2) return;

      if(initializerProps.IgnoreBroadCastMessages && message.messages[0].key.remoteJid?.match(/@broadcast/gi)?.length) return;

      if(initializerProps.IgnoreGroupsMessages && message.messages[0].key.remoteJid?.match(/@g.us/gi)?.length) return;

      initializerProps.onMessage(message);
      StorageInitializer.saveMessageInStorage(message);

    }

  });

  return new Promise((resolve) => {

    socket.ev.on('connection.update', async (update) => {

      const { connection, lastDisconnect } = update;
  
      if(update.qr){
  
        Qrcode.toFile(initializerProps.qrcodoPath, update.qr)
  
      }
  
      if(connection === 'close') {
        
        IS_CONNECTED = false;
        initializerProps.onStatusChange('WaitinLogin');

        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if(shouldReconnect) {
  
          const client = await Andromeda(initializerProps);
          resolve(client);

          return;

        }
        
        fs.rmSync(path.resolve(__dirname, '..', '..', `SessionAndromeda_${initializerProps.sessionName}`), { force: true, recursive: true });
        fs.rmSync(path.resolve(__dirname, '..', '..', '..', '..', `SessionAndromeda_${initializerProps.sessionName}`), { force: true, recursive: true });
        
        const AnotherSession = await Andromeda(initializerProps);
        resolve(AnotherSession);

      }
      
      if(connection === 'open') {

        IS_CONNECTED = true;
        initializerProps.onStatusChange('Connected');
  
        resolve({

          async replyMessage(number: string, content: string, quotedId: string): Promise<proto.WebMessageInfo> {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            const msg = await StorageInitializer.getMessageFromFakestorage(quotedId);

            const sendReply = await socket.sendMessage(`${number}${normalPrefix}`, { text: content }, { quoted: msg });

            if(typeof sendReply === 'undefined') throw { message: 'Not was possible reply this message' }

            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendReply] });

            return sendReply;

          },

          async sendGifOrVideoMessage(mediaPath: string, number: string, content?: string, isGif?: boolean): Promise<proto.WebMessageInfo> {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            const optionsMedia: AnyMessageContent = {
              video: fs.readFileSync(mediaPath)
            }

            if(isGif) optionsMedia.gifPlayback = true;

            if(content) optionsMedia.caption = content;

            const sendMediaMessage = await socket.sendMessage(`${number}${normalPrefix}`, optionsMedia);

            if(typeof sendMediaMessage === 'undefined') throw { message: 'Not was possible send video or gif now.' }

            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendMediaMessage] });

            return sendMediaMessage;

          },
 
          async logOut (): Promise<boolean> {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            await socket.logout();

            return true;

          },

          async sendAudioMedia(audioPath: string, number: string, isPtt?: boolean): Promise<proto.WebMessageInfo> {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            const device = await StorageInitializer.getTypeDevice(`${number}${normalPrefix}`);

            const sendAudioMedia = await socket.sendMessage(`${number}${normalPrefix}`, {
              audio: {
                url: audioPath
              },
              ptt: isPtt ? isPtt : false,
              mimetype: device === 'android' ? 'audio/mp4' : 'audio/mpeg'
            });

            if(typeof sendAudioMedia === 'undefined') throw { message: 'Not was possible send audio media.' }

            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendAudioMedia] });

            return sendAudioMedia;

          },

          getDeviceInformation (): Contact {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            return socket.user as Contact;

          },

          async verifyExistenceNumber (number: string): Promise<IExistenceOnWhatsApp> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
        
            const [result] = await socket.onWhatsApp(number);
        
            return {
              exists: result?.exists || false,
              formatedJid: result?.jid || ''
            }
        
          },

          async sendListMessage(number: string, listMessage: IListMessageDefinitions): Promise<proto.WebMessageInfo> {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            const sendListMessage = await socket.sendMessage(`${number}${normalPrefix}`, listMessage);

            if(typeof sendListMessage === 'undefined') throw { message: 'Not was possible send audio media.' }

            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendListMessage] });

            return sendListMessage;

          },

          async sendImage(imagePath: string, number: string, content?: string): Promise<proto.WebMessageInfo> {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            const optionsSenMessage: AnyMessageContent = {
              image: {
                url: imagePath
              }
            };  

            if(content) optionsSenMessage.caption = content;

            const sendImage = await socket.sendMessage(`${number}${normalPrefix}`, optionsSenMessage);

            if(typeof sendImage === 'undefined') throw { message: 'Not was possible send image' }

            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendImage] });

            return sendImage;

          },  
          
          async blockContact (number: string): Promise<boolean> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
        
            await socket.updateBlockStatus(`${number}${normalPrefix}`, 'block');
        
            return true;
          
          },
        
          async unBlockContact (number: string): Promise<boolean> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
            
            await socket.updateBlockStatus(`${number}${normalPrefix}`, 'unblock');
            
            return true;
          
          },
        
          async getImageContact(number: string, isGroup: boolean): Promise<{ uri: string }> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
        
            const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';
        
            const profilePictureUrl = await socket.profilePictureUrl(`${number}${prefix}`, 'image');
        
            if(typeof profilePictureUrl === 'undefined') throw { message: 'Not was possible fatch the url profile of this contact.' }
        
            return {
              uri: profilePictureUrl as string
            };
        
          },
        
          async deleteMessageForEveryone(number: string, messageId: string, isGroup?: boolean): Promise<boolean> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
        
            const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';
        
            const deleteMessage = socket.sendMessage(`${number}${prefix}`, { delete: {
              remoteJid: `${number}${prefix}`,
              id: messageId,
            } });
        
            if(typeof deleteMessage === 'undefined') throw { message: 'Not was possible delete this message' }
        
            return true;
        
          },
        
          async sendSimpleMessage(content: string, number: string): Promise<proto.WebMessageInfo> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
        
            const sendMessage = await socket.sendMessage(`${number}${normalPrefix}`, { text: content });
        
            if(typeof sendMessage === 'undefined') throw { message: 'Not was possible send this message' }

            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendMessage] });
        
            return sendMessage;
        
          },
        
        })
  
      }
  
    });

  });

}