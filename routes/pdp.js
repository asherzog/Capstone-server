var express = require('express');
var router = express.Router();

const db = require('monk')('localhost/testDB');
const Pdp = db.get('pdp');

router.get('/', (req, res, next) => {
  return Pdp.find({}).then(result => res.json(result))
    .catch((err) => next(err));
});

router.patch('/:id', (req, res, next) => {
  return Pdp.update({_id: req.params.id}, {$set: req.body})
    .then(result => {
      res.json(result);
    }).catch((err) => next(err));
});

router.delete('/:id', (req, res, next) => {
  return Pdp.findOneAndDelete({_id: req.params.id})
    .then((response) => {
      res.json({
        response,
        message: '🗑'
      });
    }).catch((err) => next(err));
});

router.get('/wells/:id', function(req, res, next) {
  return Pdp.distinct("LEASE", {"Water_System" : req.params.id})
    .then(result => {
      res.json(result);
    });
});

router.get('/:id', function(req, res, next) {
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
