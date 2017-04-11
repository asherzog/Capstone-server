var express = require('express');
var router = express.Router();

const db = require('monk')('localhost/testDB');
const wells = db.get('wells');

router.get('/', function(req, res, next) {
  return wells.find({})
    .then(response => res.json(response))
    .catch((err) => next(err));
});

router.post('/', function(req, res, next) {
  let well = req.body;
  if (isValidWell(well)) {
    let newWell = {
      RIG: well.RIG,
      WELL: well.WELL,
      "Why Scheduled?": null,
      WI: null,
      STATUS: null,
      AREA: null,
      WATER_SYSTEM: well.WATER_SYSTEM,
      TYPE_CURVE: well.TYPE_CURVE,
      TZ: null,
      "LAT LEN": null,
      SHL: null,
      BHL: null,
      PAD: null,
      "SPUD-SPUD": well.SPUD_SPUD,
      SPUD: well.SPUD,
      "RIG RELEASE": null,
      LAND: null,
      MSB: null,
      "Net Ac @ Risk": null,
      MPB: null,
      COMPLETION: null,
      NOTE: null,
      "GEO OPS": null,
      DRILLING: null,
      COMPL: null,
      "SURVEY REQUEST": null,
      RTS: null,
      STAKED: null,
      PLAT: null,
      GEOPROG: null,
      "DIR PLAN": null,
      AFE: null,
      NPZ: null,
      "SWR-37": null,
      W1: null,
      GAU: null,
      "SWR-13": null,
      WWP: null,
      "REGUL RTD": null,
      SUA: null,
      ACCESS: null,
      FACILITIES: null,
      "SURF RTB": null,
      "LOC BUILT": null,
      "MINERAL RTD": null,
      "FULL RTD": null
    };
    wells.insert(newWell);
    res.json({
      message: 'Recieved'
    });
  } else {
    next(new Error('Invalid Well Submission'));
  }
});

router.get('/:id', function(req, res, next) {
  return wells.find({_id: req.params.id})
    .then(response => res.json(response))
    .catch((err) => next(err));
});

router.patch('/:id', (req, res, next) => {
  return wells.update({_id: req.params.id}, {$set: req.body})
    .then(result => {
      res.json(result);
    }).catch((err) => next(err));
});

router.delete('/:id', (req, res, next) => {
  return wells.findOneAndDelete({_id: req.params.id})
    .then((response) => {
      res.json({
        response,
        message: '🗑'
      });
    }).catch((err) => next(err));
});

function isValidWell(well) {
  let validRig = typeof well.RIG == 'string' &&
                  well.RIG.trim().length > 1 &&
                  well.RIG.trim().length < 20;
  let validWell = typeof well.WELL == 'string' &&
                  well.WELL.trim().length > 1 &&
                  well.WELL.trim().length < 20;
  let validSystem = typeof well.WATER_SYSTEM == 'string' &&
                  well.WATER_SYSTEM.trim().length > 1 &&
                  well.WATER_SYSTEM.trim().length < 20;
  let validTC = typeof well.TYPE_CURVE == 'string' &&
                  well.TYPE_CURVE.trim().length > 1 &&
                  well.TYPE_CURVE.trim().length < 20;
  let validSpudSpud = Number(well.SPUD_SPUD) != NaN;
  let validSpud = (new Date(well.SPUD) !== "Invalid Date") && !isNaN(new Date(well.SPUD));
  return validRig && validWell && validSystem && validTC && validSpudSpud && validSpud;
}


module.exports = router;
