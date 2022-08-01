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
const andromeda_1 = require("../andromeda");
const path_1 = __importDefault(require("path"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    const SessionName = 'SpiderMan';
    const clientOne = yield (0, andromeda_1.Andromeda)({
        sessionName: SessionName,
        TemporaryStoragePath: path_1.default.resolve(__dirname, '..', '..', '..', 'storage'),
        connectionStorage: {
            dbname: 'andromeda',
            host: 'localhost',
            pass: '1234',
            user: 'guilherme'
        },
        qrCodeInTerminal: true,
        qrcodoPath: path_1.default.resolve(__dirname, '..', '..', '..', 'image', `${SessionName}_qrcode.png`),
        IgnoreBroadCastMessages: true,
        IgnoreGroupsMessages: true,
        IgnoreServer_ACK: true,
        onMessage: (message) => {
            console.log(JSON.stringify(message, undefined, 2));
            console.log(message);
        },
    });
    try {
        // sending a message
        console.log(JSON.stringify((yield clientOne.sendSimpleMessage('Vai curitintians', '5511930224168')), undefined, 2));
        //replying a message
        console.log(JSON.stringify((yield clientOne.replyMessage('5511983547629', 'Ola mundo', 'BAE57B9147270DE0')), undefined, 2));
        //verifieng the existence of a number
        console.log((yield clientOne.verifyExistenceNumber('5516992995989')));
        //sending a video or gif
        console.log(JSON.stringify((yield clientOne.sendGifOrVideoMessage(path_1.default.resolve(__dirname, '..', 'media', 'video.mp4'), '5511983547629', 'Enviando um video com conteudo', true)), undefined, 2));
        //sending a image
        console.log(JSON.stringify((yield clientOne.sendImage(path_1.default.resolve(__dirname, '..', 'media', 'image.jpeg'), '5511983547629', 'Imagem com conteudo')), undefined, 2));
        //sending a audio file or voice message
        console.log(JSON.stringify((yield clientOne.sendAudioMedia(path_1.default.resolve(__dirname, '..', 'media', 'music.mp3'), '5511983547629', false)), undefined, 2));
        //sending a list
        const sendListMessage = yield clientOne.sendListMessage('5511983547629', {
            text: 'este é o texto',
            buttonText: 'este é o texto do botão',
            title: 'Este é o titulo',
            sections: [
                {
                    title: 'titulo da primeira opção',
                    rows: [
                        {
                            title: 'linha um',
                            rowId: 'linhaUm',
                            description: 'Content node'
                        }
                    ]
                }
            ]
        });
        console.log(sendListMessage);
    }
    catch (error) {
        console.log(error.message);
    }
}))();
