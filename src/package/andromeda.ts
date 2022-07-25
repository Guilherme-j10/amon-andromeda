import makeWASocket, { AuthenticationState, DisconnectReason, useMultiFileAuthState } from "@adiwajshing/baileys";
import { Boom } from '@hapi/boom';
import fs from 'fs';

export const initializeAndromeda = async (qrcodePath?: string): Promise<void> => {

  const { state, saveCreds } = await useMultiFileAuthState('andromeda_session');

  const socket = makeWASocket({
    printQRInTerminal: true,
    auth: state
  });

  socket.ev.on('connection.update', (update) => {

    const { connection, lastDisconnect } = update;
    saveCreds();

    if(connection === 'close') {
      
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
      
      if(shouldReconnect) {

        initializeAndromeda()

      }
    
      return;

    } 
    
    if(connection === 'open') {

      console.log('opened connection')

    }

  });

  socket.ev.on('messages.upsert', async (message) => {

    console.log(JSON.stringify(message, undefined, 2))

    console.log('replying to', message.messages[0].key.remoteJid)
    console.log('Message type', message.type);
    //await socket.sendMessage(message.messages[0].key.remoteJid!, { text: 'Im andromeda.' })

  })

}

initializeAndromeda();