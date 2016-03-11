//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://dbs:iotdbsatl@ds011399.mlab.com:11399/dbs-dod';

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    // do some work here with the database.
    var collection = db.collection('currentStatus');

    var cursor = collection.find({});

    cursor.each(function(err, doc) {
    	if (err) {
    		console.log(err);
    	} else {
    		console.log('Fetched:', doc);
    	}
    })
  }
});