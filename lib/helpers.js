const crypto = require('crypto');
const config = require('./config');
const path = require('path');
const fs = require('fs');
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
  len = typeof(len) === 'number' && len > 0 ? len : false;
  if (len) {
    const numbers = "0123456789";
    let str = '';
    for (let i = 0; i < len; i++) {
      let randomNumber = numbers[Math.floor(Math.random() * 10)];
      str += randomNumber;
    }
    return str;
  } else {
    return false;
  }
}

helpers.getTemplate = function(templateName, data, callback) {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};
    if (templateName) {
      const templatesDir = path.join(__dirname,'/../public/');
      fs.readFile(templatesDir + 'header.html', 'utf8', (err, str) => {
        if (err || str.length === 0 || !str) {
          callback("Could not find the header");
        } else {
          const headerStr = str;
          fs.readFile(templatesDir + 'footer.html', 'utf8', (err, str) => {
            if (err || str.length === 0 || !str) {
              callback("Could not find the footer")
            } else {
              const footerStr = str;
              fs.readFile(templatesDir + templateName +'.html','utf8', function(err, str) {
                if (!err && str && str.length > 0) {
                  const pageString = helpers.interpolate(str,data);
                  const finalString = headerStr + pageString + footerStr;
                  callback(false, finalString);
                } else {
                  callback('Page template could not be found');
                }
              });
            }
          })
        }
      })
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

helpers.hash = function(str) {
  if (typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.generateProductId = (num) => {
  let str = String(num);
  if (str.length === 1) {
    str = "#00" + str;
  } else if (str.length === 2) {
    str = "#0" + str;
  } else {
    str = "#" + str;
  }
  return str;
}
// helpers.updateSessionLog = function(dir, file, data, callback) {
//   var baseDir = path.join(__dirname,'/../.data/');
//   fs.open(baseDir + dir + "/" + file + ".json", 'r+',function(err,fileDescriptor){
//       if (!err && fileDescriptor) {
//           var stringData = JSON.stringify(data);
//           fs.ftruncate(fileDescriptor, function(err) {
//               if (!err) {
//                   fs.writeFile(fileDescriptor, stringData, function(err) {
//                       if (!err) {
//                           fs.close(fileDescriptor, function(err) {
//                               if (!err) {
//                                   callback(false);
//                               } else {
//                                   callback('Error closing the file');
//                               }
//                           })
//                       } else {
//                           callback('Error writing to existing file')
//                       }
//                   })
//               } else {
//                   callback('Error truncating file');
//               }
//           })
//       } else {
//           callback('Could not open the file for updating, it may not exist yet')
//       }
//   });
// };

  module.exports = helpers;