"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndromedaStorage = void 0;
const knex_1 = __importDefault(require("knex"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const baileys_1 = require("@adiwajshing/baileys");
class AndromedaStorage {
    constructor(ConnectionProps, settings) {
        this.LimitMemoryStorage = 500;
        this.ApplicationName = settings.sessionName;
        this.basePath = settings.pathStorage;
        if (fs_1.default.existsSync(this.basePath)) {
            if (fs_1.default.existsSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`))) {
                this.CounterInsters = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`))).length;
            }
            else {
                fs_1.default.writeFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`), '[]');
                this.CounterInsters = 0;
            }
        }
        else {
            fs_1.default.mkdirSync(this.basePath);
            fs_1.default.writeFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`), '[]');
            this.CounterInsters = 0;
        }
        this.Connection = (0, knex_1.default)({
            client: 'mysql2',
            connection: {
                host: ConnectionProps.host,
                password: ConnectionProps.pass,
                database: ConnectionProps.dbname,
                user: ConnectionProps.user
            }
        });
        this.Connection.schema.hasTable('andromeda_storage').then((exists) => {
            if (!exists) {
                return this.Connection.schema.createTable('andromeda_storage', (table) => {
                    table.increments('id').primary();
                    table.string('message_id', 255).notNullable();
                    table.string('remoteJid', 255).notNullable();
                    table.text('MessageStructure', 'longtext').notNullable();
                });
            }
        });
    }
    removeStorageFile() {
        fs_1.default.rmSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`), { force: true, recursive: true });
    }
    getTypeDevice(numberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataMessages = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`)));
            let MessageFound = '';
            let TypeDeviceOcorrence = { web: 0, android: 0, ios: 0 };
            for (let content of dataMessages) {
                if (content.message.key.remoteJid === numberId) {
                    const typefound = (0, baileys_1.getDevice)(content.message.key.id);
                    TypeDeviceOcorrence[typefound]++;
                }
            }
            if (TypeDeviceOcorrence.android > 0 || TypeDeviceOcorrence.ios > 0) {
                MessageFound = TypeDeviceOcorrence.android > TypeDeviceOcorrence.ios ? 'android' : TypeDeviceOcorrence.ios > TypeDeviceOcorrence.android ? 'ios' : 'web';
                return MessageFound;
            }
            const result = yield this.Connection('andromeda_storage').select('MessageStructure').where({ remoteJid: numberId });
            if (!result.length) {
                if (MessageFound === 'web')
                    MessageFound = 'android';
                return !Array.from(MessageFound).length ? 'android' : MessageFound;
            }
            ;
            for (let msg of result) {
                let message = JSON.parse(msg);
                const device = (0, baileys_1.getDevice)(message.key.id);
                TypeDeviceOcorrence[device]++;
            }
            if (!TypeDeviceOcorrence.android || !TypeDeviceOcorrence.ios) {
                MessageFound = 'android';
                return MessageFound;
            }
            if (TypeDeviceOcorrence.android > 0 || TypeDeviceOcorrence.ios > 0) {
                MessageFound = TypeDeviceOcorrence.android > TypeDeviceOcorrence.ios ? 'android' : TypeDeviceOcorrence.ios > TypeDeviceOcorrence.android ? 'ios' : 'web';
            }
            return MessageFound;
        });
    }
    SaveDataInDataBase() {
        return __awaiter(this, void 0, void 0, function* () {
            this.CounterInsters = 0;
            const dataMessages = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`)));
            fs_1.default.writeFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`), '[]');
            let dataRows = [];
            for (let message of dataMessages) {
                dataRows.push({
                    message_id: message.id,
                    remoteJib: message.message.key.remoteJid,
                    MessageStructure: JSON.stringify(message.message)
                });
            }
            yield this.Connection.batchInsert('andromeda_storage', dataRows);
        });
    }
    saveMessageInStorage(data) {
        let structure = [];
        structure = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`)));
        for (let msg of data.messages) {
            structure.push({
                id: msg.key.id,
                message: msg
            });
        }
        this.CounterInsters++;
        fs_1.default.writeFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`), JSON.stringify(structure));
        structure = [];
        if (this.CounterInsters >= this.LimitMemoryStorage) {
            this.SaveDataInDataBase();
        }
    }
    getMessageFromFakestorage(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let structure = [];
            structure = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.basePath, `${this.ApplicationName}_storage.json`)));
            let Message = structure.filter(val => val.id === id);
            if (!Message.length) {
                const messageFounded = yield this.Connection('andromeda_storage').select('MessageStructure').where({ message_id: id });
                if (!messageFounded.length)
                    throw { message: 'Not was possible found the message.' };
                Message = [{ id: '', message: JSON.parse(messageFounded[0].MessageStructure) }];
            }
            return Message[0].message;
        });
    }
}
exports.AndromedaStorage = AndromedaStorage;
