import { Contact, MessageUpsertType, proto, WAPresence } from "../../Core/src";

export interface MessagesType {
  messages: proto.IWebMessageInfo[],
  type: MessageUpsertType,
  fileNameDownloaded?: string
}

export interface ITypeDeviceWithMessage {
  typeDevice: string,
  message: proto.WebMessageInfo
}

export interface AndromedaStorageConnection {
  host: string,
  pass: string,
  dbname: 'andromeda',
  user: string
}

export interface PresenceUpdated {
  id: string,
  presences: {
    [id: string]: {
      lastKnownPresence: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'
    }
  }
}

export interface AndromedaProps {
  sessionName: string,
  qrcodePath: string,
  agentName?: string,
  qrCodeInTerminal: boolean,
  downloadMediaPath: string,
  TemporaryStoragePath: string,
  IgnoreBroadCastMessages: boolean,
  connectionStorage?: AndromedaStorageConnection,
  IgnoreGroupsMessages: boolean,
  IgnoreServer_ACK: boolean,
  onMessage: (message: MessagesType) => void
  onPresenceUpdate?: (presence: PresenceUpdated) => void
  onStatusChange: (connectionStatus: 'Connected' | 'WaitinLogin') => void,
  onDisconnected: () => void
}

export interface IExistenceOnWhatsApp {
  exists: boolean,
  formatedJid: string
}

export interface IListMessageDefinitions {
  text: string,
  footer?: string,
  title: string,
  buttonText: string,
  sections: Array<{
    title: string,
    rows: Array<{
      title: string,
      rowId: string,
      description?: string
    }>
  }>
}

export interface IDocumentContent {
  location_path: string,
  file_name: string
}

export type AvaliablePresences = 'unavailable' | 'available' | 'composing' | 'recording' | 'paused';

export interface IAndromeda {
  verifyExistenceNumber: (number: string) => Promise<IExistenceOnWhatsApp>,
  sendGifOrVideoMessage: (mediaPath: string, number: string, content?: string, isGif?: boolean) => Promise<proto.WebMessageInfo>,
  sendImage: (imagePath: string, number: string, content?: string) => Promise<proto.WebMessageInfo>,
  sendAudioMedia: (audioPath: string, number: string, isPtt?: boolean, seconds?: number) => Promise<proto.WebMessageInfo>,
  logOut: () => Promise<boolean>,
  sendListMessage: (number: string, listMessage: IListMessageDefinitions) => Promise<proto.WebMessageInfo>,
  getDeviceInformation: () => Contact,
  sendArchive: (document: IDocumentContent, number: string) => Promise<proto.WebMessageInfo>,
  blockContact: (number: string) => Promise<boolean>,
  unBlockContact: (number: string) => Promise<boolean>,
  getImageContact: (number: string, isGroup: boolean) => Promise<{ uri: string }>,
  deleteMessageForEveryone: (number: string, messageId: string, isGroup?: boolean) => Promise<boolean>,
  sendSimpleMessage: (content: string, number: string) => Promise<proto.WebMessageInfo>,
  replyMessage: (number: string, content: string, quotedId: string) => Promise<proto.WebMessageInfo>,
  disconnect_database: () => Promise<void>,
  subscribe_precense: (number: string) => Promise<void>,
  read_message: (data: proto.IMessageKey[]) => Promise<boolean>,
  presenceUpdate: (type: WAPresence, toJid?: string) => Promise<boolean>
  sendPresence: (precense: AvaliablePresences, number: string) => Promise<boolean>
}