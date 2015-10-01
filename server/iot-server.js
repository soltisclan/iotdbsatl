// Load the http module to create an http server.
var http = require('http');
var mysql = require("mysql");

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

var server = http.createServer(function (request, response) {
  
console.dir(request.param);

    if (request.method == 'POST') {
        console.log("POST");
        var body = '';
        request.on('data', function (data) {
            body += data;
            console.log("Partial body: " + body);
        });
        request.on('end', function () {
            console.log("Body: " + body);
        });
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end('post received');
    }
    else
    {
        console.log("GET");
        var html = '<html><body>';
        html += con.query('SELECT * FROM employees',function(err,rows){
          if(err) throw err;
	 var row = "";
          console.log('Data received from Db:' + rows.length);
	  for (var i = 0; i < rows.length; i++) {
               console.log(rows[i].name);
		row += "Row: " + rows[i];
	  };
	  return row;
        });
        html = html + "</body></html>";

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(html);

    }
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8080);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8080/");
