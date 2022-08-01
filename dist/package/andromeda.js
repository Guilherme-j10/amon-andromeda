"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Andromeda = void 0;
const baileys_1 = __importStar(require("@adiwajshing/baileys"));
const logger_1 = __importDefault(require("./logger"));
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const andromeda_storage_1 = require("./andromeda_storage");
const logger = logger_1.default.child({});
logger.level = 'silent';
const normalPrefix = '@s.whatsapp.net';
const Andromeda = (initializerProps) => __awaiter(void 0, void 0, void 0, function* () {
    let IS_CONNECTED = false;
    const StorageInitializer = new andromeda_storage_1.AndromedaStorage(initializerProps.connectionStorage, {
        sessionName: initializerProps.sessionName,
        pathStorage: initializerProps.TemporaryStoragePath
    });
    const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(`SessionAndromeda_${initializerProps.sessionName}`);
    const presetToSocket = {
        printQRInTerminal: initializerProps.qrCodeInTerminal,
        logger: logger,
        auth: state,
        browser: ['Andromeda', 'MacOS', '3.0']
    };
    let socket = (0, baileys_1.default)(presetToSocket);
    socket.ev.on('connection.update', () => __awaiter(void 0, void 0, void 0, function* () {
        yield saveCreds();
    }));
    socket.ev.on('messages.upsert', (message) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (message.type === 'notify') {
            if (initializerProps.IgnoreServer_ACK && message.messages[0].status === 2)
                return;
            if (initializerProps.IgnoreBroadCastMessages && ((_b = (_a = message.messages[0].key.remoteJid) === null || _a === void 0 ? void 0 : _a.match(/@broadcast/gi)) === null || _b === void 0 ? void 0 : _b.length))
                return;
            if (initializerProps.IgnoreGroupsMessages && ((_d = (_c = message.messages[0].key.remoteJid) === null || _c === void 0 ? void 0 : _c.match(/@g.us/gi)) === null || _d === void 0 ? void 0 : _d.length))
                return;
            initializerProps.onMessage(message);
            StorageInitializer.saveMessageInStorage(message);
        }
    }));
    return new Promise((resolve) => {
        socket.ev.on('connection.update', (update) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const { connection, lastDisconnect } = update;
            if (update.qr) {
                qrcode_1.default.toFile(initializerProps.qrcodoPath, update.qr);
            }
            if (connection === 'close') {
                IS_CONNECTED = false;
                const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    const client = yield (0, exports.Andromeda)(initializerProps);
                    resolve(client);
                    return;
                }
                fs_1.default.rmSync(path_1.default.resolve(__dirname, '..', '..', `andromedaSessions_${initializerProps.sessionName}`), { force: true, recursive: true });
                const AnotherSession = yield (0, exports.Andromeda)(initializerProps);
                resolve(AnotherSession);
            }
            if (connection === 'open') {
                IS_CONNECTED = true;
                console.clear();
                console.log('CONNECTED');
                resolve({
                    replyMessage(number, content, quotedId) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const msg = yield StorageInitializer.getMessageFromFakestorage(quotedId);
                            const sendReply = yield socket.sendMessage(`${number}${normalPrefix}`, { text: content }, { quoted: msg });
                            if (typeof sendReply === 'undefined')
                                throw { message: 'Not was possible reply this message' };
                            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendReply] });
                            return sendReply;
                        });
                    },
                    sendGifOrVideoMessage(mediaPath, number, content, isGif) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const optionsMedia = {
                                video: fs_1.default.readFileSync(mediaPath)
                            };
                            if (isGif)
                                optionsMedia.gifPlayback = true;
                            if (content)
                                optionsMedia.caption = content;
                            const sendMediaMessage = yield socket.sendMessage(`${number}${normalPrefix}`, optionsMedia);
                            if (typeof sendMediaMessage === 'undefined')
                                throw { message: 'Not was possible send video or gif now.' };
                            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendMediaMessage] });
                            return sendMediaMessage;
                        });
                    },
                    logOut() {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            StorageInitializer.removeStorageFile();
                            yield socket.logout();
                            return true;
                        });
                    },
                    sendAudioMedia(audioPath, number, isPtt) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const device = yield StorageInitializer.getTypeDevice(`${number}${normalPrefix}`);
                            const sendAudioMedia = yield socket.sendMessage(`${number}${normalPrefix}`, {
                                audio: {
                                    url: audioPath
                                },
                                ptt: isPtt ? isPtt : false,
                                mimetype: device === 'android' ? 'audio/mp4' : 'audio/mpeg'
                            });
                            if (typeof sendAudioMedia === 'undefined')
                                throw { message: 'Not was possible send audio media.' };
                            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendAudioMedia] });
                            return sendAudioMedia;
                        });
                    },
                    getDeviceInformation() {
                        if (!IS_CONNECTED)
                            throw { message: 'Connection is closed.' };
                        return socket.user;
                    },
                    verifyExistenceNumber(number) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const [result] = yield socket.onWhatsApp(number);
                            return {
                                exists: (result === null || result === void 0 ? void 0 : result.exists) || false,
                                formatedJid: (result === null || result === void 0 ? void 0 : result.jid) || ''
                            };
                        });
                    },
                    sendListMessage(number, listMessage) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const sendListMessage = yield socket.sendMessage(`${number}${normalPrefix}`, listMessage);
                            if (typeof sendListMessage === 'undefined')
                                throw { message: 'Not was possible send audio media.' };
                            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendListMessage] });
                            return sendListMessage;
                        });
                    },
                    sendImage(imagePath, number, content) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const optionsSenMessage = {
                                image: {
                                    url: imagePath
                                }
                            };
                            if (content)
                                optionsSenMessage.caption = content;
                            const sendImage = yield socket.sendMessage(`${number}${normalPrefix}`, optionsSenMessage);
                            if (typeof sendImage === 'undefined')
                                throw { message: 'Not was possible send image' };
                            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendImage] });
                            return sendImage;
                        });
                    },
                    blockContact(number) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            yield socket.updateBlockStatus(`${number}${normalPrefix}`, 'block');
                            return true;
                        });
                    },
                    unBlockContact(number) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            yield socket.updateBlockStatus(`${number}${normalPrefix}`, 'unblock');
                            return true;
                        });
                    },
                    getImageContact(number, isGroup) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';
                            const profilePictureUrl = yield socket.profilePictureUrl(`${number}${prefix}`, 'image');
                            if (typeof profilePictureUrl === 'undefined')
                                throw { message: 'Not was possible fatch the url profile of this contact.' };
                            return {
                                uri: profilePictureUrl
                            };
                        });
                    },
                    deleteMessageForEveryone(number, messageId, isGroup) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';
                            const deleteMessage = socket.sendMessage(`${number}${prefix}`, { delete: {
                                    remoteJid: `${number}${prefix}`,
                                    id: messageId,
                                } });
                            if (typeof deleteMessage === 'undefined')
                                throw { message: 'Not was possible delete this message' };
                            return true;
                        });
                    },
                    sendSimpleMessage(content, number) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!IS_CONNECTED)
                                throw { message: 'Connection is closed.' };
                            const sendMessage = yield socket.sendMessage(`${number}${normalPrefix}`, { text: content });
                            if (typeof sendMessage === 'undefined')
                                throw { message: 'Not was possible send this message' };
                            StorageInitializer.saveMessageInStorage({ type: 'notify', messages: [sendMessage] });
                            return sendMessage;
                        });
                    },
                });
            }
        }));
    });
});
exports.Andromeda = Andromeda;
