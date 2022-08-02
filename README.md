# Amon-Andromeda - Typescript/Javascript WhatsApp

Amon-andromeda is a package based on Baileys. Made to be an easy abstraction of using Baileys, with simpler and easier methods to use, minimal configuration and quick to start. Amon-andromeda has a custom storage, unlike Baileys, which has its own, but it's in memory, which harms its use as its message base grows. we use a different approach, saving the data in a .JSON file, and when it reaches a certain limit we migrate the data from a single time to a database in mysql, storage is an important part of the code because with it we can consult previous messages which allows the use of some methods of Baileys.

**Check Baileys repository [here](https://github.com/adiwajshing/Baileys).**

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

## Documentations

- <a href="#usage">Usage</a>
- <a href="#temporary-data-storage">Temporary data storage</a>
- <a href="#methods">Methods</a>
- <a href="#listening-to-events">Listening to events</a>
- <a href="#downloading-media-files">Downloading media files</a>
- <a href="#running-with-docker">Running with docker</a>

## Usage

To be able to run the code first a connection to a mysql database is needed, just start a database locally or in the cloud and pass the connection data, no further configuration is needed, Amon-Andromeda will take care of the rest.

``` js
const { Andromeda } = require('amon-andromeda');
const path = require('path');

(async () => {

  const client = await Andromeda({
    sessionName: 'andromeda',
    TemporaryStoragePath: path.resolve(__dirname, '.', 'storage'),
    downloadMediaPath: path.resolve(__dirname, '..', 'media'),
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
    onStatusChange: (connectionStatus) => console.log(connectionStatus),
    onMessage: (messages) => {

      console.log(JSON.stringify(messages, undefined, 2))

    }
  });

  await client.sendSimpleMessage('hello word!', '551197070879');

})();
```

## Temporary data storage

Some Baileys methods require the entire body of the message sent and received so you need to save the data of all messages somewhere. Baileys itself has an internal module that helps the developer with this task, but this is just a quick fix, since this data is all saved in memory, so if your application is running for a long time and many messages are exchanged, your application will slow down as time goes on and the documentation itself warns the developer that this is not a good approach. So thinking about it, we made a slightly different logic. We save the data of all messages exchanged inside a .JSON file, and when we reach a limit of 500 messages, we migrate this data at once to a mysql database. Therefore, all you need to do is pass the path of the folder, where in the example above we call storage, but you can call it whatever you want, the path of this folder will be used to create the .JSON file where the message data will be saved.

```js
TemporaryStoragePath: path.resolve(__dirname, '.', 'storage')
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

Taking a picture of a contact.
``` js
await client.getImageContact('551197070879', false);
```

**NOTE:** if the second parameter is true, the method will try to get the profile picture of a group.

Blocking a contact.
``` js
await client.blockContact('551197070879');
```

Unlocking a contact.
``` js
await client.unBlockContact('551197070879');
```

Deleting a message for everyone.
``` js
await client.deleteMessageForEveryone('551197070879', 'BAE57B9147270DE0', false);
```

**NOTE:** The third parameter signals whether the message is a group message or not.

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

Capturing device information.
``` js
await client.getDeviceInformation();
```

**NOTE:** for the method to work correctly, an established connection is required.

## Listening to events

Every time a new message is received on your device, an event will be triggered, as a parameter it will have an object containing the message body. The **onMessage()** method is initialized as an **andromeda()** parameter, as shown in the usage example at the beginning of the article

```js
onMessage(message) => console.log(JSON.stringfy(message, undefined, 2))
```

Listening for connection status change event. Every time the connection status changes the **onStatusChange()** event will be triggered, the parameter of this method contains the status for which it was signaled. Thinking about something simpler and more concise, the signaling status was summarized in just two values **['Connected', 'WaitinLogin']**. The **onStatusChange()** method is initialized in the same way as the previous one.

```js
onStatusChange(connectionStatus) => console.log(connectionStatus)
```

## Downloading media files

Amon-andromeda does all the file handling processes for you. All you need to do is pass the path of the folder where you want the data to be saved in the **downloadMediaPath** property.

```js
downloadMediaPath: path.resolve(__dirname, '..', 'media')
```

**NOTE:** when the download finishes, you will receive the fileNameDownloaded property along with the message body data that comes as a parameter in the onMessage event method.

## Running with docker

Just like the volume configuration you do for your database in the docker-compose file, the same is necessary for Amon-Andromeda. Earlier in this article we talked about the TemporaryStoragePath initialization property, so that no data loss occurs you should make a volume for the path you specified in the property.