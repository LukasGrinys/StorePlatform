const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const fs = require('fs');


if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

var handlers = {};
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

// HTML Handlers
getPublicPage = (page, data, callback) => {
  if (data.method === "get") {
    helpers.getTemplate(page, null, function(err,str) {
        if (!err && str) {
            callback(200, str, 'html');
        } else {
            callback(500,undefined,'html');
        }
    });
  } else {
      callback(405, undefined, 'html');
  }
}

userAuth = (cookie, callback) => {
  const obj = helpers.parseJsonToObject(cookie);
  const token = helpers.parseJsonToObject(obj.auth);
  _data.read('tokens', token.id, (err,data) => {
    if (!err && data) {
      if (data.expires > Date.now() && token.username == data.username) {
        callback(true, "Authenticated")
      } else {
        callback(false, "Token expired")
      }
    } else {
      callback(false, "Token not found")
    }
  })
}

getAdminPage = (page, data, callback) => {
  if (data.method === "get") {
    let str = data.headers.cookie;
    userAuth(str, (isAuth, msg) => {
      if (isAuth) {
        var templateData = {};
        helpers.getTemplate(page, templateData,function(err,str) {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        helpers.getTemplate('employeeLogin', null, function(err,str) {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      }
    })
  } else {
    callback(405, undefined, 'html');
  } 
}

handlers.index = function(data,callback) { getPublicPage('shop', data, callback); };
handlers.checkOrder = function(data,callback) { getPublicPage('checkOrder', data, callback); }
handlers.dashboardPage = function(data,callback) { getAdminPage('employeeDashboard', data, callback)};
handlers.ordersPage = function(data,callback) { getAdminPage('orders', data, callback);};
handlers.notFound = function(data, callback) { getPublicPage('notFound', data, callback)};
handlers.loginPage = function(data,callback) {
  if (data.method === "get") {
    let str = data.headers.cookie;
    userAuth(str, (isAuth, msg) => {
      if (isAuth) {
        var templateData = {};
        helpers.getTemplate('employeeDashboard', templateData,function(err,str) {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        helpers.getTemplate('employeeLogin', null, function(err,str) {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      }
    })
  } else {
    callback(405, undefined, 'html');
  }
};

// API Handlers
handlers.orders = function(data,callback) {
  var acceptableMethods = ['post','get','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._orders[data.method](data,callback);
  } else {
    callback(405);
  }
};
handlers._orders = {};

handlers._orders.post = (data, callback) => {
  const tokenId = data.payload.tokenId;
  fs.readdir('./.data/products', function(err, files) {
    if (!err && files) {
      let allProducts = [];
      for (let i = 0; i < files.length; i++) {
        fs.readFile('./.data/products/'+ files[i],'utf-8',function(err, info) {
          if (!err && info) {
            let item = JSON.parse(info);
            allProducts.push(item);
            if (allProducts.length === files.length) {
              let totalPrice = 0;
              let orderData = [];
              const orderInfo = data.payload.orderInfo;
              for (let i = 0; i < orderInfo.length; i++) {
                let item = data.payload.orderInfo[i];
                totalPrice += parseFloat(item.quantity * item.price);
                orderData.push([item.id, item.quantity]);
              }
              stripe.charges.create({
                amount: totalPrice * 100,
                source: tokenId,
                currency: 'usd'
              }).then( () => {
                const orderId = helpers.createOrderId(10);
                const obj = {
                  orderData: orderData,
                  totalPrice: totalPrice,
                  tokenId: tokenId,
                  orderId: orderId,
                  firstName: data.payload.firstName,
                  lastName: data.payload.lastName,
                  address: data.payload.address,
                  email: data.payload.email,
                  orderStatus: "Pending"
                };
                _data.create('orders', orderId, obj, function(err) {
                  if (!err) {
                    callback(200, {'Success' : 'Your purchase was successful', orderId : orderId, success : true});
                  } else {
                    callback(500, { errMessage : 'Could not create new order', success: false});
                  }
                })
              }).catch( (err) => {
                callback(500, { errMessage: err, success: false})
              })
            };
          } else {
            callback(404, {'Error' : err});
          }
        })
      };
    } else {
      callback(404, {'Error' : err});
    }
  });  
}

handlers._orders.get = (data, callback) => {
  if (data.queryStringObject.orderId) {
    const orderId = data.queryStringObject.orderId;
    console.log(orderId);
    _data.read('./orders', orderId, (err, data) => {
      if (!err && data) {
        const orderStatus = data.orderStatus;
        callback(200, { message: `Your order status: ${orderStatus}`})
      } else {
        callback(404, { message : 'Order not found'})
      }
    })
  } else {
    let str = data.headers.cookie;
    userAuth(str, (isAuth, msg) => {
      if (isAuth) {
        fs.readdir('./.data/orders', function(err, files) {
          if (!err && files) {
            const len = files.length;
            let ordersArray = [];
            for (let i = 0; i < files.length; i++) {
              fs.readFile('./.data/orders/'+ files[i],'utf-8',function(err, data) {
                if (!err && data) {
                  ordersArray.push(data);
                  if (ordersArray.length === len) {
                    callback(200, ordersArray);
                  };
                } else {
                  callback(404, {'Error' : err});
                }
              })
            };
          } else {
            callback(err, 'No order files were found');
          }
        });
      };
    });
  }
}

handlers._orders.put = (data, callback) => {
  const cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
    if (isAuth) {
      let orderId = typeof(data.payload.orderId) === 'string' && data.payload.orderId.trim().length == 10 ? data.payload.orderId.trim() : false;
      _data.read('orders',orderId, (err, data) => {
        if (!err && data) {
            let newData = data;
            let orderStatus = data.orderStatus;
            if (orderStatus === "Pending") {
              newData.orderStatus = "Confirmed"
            } else if (orderStatus === "Confirmed") {
              newData.orderStatus = "Shipped";
            };
            _data.update('orders', orderId, newData, function(err) {
              if (!err) {
                callback(200, {'Success' : 'Order status was updated'});
              } else {
                callback(500, { message: 'Could not update the order status'});
              }
            })
          } else {
            callback(404, { message: 'Data not found'});
          }
        })
    } else {
      callback(403, { message: 'Action not allowed'})
    }
  })
};
// // To get the status of the order
// handlers._orders.check = function(data, callback) {
//   var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 10 ? data.queryStringObject.orderId.trim() : false;
//   if (orderId) {
//     // lookup the order
//     _data.read('orders',orderId,function(err, orderData) {
//       if(!err && orderData) {
//         callback(200, orderData);
//       } else {
//         callback(404, {'Error': 'No particular order was found'} )
//       }
//     }); 
//   } else {
//     callback(400, { 'Error' : 'Missing required field' });
//   }
// };

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

// handlers.admin.updateOrderStatus = function(data, callback) {
//   var orderId = typeof(data.payload.orderId) == 'string' && data.payload.orderId.trim().length == 10 ? data.payload.orderId.trim() : false;
//   var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username.trim() : false;
//   var tokenId = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
//   if (orderId) {
//     handlers._tokens.verifyToken(tokenId, username, function(tokenIsValid) {
//       if (tokenIsValid) {
//         _data.read('orders',orderId, function(err, data) {
//           if (!err && data) {
//             var newData = data;
//             var orderStatus = data.status;
//             if (orderStatus == "Waiting for payment") {
//               newData.status = "Payment received. Processing"
//             } else if (orderStatus == "Payment received. Processing") {
//               newData.status = "Shipped";
//             };
//             _data.update('orders',orderId,newData, function(err) {
//               if (!err) {
//                 callback(200, {'Success' : 'Order status was updated'});
//               } else {
//                 callback(500, {'Error' : 'Could not update order status'});
//               }
//             })
//           } else {
//             callback(404, {'Error' : 'Data not found'});
//           }
//         })
//       } else {
//         callback(403, {'Error' : 'Invalid or unspecified token'});
//       }
//     });
//   } else {
//     callback(403, {'Error' : 'Invalid order ID'});
//   }
// }

// handlers.admin.deleteOrder = function(data, callback) {
//   var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 10 ? data.queryStringObject.orderId.trim() : false;
//   var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username.trim() : false;
//   if (orderId) {
//     var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
//     handlers._tokens.verifyToken(token, username, function(tokenIsValid) {
//       if (tokenIsValid) {
//         _data.delete('orders',orderId,function(err) {
//           if (!err) {
//             callback(200, {'Success' : 'Order successfully deleted'});
//           } else {
//             callback(500, {'Error' : 'Could not delete the order'});
//           }
//         })
//       } else {
//         callback(403, {'Error' : 'Missing token in the header or the header has expired'});
//       }
//     });
//   } else {
//     callback(400, {'Error' : 'Bad OrderID'});
//   }
// }

// Admin login and session create
handlers._tokens.post = function(data,callback) {
  var username = typeof(data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (username && password) {
    // lookup the employee
    _data.read('employees',username,function(err,userData) {
      if (!err && userData) {
        // Hash the sent password and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
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

// Token update
handlers._tokens.put = function(data,callback) {
  let id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  let extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;
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

// ADMIN - PRODUCT EDITING
// Get template
handlers.admin.products = function(data,callback) {
  if (data.method == "get") {
    var templateData = {};
    helpers.getTemplate('products', templateData,function(err,str) {
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

handlers.loadProducts = function(err, callback) {
  fs.readdir('./.data/products', function(err, files) {
    if (!err && files) {
      // Form the files array
      var productsArray = [];
      for (let i = 0; i < files.length; i++) {
        fs.readFile('./.data/products/'+ files[i],'utf-8',function(err, data) {
          if (!err && data) {
            var obj = JSON.parse(data);
            productsArray.push(obj);
            if (productsArray.length == files.length) {
              callback(200, productsArray);
            };
          } else {
            callback(404, {'Error' : err});
          }
        })
      };
    } else {
      callback(404, {'Error' : err});
    }
  });
};

handlers.admin.loadProducts = function(data, callback) {
  var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username : false;
  var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid : false;
  if (username && tokenId) {
    handlers._tokens.verifyToken(tokenId, username, function(tokenIsValid) {
      if (tokenIsValid) {
        fs.readdir('./.data/products', function(err, files) {
            if (!err && files) {
              // Form the files array
              var productsArray = [];
              for (let i = 0; i < files.length; i++) {
                fs.readFile('./.data/products/'+ files[i],'utf-8',function(err, data) {
                  if (!err && data) {
                    var obj = JSON.parse(data);
                    productsArray.push(obj);
                    if (productsArray.length == files.length) {
                      callback(200, productsArray);
                    };
                  } else {
                    callback(404, {'Error' : err});
                  }
                })
              };
            } else {
              callback(404, {'Error' : err});
            }
          });
      } else {
        callback(403, {'Error' : 'Invalid token'});
      }
    });
  } else {
    callback(400, {'Error' : 'Invalid data sent with headers'});
  }
}

handlers.admin.addProduct = function(data, callback) {
  var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username.trim() : false;
  var tokenid = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
  if (username && tokenid) {
    handlers._tokens.verifyToken(tokenid, username, function(tokenIsValid) {
      if (tokenIsValid) {
        // Form product details
        var productId = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
        var productName = typeof(data.payload.productName) == 'string' && data.payload.productName.trim().length > 0 ? data.payload.productName.trim() : false;
        var category = typeof(data.payload.category) == 'string' && data.payload.category.trim().length > 0 ? data.payload.category.trim() : false;
        var imageSrc = typeof(data.payload.imageSrc) == 'string' && data.payload.imageSrc.trim().length > 0 ? data.payload.imageSrc.trim() : false;
        var altName = typeof(data.payload.altName) == 'string' && data.payload.altName.trim().length > 0 ? data.payload.altName.trim() : false;
        var description = typeof(data.payload.description) == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : false;
        var price = typeof(data.payload.price) == 'string' && data.payload.price.trim().length > 0 ? data.payload.price.trim() : false;
        if (productId && productName && category && imageSrc && altName && description && price) {
          // Create a file with new product
          var itemObject = {
            "id" : productId,
            "name" : productName,
            "category" : category,
            "imageSrc" : imageSrc,
            "altTitle" : altName,
            "description" : description,
            "price" : price,
            "timeOfChanges" : Date.now(),
            "lastChangesBy" : username
          }
          var filename = productId.replace("#","");
          _data.create('products', filename, itemObject, function(err) {
            if (!err) {
              callback(200, {'Success' : 'New product was successfully added'});
            } else {
              callback(500, {'Error' : 'Could not create new product file'});
            }
          })
        } else {
          callback(400, {'Error' : 'Invalid data'});
        }
        
      } else {
        callback(403, {'Error' : 'Session expired'})
      }
    });
  } else {
    callback(400, {'Error' : 'Invalid token sent with headers'})
  }
}

handlers.admin.editProduct = function(data, callback) {
  var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username.trim() : false;
  var tokenid = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
  if (username && tokenid) {
    handlers._tokens.verifyToken(tokenid, username, function(tokenIsValid) {
      if (tokenIsValid) {
        // Form product details
        var productId = typeof(data.payload.productId) == 'string' && data.payload.productId.trim().length > 0 ? data.payload.productId.trim() : false;
        var productName = typeof(data.payload.productName) == 'string' && data.payload.productName.trim().length > 0 ? data.payload.productName.trim() : false;
        var category = typeof(data.payload.productCategory) == 'string' && data.payload.productCategory.trim().length > 0 ? data.payload.productCategory.trim() : false;
        var altName = typeof(data.payload.altName) == 'string' && data.payload.altName.trim().length > 0 ? data.payload.altName.trim() : false;
        var description = typeof(data.payload.productDescription) == 'string' && data.payload.productDescription.trim().length > 0 ? data.payload.productDescription.trim() : false;
        var price = typeof(data.payload.productPrice) == 'string' && data.payload.productPrice.trim().length > 0 ? data.payload.productPrice.trim() : false;
        if (productId && productName && category && altName && description && price) {
          // Form new data object
          var filename = productId.replace("#","");
          var obj = {
            "id" : productId,
            "name" : productName,
            "category" : category,
            "imageSrc" : "Items/item"+filename+".jpg",
            "altTitle" : altName,
            "description" : description,
            "price" : price,
            "timeOfChanges" : Date.now(),
            "lastChangesBy" : username
          }
          _data.update('products', filename, obj, function(err){
            if (!err) {
              callback(200, {'Success' : 'Product information was updated successfully'})
            } else {
              callback(500, {'Error' : err});
            }
          })
        } else {
          callback(400, {'Error' : 'Invalid data'});
        }
        
      } else {
        callback(403, {'Error' : 'Session expired'})
      }
    });
  } else {
    callback(400, {'Error' : 'Invalid token sent with headers'})
  }
}

handlers.admin.deleteProduct = function(data, callback) {
  var username = typeof(data.headers.username) == 'string' && data.headers.username.trim().length > 0 ? data.headers.username.trim() : false;
  var tokenid = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
  if (username && tokenid) {
    handlers._tokens.verifyToken(tokenid, username, function(tokenIsValid) {
      if (tokenIsValid) {
        var productId = typeof(data.payload.productId) == 'string' && data.payload.productId.trim().length > 0 ? data.payload.productId.trim() : false;
        if (productId) {
          _data.delete('products', productId.replace("#",""), function(err) {
            if (!err) {
              callback(200, {'Success' : 'Product was deleted'});
            } else {
              callback(500, err);
            }
          });
        }
      } else {
        callback(403, {'Error' : 'Session expired'});
      }
    });
  } else {
    callback(400, {'Error' : 'Invalid headers'});
  }
}

handlers.createUser = function(data, callback) {
  var username = typeof(data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : false;
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (username && firstName && lastName && password) {
    // make sure that the user doesnt already exists
    _data.read('users', username, function(err,data) {
      if (err) {
        var hashedPassword = helpers.hash(password);
        // create the user object
        if (hashedPassword) {        
          var userObject = {
            'username' : username,
            'firstName' : firstName,
            'lastName' : lastName,
            'hashedPassword' : hashedPassword
          };
          // store the user
          _data.create('employees', username, userObject,function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not create new user'});
            };
          });
        } else {
          callback(500, {'Error' : "Could not hash the user\'s password"});
        };
      } else {
        callback(400, {'Error' : 'User with that username already exists'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
}
module.exports = handlers;
