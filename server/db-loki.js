var path = require("path"),
  Loki = require('lokijs'),
  loki = new Loki(__dirname + '/../db/statuses.json', {
    autoload: true,
    autoloadCallback: initializeDb
  });

var db = {};

db.getCurrentStatus = function(size, offset) {
  // size: number of results to limit results to
  // offset: starting position to return results of
  var currentStatuses = loki.getCollection('currentStatus');
  return currentStatuses.chain().simplesort('deviceId').offset(offset).limit(size).data();
}

db.getHistory = function(size, offset) {
  // size: number of results to limit results to
  // offset: starting position to return results of
  var statusHistory = loki.getCollection('statusHistory');
  return statusHistory.chain().simplesort('$loki', true).offset(offset).limit(size).data();
}

db.upsertStatus = function(deviceId, isOccupied) {
  var devices = loki.getCollection('currentStatus');
  var device = devices.findOne({'deviceId' : deviceId});
  if(device == null) {
    // Insert
    var newDevice = {
      deviceId: deviceId,
      isOccupied: isOccupied,
      timestamp: new Date()
    };
    devices.insert(newDevice);
    console.log('Inserted ' + JSON.stringify(newDevice));
  }
  else {
    // Update
    device.isOccupied = isOccupied;
    device.timestamp = new Date();
    console.log('Updated status of ' + deviceId + ' to ' + isOccupied);
  }

  insertHistory(deviceId, isOccupied);

  loki.saveDatabase(function() {
    console.log('DB saved');
  });
}

function insertHistory(deviceId, isOccupied) {
  // If status has changed since the last update from this device, calculate
  // the time span between status changes, otherwise or if this is a new
  // device, just insert a history record
  var statusHistory = loki.getCollection('statusHistory');
  var timeSince = 0;
  var lastUpdate = statusHistory.chain().find({'deviceId': deviceId}).simplesort('timestamp', true).limit(1).data();

  if(lastUpdate.length > 0 && lastUpdate[0].timestamp != null && lastUpdate[0].isOccupied != isOccupied) {
    timeSince = new Date() - new Date(lastUpdate[0].timestamp);
  }

  var historyEntry = {
    deviceId: deviceId,
    timestamp: new Date(),
    isOccupied: isOccupied,
    timeSince: timeSince
  };
  statusHistory.insert(historyEntry);
}

// If any of the collections we need does not exist in the database,
// create them
function initializeDb() {
  var collections = ['currentStatus', 'statusHistory'];
  for (var i in collections) {
    if(loki.listCollections().filter(function(dbCollection) {
      return dbCollection.name == collections[i];
    }).length == 0) {
      loki.addCollection(collections[i]);
      console.log('Created collection ' + collections[i]);
    }
  }
  loki.saveDatabase(function() {
    console.log('DB initialized');
    console.log(loki.listCollections());
  });
}

module.exports = db;
