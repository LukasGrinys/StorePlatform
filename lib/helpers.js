const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const _data = require('./data');

var helpers = {};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function(str) {
  try{
    var obj = JSON.parse(str);
    return obj;
  }catch(e){
    return {};
  }
};

  // create a string of random alphanumeric characters of a given length
helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
      var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var str = '';
      for (let i = 0; i < strLength; i++) {
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()* possibleCharacters.length));
        str += randomCharacter;
      }
      str = str.toUpperCase();
      return str;
    } else {
      return false;
    }
};

helpers.createOrderId = function(len) {
  len = typeof(len) == 'number' && len > 0 ? len : false;
  if (len) {
    var numbers = "0123456789";
    var str = '';
    for (let i = 0; i < len; i++) {
      let randomNumber = numbers[Math.floor(Math.random() * 10)];
      str += randomNumber;
    }
    return str;
  } else {
    return false;
  }
}

  // Get the string content of a template
helpers.getTemplate = function(templateName, data, callback) {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};
    if (templateName) {
      var templatesDir = path.join(__dirname,'/../public/');
      fs.readFile(templatesDir + templateName+'.html','utf8',function(err, str) {
        if (!err && str && str.length > 0) {
          // Do interpolation of string
          var finalString = helpers.interpolate(str,data);
          callback(false, finalString);
        } else {
          callback('Page template could not be found');
        }
      });
    } else {
      callback('A valid page template name was not specified');
    }
  };

  // Take a given string and a data object and find/replace all the keys within it
  helpers.interpolate = function(str,data) {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
    // Add the templateGlobals to the data object, prepending their key name with global;
    for (var keyName in config.templateGlobals) {
      if(config.templateGlobals.hasOwnProperty(keyName)) {
        data['global.'+keyName] = config.templateGlobals[keyName];
      }
    }
    // For earch key in the data object, insert its value into the string of the corresponding smoething
    for (var key in data) {
      if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
        var replace = data[key];
        var find = '{' + key + '}';
        str = str.replace(find,replace);
      }
    }
    return str;
  };

  // Get the contents of a static (public) asset
helpers.getStaticAsset = function(fileName,callback){
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if(fileName){
      var publicDir = path.join(__dirname,'/../public/');
      fs.readFile(publicDir+fileName, function(err,data){
        if(!err && data){
          callback(false,data);
        } else {
          callback('No file could be found');
        }
      });
    } else {
      callback('A valid file name was not specified');
    }
};

// Sending payment details and order ID
helpers.sendEmail = function(recAdd, orderId, totalPrice) {
  let transport = nodemailer.createTransport({
    host: '', // transport service host
    port: 0, 
    auth: { // authorisation
      user: '',
      pass: '',
    }
  });
  let messageHTML = `
  <body style="background-color:rgb(218, 205, 170)">
        <h1>We got your order!</h1>
        <span>Now all you need to do, is to pay ${totalPrice} to any of accounts below: <br>
        <span>Account example 1</span><br>
        <span>Account example 2</span><br>
        <span>Dont forget to include your <b>Order ID</b>: ${orderId}</span>
        </span>
  </body>`
  const message = {
    from: '', // sender e-mail
    to: recAdd, // recipient e-mail
    subject: 'Your order details | Fictional Store',
    html: messageHTML 
  };
  transport.sendMail(message, function(err, info) {
    if (err) {  
      console.log("Transport service options are not specified, but the ID of the order received was: ", orderId);
    } else {
      console.log("Message should be sent at this point. Order ID: ", orderId); //
    }
  });
};

helpers.hash = function(str) {
  if (typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.formOrderFile = function(username, callback) {
  // Create an admin session file
  var baseDir = path.join(__dirname,'/../.data/');
  // Clean the content of the previous order log
  fs.writeFile(baseDir+'sessions/'+username+'.json', '', function(err) {
    if (!err) {
      fs.readdir('./.data/orders', function(err, files) {
        if (!err && files) {
          for (let i = 0; i < files.length; i++) {
            let filename = files[i];
            fs.readFile(baseDir+'orders/' + filename, function(err, data) {
              if (!err && data) {
                helpers.updateSessionLog('sessions',username,data,function(err) {
                  if (!err) {
                    callback(data);
                  } else {
                    callback(err);
                  }
                })
              } else {
                // callback(403, {'Error' : 'There was an error while reading order files'})
              }
            })
          }
        } else {
          callback(err);
        }
      });
    } else {
      callback(500, {'Error' : 'Could not clean the file'});
    }
  });
};

helpers.updateSessionLog = function(dir, file, data, callback) {
  var baseDir = path.join(__dirname,'/../.data/');
  fs.open(baseDir + dir + "/" + file + ".json", 'r+',function(err,fileDescriptor){
      if (!err && fileDescriptor) {
          var stringData = JSON.stringify(data);
          fs.ftruncate(fileDescriptor, function(err) {
              if (!err) {
                  fs.writeFile(fileDescriptor, stringData, function(err) {
                      if (!err) {
                          fs.close(fileDescriptor, function(err) {
                              if (!err) {
                                  callback(false);
                              } else {
                                  callback('Error closing the file');
                              }
                          })
                      } else {
                          callback('Error writing to existing file')
                      }
                  })
              } else {
                  callback('Error truncating file');
              }
          })
      } else {
          callback('Could not open the file for updating, it may not exist yet')
      }
  });
};

  module.exports = helpers;