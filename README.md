# Amon-Andromeda - Typescript/Javascript WhatsApp

Amon-andromeda is a package based on Baileys. Made to be an easy abstraction of using Baileys, with simpler and easier methods to use, minimal configuration and quick to start. Amon-andromeda has a custom storage, unlike Baileys, which has its own, but it's in memory, which harms its use as its message base grows. we use a different approach, saving the data in a .JSON file, and when it reaches a certain limit we migrate the data from a single time to a database in mysql, storage is an important part of the code because with it we can consult previous messages which allows the use of some methods of Baileys.

**Verifiquei o repositiorio do Baileys [here](https://github.com/adiwajshing/Baileys).**

## Install

If you want the qrcode to be printed in the terminal, you will need to download the **qrcode-terminal** package, which is not included for licensing reasons.

```
yarn add amon-andromeda
```

Than you can import using: 

``` ts
import { Andromeda } from 'amon-andromeda';
//or
const { Andromeda } = require('amon-andromeda');
```

## Usage

para poder rodar o código antes é necessária uma conexão com um banco de dados mysql, apenas iniciar um banco de dados localmente ou em nuvem e passar os dados de conexão, nenhuma outra configuração é necessária, Amon-Andromeda cuidara do resto.

``` js
const { Andromeda } = require('amon-andromeda');
const path = require('path');

(async () => {

  const client = await Andromeda({
    sessionName: 'andromeda',
    TemporaryStoragePath: path.resolve(__dirname, '.', 'storage'),
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    qrCodeInTerminal: true,
    qrcodoPath: path.resolve(__dirname, '.', 'image', 'andromeda_qrcode.png'),
    connectionStorage: {
      dbname: 'andromeda',
      host: 'host',
      pass: 'pass',
      user: 'user'
    },
    onMessage: (messages) => {

      console.log(JSON.stringify(messages, undefined, 2))

    }
  });

  await client.sendSimpleMessage('hello word!', '551197070879');

})();
```

## Methods

Sending a simple message.
``` js
await client.sendSimpleMessage('hello word!', '551197070879');
```

Replying to a message.
``` js
await client.replyMessage('551197070879', 'hello word!', 'BAE57B9147270DE0');
```

Checking if a number exists as valid whatsapp number.
``` js
await client.verifyExistenceNumber('551197070879');
```

Sending a gif or video.
``` js
await client.sendGifOrVideoMessage(path.resolve(__dirname, 'file.mp4'), '551197070879', 'hello word!', true);
```

**NOTE:** if the last parameter is true, this means that the message gonna be sent how gif.

Sending a picture.
``` js
await client.sendImage(path.resolve(__dirname, 'file.png'), '551197070879', 'Hello word!');
```

Sending audio files.
``` js
await client.sendAudioMedia(path.resolve(__dirname, 'file.mp3'), '551197070879', false);
```
**NOTE:** if the last parameter is false the message will be sent as an audio file, if true it will be sent with a voice message.

Sending a list.
``` js
await client.sendListMessage('551197070879', {
  text: 'text',
  buttonText: 'buttonText',
  footer: 'footer',
  title: 'title',
  sections: [
    {
      title: 'section title',
      rows: [
        {
          title: 'Option one',
          rowId: 'optionone',
          description: 'description'
        }
      ]
    }
  ]
});
```