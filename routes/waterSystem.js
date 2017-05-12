var express = require('express');
var router = express.Router();


router.get('/monthly/:id', (req, res, next) => {
  var db = require('../db.js').db();
  const wells = db.get('wells');
  const Pdp = require('monk')(`localhost/testDB`).get('pdp');
  var pdp;
  var same = [];
  Pdp.aggregate([
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
  ])
  .then(result => {
    if (result.length > 0) {
      result.forEach(month => {
        month._id.Date = convertDate(month._id.Date, 0);
      });
      result.sort(function(a, b) {
        a = new Date(a._id.Date);
        b = new Date(b._id.Date);
        return a<b ? -1 : a>b ? 1 : 0;
      });
      pdp = result.map(pdp => {
        return {
          month: pdp._id.Date,
          total: pdp.total
        };
      });
    }
    else {
      pdp = [];
    }
    return pdp;
  })
  .then(pdp => {
    return wells.find({"WATER_SYSTEM" : req.params.id})
      .then(response => {
        response.forEach(well => {
          if (well.SPUD) {
            well.SPUD = convertDate(well.SPUD, 0);
          }
          if (well.COMPLETION) {
            well.COMPLETION = convertDate(well.COMPLETION, 0);
          }
          if (well.First_Production) {
            well.First_Production = convertDate(well.First_Production, 0);
          }
        });
        return response;
      });
  })
  .then(waterSystem => {
    let totals = [];
    for (var i = 0; i < waterSystem.length; i++) {
      if (waterSystem[i].RIG != 'Bullpen') {
        totals.push(updateWater(waterSystem[i]));
      }
    }
    return totals;
  })
  .then((totals) => {
    return Promise.all(totals).then(total => {
      let myArr = [];
      total.forEach(well => {
        for (var key in well) {
          let newKey = convertDate(key, 0);
          let newMonth = {
            month: newKey,
            total : well[key]
          };
          var found = myArr.some(function (el) {
            return el.month === newMonth.month;
          });
          if (!found) {
            myArr.push(newMonth);
          }
          else {
            for (var i = 0; i < myArr.length; i++) {
              if (myArr[i].month == newMonth.month) {
                myArr[i].total += newMonth.total;
              }
            }
          }
        }
      });
      return myArr;
    });
  })
  .then((myArr) => {
    if (pdp.length > 0) {
      for (var j = 0; j < pdp.length; j++) {
        var found = same.some(function (el) {
          return el.month === pdp[j].month;
        });
        if (!found) { same.push({
          Month: pdp[j].month,
          PDP: pdp[j].total,
          New_Wells: 0,
          Total: pdp[j].total
        }); }
      }
      for (var i = 0; i < myArr.length; i++) {
        for (var j = 0; j < pdp.length; j++) {
          if (new Date(myArr[i].month).getTime() == new Date(pdp[j].month).getTime()) {
            same[j]['New_Wells'] = same[j]['New_Wells'] + myArr[i].total;
            same[j]['Total'] = same[j]['Total'] + myArr[i].total;
          }
        }
      }
    } else {
      for (var i = 0; i < myArr.length; i++) {
        if (new Date(myArr[i].month).getTime() < new Date(new Date().setFullYear(new Date().getFullYear() + 2)).getTime()) {
          same.push({
            Month: myArr[i].month,
            PDP: 0,
            'New_Wells': myArr[i].total,
            Total: myArr[i].total
          });
        }
      }
    }
    return same;
  })
  .then(same => {
    res.json(same);
  })
  .catch((err) => next(err));
});


router.get('/daily/:id', (req, res, next) => {
  var db = require('../db.js').db();
  const wells = db.get('wells');
  const Pdp = require('monk')(`localhost/testDB`).get('pdp');

  var pdp;
  var same = [];
  Pdp.aggregate([
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
  ])
  .then(result => {
    if (result.length > 0) {
      pdp = result.map(pdp => {
        let myArr = [];
        let month = pdp._id.Date.split('/')[0];
        let days = pdp._id.Date.split('/')[1];
        let year = pdp._id.Date.split('/')[2];
        let i = days;
        while (i > 0) {

          myArr.push({
            day: convertDate(month + '/' + i + '/' + year, 0),
            total: Math.round(pdp.total / days)
          });
          i--;
        }
        return myArr;
      });
      pdp = pdp.reduce((a, b) => {
        return a.concat(b);
      });
    } else {
      pdp = [];
    }
    return pdp;
  })
  .then(pdp => {
    return wells.find({"WATER_SYSTEM" : req.params.id})
      .then(system => {
        let totals = [];
        for (var i = 0; i < system.length; i++) {
          if (system[i].RIG != 'Bullpen') {
            totals.push(findValues(system[i]));
          }
        }
        return totals;
      });
  })
  .then(totals => {
    return Promise.all(totals).then(total => {
      let myArr = [];
      total.forEach(well => {
        for (var key in well) {
          let date = convertDate(key, 0);
          let dateObj = {
            day: date,
            total: well[key]
          };
          var found = myArr.some(function (el) {
            return el.day === dateObj.day;
          });
          if (!found) {
            myArr.push(dateObj);
          }
          else {
            for (var i = 0; i < myArr.length; i++) {
              if (myArr[i].day == dateObj.day) {
                myArr[i].total += dateObj.total;
              }
            }
          }
        }
      });
      return myArr;
    });
  })
  .then(myArr => {
    if (pdp.length > 0) {
      for (var j = 0; j < pdp.length; j++) {
        var found = same.some(function (el) {
          return el.day === pdp[j].day;
        });
        if (!found) { same.push({
          Day: pdp[j].day,
          PDP: pdp[j].total,
          New_Wells: 0,
          Total: pdp[j].total
        }); }
      }
      for (var i = 0; i < myArr.length; i++) {
        for (var j = 0; j < pdp.length; j++) {
          if (new Date(myArr[i].day).getTime() == new Date(pdp[j].day).getTime()) {
            same[j]['New_Wells'] = same[j]['New_Wells'] + myArr[i].total;
            same[j]['Total'] = same[j]['Total'] + myArr[i].total;
          }
        }
      }
      return same;
    } else {
      for (var i = 0; i < myArr.length; i++) {
        if (new Date(myArr[i].day).getTime() < new Date(new Date().setFullYear(new Date().getFullYear() + 2)).getTime()) {
          same.push({
            Day: myArr[i].day,
            PDP: 0,
            'New_Wells': myArr[i].total,
            Total: myArr[i].total
          });
        }
      }
    }
    return same;
  })
  .then(same => {
    res.json(same);
  })
  .catch((err) => next(err));
});


function findValues(well) {
  const TC = require('monk')(`localhost/testDB`).get('TypeCurves');
  if (!well.COMPLETION) {
    well.COMPLETION = convertDate(well.SPUD, 60);
  }
  if (!well.First_Production) {
    well.First_Production = convertDate(well.COMPLETION, 7);
  }
  let total = {};
  let monthDayCount = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = Number(well.First_Production.split('/')[0]);
  let day = Number(well.First_Production.split('/')[1]);
  let year = Number(well.First_Production.split('/')[2]);
  return TC.aggregate([
    {
      '$match': {"name": well.TYPE_CURVE}
    }
  ])
  .then(response => {
    let tc = response[0].data;
    let i = 0;
    while (i < tc.length) {
      total[`${month}/${day}/${year}`] = Math.round(tc[i].Water);
      i++;
      if (day < monthDayCount[month]) {
        day++;
      } else {
        day = 1;
        if (month < 12) {
          month++;
        } else {
          month = 1;
          year++;
        }
      }
    }
    return total;
  })
  .catch((err) => {return err;});
}


function updateWater(well) {
  const TC = require('monk')(`localhost/testDB`).get('TypeCurves');
  let totals = {};
  let monthDayCount = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (!well.COMPLETION) {
    well.COMPLETION = convertDate(well.SPUD, 60);
  }
  if (!well.First_Production) {
    well.First_Production = convertDate(well.COMPLETION, 7);
  }
  let month = Number(well.First_Production.split('/')[0]);
  let day = Number(well.First_Production.split('/')[1]);
  let year = Number(well.First_Production.split('/')[2]);
  let dayCount = (monthDayCount[month] - day) + 1;
  return TC.aggregate([
    {
      '$match': {"name": well.TYPE_CURVE}
    }
  ])
  .then(response => {
    let tc = response[0].data;
    let first = tc.slice(0, dayCount);
    let total = first.reduce((a,b) => {
      return a + b.Water;
    },0);
    if (!totals[month + '/' + monthDayCount[month] + '/' + year]) {
      totals[month + '/' + monthDayCount[month] + '/' + year] = Math.round(total);
    }
    else {
      totals[month + '/' + monthDayCount[month] + '/' + year] += Math.round(total);
    }
    if (month < 12) {
      month++;
    } else {
      month = 1;
      year++;
    }
    while (dayCount < tc.length) {
      let prev = dayCount;
      dayCount += monthDayCount[month];
      let first = tc.slice(prev, dayCount);
      let total = first.reduce((a,b) => {
        return a + b.Water;
      },0);
      if (!totals[month + '/' + monthDayCount[month] + '/' + year]) {
        totals[month + '/' + monthDayCount[month] + '/' + year] = Math.round(total);
      }
      else {
        totals[month + '/' + monthDayCount[month] + '/' + year] += Math.round(total);
      }
      if (month < 12) {
        month++;
      } else {
        month = 1;
        year++;
      }
    }
    return totals;
  })
  .catch((err) => {return err;});
}


function convertDate(strDate, days) {
  let someDate = new Date(strDate);
  someDate.setDate(someDate.getDate() + days);
  return strDate = ('0' +(someDate.getMonth()+1)).slice(-2) + "/" + ('0' + someDate.getDate()).slice(-2) + "/" + someDate.getFullYear();
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};



module.exports = router;
