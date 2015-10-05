var express = require('express'),
    mysql = require("mysql"),
    path = require("path"),
    url = require("url");

var app = express();

app.use(express.static(path.join(__dirname, '../client')));


var con = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE
    });

con.connect(function(err){
    if(err){
         console.log('Error ' + err);
         return;
    }
    console.log('Connection established');
 });


app.get('/api', function(request, response) {
    // var html = '{';
    var queryObject = url.parse(request.url,true).query;
    console.log("Query: " + JSON.stringify(queryObject, null, "\t"));
    console.log("Params: " + JSON.stringify(request.param, null, "\t"));
    
    if (queryObject.device == null) {
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
	var device = queryObject.device;
	var state = queryObject.occupied;
	console.log(device + ', ' + state);
	con.query('INSERT INTO cubestate (deviceId, occupied, ts) VALUES (' + device + ',' + state + ', now());', function(err, result) {
		console.log("Err: " + err + ", Res: " + result);
	});
	response.writeHead(200, {'Content-Type': 'application/json'});
        response.end("{'response':'Success'}");
    }
});

module.exports = app;
