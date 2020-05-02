const _data = require('./data');
const helpers = require('./helpers');
const fs = require('fs');

if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

var handlers = {};
// Public assets
handlers.public = function(data,callback) {
    if (data.method == "get") {
      var trimmedAssetName = data.trimmedPath.replace('public/','').trim();
      if (trimmedAssetName.length > 0) {
        helpers.getStaticAsset(trimmedAssetName,function(err, data) {
          if (!err && data) {
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
  const token = obj.auth;
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
handlers.productsPage = (data, callback) => { getAdminPage('products', data, callback)};
handlers.usersPage = (data, callback) => {getAdminPage('users', data, callback)};
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

handlers.tokens = function(data,callback) {
  var acceptableMethods = ['post','get','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};
handlers._tokens = {};

handlers._tokens.post = function(data,callback) {
  let username = typeof(data.payload.username) === 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : false;
  let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (username && password) {
    fs.readdir('./.data/users/', 'utf-8', (err, files) => {
      if (!err && files) {
        let len = files.length;
        let count = 0;
        let userFound = false;
        for (let i = 0; i < len; i++) {
          _data.read('users', files[i].replace(".json",""), (err, data) => {
            if (!err && data) {
              if (username === data.username) {
                userFound = true;
                count++;
                let hashedPassword = helpers.hash(password);
                if (hashedPassword === data.hashedPassword) {
                  const tokenId = helpers.createRandomString(20);
                  const expires = Date.now() + 1000 * 60 * 60;
                  const tokenObject = {
                    'username' : username,
                    'id' : tokenId,
                    'expires' : expires
                  };
                  _data.create('tokens',tokenId,tokenObject, (err) => {
                    if (!err) {
                      callback(200, tokenObject);
                    } else {
                      callback(500,{'Error' : 'Could not create a new token'});
                    }
                  })
                } else {
                  callback(400, { message : "Wrong password"})
                }
              } else {
                count++;
              };
              if (count === len && userFound === false) {
                callback(404, { message : "User not found"})
              }
            } else {
             callback(500, { message : "Error trying to find user"});
            };
          })
        }
      } else {
        callback(500, { message : "Could not find any users"})
      }
    })
  } else {
    callback(400, { message : "Bad inputs"})
  }
};

handlers._tokens.put = (data,callback) => {
  let id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  let extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;
  if (id && extend) {
    _data.read('tokens',id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          let newTime = Date.now() + 1000 * 60 * 60;
          tokenData.expires = newTime;
          _data.update('tokens',id,tokenData, (err) => {
            if (!err) {
              callback(200, tokenData );
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
        let title = body.title.trim().length > 0 && typeof(body.title) === "string" ? body.title.trim() : false;
        let category = body.category.trim().length > 0 && typeof(body.category) === "string" ? body.category.trim() : false;
        let imageSrc = body.imageURL.trim().length > 0 && typeof(body.imageURL) === "string" ? body.imageURL.trim() : false;
        let description = body.description.trim().length > 0 && typeof(body.description) === "string" ? body.description.trim() : false;
        let price = body.price !== 0 && typeof(body.price) === "number" ? body.price : false;
        if (title && category && imageSrc && description && price) {
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

handlers.users = (data, callback) => {
  const acceptableMethods = ['get','post','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, { message : "Method not allowed"})
  }
}
handlers._users = {};

handlers._users.get = (data, callback) => {
  let cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
    if (isAuth) {
      let userId = data.queryStringObject.id;
      if (userId) {
        const username = helpers.parseJsonToObject(cookie).auth.username;
        _data.read('users', userId, (err, userData) => {
          if (!err && userData) {
            if (userData.username === username || username === "admin") {
              callback(200, userData);
            } else {
              callback(403, { message : "You are not allowed to modify other users"})
            }
          } else {
            callback(404, { message : "User was not found"})
          }
        })
      } else {
        fs.readdir('./.data/users/', 'utf8', (err,files) => {
          if (!err && files) {
            let usersArr = [];
            for (let i = 0; i < files.length; i++) {
              _data.read('users', files[i].replace(".json",""), (err, data) => {
                if (!err && data) {
                  usersArr.push(data);
                } else {
                  callback(500, { message : err})
                };
                if (files.length === usersArr.length) {
                  callback(200, { users : usersArr})
                }
              })
            }
          } else {
            console.log(err);
            callback(404, { message : "No users found"})
          }
        })
      }
    } else {
      callback(403, { message : msg})
    }
  })
}

handlers._users.post = (data, callback) => {
  let cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
    if (isAuth) {
      const obj = data.payload;
      let username = obj.username.trim().length > 0 && obj.username.trim().length <= 12 && typeof(obj.username) === "string" ? obj.username.trim() : false;
      fs.readdir('./.data/users', 'utf-8', (err, files) => {
        if (!err && files) {
          let count = 0;
          let doesUserExist = false;
          for (let i = 0; i < files.length; i++) {
            _data.read('users', files[i].replace(".json",""), (err, data) => {
              if (!err && data) {
                count++;
                if (data.username === username) {
                  doesUserExist = true;
                  
                  return;
                };
                if (count === files.length && doesUserExist === false) {
                  const firstName = typeof(obj.firstName) === "string" ? obj.firstName.trim() : false;
                  const lastName = typeof(obj.lastName) === "string" ? obj.lastName.trim() : false;
                  const password = typeof(obj.password) === "string" && obj.password.trim().length > 6 ? obj.password.trim(): false;
                  if (firstName && lastName && password) {
                    const hashedPassword = helpers.hash(password);
                    const userId = helpers.createRandomString(10);
                    const dateCreated = Date.now();
                    const dataObj = {
                      userId : userId,
                      username : username,
                      firstName : firstName,
                      lastName : lastName,
                      hashedPassword : hashedPassword,
                      dateCreated : dateCreated
                    };
                    _data.create('users', userId, dataObj, (err) => {
                      if (!err) {
                        callback(200, { message : "New user was created successfully"})
                      } else {
                        callback(500, { message : err})
                      }
                    })
                  } else {
                    callback(400, { message : "Bad inputs"})
                  }
                } else if (doesUserExist === true) {
                  callback(400, { message : "User already exists"});
                };
              } else {
                callback(500, { message : "Error reading the database"})
              }
            })
          }
        } else {
          callback(500, { message : "There was an error trying to check whether the user exists"})
        }
      })
    } else {
      callback(403, { message : msg})
    }
  })
}

handlers._users.put = (data, callback) => {
  let cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
    if (isAuth) {
      _data.read('users', data.payload.userId, (err, userdata) => {
        if (!err && userdata) {
          if (data.payload.newPassword.trim().length === 0 && data.payload.oldPassword.trim().length === 0) {
            console.log("password is not changed");
            const newData = {
              userId : userdata.userId,
              username : userdata.username,
              firstName : data.payload.firstName.trim(),
              lastName : data.payload.lastName.trim(),
              hashedPassword : userdata.hashedPassword,
              dateCreated : userdata.dateCreated
            };
            _data.update('users', data.payload.userId, newData, (err) => {
              if (!err) {
                callback(200, { message : "Data updated"})
              } else {
                callback(500, { message : "Could not update the data"})
              }
            });
          } else {
            let hashedOldPassword = helpers.hash(data.payload.oldPassword);
            if (hashedOldPassword === userdata.hashedPassword) {
              console.log('passwords match')
              const newData = {
                userId : userdata.userId,
                username : userdata.username,
                firstName : data.payload.firstName.trim(),
                lastName : data.payload.lastName.trim(),
                hashedPassword : helpers.hash(data.payload.newPassword),
                dateCreated : userdata.dateCreated
              }
              _data.update('users', userdata.userId, newData, (err) => {
                if (!err) {
                  callback(200, { message : "Data updated"})
                } else {
                  callback(500, { message : "Could not update the data"})
                }
              })
            } else {
              callback(400, { message : "Wrong password"})
            }
          }
        } else { 
          callback(404, { message : "User not found"})
        }
      });
    } else {
      callback(403, { message : msg})
    }
  });
}

handlers._users.delete = (data, callback) => {
  let cookie = data.headers.cookie;
  userAuth(cookie, (isAuth, msg) => {
    if (isAuth) {
      let userId = data.queryStringObject.id;
      _data.read('users', data.queryStringObject.id, (err, data) => {
        if (!err && data) {
          if (data.username === "admin") {
            callback(403, { message : "Cannot delete admin account"})
          } else {
            _data.delete('users', userId, (err) => {
              if (!err) {
                callback(200, { message : "User deleted"})
              } else {
                callback(500, { message : err })
              }
            })
          }
        } else {
          callback(404, { message : "User not found"})
        }
      })
    } else {
      callback(403, { message : msg})
    }
  })
}
module.exports = handlers;
