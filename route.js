var express = require("express");
var router = express.Router();

var indexController = require("./controller/index");

router.get('/', indexController.index);
module.exports = router;
