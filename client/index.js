var path = require('path');
var express = require('express');

var app = express();

app.set('port', (process.env.PORT || 3000));
app.use('/', express.static(path.join(__dirname, 'public')));

var server = app.listen(app.get('port'), function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Dodo listening at http://%s:%s', host, port);
});


/************  TEST DATA ***************/

app.get('/api/status', function(req, res) {
  res.setHeader('Cache-Control', 'no-cache');
  res.json(getOfficeStatus());
});

var getOfficeStatus = function () {
  var officeStatus = [
    {
      "name": "A-012",
      "description": "2nd office on the left by the East wall",
      "status": "available",
      "lastUpdate": "2015-10-02T18:00:20.511Z"
    },
    {
      "name": "A-013",
      "description": "2nd office on the left by the East wall",
      "status": "available",
      "lastUpdate": "2015-10-02T17:20:24.511Z"
    },
    {
      "name": "A-014",
      "description": "4th office on the left by the East wall",
      "status": "occupied",
      "lastUpdate": "2015-10-03T09:42:00.511Z"
    },
    {
      "name": "B-011",
      "description": "1st office on the left by the West wall",
      "status": "occupied",
      "lastUpdate": "2015-10-03T09:25:43.511Z"
    },
    {
      "name": "B-012",
      "description": "1st office on the right by the West wall",
      "status": "available",
      "lastUpdate": "2015-10-02T16:18:20.511Z"
    },
    {
      "name": "A-011",
      "description": "1st office on the left by the East wall",
      "status": null,
      "lastUpdate": null
    }
  ];

  // Randomize status of one office
  var statuses = [null, 'available', 'occupied'];
  var randomOfficeIndex = Math.floor((Math.random() * officeStatus.length));
  var randomStatusIndex = Math.floor((Math.random() * statuses.length));
  officeStatus[randomOfficeIndex].status = statuses[randomStatusIndex];
  officeStatus[randomOfficeIndex].lastUpdate = new Date();

  return officeStatus;
}
