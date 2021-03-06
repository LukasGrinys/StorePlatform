const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./handlers');
const Helpers = require('./helpers');
const Stripe = require('./stripe');
const config = require('./config');


const stripe = new Stripe();
const helpers = new Helpers();

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
        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };
        chosenHandler(data, function (statusCode,payload,contentType) {
            contentType = typeof(contentType) == 'string' ? contentType : 'json';
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
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
            res.writeHead(statusCode);
            res.end(payloadString);
            if (statusCode !== 200) {
                console.log(statusCode, payloadString);
            } 
        });
    });
};

server.router = {
    '' : handlers.index,
    'public' : handlers.public,
    'notFound' : handlers.notFound,
    'checkorder' : handlers.checkOrder,
    'login' : handlers.loginPage,
    'dashboard' : handlers.dashboardPage,
    'orders' : handlers.ordersPage,
    'products' : handlers.productsPage,
    'users' : handlers.usersPage,
    'favicon.ico' : handlers.favicon,
    'api/orders' : handlers.orders,
    'api/tokens' : handlers.tokens,
    'api/products' : handlers.products,
    'api/users' : handlers.users,
    'api/stripeKeys' : stripe.sendStripeKeys,
};

server.init = function() {
    server.httpServer.listen(config.httpPort, function() {
        console.log("The HTTP server is listening on port "+config.httpPort);
    });
    // server.httpsServer.listen(config.httpsPort, function() {
    //     console.log("The HTTPS server is listening on port "+config.httpsPort);
    // });
};

module.exports = server;