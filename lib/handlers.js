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

handlers.index = (data,callback) => { getPublicPage('shop', data, callback); };
handlers.checkOrder = (data,callback) => { getPublicPage('checkOrder', data, callback); }
handlers.dashboardPage = (data,callback) => { getAdminPage('employeeDashboard', data, callback)};
handlers.ordersPage = (data,callback) => { getAdminPage('orders', data, callback);};
handlers.productsPage = (data, callback) => { getAdminPage('products', data, callback)}
handlers.notFound = (data, callback) => { getPublicPage('notFound', data, callback)};
handlers.loginPage = (data,callback) => {
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

handlers._orders.delete = (data, callback) => {
  let cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
    if (isAuth) {
      let orderId = data.queryStringObject.id;
      orderId = orderId.trim().length === 10 && typeof(orderId) === "string" ? orderId : false;
      if (orderId) {
        _data.delete('orders', orderId, (err) => {
          if (!err) {
            callback(200, { message : "Order was succesfully deleted"})
          } else {
            callback(500, { message : "Could not delete order"})
          }
        })
      } else {
        callback(400, { message : "Bad request"})
      }
    } else {
      callback(403, { message : msg})
    }
  })
}

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
handlers.products = (data,callback) => {
  const acceptableMethods = ['post','get','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._products[data.method](data,callback);
  } else {
    callback(405);
  }
};
handlers._products = {};

handlers._products.get = (data, callback) => {
  if (data.queryStringObject.itemId) {
    let itemId = data.queryStringObject.itemId;
    itemId = itemId.trim().length === 3 && typeof(itemId) === 'string' ? itemId.trim() : false;
    if (itemId) {
      let cookie = data.headers.cookie;
      userAuth(cookie, (isAuth, msg) => {
        if (isAuth) {
          _data.read('products', itemId, (err, data) => {
            if (!err && data) {
              callback(200, data);
            } else {
              callback(404, { message : "Product not found"})
            }
          })
        } else {
          calllback(403, { message : msg})
        }
      })
    }
  } else {
    fs.readdir('./.data/products', function(err, files) {
      if (!err && files) {
        let productsArray = [];
        for (let i = 0; i < files.length; i++) {
          fs.readFile('./.data/products/'+ files[i],'utf-8',function(err, data) {
            if (!err && data) {
              const obj = JSON.parse(data);
              productsArray.push(obj);
              if (productsArray.length === files.length) {
                callback(200, productsArray);
              };
            } else {
              callback(404, { message : err});
            }
          })
        };
      } else {
        callback(404, { message : err});
      }
    });
  } 
};

handlers._products.post = (data, callback) => {
    let cookie = data.headers.cookie;
    userAuth(cookie, (isAuth, msg) => {
      if (isAuth) {
        let body = data.payload;
        // id name category imagesrc alttitle desc price time of changes last changes by
        let title = body.title.trim().length > 0 && typeof(body.title) === "string" ? body.title.trim() : false;
        let category = body.category.trim().length > 0 && typeof(body.category) === "string" ? body.category.trim() : false;
        let imageSrc = body.imageURL.trim().length > 0 && typeof(body.imageURL) === "string" ? body.imageURL.trim() : false;
        let description = body.description.trim().length > 0 && typeof(body.description) === "string" ? body.description.trim() : false;
        let price = body.price !== 0 && typeof(body.price) === "number" ? body.price : false;
        if (title && category && imageSrc && description && price) {
          // Generate ID
          fs.readdir('./.data/products', (err, files) => {
            const len = files.length;
            let numArr = [];
            for (let i = 0; i < len; i++) {
              let str = files[i].replace(".json", "");
              let num = Number(str);
              numArr.push(num);
              if (numArr.length === len) {
                let newIdNum = 1;
                while (numArr.indexOf(newIdNum) > -1) {
                  newIdNum++;
                }
                let newId = helpers.generateProductId(newIdNum);
                let timeOfChanges = Date.now();
                let parsedAuth = helpers.parseJsonToObject(cookie).auth;
                let lastChangesBy = helpers.parseJsonToObject(parsedAuth).username;
                const dataObj = {
                  id : newId,
                  name : title,
                  category : category,
                  imageSrc : imageSrc,
                  altTitle : title,
                  description : description,
                  price: price,
                  timeOfChanges : timeOfChanges,
                  lastChangesBy : lastChangesBy
                };
                let fileName = newId.replace("#", "");
                _data.create('products', fileName, dataObj, (err) => {
                  if (!err) {
                    callback(200, { message : "New product was added successfuly"})
                  } else {
                    callback(500, { message : "There was an error trying to add new product. Try again later"})
                  }
                })
              }
            }
          })
        } else {
          callback(400, { message : "Bad request"} );
        }
      } else {  
        callback(403, { message : "Action not allowed. Log in again"})
      }
    });
}

handlers._products.put = (data, callback) => {
  let cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
      if (isAuth) {
        let body = data.payload;
        console.log(body);
        let title = body.title.trim().length > 0 && typeof(body.title) === "string" ? body.title.trim() : false;
        let category = body.category.trim().length > 0 && typeof(body.category) === "string" ? body.category.trim() : false;
        let imageSrc = body.imageURL.trim().length > 0 && typeof(body.imageURL) === "string" ? body.imageURL.trim() : false;
        let description = body.description.trim().length > 0 && typeof(body.description) === "string" ? body.description.trim() : false;
        let price = body.price !== 0 && typeof(body.price) === "number" ? parseFloat(body.price) : false;
        let itemId = body.itemId.trim().length === 4 && typeof(body.itemId) === 'string' ? body.itemId.trim() : false;
        if (title && category && imageSrc && description && price && itemId) {
            let timeOfChanges = Date.now();
            let parsedAuth = helpers.parseJsonToObject(cookie).auth;
            let lastChangesBy = helpers.parseJsonToObject(parsedAuth).username;
            const dataObj = {
                  id : itemId,
                  name : title,
                  category : category,
                  imageSrc : imageSrc,
                  altTitle : title,
                  description : description,
                  price: price,
                  timeOfChanges : timeOfChanges,
                  lastChangesBy : lastChangesBy
            };
            let itemname = itemId.replace("#","");
            _data.update('products', itemname, dataObj, (err) => {
              if (!err) {
                callback(200, { message : "Product updated successfuly"})
              } else {
                callback(500, { message : "There was an error. Try again later"})
              }
            })
        } else {
          callback(400, { message : "Bad request"} );
        }
      } else {  
        callback(403, { message : msg})
      }
  })
}

handlers._products.delete = (data, callback) => {
  let cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
    if (isAuth) {
      let itemId = data.queryStringObject.id;
      itemId = itemId.trim().length === 3 && typeof(itemId) === "string" ? itemId.trim() : false;
      if (itemId) {
        _data.delete('products', itemId, (err) => {
          if (!err) {
            callback(200, { message : "Product deleted successfully"})
          } else {
            callback(500, { message : err})
          }
        })
      }
    } else {
      callback(403, { message : msg })
    }
  })
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
