var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Pr4xChat', scripts: ['/javascripts/index.js'] });
});

module.exports = router;
