const axios = require('axios');

exports.index = function(req, res){
  let content = {
		newMessage: []
	};
	
	res.render("Index", content);
}