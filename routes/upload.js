var express = require('express');
var multer = require('multer');
var upload = multer()
var xlsx = require('xlsx')
var router = express.Router();

const db = require('monk')('localhost/testDB');
const TC = db.get('TypeCurves');
const Wells = db.get('wells');
const Pdp = db.get('pdp');

let name = '';
let type = '';
let parsed = '';

router.post('/', upload.any(), function(req, res, next) {
  type = req.body.item;
  name = req.body.name;
  let arraybuffer = req.files[0].buffer;
  var data = new Uint8Array(arraybuffer);
  var arr = new Array();
  for (var i = 0; i != data.length; ++i) {
    arr[i] = String.fromCharCode(data[i]);
  };
  var bstr = arr.join("");
  var workbook = xlsx.read(bstr, {type:"binary"});
  var first_sheet_name = workbook.SheetNames[0];
  var worksheet = workbook.Sheets[first_sheet_name];
  parsed = xlsx.utils.sheet_to_json(worksheet, {header: 'A', raw: true});
  while (Object.values(parsed[0]).length < 4) {
    parsed.shift();
  }
  res.json({
    type,
    name,
    data: Object.values(parsed[0])
  });
});

router.post('/update', (req, res, next) => {
  let columnNames = req.body;
  let originalColumns = parsed[0];
  let oldKeyArr = [];
  let newTc = [];
  let newPdp = [];
  Object.keys(originalColumns).forEach(oldKey => {
    Object.keys(columnNames).forEach(key => {
      if (columnNames[key] == originalColumns[oldKey].replace('.', '').replace(/ /g, '_')) {
        oldKeyArr.push(oldKey);
      }
    });
  });
  for (var i = 0; i < parsed.length; i++) {
    let day = {};
    for (var j = 0; j < oldKeyArr.length; j++) {
      day[Object.keys(columnNames)[j]] = parsed[i][oldKeyArr[j]];
    }
    if (type == 'Type Curve') {
      day['TC'] = name;
      newTc.push(day);
    } else {
      newPdp.push(day);
    }
  }
  if (type == 'PDP') {
    newPdp.shift();
    Pdp.drop().then(() => {
      newPdp.forEach(month => {
        month.OUTDATE = getJsDateFromExcel(month.OUTDATE);
        Pdp.insert(month)
          .then(() => {
            res.json({
              message: '👍'
            });
          });
      });
    });
  }
  if (type == 'Type Curve') {
    newTc.shift();
    TC.insert({
      "name": name,
      data: newTc
    })
    .then(() => {
      res.json({
        message: '👍'
      });
    });
  }
  console.log(newTc);
  console.log(newPdp);
  res.json({
    message: '👍'
  });
});

router.post('/wells', upload.any(), function(req, res, next) {
  type = req.body.item;
  name = req.body.name;
  let arraybuffer = req.files[0].buffer;
  var data = new Uint8Array(arraybuffer);
  var arr = new Array();
  for (var i = 0; i != data.length; ++i) {
    arr[i] = String.fromCharCode(data[i]);
  };
  var bstr = arr.join("");
  var workbook = xlsx.read(bstr, {type:"binary"});
  var first_sheet_name = workbook.SheetNames[0];
  var worksheet = workbook.Sheets[first_sheet_name];
  parsed = xlsx.utils.sheet_to_json(worksheet, {header: 'A', raw: true});
  parsed.shift();

  let normalizedData = [];
  let parsedKeys = Object.keys(parsed[0]);
  parsedKeys.splice(2, 0, "WATER SYSTEM");
  parsedKeys.splice(3, 0, "TYPE CURVE");
  parsed.forEach(obj => {
    let item = {};
    parsedKeys.forEach(key => {
      if (obj[key] == undefined) {
        obj[key] = null;
      }
      if (parsed[0][key]){
        item[parsed[0][key].replace('.', '').replace(/ /g, '_')] = obj[key];
      } else {
        item[key.replace('.', '').replace(/ /g, '_')] = obj[key];
      }
    });
    normalizedData.push(item);
  });
  normalizedData.shift();
  normalizedData = normalizedData.map(obj => {
    obj['TYPE_CURVE'] = `TC1-${obj.LAT_LEN}`;
    obj.WATER_SYSTEM = `W${obj.RIG.split(' ')[1]}`;
    if (obj.SPUD) {
      obj.SPUD = getJsDateFromExcel(obj.SPUD);
    }
    if (obj.COMPLETION) {
      obj.COMPLETION = getJsDateFromExcel(obj.COMPLETION);
    }
    if (obj.First_Production) {
      obj.First_Production = getJsDateFromExcel(obj.First_Production);
    }
    if (obj.MSB) {
      obj.MSB = getJsDateFromExcel(obj.MSB);
    }
    return obj;
  });
  Wells.drop();
  normalizedData.forEach(well => {
    Wells.insert(well);
  });
  res.json({
    data: normalizedData
  });
});

function getJsDateFromExcel(excelDate) {
  let date = new Date((excelDate - (25567 + 1))*86400*1000);
  return (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
}

module.exports = router;
