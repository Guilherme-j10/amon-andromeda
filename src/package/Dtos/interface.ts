import makeWASocket, { Contact, MessageUpsertType, proto, UserFacingSocketConfig } from "@adiwajshing/baileys";

export const IBaileys = makeWASocket({} as UserFacingSocketConfig);

export interface MessagesType {
  messages: proto.IWebMessageInfo[],
  type: MessageUpsertType
}

export interface AndromedaStorageConnection {
  host: string,
  pass: string,
  dbname: 'andromeda',
  user: string
}

export interface AndromedaProps {
  sessionName: string,
  qrcodoPath: string,
  qrCodeInTerminal: boolean,
  IgnoreBroadCastMessages: boolean,
  connectionStorage: AndromedaStorageConnection,
  IgnoreGroupsMessages: boolean,
  IgnoreServer_ACK: boolean,
  onMessage: (message: MessagesType) => void
}

export interface IExistenceOnWhatsApp {
  exists: boolean,
  formatedJid: string
}

export interface IAndromeda {
  verifyExistenceNumber: (number: string) => Promise<IExistenceOnWhatsApp>,
  sendGifOrVideoMessage: (mediaPath: string, number: string, content?: string, isGif?: boolean) => Promise<proto.WebMessageInfo>,
  sendImage: (imagePath: string, number: string, content?: string) => Promise<proto.WebMessageInfo>,
  sendAudioMedia: (audioPath: string, number: string) => Promise<proto.WebMessageInfo>,
  logOut: () => Promise<boolean>,
  getDeviceInformation: () => Contact,
  blockContact: (number: string) => Promise<boolean>,
  unBlockContact: (number: string) => Promise<boolean>,
  getImageContact: (number: string, isGroup: boolean) => Promise<{ uri: string }>,
  deleteMessageForEveryone: (number: string, messageId: string, isGroup?: boolean) => Promise<boolean>,
  sendSimpleMessage: (content: string, number: string) => Promise<proto.WebMessageInfo>
  replyMessage: (number: string, content: string, quotedId: string) => Promise<proto.WebMessageInfo>
}