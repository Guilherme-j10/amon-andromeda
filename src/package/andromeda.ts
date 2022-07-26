import makeWASocket, { Contact, DisconnectReason, proto, useMultiFileAuthState, UserFacingSocketConfig } from "@adiwajshing/baileys";
import { Boom } from '@hapi/boom';
import { AndromedaProps, IAndromeda, IBaileys, IExistenceOnWhatsApp } from "./Dtos/interface";
import MAINLOGGER from './logger';
import Qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

const logger = MAINLOGGER.child({ });
logger.level = 'silent';

export const Andromeda = async (initializerProps: AndromedaProps): Promise<IAndromeda> => {

  let IS_CONNECTED = false;

  const { state, saveCreds } = await useMultiFileAuthState(`andromedaSessions_${initializerProps.sessionName}`);

  const presetToSocket: UserFacingSocketConfig = {
    printQRInTerminal: initializerProps.qrCodeInTerminal,
    logger: logger,
    auth: state,
    browser: ['Andromeda', 'MacOS', '3.0']
  };

  let socket: typeof IBaileys = makeWASocket(presetToSocket);

  socket.ev.on('connection.update', async () => {
  
    await saveCreds();

  });

  socket.ev.on('messages.upsert', async (message) => {

    if(message.type === 'notify'){  

      if(initializerProps.IgnoreServer_ACK && message.messages[0].status === 2) return;

      if(initializerProps.IgnoreBroadCastMessages && message.messages[0].key.remoteJid?.match(/@broadcast/gi)?.length) return;

      if(initializerProps.IgnoreGroupsMessages && message.messages[0].key.remoteJid?.match(/@g.us/gi)?.length) return;

      initializerProps.onMessage(message);

    }

  }) 

  return new Promise((resolve) => {

    socket.ev.on('connection.update', async (update) => {

      const { connection, lastDisconnect } = update;
  
      if(update.qr){
  
        Qrcode.toFile(initializerProps.qrcodoPath, update.qr)
  
      }
  
      if(connection === 'close') {
        
        IS_CONNECTED = false;
  
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if(shouldReconnect) {
  
          const client = await Andromeda(initializerProps);
          resolve(client);

          return;

        }

        fs.rmSync(path.resolve(__dirname, '..', '..', `andromedaSessions_${initializerProps.sessionName}`), { force: true, recursive: true });
        
        const AnotherSession = await Andromeda(initializerProps);
        resolve(AnotherSession);

      }
      
      if(connection === 'open') {

        IS_CONNECTED = true;
        console.clear();
        console.log('CONNECTED');
  
        resolve({

          async logOut (): Promise<boolean> {

            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };

            await socket.logout()

            return true;

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
        
          async logOutInstance (): Promise<boolean> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
        
            await socket.logout();
        
            return true;
        
          },
          
          async blockContact (number: string): Promise<boolean> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
        
            await socket.updateBlockStatus(`${number}@s.whatsapp.net`, 'block');
        
            return true;
          
          },
        
          async unBlockContact (number: string): Promise<boolean> {
        
            if(!IS_CONNECTED) throw { message: 'Connection is closed.' };
            
            await socket.updateBlockStatus(`${number}@s.whatsapp.net`, 'unblock');
            
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
        
            const sendMessage = await socket.sendMessage(`${number}@s.whatsapp.net`, { text: content });
        
            if(typeof sendMessage === 'undefined') throw { message: 'Not was possible send this message' }
        
            return sendMessage;
        
          },
        
        })
  
      }
  
    });

  });

}