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
      WATER_SYSTEM: well.WATER_SYSTEM,
      TYPE_CURVE: well.TYPE_CURVE,
      "Why_Scheduled?": null,
      WI: null,
      NRI:well.NRI,
      STATUS: null,
      AREA: null,
      TZ: null,
      "LAT_LEN": null,
      SHL1: null,
      BHL: null,
      PAD: null,
      "SPUD-SPUD": well.SPUD_SPUD,
      SPUD: well.SPUD,
      "RIG_RELEASE": null,
      LAND1: null,
      MSB: null,
      "Net_Ac_@_Risk": null,
      MPB: null,
      COMPLETION: null,
      First_Production: null,
      NOTE: null,
      LAND: null,
      "GEO_OPS": null,
      DRILLING: null,
      COMPL: null,
      SHL: null,
      "SURVEY_REQUEST": null,
      RTS: null,
      STAKED: null,
      PLAT: null,
      GEOPROG: null,
      "DIR_PLAN": null,
      AFE: null,
      NPZ: null,
      "SWR-37": null,
      W1: null,
      GAU: null,
      "SWR-13": null,
      WWP: null,
      "REGUL_RTD": null,
      SUA: null,
      ACCESS: null,
      FACILITIES: null,
      "SURF_RTB": null,
      "LOC_BUILT": null,
      "MINERAL_RTD": null,
      "FULL_RTD": null
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
