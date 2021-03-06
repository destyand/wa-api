const { Client, MessageMedia, ClientInfo } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const store = require('store2');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
var path = require('path');
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
var route = require("./route");



// let sessionCfg;
// const SESSION_FILE_PATH = './session.json';
// if (fs.existsSync(SESSION_FILE_PATH)) {
//   sessionCfg = require(SESSION_FILE_PATH);
// }

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: true
}));

// app.use(express.static(path.join(__dirname + "/public")));
// app.get('/', (req, res) => {
//   res.sendFile('index.html', {
//     root: __dirname
//   });
// });
const db = require('./helpers/db');

(async() => {
const savedSession = await db.readSession();
console.log("savedSession");
console.log(savedSession);
global.client = new Client({
  restartOnAuthFail: false,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
  },
  session: savedSession
});

global.client_info = new ClientInfo({})

global.authed = (savedSession !== null) ? true : false;

client.initialize();

// client.on('message', msg => {
//   if (msg.body == '!ping') {
//     msg.reply('pong');
//   } else if (msg.body == 'good morning') {
//     msg.reply('selamat pagi');
//   } else if (msg.body == '!groups') {
//     client.getChats().then(chats => {
//       const groups = chats.filter(chat => chat.isGroup);

//       if (groups.length == 0) {
//         msg.reply('You have no group yet.');
//       } else {
//         let replyMsg = '*YOUR GROUPS*\n\n';
//         groups.forEach((group, i) => {
//           replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
//         });
//         replyMsg += '_You can use the group id to send a message to the group._'
//         msg.reply(replyMsg);
//       }
//     });
//   }
// });

client.on('authenticated', async (session) => {
	console.log("AUTH!");
	// db.saveSession(session)
	store.set('session', session);
	// sessionCfg = session;
	authed = (savedSession !== null && savedSession !== "") ? true : false;
	// authed = (store.get('session') !== null) ? true : false;
	// const clientInfo = await client.ClientInfo()
	// fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
	// 		if (err) {
	// 				console.error(err);
	// 		}
	// 		authed = true;
	// });
});
console.log(savedSession);

// Socket IO
io.on('connection', function(socket) {
	// console.log(savedSession);
	console.log(authed);
	if(authed){
		socket.emit('message', 'Please Wait...');
		socket.emit('status', 200);
		socket.emit('authed', authed);
		console.log("Loading");
	} else {
		if(savedSession !== null && savedSession !== ""){
			socket.emit('message', 'Connected...');
			socket.emit('status', 200);
			socket.emit('authed', authed);
			console.log("Connected With Session ");
		} else {
			socket.emit('message', 'Connecting...');
			socket.emit('status', 400);
			socket.emit('authed', authed);
			console.log("Connecting...");
			// client.getState().then((data) => {
      //   console.log(data)
      //   // res.send(data)
			// }).catch((err) => {
			// 	db.removeSession();
			// 	store.remove('session', null); 
			// 	// res.send(err);
			// })
		}
	}

	client.on('message', async (msg) => {
		socket.emit('new_message', msg);
		if (msg.body == '!ping') {
			msg.reply('pong');
		} else if (msg.body == 'good morning') {
			msg.reply('selamat pagi');
		} else if (msg.body.includes("-")) {
			// msg.reply('selamat pagi');
			const get_id = msg.body.split("-")[0];
			const get_value = msg.body.split("-")[1];
			const checkStr = new String(get_id).valueOf() == new String("!nisn").valueOf();
			if(checkStr){
				const resp = await db.readMasterData(get_value);
				// console.log(resp);
				if(resp !== ""){
					const repplyMsg = `${resp.desc}, Data Anda (NISN: ${resp.name}, Nama: ${resp.title})`
					msg.reply(repplyMsg);
					return true;
				} else {
					msg.reply("Data Tidak Ditemukan");
				}
			}
		} else if (msg.body == '!groups') {
			client.getChats().then(chats => {
				const groups = chats.filter(chat => chat.isGroup);
	
				if (groups.length == 0) {
					msg.reply('You have no group yet.');
				} else {
					let replyMsg = '*YOUR GROUPS*\n\n';
					groups.forEach((group, i) => {
						replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
					});
					replyMsg += '_You can use the group id to send a message to the group._'
					msg.reply(replyMsg);
				}
			});
		}
	});

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
		console.log("Whatsapp is ready");
  });

  client.on('authenticated', (session) => {
    socket.emit('authenticated', 'Whatsapp is authenticated!');
    socket.emit('message', 'Whatsapp is authenticated!');
    console.log('AUTHENTICATED', session);
		db.saveSession(session)
		store.set('session', session);
		authed = true;
		console.log(client_info.me);
    // sessionCfg = session;
    // fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
    //   if (err) {
    //     console.error(err);
    //   }
    // });
  });

  client.on('auth_failure', function(session) {
    socket.emit('message', 'Auth failure, restarting...');
		authed = false;
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    db.removeSession();
		store.remove('session', null); 
		authed = false;
		// fs.unlinkSync(SESSION_FILE_PATH, function(err) {
    //     if(err) return console.log(err);
    //     console.log('Session file deleted!');
    // });
    client.destroy();
    client.initialize();
  });
});


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname + "/public")));
app.use(route);

// ROUTE
const chatRoute = require('./controller/api/chatting');
const contactRoute = require('./controller/api/contact');
const authRoute = require('./controller/api/auth');

app.use(function(req, res, next){
	// console.log(req.method + ' : ' + req.path);
	next();
});

app.use('/chat',chatRoute);
app.use('/contact',contactRoute);
app.use('/auth',authRoute);
app.post('/remove_session', async (req, res) => {
	const rm_session = await db.removeSession();
	res.send({ status: "success", message: 'success remove session' })
	store.remove('session', null);
});

server.listen(port, function() {
  console.log('App running on *: ' + port);
});

})();