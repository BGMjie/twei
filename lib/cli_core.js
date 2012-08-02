var util = require('util')
  , fs = require('fs')
  , shower
  , tips = require('../txt/tips')
  , twei = require('../')
  ;
  
var TOKENPATH = __dirname + '/../access_token'
  , getAccessTokenUrl = function(){
    return fs.readFileSync(__dirname + '/../access_token_url', 'utf8')
  }
  , noop = function(){}
  ;

//a global var for debug
root.log = function(){};

//command info
var info = {};

//twei core commands
var cmdMap = {
  
    help: function(type){
    help(type);
  }
  , execute: function(apiStr, apiExtra, apiExtra2){
    var apiItem, args = arguments
      
      , qs = require('querystring')
      , group, name;
    
    if(apiExtra){
      if(apiExtra.indexOf('=') === -1){//�ԵȺ���Ϊ�жϲ�������
        apiItem = twei.getApiItem(apiStr);
        
        if(apiItem.expect){
          if(Array.isArray(apiItem.expect)){
            var str = '';
            
            apiItem.expect.forEach(function(expect, i){
              str += expect + '=' + args[i + 1] + '&';
            });
            console.log(str)
            apiExtra = str.slice(0, str.length - 1);
            apiExtra2 = args[apiItem.expect.length + 1];
          }else{
            apiExtra = apiItem.expect + '=' + apiExtra;
          }
        }else{
          console.warn(shower.color('unexpect apiExtra: ' + apiExtra).warn);
        }
      }
        
      if(apiExtra2){
        apiExtra = qs.parse(apiExtra);
        apiExtra2 = qs.parse(apiExtra2);
        
        for(var key in apiExra2){
          if(apiExtra[key] === undefined){
            apiExtra[key] = apiExtra2[key];
          }
        }
        
        apiExtra = qs.stringify(apiExtra);
      }
    }
    log('command / extra: ' + apiStr + ' / ' + (apiExtra))
    apiExc(apiStr, apiExtra);
  }
  , authorize: function(){
    open(getAccessTokenUrl());
    takeAccessToken();
  }
  
  , config: function(){}
};

/**
 * ����������г�ʼ��
 * @param {Array} argvs cli ����Ĳ����б�. ������ node [--debug] twei
 */

function init(argvs){
  var args = argvs.slice();
  var cmd = args.shift(), tmp;
    
  if(tmp = restoreAlias(cmd)){
    cmd = tmp.shift();
    args = tmp.concat(args);
  }
  
  if(cmd && !cmd.indexOf('-')){
    args.unshift(cmd);
    cmd = '';
  }
  
  var param = []
    , arg
    , flagsParam = {}, flag, flagFn
    , helpFn = getFlagFn('--help')
    ;
  
  while(arg = args.shift()){
    if(arg.indexOf('-')){
      if(flag){
        flagsParam[flag].push(arg);
      }else{
        param.push(arg);
      }
    }else{
      flag = arg;
      flagsParam[flag] = [];
    }
  }
  
  getFlagFn('--shower').apply(null, flagsParam['--shower']);
  if(flagsParam['--shower']){//��ǰ���� shower
    delete flagsParam['--shower'];
  }
  if(flagsParam['-d'] || flagsParam['--debug']){//���� debug ִ��˳��
    getFlagFn('-d')();
    delete flagsParam['-d'];
    delete flagsParam['--debug'];
  }
  
  log('flagsMap: ' + util.inspect(flagsParam))
  
  //cmd || help();
  
  for(var key in flagsParam){
    flagFn = getFlagFn(key);
    if(flagFn){
    
      if(flagFn == helpFn){//help all others param
        helpFn.apply(null, (cmd ? [cmd] : []).concat(param).concat(flagsParam[key]));
      }else{
        flagFn.apply(null, flagsParam[key]);
      }
    }
  }
  
  cmdMap[cmd] ? cmdMap[cmd].apply(null, param) : help(cmd);
}


function getFlagFn(flag){
  var fn;
  switch(flag){
  case "--about":
    fn = function(){}
    break;
  case "--coordinates":
  case "-c":
    fn = function(coordinates){
      info.coordinates = coordinates;
    };
    break;
  case "--debug":
  case "-d":
    fn = function(){
      log = function(){
        console.log.apply(console, arguments);
      };
    };
    break;
  case "--force":
  case "-f":
    fn = function(){
      info.force = true;
    };
    break;
  case "--help":
  case "-h":
  case "-?":
    fn = help
    break;
  case "--image":
  case "-i":
    fn = function(url){
      if(!/^https?\:\/\//.test(url)){
        try{
          log('image path: ' + url);
          info.image = fs.readFileSync(url);
        }catch(e){
          console.warn(shower.color(tips.img_fail).warn, url);
          exit();
        }
      }else{
        info.image = url;
      }
    }
    break;
  case "--shower":
    fn = function(showerName){
      log('use shower: ' + showerName)
      return shower = new (require('../lib/shower').use(showerName));
    };
    break;
  case "--version":
  case "-v":
    fn = function(){
      console.log(JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version);
      exit();
    };
    break;
  default:
    break;
  }
  return fn;
}
  

var aliases = require('./alias.js');

//console.log(aliases)

// return an Array
function restoreAlias(cmd){
  var cmds;
  if(aliases[cmd]){
    cmds = aliases[cmd].trim().split(/\s+/);
  }
  return cmds;
}


//�ӿ���̨��ȡ access_token, ֱ������������
function takeAccessToken(callback){
  callback = callback || noop;
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdout.write(tips.input_access_token);
  process.stdin.on('data', function (text) {
    text = text.trim();
    process.stdin.removeListener('data', arguments.callee);
    process.stdin.pause();
    
    if(text){
      log('a new access token: ' + text);
      saveAccessToken(text);
      callback(text);
    }else{
      open(getAccessTokenUrl());
      takeAccessToken(callback);
    }
  });
}

function saveAccessToken(token){
   fs.writeFileSync(TOKENPATH, token, 'utf8');
   return token;
}

function getAccessToken(){
  var token;
  try{
    token = fs.readFileSync(TOKENPATH, 'utf8');
  }catch(e){
    token = ''
    saveAccessToken(token);
  }
  return token;
}

function updateStatus(opts){

  if(opts.coordinates){
    opts.coordinates = opts.coordinates.split(',')
  }
  
  return require('../').updateWeibo(opts);
}

/**
 * ͨ�� api ִ�г���
 * @param {String} apiName ��ʽΪ: group.name
 * @param {String} apiExtra ������� querystring
 */
function apiExc(apiName, apiExtra){
  var token = getAccessToken()
    , apiItem = require('../').getApiItem(apiName)
    , promise
    ;
    
  if(!token){
    takeAccessToken(function(){
      apiExc(apiName, apiExtra);
    });
    return false;
  }
  try{
    var query = require('querystring').decode(apiExtra)
      ;
      
    query.access_token = token;
    log('apiExtra: ' + apiExtra);
    log('apiPath: ' + apiItem.path);
    log('query: ' + util.inspect(query));
    
    shower.emit('pendStart');
    if(apiName == 'status.update' && info.image && query.status){
      info.accessToken = token;
      info.message = query.status;
      promise = updateStatus(info)
    }else{
      promise= require('../').executeApi(apiName, query);
    }
    
    promise.then(function(reply){
      shower.emit('pendDone');
      if(checkreply(reply)){
        shower.emit('data', apiItem.promise, reply);
      };
    }, function(err){
      shower.emit('pendFail', err);
      throw err;
    });
    
  }catch(err){
    shower.emit('pendFail', err);
    throw err;
  }
}

// ���΢������
// 
function checkreply(reply){
  if(reply.error){
    if(reply.error_code == 21327 || reply.error_code == 21332){
      console.warn(tips.errortips[reply.error_code]);
      log(reply);
      takeAccessToken(function(token){
        //nomsg ? apiExc(apiName, apiExtra) : updateStatus(token);
      });
    }else{
      shower.emit('data_error', reply);
      return false;
    }
  }else{
    log('done');
    return true;
  }
}

function exit(){
  process.exit();
}

function help(type){
  switch(type){
    case "status":
      util.puts('help status')
      break;
    case undefined:
      util.puts(shower.color(fs.readFileSync(__dirname + '/../txt/help', 'utf8')).info);
      break;
    default:
      console.log('help: ' + util.inspect(arguments));
      break;
  }
  exit();
}

//open a url
function open(url){
  var cmd, exec = require('child_process').exec;
  switch(process.platform){
  case 'darwin':
    cmd = 'open';
    break;
  case 'win32':
  case 'win64':
    cmd = 'start';
    break;
  case 'cygwin':
    cmd = 'cygstart';
    break;
  default:
    cmd = 'xdg-open';
    break;
  }
  cmd = cmd + ' ' + url + '';
  log(cmd);
  exec(cmd);
}


module.exports = {
    init: init
};