const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

var handlers = {};

// HTML Handlers

handlers.index = function(data,callback) {
    // Reject any request that is not "GET"
    if (data.method == "get") {
        // Prepare data for interpolation
        var templateData = {
            'head-title' : 'Fictional Store - An online shop example',
            'head-description' : 'This is a description',
            'body.class' : 'index'
        };
        // Read the index template as a string
        helpers.getTemplate('shop', templateData, function(err,str) {
            if (!err && str) {
                callback(200, str, 'html');
            } else {
                callback(500,undefined,'html');
            }
        });
    } else {
        callback(405, undefined, 'html');
    }
};

// Public assets
handlers.public = function(data,callback) {
    // Reject any request that isnt a GET
    if (data.method == "get") {
      // get the filename being requested
      var trimmedAssetName = data.trimmedPath.replace('public/','').trim();
      if (trimmedAssetName.length > 0) {
        // Read in the assets data
        helpers.getStaticAsset(trimmedAssetName,function(err, data) {
          if (!err && data) {
            // Determine the content type (default to plain text)
            var contentType = 'plain';
            if (trimmedAssetName.indexOf(".css") > -1) {
              contentType = 'css';
            }
            if (trimmedAssetName.indexOf(".png") > -1) {
              contentType = 'png';
            }
            if (trimmedAssetName.indexOf(".jpeg") > -1) {
              contentType = 'jpeg';
            }
            if (trimmedAssetName.indexOf(".ico") > -1) {
              contentType = 'favicon';
            }
            //
            callback(200, data, contentType);
          } else {
            callback(404)
          }
        });
      } else {
        callback(404)
      }
    } else {
      callback(405)
    }
  };

handlers.notFound = function(data, callback) {
  callback(404);
};

// handlers.orderSent = function(data,callback);

// handlers.sendOrder = function(data, callback) {

handlers.orderSent = function(data,callback) {
  // Reject any request that isnt a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      'head.title' : 'Order was sent',
      'body.class' : 'Your order was sent'
    };
    // Read in the index template as a string
    helpers.getTemplate('orderSent', templateData, function(err,str) {
      if (!err && str) {
        callback(200,str,'html');
      } else {
        callback(500,undefined,'html');
      }
    });
  } else {
    callback(405,undefined,'html');
  }
};

handlers._orders = {};
handlers._orders.post = function(data, callback) {
  // validate all the inputs
  var fullName = typeof(data.payload.fullName) == 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf("@") > -1 ? data.payload.email : false;
  var addressLineOne = typeof(data.payload.addressLineOne) == 'string' && data.payload.addressLineOne.trim().length > 0 ? data.payload.addressLineOne : false;
  var addressLineTwo = typeof(data.payload.addressLineTwo) == 'string' ? data.payload.addressLineTwo : false;
  var agreement = typeof(data.payload.agreement) == 'boolean' ? data.payload.agreement : false;
  var order = typeof(data.payload.order) == 'object' && data.payload.order.length > 0 && data.payload.order.length > 0 ? data.payload.order : false;
  if (fullName && email && addressLineOne && agreement && order) {
    // Create a random ID for the order
    var orderFileName = helpers.createRandomString(20);
    // Create the order object with order and customer info
    var orderObject = {
      'fullName' : fullName,
      'email' : email,
      'address' : [addressLineOne, addressLineTwo],
      'order' : order,
      'orderID' : helpers.createOrderId(10)
    };
    // Save the orderObject into order folder
    _data.create('orders', orderFileName, orderObject,function(err) {

      if (!err) {
      // return the data about the new order
        callback(200, orderObject);
      } else {
        callback(500, {'Error' : 'Could not create new order'});
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required inputs or inputs are invalid'});
  }
};
  
module.exports = handlers;