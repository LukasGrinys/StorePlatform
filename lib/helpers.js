const crypto = require('crypto');
const config = require('./config');
const path = require('path');
const fs = require('fs');

module.exports = class Helpers {
  parseJsonToObject(str) {
    try {
      var obj = JSON.parse(str);
      return obj;
    } catch(e) {
      return {};
    }
  };

  createRandomString(strLength) {
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

  createOrderId(len) {
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

  interpolate(str,data) {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
    for (var keyName in config.templateGlobals) {
      if(config.templateGlobals.hasOwnProperty(keyName)) {
        data['global.'+keyName] = config.templateGlobals[keyName];
      }
    }
    for (var key in data) {
      if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
        var replace = data[key];
        var find = '{' + key + '}';
        str = str.replace(find,replace);
      }
    }
    return str;
  };

  getTemplate(templateName, data, callback) {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};
    const interpolateMethod = this.interpolate;
    if (templateName) {
      const templatesDir = path.join(__dirname,'/../public/templates/');
      fs.readFile(templatesDir + templateName +'.html','utf8', function(err, str) {
        if (!err && str && str.length > 0) {
          const pageTemplate = interpolateMethod(str,data);
          callback(false, pageTemplate);
        } else {
          callback('Page template could not be found');
        }
      });
    } else {
      callback('A valid page template name was not specified');
    }
  };

  getStaticAsset(fileName,callback){
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

  hash(str) {
    if (typeof(str) == 'string' && str.length > 0) {
      var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
      return hash;
    } else {
      return false;
    }
  };

  generateProductId(num) {
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

}