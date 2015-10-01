var http = require('http'),
    url = require('url');
	

function processRequest(request, response){
	response.writeHead(200, {'Content-Type': 'text/plain'});
	var params = url.parse(request.url, true).query;
	if (Object.keys(params).length > 0){
		response.write("Params:\n" + JSON.stringify(params,null,"\t"));
	} else {
		response.write(":(");
	}
	response.end();
}

http.createServer(processRequest).listen(process.env.PORT || 8080);
