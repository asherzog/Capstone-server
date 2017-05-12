var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  var db = require('../db.js').db();
  const Pdp = db.get('pdp');
  return Pdp.find({}).then(result => res.json(result))
    .catch((err) => next(err));
});

router.patch('/:id', (req, res, next) => {
  var db = require('../db.js').db();
  const Pdp = db.get('pdp');
  return Pdp.update({_id: req.params.id}, {$set: req.body})
    .then(result => {
      res.json(result);
    }).catch((err) => next(err));
});

router.delete('/:id', (req, res, next) => {
  var db = require('../db.js').db();
  const Pdp = db.get('pdp');
  return Pdp.findOneAndDelete({_id: req.params.id})
    .then((response) => {
      res.json({
        response,
        message: '🗑'
      });
    }).catch((err) => next(err));
});

router.get('/wells/:id', function(req, res, next) {
  var db = require('../db.js').db();
  const Pdp = db.get('pdp');
  return Pdp.distinct("LEASE", {"Water_System" : req.params.id})
    .then(result => {
      res.json(result);
    });
});

router.get('/lease/:id', function(req, res, next) {
  var db = require('../db.js').db();
  const Pdp = db.get('pdp');
  return Pdp.find({"LEASE" : req.params.id})
    .then(result => {
      res.json(result);
    });
});

router.get('/:id', function(req, res, next) {
  var db = require('../db.js').db();
  const Pdp = db.get('pdp');
  return Pdp.aggregate([
    {
      '$match' : {"Water_System" : req.params.id},
    },
    {
      '$group' : {
        '_id' : {
          'Date' : "$OUTDATE"
        },
        'total' : {'$sum': "$Gross_Water_Bbls"},
        'count' : {'$sum': 1}
      }
    }
  ]).then(result => res.json(result));
});


module.exports = router;
