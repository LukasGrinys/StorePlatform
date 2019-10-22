const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('handlers');

// Server module object
var server = {};

// Starting the HTTP server
server.httpServer = http.createServer(function(req,res) {
    server.unifiedServer(req,res);
});
// Starting the HTTPS server
server.httpsServerOptions = {
    'key' : false.readFileSync(path.join(__dirname,'/../https/bin/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/bin/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function(req,res) {
    server.unifiedServer(req,res);
});

// Unified server logic
server.unifiedServer = function(req, res) {
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');
    var queryStringObject = parsedUrl.query;
    var method = req.method.toLowerCase();
    var headers = req.headers;
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();
        // Choose the request handler
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        // Construct the data object to send to the handler
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsontoObject(buffer)
        };
        // Route the request to the handler
        chosenHandler(data,function(statusCode,payload,contenType) {
            // Determine the type of response - Default - json
            contentType = typeof(contentType) == 'string' ? contentType : 'json';
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            // Return the response parts that are content-type specific
            var payloadString = '';
            if (contentType == 'json'){
                res.setHeader('Content-Type', 'application/json');
                payload = typeof(payload) == 'object'? payload : {};
                payloadString = JSON.stringify(payload);
            }
            if (contentType == 'html'){
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof(payload) == 'string'? payload : '';
            }
            if (contentType == 'favicon'){
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'plain'){
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'css'){
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'png'){
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'jpg'){
                res.setHeader('Content-Type', 'image/jpeg');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            // Return the common response parts
            res.writeHead(statusCode);
            res.end(payloadString);
            //
            if (statusCode == 200) {
                console.log("\x1b[32m",method.toUpperCase()+" /"+trimmedPath + ' ' + statusCode);
            } else {
                console.log("\x1b[31m",method.toUpperCase()+" /"+trimmedPath + ' ' + statusCode);
            }

        });
    });
};

server.router = {
    ' ' : handlers.index,
    'public' : handlers.public,
    'store' : handlers.store
};

// Script initializing
server.init = function() {
    // Start the HTTP server
    server.httpServer.listen(3010, function() {
        console.log("\x1b[32m","The server is listening on port 3010");
    });
    // Start the HTTPS server
    server.httpsServer.listen(3011, function() {
        console.log("\x1b[32m","The server is listening on port 3011");
    });
};

module.exports = server;