var express = require('express');
var router = express.Router();

const db = require('monk')('localhost/testDB');
const TC = db.get('TypeCurves');

router.get('/', (req, res, next) => {
  return TC.find({}).then(result => {
    res.json(result);
  })
  .catch((err) => next(err));
});

router.get('/:id', (req, res, next) => {
  return TC.aggregate([
    {
      '$match': {"TC": req.params.id}
    },
    {
      '$sort': {'Days': 1}
    }
  ])
  .then(result => {
    res.json(result);
  })
  .catch((err) => next(err));
});



module.exports = router;