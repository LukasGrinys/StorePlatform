const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./handlers');
const helpers = require('./helpers');
const config = require('./config')

// Server module object
var server = {};

// Starting the HTTP server
server.httpServer = http.createServer(function(req,res) {
    server.unifiedServer(req,res);
});
// Starting the HTTPS server
server.httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
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
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };
        // Route the request to the handler
        chosenHandler(data, function (statusCode,payload,contentType) {
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
            if (statusCode !== 200) {
                // console.log(statusCode, payloadString);
            } 
        });
    });
};

server.router = {
    '' : handlers.index,
    'public' : handlers.public,
    'orderSent' : handlers.orderSent,
    'api/orders/send' : handlers._orders.post,
    'favicon.ico' : handlers.favicon,
    'notFound' : handlers.notFound,
    'checkOrder' : handlers.checkOrder,
    'api/orders/check' : handlers._orders.check,
    'login' : handlers.admin.login,
    'dashboard' : handlers.admin.dashboard,
    'orders' : handlers.admin.orders,
    'products' : handlers.admin.products,
    'api/tokens' : handlers.tokens,
    'api/orders/view' : handlers.admin.viewOrders,
    'api/orders/update' : handlers.admin.updateOrderStatus,
    'api/orders/delete' : handlers.admin.deleteOrder,
    'api/products/load' : handlers.loadProducts,
    'api/products/adminLoad' : handlers.admin.loadProducts,
    'api/products/add' : handlers.admin.addProduct,
    'api/products/edit' : handlers.admin.editProduct,
    'api/products/delete' : handlers.admin.deleteProduct,
    'users/create' : handlers.createUser
};

// Script initializing
server.init = function() {
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function() {
        console.log("\x1b[32m","The server is listening on port "+config.httpPort);
    });
    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function() {
        console.log("\x1b[32m","The server is listening on port "+config.httpsPort);
    });
};

module.exports = server;