var express = require('express');
var router = express.Router();

const db = require('monk')('localhost/testDB');
const Wells = db.get('wells');
const Pdp = db.get('pdp');
const TC = db.get('TypeCurves');

router.get('/monthly/:id', (req, res, next) => {
  if (req.params.id == "gross") {
    var pdp;
    var same = [];
    Pdp.aggregate([
      {
        '$group' : {
          '_id' : {
            'Date' : "$OUTDATE"
          },
          'Gross_Oil' : {'$sum': "$Gross_Oil_Bbls"},
          'Gross_Gas' : {'$sum': "$Gross_Gas_Mcf"},
          'Net_Oil': {'$sum': "$Net_Oil_Bbls"},
          'Net_Gas': {'$sum': "$Net_Gas_Mcf"}
        }
      }
    ])
    .then((result) => {
      result.sort(function(a, b) {
        a = new Date(a._id.Date);
        b = new Date(b._id.Date);
        return a<b ? -1 : a>b ? 1 : 0;
      });
      pdp = result.map(pdp => {
        return {
          month: pdp._id.Date,
          Oil: pdp.Gross_Oil,
          Gas: pdp.Gross_Gas,
          BOE: Number((pdp.Gross_Oil + (pdp.Net_Gas/6)).toFixed(0))
        };
      });
      return pdp;
    })
    .then(() => {
      var wellList = [];
      return Wells.find({})
        .then(results => {
          results.forEach(well => {
            if (well.RIG != 'Bullpen') {
              if (!well.First_Production) {
                well.First_Production = convertDate(well.SPUD, 67);
              }
              wellList.push(well);
            }
          });
          return wellList;
        });
    })
    .then(wells => {
      let totals = [];
      for (var i = 0; i < wells.length; i++) {
        totals.push(calculateGross(wells[i]));
      }
      return totals;
    })
    .then(totals => {
      return Promise.all(totals).then(total => {
        let myArr = [];
        total.forEach(well => {
          for (var key in well) {
            let newKey = convertDate(key, 0);
            let newMonth = {
              month: newKey,
              Oil : well[key].Oil,
              Gas: well[key].Gas,
              BOE: well[key].Oil + (well[key].Gas * well[key].NRI / 6)
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
                  myArr[i].Oil += newMonth.Oil;
                  myArr[i].Gas += newMonth.Gas;
                  myArr[i].BOE = myArr[i].Oil + (myArr[i].Gas * well[key].NRI / 6);
                }
              }
            }
          }
        });
        return myArr;
      });
    })
    .then(myArr => {
      myArr.sort(function(a, b) {
        a = new Date(a.month);
        b = new Date(b.month);
        return a<b ? -1 : a>b ? 1 : 0;
      });
      for (var j = 0; j < pdp.length; j++) {
        var found = same.some(function (el) {
          return el.month === pdp[j].month;
        });
        if (!found) { same.push({
          Month: pdp[j].month,
          PDP_Gas: numberWithCommas(pdp[j].Gas),
          PDP_Oil: numberWithCommas(pdp[j].Oil),
          PDP_BOE: numberWithCommas(pdp[j].BOE),
          New_Wells_Gas: 0,
          New_Wells_Oil: 0,
          New_Wells_BOE: 0,
          Total_Gas: pdp[j].Gas,
          Total_Oil: pdp[j].Oil,
          Total_BOE: pdp[j].BOE
        }); }
      }
      for (var i = 0; i < myArr.length; i++) {
        for (var j = 0; j < pdp.length; j++) {
          if (myArr[i].month == pdp[j].month) {
            same[j]['New_Wells_Gas'] = numberWithCommas((Number(same[j]['New_Wells_Gas']) + Number(myArr[i].Gas)).toFixed(0));
            same[j]['New_Wells_Oil'] = numberWithCommas((Number(same[j]['New_Wells_Oil']) + Number(myArr[i].Oil)).toFixed(0));
            same[j]['New_Wells_BOE'] = numberWithCommas((Number(same[j]['New_Wells_BOE']) + Number(myArr[i].BOE)).toFixed(0));
            same[j]['Total_Gas'] = numberWithCommas((Number(same[j]['Total_Gas']) + Number(myArr[i].Gas)).toFixed(0));
            same[j]['Total_Oil'] = numberWithCommas((Number(same[j]['Total_Oil']) + Number(myArr[i].Oil)).toFixed(0));
            same[j]['Total_BOE'] = numberWithCommas((Number(same[j]['Total_BOE']) + Number(myArr[i].BOE)).toFixed(0));
          }
        }
      }
      return same;
    })
    .then(same => {
      res.json(same);
    })
    .catch((err) => next(err));
  } else if (req.params.id == 'net') {
    let same = [];
    Pdp.aggregate([
      {
        '$group' : {
          '_id' : {
            'Date' : "$OUTDATE"
          },
          'Gross_Oil' : {'$sum': "$Gross_Oil_Bbls"},
          'Gross_Gas' : {'$sum': "$Gross_Gas_Mcf"},
          'Net_Oil': {'$sum': "$Net_Oil_Bbls"},
          'Net_Gas': {'$sum': "$Net_Gas_Mcf"}
        }
      }
    ])
    .then((result) => {
      result.sort(function(a, b) {
        a = new Date(a._id.Date);
        b = new Date(b._id.Date);
        return a<b ? -1 : a>b ? 1 : 0;
      });
      pdp = result.map(pdp => {
        return {
          month: pdp._id.Date,
          Oil: pdp.Net_Oil,
          Gas: pdp.Net_Gas,
          BOE: Number((pdp.Gross_Oil + (pdp.Net_Gas/6)).toFixed(0))
        };
      });
      return pdp;
    })
    .then(() => {
      var wellList = [];
      return Wells.find({})
        .then(results => {
          results.forEach(well => {
            if (well.RIG != 'Bullpen') {
              if (!well.First_Production) {
                well.First_Production = convertDate(well.SPUD, 67);
              }
              wellList.push(well);
            }
          });
          return wellList;
        });
    })
    .then(wells => {
      let totals = [];
      for (var i = 0; i < wells.length; i++) {
        totals.push(calculateNet(wells[i]));
      }
      return totals;
    })
    .then(totals => {
      return Promise.all(totals).then(total => {
        let myArr = [];
        total.forEach(well => {
          for (var key in well) {
            let newKey = convertDate(key, 0);
            let newMonth = {
              month: newKey,
              Oil : well[key].Oil,
              Gas: well[key].Gas,
              BOE: (well[key].Oil + well[key].Gas) / 6
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
                  myArr[i].Oil += newMonth.Oil;
                  myArr[i].Gas += newMonth.Gas;
                  myArr[i].BOE = (myArr[i].Oil + myArr[i].Gas) / 6;
                }
              }
            }
          }
        });
        return myArr;
      });
    })
    .then(myArr => {
      myArr.sort(function(a, b) {
        a = new Date(a.month);
        b = new Date(b.month);
        return a<b ? -1 : a>b ? 1 : 0;
      });
      for (var j = 0; j < pdp.length; j++) {
        var found = same.some(function (el) {
          return el.month === pdp[j].month;
        });
        if (!found) { same.push({
          Month: pdp[j].month,
          PDP_Gas: numberWithCommas(pdp[j].Gas),
          PDP_Oil: numberWithCommas(pdp[j].Oil),
          PDP_BOE: numberWithCommas(pdp[j].BOE),
          New_Wells_Gas: 0,
          New_Wells_Oil: 0,
          New_Wells_BOE: 0,
          Total_Gas: pdp[j].Gas,
          Total_Oil: pdp[j].Oil,
          Total_BOE: pdp[j].BOE
        }); }
      }
      for (var i = 0; i < myArr.length; i++) {
        for (var j = 0; j < pdp.length; j++) {
          if (myArr[i].month == pdp[j].month) {
            same[j]['New_Wells_Gas'] = numberWithCommas((Number(same[j]['New_Wells_Gas']) + Number(myArr[i].Gas)).toFixed(0));
            same[j]['New_Wells_Oil'] = numberWithCommas((Number(same[j]['New_Wells_Oil']) + Number(myArr[i].Oil)).toFixed(0));
            same[j]['New_Wells_BOE'] = numberWithCommas((Number(same[j]['New_Wells_BOE']) + Number(myArr[i].BOE)).toFixed(0));
            same[j]['Total_Gas'] = numberWithCommas((Number(same[j]['Total_Gas']) + Number(myArr[i].Gas)).toFixed(0));
            same[j]['Total_Oil'] = numberWithCommas((Number(same[j]['Total_Oil']) + Number(myArr[i].Oil)).toFixed(0));
            same[j]['Total_BOE'] = numberWithCommas((Number(same[j]['Total_BOE']) + Number(myArr[i].BOE)).toFixed(0));
          }
        }
      }
      return same;
    })
    .then(same => {
      res.json(same);
    })
    .catch((err) => next(err));
  }

});



function calculateGross(well) {
  let totals = {};
  let monthDayCount = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = Number(well.First_Production.split('/')[0]);
  let day = Number(well.First_Production.split('/')[1]);
  let year = Number(well.First_Production.split('/')[2]);
  let dayCount = (monthDayCount[month] - day) + 1;
  let nri = well.NRI;
  return TC.aggregate([
    {
      '$match': {"name": well.TYPE_CURVE}
    }
  ])
  .then(response => {
    let tc = response[0].data;
    let first = tc.slice(0, dayCount);
    let NewOil = first.reduce((a,b) => {
      return a + b.Oil;
    },0);
    let NewGas = first.reduce((a,b) => {
      return a + b.Gas;
    },0);
    if (!totals[month + '/' + monthDayCount[month] + '/' + year]) {
      totals[month + '/' + monthDayCount[month] + '/' + year] = {
        Oil: Math.round(NewOil),
        Gas: Math.round(NewGas),
        NRI: nri
      };
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
      let NewOil = first.reduce((a,b) => {
        return a + b.Oil;
      },0);
      let NewGas = first.reduce((a,b) => {
        return a + b.Gas;
      },0);
      if (!totals[month + '/' + monthDayCount[month] + '/' + year]) {
        totals[month + '/' + monthDayCount[month] + '/' + year] = {
          Oil: Math.round(NewOil),
          Gas: Math.round(NewGas),
          NRI: nri
        };
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


function calculateNet(well) {
  let totals = {};
  let monthDayCount = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = Number(well.First_Production.split('/')[0]);
  let day = Number(well.First_Production.split('/')[1]);
  let year = Number(well.First_Production.split('/')[2]);
  let dayCount = (monthDayCount[month] - day) + 1;
  let nri = well.NRI;
  return TC.aggregate([
    {
      '$match': {"name": well.TYPE_CURVE}
    }
  ])
  .then(response => {
    let tc = response[0].data;
    let first = tc.slice(0, dayCount);
    let NewOil = first.reduce((a,b) => {
      return a + b.Oil;
    },0);
    let NewGas = first.reduce((a,b) => {
      return a + b.Gas;
    },0);
    if (!totals[month + '/' + monthDayCount[month] + '/' + year]) {
      totals[month + '/' + monthDayCount[month] + '/' + year] = {
        Oil: Math.round(NewOil * nri),
        Gas: Math.round(NewGas * nri),
        NRI: nri
      };
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
      let NewOil = first.reduce((a,b) => {
        return a + b.Oil;
      },0);
      let NewGas = first.reduce((a,b) => {
        return a + b.Gas;
      },0);
      if (!totals[month + '/' + monthDayCount[month] + '/' + year]) {
        totals[month + '/' + monthDayCount[month] + '/' + year] = {
          Oil: Math.round(NewOil * nri),
          Gas: Math.round(NewGas * nri),
          NRI: nri
        };
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
