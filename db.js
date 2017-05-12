var db;

exports.setDB = function(newDB) {
  db = newDB;
};

exports.getDB = function() {
  return db;
};

exports.db = function() {
  if (!db) {
    db = 'testDB';
  }
  return require('monk')(`localhost/${db}`);
};
