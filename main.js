const { WAConnection: _WAConnection, ReconnectMode, MessageType, MessageOptions } = require('@adiwajshing/baileys');
const simple = require("./whatsapp/connecting.js");
const WAConnection = simple.WAConnection(_WAConnection);
const Felip = new WAConnection();
const qrcode = require("qrcode-terminal");
const {
  cekWelcome,
  cekAntilink,
  cekBadword,
  cekAntidelete,
  cekDetect
} = require('./functions/group');
const {
  getCustomWelcome,
  getCustomBye
} = require('./functions/welcome')
const fs = require("fs");
const thumb = fs.readFileSync('./temp/turbo.jpg')
const { getBuffer } = require('./library/fetcher')
const { week, time, tanggal} = require("./library/functions");
const { color } = require("./library/color");
async function starts() {
	Felip.autoReconnect = ReconnectMode.onConnectionLost;
	Felip.version = [2, 2140, 6];
	Felip.logger.level = 'warn';
	Felip.on('qr', () => {
	console.log(color('[QR]','white'), color('Escanee el codigo QR para conectarse'));
	});

	fs.existsSync('./whatsapp/sessions.json') && Felip.loadAuthInfo('./whatsapp/sessions.json');
	
	await Felip.connect({timeoutMs: 30*1000});
  fs.writeFileSync('./whatsapp/sessions.json', JSON.stringify(Felip.base64EncodedAuthInfo(), null, '\t'));
  link = 'https://t.me/+u3sxmOJHqLc3Yjhh'
  Felip.query({ json:["action", "invite", `${link.replace('https://web.telegram.org/','')}`]})
    // llamada por wha
    // ¡esto puede tardar unos minutos si tiene miles de conversaciones!!Felip.on('chats-received', async ({ hasNewChats }) => {
    	Felip.on('chats-received', async ({ hasNewChats }) => {
        console.log(`‣ Tú tienes ${Felip.chats.length} chats, new chats available: ${hasNewChats}`);

        const unread = await Felip.loadAllUnreadMessages ();
        console.log ("‣ Tú tienes " + unread.length + " mensajes no leídos");
    });
    // called when WA sends chats
    // ¡esto puede tardar unos minutos si tiene miles de contactos!
    Felip.on('contacts-received', () => {
        console.log('‣ Tú tienes ' + Object.keys(Felip.contacts).length + ' contactos');
    });
    
    //--- Bienvenida y Despedida 
  Felip.on('group-participants-update', async (anu) => {
      isWelcome = cekWelcome(anu.jid);
      if(isWelcome === true) {
      	
      try {
	      ppimg = await Felip.getProfilePicture(`${anu.participants[0].split('@')[0]}@c.us`);
	    } catch {
	      ppimg = 'https://i.ibb.co/k2sB7wB/felip.jpg';
	    } 
	
      mdata = await Felip.groupMetadata(anu.jid);
      if (anu.action == 'add') {
        num = anu.participants[0];
          
	    let username = Felip.getName(num)
        let about = (await Felip.getStatus(num).catch(console.error) || {}).status || ''
        let member = mdata.participants.length
        let tag = '@'+num.split('@')[0]
	    let buff = await getBuffer(ppimg);
	    let descrip = mdata.desc
	    let welc = await getCustomWelcome(mdata.id)
	    capt = welc.replace('@user', tag).replace('@name', username).replace('@bio', about).replace('@date', tanggal).replace('@desc', descrip).replace('@group', mdata.subject);
	      Felip.send2ButtonLoc(mdata.id, buff, capt, 'Canal de Telegram\nhttps://t.me/+u3sxmOJHqLc3Yjhh', '⦙☰ MENU', '/menu', '⏍ INFO GP', '/infogp', false, {
	      contextInfo: {  
            mentionedJid: Felip.parseMention(capt)
	      } 
	    });
        } else if (anu.action == 'remove') {
        num = anu.participants[0];
        let username = Felip.getName(num)
        let about = (await Felip.getStatus(num).catch(console.error) || {}).status || ''
        let member = mdata.participants.length
        let tag = '@'+num.split('@')[0]
        let buff = await getBuffer(ppimg);
        let bye = await getCustomBye(mdata.id);
        capt = bye.replace('@user', tag).replace('@name', username).replace('@bio', about).replace('@date', tanggal).replace('@group', mdata.subject);
        Felip.sendButtonLoc(mdata.id, buff, capt, 'Canal de Telegram\nhttps://t.me/+u3sxmOJHqLc3Yjhh', '👋🏻', 'unde', false, {
	      contextInfo: { 
            mentionedJid: Felip.parseMention(capt)
	      } 
	    });
	//--
      }
  }
});

//--antidelete 
Felip.on('message-delete', async (m) => {
    if (m.key.fromMe) return;
    let isAntidelete = cekAntidelete(m.key.remoteJid);
    if (isAntidelete === false) return;
    m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message;
    const Type = Object.keys(m.message)[0];
    await Felip.reply(m.key.remoteJid, `
━━━━⬣  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀  ⬣━━━━

*▢ Nombre :* @${m.participant.split`@`[0]} 
*▢ Hora :* ${time}

━━━━⬣  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀  ⬣━━━━

`.trim(), m.message, {
      contextInfo: {
        mentionedJid: [m.participant]
      }
    });
    Felip.copyNForward(m.key.remoteJid, m.message).catch(e => console.log(e, m));
  });
    
//---llamada auto block
Felip.on("CB:Call", json => {
  let call;
  calling = JSON.parse(JSON.stringify(json));
  call = calling[1].from;
  Felip.sendMessage(call, `*${Felip.user.name}* No hagas llamadas al bot, tu número se bloqueará automáticamente`, MessageType.text).then(() => Felip.blockUser(call, "add"));
}); 


}

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
 
function nocache(module, cb = () => { }) {
  console.log("‣ Modulo", `'${module}'`, "se está revisando si hay cambios");
  fs.watchFile(require.resolve(module), async () => {
    await uncache(require.resolve(module));
    cb(module);
    });
    }


/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(module)];
      resolve();
      } catch (e) {
        reject(e);
        }
        });
        }

require('./index.js');
nocache('./index.js', module => console.log(color(`Index.js Se actualizó!`)));


Felip.on('chat-update', async (message) => {
require('./index.js')(Felip, message);
});

starts();
