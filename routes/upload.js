var express = require('express');
var multer = require('multer');
var upload = multer()
var xlsx = require('xlsx')
var router = express.Router();

const db = require('monk')('localhost/testDB');
const TC = db.get('TypeCurves');

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
  parsed.shift();
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
      if (columnNames[key] == originalColumns[oldKey]) {
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
  console.log(newTc);
  console.log(newPdp);
  res.json({
    message: '👍'
  });
});



module.exports = router;
