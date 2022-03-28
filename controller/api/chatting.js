const router = require('express').Router();
const { MessageMedia, Location } = require("whatsapp-web.js");
const request = require('request')
const vuri = require('valid-url');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { phoneNumberFormatter } = require('../../helpers/formatter');

const checkRegisteredNumber = async function(number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
}

const mediadownloader = (url, path, callback) => {
	request.head(url, (err, res, body) => {
		request(url)
			.pipe(fs.createWriteStream(path))
			.on('close', callback)
	})
}

const getProfilePic = async (number) => {
	let arr = [];
	const profilePic = await client.getProfilePicUrl(`${number}@c.us`);
	return profilePic;
}

router.post('/send-message', [
	body('number').notEmpty(),
	body('message').notEmpty(),
], async (req, res) => {
	const errors = validationResult(req).formatWith(({
		msg
	}) => {
		return msg;
	});

	if (!errors.isEmpty()) {
		return res.status(422).json({
			status: false,
			message: errors.mapped()
		});
	}

	const number = phoneNumberFormatter(req.body.number);
	const message = req.body.message;

	const isRegisteredNumber = await checkRegisteredNumber(number);

	if (!isRegisteredNumber) {
		return res.status(422).json({
			status: false,
			message: 'The number is not registered'
		});
	}

	client.sendMessage(number, message).then(response => {
		res.status(200).json({
			status: true,
			response: response
		});
	}).catch(err => {
		res.status(500).json({
			status: false,
			response: err
		});
	});
});

router.post('/sendmessage/:phone', async (req,res) => {
    let phone = req.params.phone;
    let message = req.query.message;
		console.log(req.query.message);
    if (phone == undefined) {
        res.send({ status:"error", message:"please enter valid phone", number: phone, pesan: message })
    } else if (message == undefined) {
				res.send({ status:"error", message:"please enter valid message", number: phone, pesan: null })
		} else {
        client.sendMessage(phone + '@c.us', message).then((response) => {
            if (response.id.fromMe) {
                res.send({ status:'success', message: `Message successfully sent to ${phone}` })
            }
        });
    }
});

router.post('/sendimage/:phone', async (req,res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = req.params.phone;
    let image = req.body.image;
    let caption = req.body.caption;

    if (phone == undefined || image == undefined) {
        res.send({ status: "error", message: "please enter valid phone and base64/url of image" })
    } else {
        if (base64regex.test(image)) {
            let media = new MessageMedia('image/png',image);
            client.sendMessage(`${phone}@c.us`, media, { caption: caption || '' }).then((response) => {
                if (response.id.fromMe) {
                    res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                }
            });
        } else if (vuri.isWebUri(image)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }

            var path = './temp/' + image.split("/").slice(-1)[0]
            mediadownloader(image, path, () => {
                let media = MessageMedia.fromFilePath(path);
                
                client.sendMessage(`${phone}@c.us`, media, { caption: caption || '' }).then((response) => {
                    if (response.id.fromMe) {
                        res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                        fs.unlinkSync(path)
                    }
                });
            })
        } else {
            res.send({ status:'error', message: 'Invalid URL/Base64 Encoded Media' })
        }
    }
});

router.post('/sendpdf/:phone', async (req,res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = req.params.phone;
    let pdf = req.body.pdf;

    if (phone == undefined || pdf == undefined) {
        res.send({ status: "error", message: "please enter valid phone and base64/url of pdf" })
    } else {
        if (base64regex.test(pdf)) {
            let media = new MessageMedia('application/pdf', pdf);
            client.sendMessage(`${phone}@c.us`, media).then((response) => {
                if (response.id.fromMe) {
                    res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                }
            });
        } else if (vuri.isWebUri(pdf)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }

            var path = './temp/' + pdf.split("/").slice(-1)[0]
            mediadownloader(pdf, path, () => {
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(`${phone}@c.us`, media).then((response) => {
                    if (response.id.fromMe) {
                        res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                        fs.unlinkSync(path)
                    }
                });
            })
        } else {
            res.send({ status: 'error', message: 'Invalid URL/Base64 Encoded Media' })
        }
    }
});

router.post('/sendlocation/:phone', async (req, res) => {
    let phone = req.params.phone;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let desc = req.body.description;

    if (phone == undefined || latitude == undefined || longitude == undefined) { 
        res.send({ status: "error", message: "please enter valid phone, latitude and longitude" })
    } else {
        let loc = new Location(latitude, longitude, desc || "");
        client.sendMessage(`${phone}@c.us`, loc).then((response)=>{
            if (response.id.fromMe) {
                res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
            }
        });
    }
});

router.get('/getchatbyid/:phone', async (req, res) => {
    let phone = req.params.phone;
    if (phone == undefined) {
        res.send({status:"error",message:"please enter valid phone number"});
    } else {
        client.getChatById(`${phone}@c.us`).then((chat) => {
            res.send({ status:"success", message: chat });
        }).catch(() => {
            console.error("Phone Not Connected")
            res.send({ status: "error", message: "Phone Not Connected" })
        })
    }
});

router.get('/getchats', async (req, res) => {
		// const chats = await client.getChats()
		// const foto = await chats.getProfilePicUrl() //assuming we only have 1 chat 

		// res.status(200).json({
		// 	status:true,
		// 	response: foto
		// })
		client.getChats().then((chat) => {
			let foto;
			chat.map(dt => {
				const aaa = getProfilePic(`${dt.id.user}@c.us`);
			})
			res.send({ status:"success", message: chat, profilePic: foto });
		}).catch(() => {
				console.error("Phone Not Connected")
				res.send({ status: "error", message: "Phone Not Connected" })
		})
});

router.get('/fetchMessages/:phone', async (req, res) => {
	let phone = req.params.phone;
	if (phone == undefined) {
			res.send({status:"error",message:"please enter valid phone number"});
	} else {
			const chats = await client.getChats()
			var index = chats.findIndex(p => p.id._serialized == `${phone}@c.us`);
			await chats[index].fetchMessages()
			.then((messages) => {
					res.send({ status: "success", message: messages })
			})
			.catch((err) => {
					console.error(err)
					res.send({ status: "error", message: "getmsgerror" })
			})
	}
});

module.exports = router;