const axios = require('axios');
// const getUrisrv = 'https://pixodestyafandy-cv-admin.herokuapp.com/';
// const getUrisrv = 'http://127.0.0.1:1337/';

exports.index = function(req, res){
  // // var array = new Array();
  // if (!req.session.languages) {
  //   req.session.languages = "id";
  // } else {
  //   req.session.languages
  // }

  let content = {
		newMessage: []
	};
  // return axios.get('/contact/getcontacts')
  // .then(resp => {
	// 	console.log(resp);
  // })
  // .catch(error => {
  //   return console.log(error);
  // });
	
	res.render("Index", content);
}