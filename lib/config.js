var enviroments = {};

enviroments.development = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'development',
  'hashingSecret' : 'thisIsASecret',
  'templateGlobals' : {
    'appName' : 'Online Store',
    'companyName' : 'FromMedToDev',
    'yearCreated' : '2019',
    'baseUrl' : 'http://localhost:3000/'
  }
};

enviroments.production = {
  'httpPort' : 5000,
  'httpsPort' : process.env.PORT,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'templateGlobals' : {
    'appName' : 'Fictional sStore',
    'companyName' : 'FromMedToDev inc.',
    'yearCreated' : '2019',
    'baseUrl' : 'http://localhost:3010/'
  }
};

var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.development;

module.exports = enviromentToExport;