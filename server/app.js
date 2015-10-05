var express = require('express');
var mysql = require("mysql");
var path = require('path');
var url = require("url");

var app = express();

app.use(express.static(path.join(__dirname, 'public')));


var con = mysql.createConnection({
   host: "dbsiotdb.ctdx7umcipoo.us-west-2.rds.amazonaws.com",
   user: "dbs",
   password: "dbsatlanta",
   database: "iot"
 });

con.connect(function(err){
    if(err){
         console.log('Error ' + err);
         return;
    }
    console.log('Connection established');
 });


app.get('/api', function(request, response) {
    var html = '{';

    console.dir(request.param);

    var queryObject = url.parse(request.url,true).query;
    console.log(queryObject);

    if (queryObject['device'] == null) {
	con.query('SELECT * FROM cubestate limit 1000;',function(err, rows){
		// for(var i =0; i<rows.length; i++) {
		// 	html += "{'deviceID':'" + rows[i].deviceID + "','occupied':'" + rows[i].occupied + "','ts':' " +rows[i].ts + "'},\n";
		// }
  	//       	html += '}';
		// response.writeHead(200, {'Content-Type': 'application/json'});
    //     	response.end(html);
    response.setHeader('Cache-Control', 'no-cache');
    response.json(rows);
	});
    }
    else
    {
	var device = queryObject['device'];
	var state = queryObject['occupied']
	console.log(device + ', ' + state);
	con.query('INSERT INTO cubestate (deviceId, occupied, ts) VALUES (' + device + ',' + state + ', now());', function(err, result) {
		console.log("Err: " + err + ", Res: " + result);
	});
	response.writeHead(200, {'Content-Type': 'application/json'});
        response.end("{'response':'Success'}");
    }
});

module.exports = app;
