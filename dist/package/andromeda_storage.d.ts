import { AndromedaStorageConnection } from "./Dtos/interface";
import { MessageUpsertType, proto, WAMessage } from "@adiwajshing/baileys";
export declare class AndromedaStorage {
    private Connection;
    private CounterInsters;
    private ApplicationName;
    private LimitMemoryStorage;
    private basePath;
    constructor(ConnectionProps: AndromedaStorageConnection, settings: {
        sessionName: string;
        pathStorage: string;
    });
    removeStorageFile(): void;
    getTypeDevice(numberId: string): Promise<string>;
    SaveDataInDataBase(): Promise<void>;
    saveMessageInStorage(data: {
        messages: proto.IWebMessageInfo[];
        type: MessageUpsertType;
    }): void;
    getMessageFromFakestorage(id: string): Promise<WAMessage>;
}
