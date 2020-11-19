//
//  ______             _            
// |  ____|           (_)           
// | |__   _ __   __ _ _ _ __   ___ 
// |  __| | '_ \ / _` | | '_ \ / _ \
// | |____| | | | (_| | | | | |  __/
// |______|_| |_|\__, |_|_| |_|\___|
//                __/ |             
//               |___/              
// GitHub-Sheets Engine
//function test_tosheet(){
//  var sheet = SpreadsheetApp.getActive().getSheetByName('#test1#');
//  writeGitHub_to_Sheet_(sheet);
//}
// const
var C_FLOW_ERROR = ''; // collects errors to show them for user
var C_MUTE_ERROR = '{{mute}}'; // the message not to show in error
//
//
// → Sheets
function writeGitHub_to_Sheet_(sheet) {
  var t = new Date();
  var s = sheet || SpreadsheetApp.getActiveSheet();
  // get sets with GitHub-query parameters
  var sets = getGitHubSheetRepoSets_(s);
  if (msgError_(C_FLOW_ERROR)) { return -1; } // return is error
  try {
    // get data from API
    var textData = getRepoFile_(sets);
    // convert string data into 2D-Array
    var data = csvToArray_(textData);
    // put the data to the sheet
    if (data.length === 0) { throw 'Empty result fron API'; }
    s.getRange(2, 1, s.getMaxRows(), s.getMaxColumns()).clearContent(); 
    var writeResult = writeDataIntoSheet_(false, s, data, 2, 1);
    Browser.msgBox(writeResult + '\\n\\nExecution time:' + getTimeEllapse_(t));
  }
  catch(err) {
    Browser.msgBox('=( Got Error wile trying to get data. Message:\\n\\n' + err); 
  }
}
//
//
// → Git
function test_togit() {
  var sheet = SpreadsheetApp.getActive().getSheetByName('#test2#');
  writeSheet_to_GitHub_(sheet);
}
function writeSheet_to_GitHub_(sheet) {
  var t = new Date();
  var s = sheet || SpreadsheetApp.getActiveSheet();
  var sets = getGitHubSheetRepoSets_(s);
  if (msgError_(C_FLOW_ERROR)) { return -1; }
  
  // Check repo exists
  try {
    var repo = getRepo_(sets);
  }
  catch(err) {
    Browser.msgBox('Repo ' + sets.repo + 'does not exist. Please try again.')
    return -1;
  }
  
  // Check if file exists
  var json = false;
  try {
    json = getRepoJson_(sets);
  }
  catch(err) {
    var ui =  SpreadsheetApp.getUi();
    var doNewFileResponse = ui.alert('No file `' + sets.path + '` in repo `' + sets.repo + '`\n\n🤔 Create new file?', ui.ButtonSet.YES_NO)
    if (doNewFileResponse === ui.Button.NO) { return -2; }
    // the code with json = false creates new file in repo
  }
  sets.json = json;
  
  // Execut repo edit
  try {
    // get data from API
    var newRepoText = '';
    if (sets.extension === '.csv') {
      newRepoText = arrayToCSV_(sets.data);   
    }
    else {
      // convert to regular string
      newRepoText =  sets.data.map(function(row) { return row.join(''); }).join('\n');
    }
    updateRepo_(sets, newRepoText);
    Browser.msgBox('Wtite data to GitHub:\\n ✔️ Done!' + '\\n\\nExecution time: ' + getTimeEllapse_(t));
  }
  catch(err) {
    Browser.msgBox('=( Got Error wile trying to push data. Message:\\n\\n' + err); 
    throw err;
  }    
}




// browsws error and sends the response = true to let main function exit
function msgError_(error) {
  if (error == '' || !error) { return false; }
  if (error === C_MUTE_ERROR) { return true; }
  Browser.msgBox(error);
  return true; // error is Done!
}

// checks GitHub sheet settings are ok
// returns repo sets:
//    { repo: string
//      path: string
//      user: sting
//      data: [[]] array
//      extension: sting = ".js"
//    }
// change this function to counstruct your settings flow
function getGitHubSheetRepoSets_(sheet) {
  // test credits first
  var checkPass = testGitHubCredits_();
  if (checkPass !== 0) { 
    C_FLOW_ERROR = C_MUTE_ERROR;
    return -1;                 
  }
  //  
  // Get sheet sets
  var sheetData = sheet.getDataRange().getValues();
  var setsRow = sheetData[0];  // change if needed
  var repo = setsRow[0];       // change if needed
  var path = setsRow[1];       // change if needed
  var user = setsRow[2];       // change if needed
  if (!repo || repo === '') {
    C_FLOW_ERROR = '🛸 Sets Error\\nSorry, no repo found in A1.';
    return -2;    
  }
  if (!path || path === '') {
    C_FLOW_ERROR = '🛸 Sets Error\\nSorry, no path found in B1.';
    return -3;         
  }
  if (!user || user === '') {
    user = getGitHubUserName_();
    if (!user || user === '') {
      C_FLOW_ERROR = '🛸 Sets Error\\nSorry, no user found in C1 and no default user set.';
      return -4;             
    } 
  }
  var data = [];
  for (var i = 1; i < sheetData.length; i++) {
    if (sheetData[i].join('') !== '') { data.push(sheetData[i]) } // skip empty rows
  };
  // get extension
  var ext = '';
  var extMatch = path.match(/\.[0-9a-z]+$/i);
  if (extMatch) { ext = extMatch[0]; }  
  var sets = {
    repo: repo,
    path: path,
    user: user,
    data: data,
    extension: ext
  };
  return sets;  
}

// test if api key is valid. 
// Will prompt user to enter new api key if the old is invalid.
function testGitHubCredits_() {
  try {
    getGitHubRateLimit_(); 
  }
  catch(err) {
    Logger.log('Connection failed... ' + err );
    // connect first
    Browser.msgBox('⚡ GitHub credits are not set or incorrect.\\n\\nPlease do:\\n 1. set the following... and then\\n 2. try it again.')
    var passOk = setGitHubConnection_();
    Logger.log(passOk);
    return -1;
  }
  Logger.log('Connection ok!');
  return 0;
}






//   _____                              _                 
//  / ____|                            (_)                
// | |     ___  _ ____   _____ _ __ ___ _  ___  _ __  ___ 
// | |    / _ \| '_ \ \ / / _ \ '__/ __| |/ _ \| '_ \/ __|
// | |___| (_) | | | \ V /  __/ |  \__ \ | (_) | | | \__ \
//  \_____\___/|_| |_|\_/ \___|_|  |___/_|\___/|_| |_|___/
//                                                        
//                                                        

// Converts 2D-array to csv
//
//function test_getCsv() {
//  Logger.log(arrayToCSV_([['a', 'b'], ['c', new Date()]]));
//  Logger.log(arrayToCSV_([['a', '"b" great'], ['c', 3.1415]]));
//  Logger.log(arrayToCSV_([[',a', '"b" great'], ['c', 3.1415]]));
//  var data = SpreadsheetApp.getActive().getSheets()[0].getRange('A2:B4').getValues();
//  Logger.log(arrayToCSV_(data));
//}
//
// Used: 
// sourse:    https://www.30secondsofcode.org/js/s/array-to-csv
// convert:   https://babeljs.io/repl
var timezone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
function arrayToCSV_(arr) {
  var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ',';
  return arr.map(function (v) {
    return v.map(function (x) {
      if ( isNaN(x) ) {
        return "\"".concat(x.replace(/"/g, '""'), "\"");
      }
      if (isDate_(x)) {
        // used recommended date format:
        // https://stackoverflow.com/a/804137/5372400
        var format = "yyyy-MM-dd HH:mm:ss";
        if (x.getHours() === 0 && x.getMinutes() === 0 && x.getSeconds() === 0) {
          format = "yyyy-MM-dd";
        }
        return Utilities.formatDate(x, timezone, format);
      }
      return x;
    }).join(delimiter);
  }).join('\n');
}

// https://stackoverflow.com/a/10589791/5372400
function isDate_(date) {
  return date instanceof Date && !isNaN(date.valueOf());
}

// Converts csv to 2D-array
//
// Also works for converting text with new lines into 2D-Array
// 
//function test_csvToArray() {
//  Logger.log(csvToArray_('"a","b"\n"c",Fri Oct 23 2020 15:41:17 GMT+0300 (Eastern European Summer Time)'));
//  sets = {
//    user: 'Max-Makhrov',
//    repo: 'myFiles',
//    path: 'tests/test.js'
//  } 
//  Logger.log(csvToArray_(getRepoFile_(sets)));
//}
// Return array of string values, or NULL if CSV string not well formed.
function csvToArray_(text) {
  // source: https://stackoverflow.com/a/41563966/5372400  
  // help:   https://stackoverflow.com/a/33156233/5372400
  //   let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
  //    for (l of text) {
  //        if ('"' === l) {
  //            if (s && l === p) row[i] += l;
  //            s = !s;
  //        } else if (',' === l && s) l = row[++i] = '';
  //        else if ('\n' === l && s) {
  //            if ('\r' === p) row[i] = row[i].slice(0, -1);
  //            row = ret[++r] = [l = '']; i = 0;
  //        } else row[i] += l;
  //        p = l;
  //    }
  var ret = Utilities.parseCsv(text);
  var result = ret.filter(function(line) { return line.join('') !== ''; });
  return result;
};



//  _______ _                     
// |__   __(_)                    
//    | |   _ _ __ ___   ___ _ __ 
//    | |  | | '_ ` _ \ / _ \ '__|
//    | |  | | | | | | |  __/ |   
//    |_|  |_|_| |_| |_|\___|_|   
//                                                             
function getTimeEllapse_(t)
{
  var dif = new Date() - t;
  if (dif < 1000) { return dif + ' ms.'; }  
  var mm = parseInt(dif/1000), respo = '';
  if (mm < 60)
  {
     respo = mm + ' sec.';
  }
  else
  {
    var min = parseInt(mm / 60);
    var sec = mm - min *60;
    respo = min + ' min. ' + sec + ' sec.';
  }
  return respo;  
}