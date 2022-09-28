import knex, { Knex } from "knex";
import { AndromedaStorageConnection } from "./Dtos/interface";
import fs from 'fs';
import path from 'path';
import { MessageUpsertType, proto, WAMessage, getDevice } from "@adiwajshing/baileys";

export class AndromedaStorage {

  private Connection: Knex<any, unknown[]>;
  private CounterInsters: number;
  private LimitMemoryStorage: number;
  private basePath: string;

  constructor (ConnectionProps: AndromedaStorageConnection, settings: { pathStorage: string }) {

    this.LimitMemoryStorage = 500;
    this.basePath = settings.pathStorage;

    if(fs.existsSync(this.basePath)) {

      if(fs.existsSync(path.resolve(this.basePath, `MessageStorage.json`))) {

        this.CounterInsters = (
          JSON.parse(
            fs.readFileSync(
              path.resolve(this.basePath, `MessageStorage.json`)
            ) as unknown as string
          ) as unknown as { id: string, message: proto.IWebMessageInfo }[]
        ).length;
  
      } else {
  
        fs.writeFileSync(path.resolve(this.basePath, `MessageStorage.json`), '[]');
        this.CounterInsters = 0;
  
      }

    } else {

      fs.mkdirSync(this.basePath);
      fs.writeFileSync(path.resolve(this.basePath, `MessageStorage.json`), '[]');
      this.CounterInsters = 0;

    }

    this.Connection = knex({
      client: 'mysql2',
      connection: {
        host: ConnectionProps.host,
        password: ConnectionProps.pass,
        database: ConnectionProps.dbname,
        user: ConnectionProps.user
      }
    });

    this.Connection.schema.hasTable('andromeda_storage').then((exists) => {
      
      if(!exists) {

        return this.Connection.schema.createTable('andromeda_storage', (table) => {
          table.increments('id').primary();
          table.string('message_id', 255).notNullable();
          table.string('remoteJid', 255).notNullable();
          table.text('MessageStructure', 'longtext').notNullable();
        })

      }

    })

  }

  async getTypeDevice (numberId: string): Promise<string> {

    const dataMessages = JSON.parse(
      fs.readFileSync(
        path.resolve(this.basePath, `MessageStorage.json`)
      ) as unknown as string
    ) as unknown as { id: string, message: proto.WebMessageInfo }[];

    let MessageFound = '';
      
    let TypeDeviceOcorrence = { web: 0, android: 0, ios: 0 };

    for(let content of dataMessages) {

      if(content.message.key.remoteJid === numberId) {

        const typefound = getDevice(content.message.key.id as string);
        TypeDeviceOcorrence[typefound]++;

      }

    }

    if(TypeDeviceOcorrence.android > 0 || TypeDeviceOcorrence.ios > 0) {

      MessageFound = TypeDeviceOcorrence.android > TypeDeviceOcorrence.ios ? 'android' : TypeDeviceOcorrence.ios > TypeDeviceOcorrence.android ? 'ios' : 'web'; 

      return MessageFound;

    }

    const result = await this.Connection('andromeda_storage').select('MessageStructure').where({ remoteJid: numberId })

    if(!result.length) {

      if(MessageFound === 'web') MessageFound = 'android';

      return !Array.from(MessageFound).length ? 'android' : MessageFound;

    };

    for(let msg of result) {

      let message = JSON.parse(msg) as unknown as proto.WebMessageInfo;

      const device = getDevice(message.key.id as string);
      TypeDeviceOcorrence[device]++;

    }

    if(!TypeDeviceOcorrence.android || !TypeDeviceOcorrence.ios) {

      MessageFound = 'android';

      return MessageFound;

    }

    if(TypeDeviceOcorrence.android > 0 || TypeDeviceOcorrence.ios > 0) {

      MessageFound = TypeDeviceOcorrence.android > TypeDeviceOcorrence.ios ? 'android' : TypeDeviceOcorrence.ios > TypeDeviceOcorrence.android ? 'ios' : 'web'; 

    }

    return MessageFound;

  }

  async SaveDataInDataBase (): Promise<void> {

    this.CounterInsters = 0;

    const dataMessages = JSON.parse(
      fs.readFileSync(
        path.resolve(this.basePath, `MessageStorage.json`)
      ) as unknown as string
    ) as unknown as { id: string, message: proto.IWebMessageInfo }[];

    fs.writeFileSync(path.resolve(this.basePath, `MessageStorage.json`), '[]');

    let dataRows = [];

    for(let message of dataMessages) {

      dataRows.push({
        message_id: message.id,
        remoteJid: message.message.key.remoteJid,
        MessageStructure: JSON.stringify(message.message)
      });

    }

    await this.Connection.batchInsert('andromeda_storage', dataRows);

  }

  saveMessageInStorage (data: { messages: proto.IWebMessageInfo[]; type: MessageUpsertType; }): void {

    let structure = [] as { id: string, message: proto.IWebMessageInfo }[];

    structure = JSON.parse(
      fs.readFileSync(
        path.resolve(this.basePath, `MessageStorage.json`)
      ) as unknown as string
    ) as unknown as { id: string, message: proto.IWebMessageInfo }[];

    for(let msg of data.messages) {

      structure.push({
        id: msg.key.id as string,
        message: msg
      })

    }

    this.CounterInsters++;

    fs.writeFileSync(path.resolve(this.basePath, `MessageStorage.json`), JSON.stringify(structure));

    structure = [];

    if(this.CounterInsters >= this.LimitMemoryStorage) {

      this.SaveDataInDataBase();

    }

  }

  async getMessageFromFakestorage (id: string): Promise<WAMessage> {

    let structure = [] as { id: string, message: proto.IWebMessageInfo }[];

    structure = JSON.parse(
      fs.readFileSync(path.resolve(this.basePath, `MessageStorage.json`)
      ) as unknown as string
    ) as unknown as { id: string, message: proto.IWebMessageInfo }[];
  
    let Message = structure.filter(val => val.id === id);

    if(!Message.length) {

      const messageFounded = await this.Connection('andromeda_storage').select('MessageStructure').where({ message_id: id });

      if(!messageFounded.length) throw { message: 'Not was possible found the message.' };

      Message = [{ id: '', message: JSON.parse(messageFounded[0].MessageStructure) }];

    }
  
    return Message[0].message;
  
  }

}
