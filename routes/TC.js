var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  const TC = require('monk')(`localhost/testDB`).get('TypeCurves');
  return TC.find({}).then(result => {
    res.json(result);
  })
  .catch((err) => next(err));
});

router.get('/:id', (req, res, next) => {
  const TC = require('monk')(`localhost/testDB`).get('TypeCurves');
  return TC.aggregate([
    {
      '$match': {"name": req.params.id}
    }
  ])
  .then(result => {
    res.json(result);
  })
  .catch((err) => next(err));
});

router.delete('/:id', (req, res, next) => {
  const TC = require('monk')(`localhost/testDB`).get('TypeCurves');
  return TC.aggregate([
    {
      '$match': {"name": req.params.id}
    }
  ])
  .then(result => {
    TC.remove(result[0])
      .then(() => {
        res.json({
          message: 'removed'
        })
      })
  })
})

module.exports = router;
