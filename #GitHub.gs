// GitHub Specific variables
var C_GITHUB = {
  domain: 'https://api.github.com/',
  accept: 'application/vnd.github.v3+json'
}

//
//                 _ _  __          
//     /\         (_) |/ /          
//    /  \   _ __  _| ' / ___ _   _ 
//   / /\ \ | '_ \| |  < / _ \ | | |
//  / ____ \| |_) | | . \  __/ |_| |
// /_/    \_\ .__/|_|_|\_\___|\__, |
//          | |                __/ |
//          |_|               |___/ 
//
function getSavedGitHubApiKey_() {
  var json = getGitHubConnectionJson_();
  return json.password;
}
function getGitHubConnectionJson_() {
  var s_json = getElementFromUserMemory_(getPropertiesGitHubKey_());
  return JSON.parse(s_json);  
}
function getGitHubUserName_() {
  var json = getGitHubConnectionJson_();  
  return json.username;
}


//                 _ 
//     /\         (_)
//    /  \   _ __  _ 
//   / /\ \ | '_ \| |
//  / ____ \| |_) | |
// /_/    \_\ .__/|_|
//          | |      
//          |_|    
// headers
function getGitHubApiHeaders_() {
  var sets = C_GITHUB;  
  var headers = {
    "Authorization": "Bearer " + getSavedGitHubApiKey_(),
    // 'Content-Type':'application/json',
    "Accept": sets.accept
  };  
  return headers;
}
// options for get
function getGitHubGetOptions_(method) {
  var m = method || "GET";
  return {
    "headers": getGitHubApiHeaders_(),
    "method" : m,
    "muteHttpExceptions": true
  } ; 
}
// Get response
function getGitHubGetResponse_(request) {
  var api = getGitHubApiUrl_(request);
  var options = getGitHubGetOptions_();  
  var response = UrlFetchApp.fetch(api, options);
  if (passResponseValidation_(response)) {
    var json = JSON.parse(response.getContentText()); 
    return json
  }  
  throw 'Response was not success. ' + response.getResponseCode() + '. ' + request;
}

function getGitHubApiUrl_(request) {
  var sets = C_GITHUB;
  var api = sets.domain + request; 
  return api;
}
// codes 200, 201 are ok
function passResponseValidation_(response) {
  var codeResponse = response.getResponseCode()
  Logger.log(codeResponse)
  if (codeResponse == 200) { return true; }
  if (codeResponse == 201) { return true; }
  return false;
}

//
//  __  __      _   _               _     
// |  \/  |    | | | |             | |    
// | \  / | ___| |_| |__   ___   __| |___ 
// | |\/| |/ _ \ __| '_ \ / _ \ / _` / __|
// | |  | |  __/ |_| | | | (_) | (_| \__ \
// |_|  |_|\___|\__|_| |_|\___/ \__,_|___/
//                                        
//                                        

// Get Rate limit
function test_getGitHubRateLimit() {
  getGitHubRateLimit_();
}
function getGitHubRateLimit_() {
  var json = getGitHubGetResponse_("rate_limit");
  Logger.log("You have " + json.rate.remaining + " requests left this hour.");
  return json;
}

// json of repo
//    { repo: string
//      path: string
//      user: sting
//      data: [[]] array
//      extension: sting = ".js"
//    }
function getRepoJson_(sets) {
  // https://api.github.com/repos/{username}/{repository name}/contents/{filepath and name}
  var url = 'repos/' + sets.user + '/' + sets.repo + '/contents/' + sets.path; 
  var json = getGitHubGetResponse_(url);
  //json =
  //{
  //   "name":"test.js",
  //   "path":"tests/test.js",
  //   "sha":"65f8c0204d543fb4bb098cfdbfb6ab0f16719a04",
  //   "size":46,
  //   "url":"https://api.github.com/repos/Max-Makhrov/myFiles/contents/tests/test.js?ref=master",
  //   "html_url":"https://github.com/Max-Makhrov/myFiles/blob/master/tests/test.js",
  //   "git_url":"https://api.github.com/repos/Max-Makhrov/myFiles/git/blobs/65f8c0204d543fb4bb098cfdbfb6ab0f16719a04",
  //   "download_url":"https://raw.githubusercontent.com/Max-Makhrov/myFiles/master/tests/test.js",
  //   "type":"file",
  //   "content":"ZnVuY3Rpb24gbWUoKSB7CiAgY29uc29sZS5sb2coJ0hlbGxvIG1lIScpOwp9\nCg==\n",
  //   "encoding":"base64",
  //   "_links":{
  //      "self":"https://api.github.com/repos/Max-Makhrov/myFiles/contents/tests/test.js?ref=master",
  //      "git":"https://api.github.com/repos/Max-Makhrov/myFiles/git/blobs/65f8c0204d543fb4bb098cfdbfb6ab0f16719a04",
  //      "html":"https://github.com/Max-Makhrov/myFiles/blob/master/tests/test.js"
  //   }
  //}  
  return json;  
}


function test_getRepoFile() {
  // https://github.com/Max-Makhrov/myFiles/blob/master/tests/test.js
  sets = {
    user: 'Max-Makhrov',
    repo: 'myFiles',
    path: 'tests/test.js'
  } 
  getRepoFile_(sets);
}
// sets = 
//    { repo: string
//      path: string
//      user: sting
//      data: [[]] array
//      extension: sting = ".js"
//    }
function getRepoFile_(sets) {  
  var json = getRepoJson_(sets);
  var content = json.content;
  var decoded = Utilities.base64Decode(content, Utilities.Charset.UTF_8);
  var res = Utilities.newBlob(decoded).getDataAsString();
  Logger.log(res);
  return res;   
}


function test_updateRepo() {
  sets = {
    user: 'Max-Makhrov',
    repo: 'myFiles',
    path: 'tests/test.js',
  };
  sets.json = getRepoJson_(sets);
  var newRepoText = "console.log('You did it =)')";
  var res = updateRepo_(sets, newRepoText);
  Logger.log(res);
}
//
// Creates or Updates Repo
// newRepoText -- string. The text of repo
// sets = 
//    { repo: string
//      path: string
//      user: sting
//      data: [[]] array
//      extension: sting = ".js"
//      json: updateRepo_(sets) // !!! set json if it is an existing file
//    }
function updateRepo_(sets, newRepoText) {
  // message. Required. The commit message.
  var message = 'Automatic update by Google Script';  
  // content. Required. The new file content, using Base64 encoding.
  var charset = Utilities.Charset.UTF_8;
  var content = Utilities.base64Encode(newRepoText, charset);  
  var data = {
    "message": message,
    "content": content    
  };     
  var json = sets.json; 
  if (json) { // file exists → update it  
    // sha. Required if you are updating a file. The blob SHA of the file being replaced.    
    var sha = json.sha;
    data.sha = sha;
  } 
  //
  var payload = JSON.stringify(data);
  //
  var options = {
    "headers": getGitHubApiHeaders_(),
    "method" : 'put',
    "contentType": 'application/json',
    "muteHttpExceptions": true,
    'payload': payload  // encodeURIComponent(   
  };
  //
  // https://api.github.com/repos/{username}/{repository name}/contents/{filepath and name}
  var request = 'repos/' + sets.user + '/' + sets.repo + '/contents/' + sets.path; 
  var url = getGitHubApiUrl_(request);
  // get response
  var response = UrlFetchApp.fetch(url, options);
  if (passResponseValidation_(response)) {
    var json = JSON.parse(response.getContentText()); 
    return json
  }  
  throw 'Response was not success. ' + response.getResponseCode() + '. ' + request + '. Response: ' + response.getContentText();  
}


function test_getRepo() {
  sets = {
    user: 'Max-Makhrov',
    repo: 'myFiles'
  };
  var res = getRepo_(sets);
  Logger.log(res);
}
function getRepo_(sets) {
  var url = 'repos/' + sets.user + '/' + sets.repo;
  var json = getGitHubGetResponse_(url);  
  return json;
}

function test_getRepos() {
  var res = getRepos_('Max-Makhrov');
  Logger.log(res);    
}
function getRepos_(user) {
  var url = 'users/' + user + '/repos'; 
  var json = getGitHubGetResponse_(url);  
  return json;  
}