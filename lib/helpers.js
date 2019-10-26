const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const path = require('path');
const fs = require('fs');
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

  module.exports = helpers;