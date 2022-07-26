import makeWASocket, { Contact, proto, UserFacingSocketConfig } from "@adiwajshing/baileys";

export const IBaileys = makeWASocket({} as UserFacingSocketConfig);

export interface AndromedaProps {
  sessionName: string,
  qrcodoPath: string,
  qrCodeInTerminal: boolean,
  IgnoreBroadCastMessages: boolean,
  IgnoreGroupsMessages: boolean,
  IgnoreServer_ACK: boolean,
  onMessage: (message: any) => void
}

export interface IExistenceOnWhatsApp {
  exists: boolean,
  formatedJid: string
}

export interface IAndromeda {
  verifyExistenceNumber: (number: string) => Promise<IExistenceOnWhatsApp>,
  logOut: () => Promise<boolean>,
  getDeviceInformation: () => Contact,
  logOutInstance: () => Promise<boolean>,
  blockContact: (number: string) => Promise<boolean>,
  unBlockContact: (number: string) => Promise<boolean>,
  getImageContact: (number: string, isGroup: boolean) => Promise<{ uri: string }>,
  deleteMessageForEveryone: (number: string, messageId: string, isGroup?: boolean) => Promise<boolean>,
  sendSimpleMessage: (content: string, number: string) => Promise<proto.WebMessageInfo>
}

export interface IKey {
  remoteJid: string,
  fromMe: boolean,
  id: string
}

export interface IMessageText {
  messages: Array<{
    key: IKey,
    messageTimestamp: number,
    pushName: string,
    message: {
      conversation: string,
      messageContextInfo: {
        deviceListMetadata: {
          senderTimestamp: number,
          recipientKeyHash: string,
          recipientTimestamp: number
        },
        deviceListMetadataVersion: number
      }
    }
  }>,
  type: string
}

export interface IMessageSticker {
  messages: Array<{
    key: IKey,
    messageTimestamp: number,
    pushName: string,
    message: {
      stickerMessage: {
        url: string,
        fileSha256: string,
        fileEncSha256: string,
        caption?: string,
        mediaKey: string,
        mimetype: string,
        height: number,
        width: number,
        directPath: string,
        fileLength: string,
        mediaKeyTimestamp: string,
        isAnimated: boolean
      },
      messageContextInfo: {
        deviceListMetadata: {
          senderTimestamp: number,
          recipientKeyHash: string,
          recipientTimestamp: number
        },
        deviceListMetadataVersion: number
      }
    }
  }>,
  type: string
}

export interface IMessageGif {
  messages: Array<{
    key: IKey,
    messageTimestamp: number,
    pushName: string,
    message: {
      videoMessage: {
        url: string,
        mimetype: string,
        fileSha256: string,
        fileLength: string,
        seconds: number,
        mediaKey: string,
        caption?: string,
        gifPlayback: boolean,
        height: number,
        width: number,
        fileEncSha256: string,
        directPath: string,
        mediaKeyTimestamp: string,
        jpegThumbnail: string,
        gifAttribution: string
      },
      messageContextInfo: {
        deviceListMetadata: {
          senderTimestamp: number,
          recipientKeyHash: string,
          recipientTimestamp: number
        },
        deviceListMetadataVersion: number
      }
    }
  }>,
  type: string
}

export interface IMessageImage {
  messages: Array<{
    key: IKey,
    messageTimestamp: number,
    pushName: string,
    message: {
      imageMessage: {
        url: string,
        mimetype: string,
        fileSha256: string,
        caption?: string,
        fileLength: string,
        height: number,
        width: number,
        mediaKey: string,
        fileEncSha256: string,
        directPath: string,
        mediaKeyTimestamp: string,
        jpegThumbnail: string,
        scansSidecar: string,
        scanLengths: number[],
        midQualityFileSha256: string
      }
      messageContextInfo: {
        deviceListMetadata: {
          senderTimestamp: number,
          recipientKeyHash: string,
          recipientTimestamp: number
        },
        deviceListMetadataVersion: number
      }
    }
  }>,
  type: string
}

export interface IMessageAudio {
  messages: Array<{
    key: IKey,
    messageTimestamp: number,
    pushName: string,
    message: {
      audioMessage: {
        "url": string,
        "mimetype": string,
        "fileSha256": string,
        "fileLength": string,
        "seconds": number,
        "ptt": boolean,
        "mediaKey": string,
        "fileEncSha256": string,
        "directPath": string,
        "mediaKeyTimestamp": string,
        "waveform": string
      }
      messageContextInfo: {
        deviceListMetadata: {
          senderTimestamp: number,
          recipientKeyHash: string,
          recipientTimestamp: number
        },
        deviceListMetadataVersion: number
      }
    }
  }>,
  type: string
}