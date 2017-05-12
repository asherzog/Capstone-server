var express = require('express');
var router = express.Router();
var setter = require('../db.js');

router.get('/allsystems', function(req, res, next) {
  var db = setter.db();
  const wells = db.get('wells');
  const Pdp = db.get('pdp');

  return wells.distinct("WATER_SYSTEM")
    .then(response => {
      let wells = response;
      Pdp.distinct("Water_System")
        .then(results => {
          let pdp = results;
          let answer = wells.concat(pdp.filter((item => {
            return wells.indexOf(item) < 0;
          })));
          res.json(answer);
        });
    })
    .catch((err) => next(err));
});

router.get('/allrigs', function(req, res, next) {
  var db = setter.db();
  const wells = db.get('wells');

  return wells.distinct("RIG")
    .then(response => res.json(response))
    .catch((err) => next(err));
});

router.get('/alltc', function(req, res, next) {
  var db = setter.db();
  const TC = db.get('TypeCurves');

  return TC.distinct("name")
    .then(response => res.json(response))
    .catch((err) => next(err));
});

router.get('/allpdp', function(req, res, next) {
  var db = setter.db();
  const Pdp = db.get('pdp');

  return Pdp.distinct("LEASE")
    .then(response => res.json(response))
    .catch((err) => next(err));
});

router.get('/water/:id', function(req, res, next) {
  var db = setter.db();
  const wells = db.get('wells');

  return wells.find({"WATER_SYSTEM" : req.params.id})
    .then(response => res.json(response))
    .catch((err) => next(err));
});

router.get('/rig/:id', function(req, res, next) {
  var db = setter.db();
  const wells = db.get('wells');

  return wells.find({"RIG" : req.params.id})
    .then(response => res.json(response))
    .catch((err) => next(err));
});

router.post('/setdb', (req, res, next) => {
  setter.setDB(req.body.db);
  let result = setter.getDB();
  res.json({
    result
  });
});

module.exports = router;
