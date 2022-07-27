import knex, { Knex } from "knex";
import { AndromedaStorageConnection } from "./Dtos/interface";
import fs from 'fs';
import path from 'path';
import { MessageUpsertType, proto, WAMessage } from "@adiwajshing/baileys";

export class AndromedaStorage {

  private Connection: Knex<any, unknown[]>;
  private CounterInsters: number;
  private ApplicationName: string;
  private LimitMemoryStorage: number;

  constructor (ConnectionProps: AndromedaStorageConnection, ApplicationName: string) {

    this.LimitMemoryStorage = 500;
    this.ApplicationName = ApplicationName;

    if(fs.existsSync(path.resolve(__dirname, '.', 'storage', `${ApplicationName}_storage.json`))) {

      this.CounterInsters = (
        JSON.parse(
          fs.readFileSync(
            path.resolve(__dirname, '.', 'storage', `${ApplicationName}_storage.json`)
          ) as unknown as string
        ) as unknown as { id: string, message: proto.IWebMessageInfo }[]
      ).length;

    } else {

      fs.writeFileSync(path.resolve(__dirname, '.', 'storage', `${ApplicationName}_storage.json`), '[]');
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
          table.text('MessageStructure', 'longtext').notNullable();
        })

      }

    })

  }

  removeStorageFile() {

    fs.rmSync(path.resolve(__dirname, '.', 'storage', `${this.ApplicationName}_storage.json`), { force: true, recursive: true });

  }

  async SaveDataInDataBase (): Promise<void> {

    this.CounterInsters = 0;

    const dataMessages = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '.', 'storage', `${this.ApplicationName}_storage.json`)
      ) as unknown as string
    ) as unknown as { id: string, message: proto.IWebMessageInfo }[];

    fs.writeFileSync(path.resolve(__dirname, '.', 'storage', `${this.ApplicationName}_storage.json`), '[]');

    let dataRows = [];

    for(let message of dataMessages) {

      dataRows.push({
        message_id: message.id,
        MessageStructure: JSON.stringify(message.message)
      });

    }

    await this.Connection.batchInsert('andromeda_storage', dataRows);

  }

  saveMessageInStorage (data: { messages: proto.IWebMessageInfo[]; type: MessageUpsertType; }): void {

    let structure = [] as { id: string, message: proto.IWebMessageInfo }[];

    structure = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '.', 'storage', `${this.ApplicationName}_storage.json`)
      ) as unknown as string
    ) as unknown as { id: string, message: proto.IWebMessageInfo }[];

    for(let msg of data.messages) {

      structure.push({
        id: msg.key.id as string,
        message: msg
      })

    }

    this.CounterInsters++;

    fs.writeFileSync(path.resolve(__dirname, '.', 'storage', `${this.ApplicationName}_storage.json`), JSON.stringify(structure));

    structure = [];

    if(this.CounterInsters >= this.LimitMemoryStorage) {

      this.SaveDataInDataBase();

    }

  }

  async getMessageFromFakestorage (id: string): Promise<WAMessage> {

    let structure = [] as { id: string, message: proto.IWebMessageInfo }[];

    structure = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '.', 'storage', `${this.ApplicationName}_storage.json`)
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