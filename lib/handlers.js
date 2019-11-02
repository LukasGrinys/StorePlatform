const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const fs = require('fs');

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

handlers.checkOrder = function(data,callback) {
  if (data.method == "get") {
    var templateData = {};
    helpers.getTemplate('checkOrder', templateData,function(err,str) {
      if (!err && str) {
        callback(200, str, 'html');
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
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
    // Create an order ID, which would serve as file name
    var orderId = helpers.createOrderId(10);
    // Create the order object with order and customer info
    var orderObject = {
      'fullName' : fullName,
      'email' : email,
      'address' : [addressLineOne, addressLineTwo],
      'order' : order,
      'orderId' : orderId,
      'time' : Date.now(),
      'status' : 'Waiting for payment'
    };
    var totalPrice = 0;
    for (let i = 0; i < order.length; i++) {
      let quant = order[i].quantity;
      let singlePrice = order[i].price.replace("$","");
      totalPrice += quant * singlePrice;
    };
    totalPrice = "$" + totalPrice;
    // Write the price correctly
    if (totalPrice.indexOf(".") > -1) {
      var decimalPart = totalPrice.slice(totalPrice.indexOf(".") + 1, totalPrice.length);
      if (decimalPart.length == 1) {
        totalPrice += "0";
      }
    } else {
      totalPrice += ".00";
    }
    // Save the orderObject into order folder
    _data.create('orders', orderId, orderObject,function(err) {
      if (!err) {
        // Send e-mail with payment details and order ID
        helpers.sendEmail(orderObject.email, orderObject.orderId, totalPrice);
        callback(200, orderObject);
      } else {
        callback(500, {'Error' : 'Could not create new order'});
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required inputs or inputs are invalid'});
  }
};

// To get the status of the order
handlers._orders.check = function(data, callback) {
  var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 10 ? data.queryStringObject.orderId.trim() : false;
  if (orderId) {
    // lookup the order
    _data.read('orders',orderId,function(err, orderData) {
      if(!err && orderData) {
        callback(200, orderData);
      } else {
        callback(404, {'Error': 'No particular order was found'} )
      }
    }); 
  } else {
    callback(400, { 'Error' : 'Missing required field' });
  }
};

// ADMIN section
handlers.admin = {};
handlers._tokens = {};
handlers.tokens = function(data,callback) {
  var acceptableMethods = ['post','get','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Employee login page asset
handlers.admin.login = function(data,callback) {
  if (data.method == "get") {
    var templateData = {};
    helpers.getTemplate('employeeLogin', templateData,function(err,str) {
      if (!err && str) {
        callback(200, str, 'html');
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};
// Employee dashboard page:
handlers.admin.dashboard = function(data,callback) {
  if (data.method == "get") {
    var templateData = {};
    helpers.getTemplate('employeeDashboard', templateData,function(err,str) {
      if (!err && str) {
        callback(200, str, 'html');
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Admin orders page:
handlers.admin.orders = function(data,callback) {
  if (data.method == "get") {
    var templateData = {};
    helpers.getTemplate('orders', templateData,function(err,str) {
      if (!err && str) {
        callback(200, str, 'html');
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Loading the actual orders into table:
handlers.admin.viewOrders = function(data, callback) {
  var username = data.payload.username;
  fs.readdir('./.data/orders', function(err, files) {
    if (!err && files) {
      // object should be formed
      let len = files.length;
      var ordersArray = [];
      for (let i = 0; i < files.length; i++) {
        fs.readFile('./.data/orders/'+ files[i],'utf-8',function(err, data) {
          if (!err && data) {
            ordersArray.push(data);
            if (ordersArray.length == len) {
              callback(200, ordersArray);
            };
          } else {
            console.log("Something went wrong");
            callback(404, {'Error' : err});
          }
        })
      };
    } else {
      callback(err + '. No order files were found');
    }
  });
};

handlers.admin.updateOrderStatus = function(data, callback) {
  var orderId = typeof(data.payload.orderId) == 'string' && data.payload.orderId.trim().length == 10 ? data.payload.orderId.trim() : false;
  var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username.trim() : false;
  var tokenId = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
  if (orderId) {
    handlers._tokens.verifyToken(tokenId, username, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read('orders',orderId, function(err, data) {
          if (!err && data) {
            var newData = data;
            var orderStatus = data.status;
            if (orderStatus == "Waiting for payment") {
              newData.status = "Payment received. Processing"
            } else if (orderStatus == "Payment received. Processing") {
              newData.status = "Shipped";
            };
            _data.update('orders',orderId,newData, function(err) {
              if (!err) {
                callback(200, {'Success' : 'Order status was updated'});
              } else {
                callback(500, {'Error' : 'Could not update order status'});
              }
            })
          } else {
            callback(404, {'Error' : 'Data not found'});
          }
        })
      } else {
        callback(403, {'Error' : 'Invalid or unspecified token'});
      }
    });
  } else {
    callback(403, {'Error' : 'Invalid order ID'});
  }
}

handlers.admin.deleteOrder = function(data, callback) {
  var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 10 ? data.queryStringObject.orderId.trim() : false;
  var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username.trim() : false;
  if (orderId) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, username, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.delete('orders',orderId,function(err) {
          if (!err) {
            callback(200, {'Success' : 'Order successfully deleted'});
          } else {
            callback(500, {'Error' : 'Could not delete the order'});
          }
        })
      } else {
        callback(403, {'Error' : 'Missing token in the header or the header has expired'});
      }
    });
  } else {
    callback(400, {'Error' : 'Bad OrderID'});
  }
}

// Employee login and session create
handlers._tokens.post = function(data,callback) {
  var username = typeof(data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (username && password) {
    // lookup the employee
    _data.read('employees',username,function(err,userData) {
      if (!err && userData) {
        // Hash the sent password and compare it to the password stored in the user object
        // var hashedPassword = helpers.hash(password);
        // if (hashedPassword == userData.hashedPassword) 
        if (password == userData.password) {
          // if valid, create a new token with a random name. Set expiration data 1 hour in the future
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'username' : username,
            'id' : tokenId,
            'expires' : expires
          };
          // store the token
          _data.create('tokens',tokenId,tokenObject,function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500,{'Error' : 'Could not create a new token'});
            }
          });
        } else {
          callback(400, {'Error' : 'Password did not match'});
        };
      } else {
        callback(400, {'Error' : 'Could not find the specified user'})
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};

// Token renewal - put
handlers._tokens.put = function(data,callback) {
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    _data.read('tokens',id,function(err, tokenData) {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update('tokens',id,tokenData,function(err){
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error' : 'Could not update the token expiration'});
            }
          });
        } else {
          callback(400, {'Error' : 'The token has already expired'});
        };
      } else {
        callback(400, {'Error' : 'Specified token does not exist'});
      };
    });
  } else {
    callback(400, {'Error' : 'Missing required fields or the fields are invalid'})
  }
};

// Signing out;
handlers._tokens.delete = function(data,callback) {
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, function(err,data) {
      if (!err && data) {
        _data.delete('tokens',id,function(err){
          if(!err) {
            callback(200);
          } else {
            callback(500, {'Error' : 'Could not delete specified token'});
          }
        });
      } else {
        callback(400, { 'Error' : 'Could not find the specified token'});
      };
    });
  } else {
    callback(400, { 'Error' : 'Missing required field'});
  };
};

handlers._tokens.get = function(data,callback) {
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, function(err,tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      };
    });
  } else {
    callback(400, { 'Error' : ''});
  };
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, username, callback) {
  // lookup the token
  _data.read('tokens',id, function(err, tokenData) {
    if (!err && tokenData) {
      if(tokenData.username == username && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  })
};


module.exports = handlers;
