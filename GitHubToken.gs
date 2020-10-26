//
//  __  __                                 
// |  \/  |                                
// | \  / | ___ _ __ ___   ___  _ __ _   _ 
// | |\/| |/ _ \ '_ ` _ \ / _ \| '__| | | |
// | |  | |  __/ | | | | | (_) | |  | |_| |
// |_|  |_|\___|_| |_| |_|\___/|_|   \__, |
//                                    __/ |
//                                   |___/ 
// get the  key for storing connections
function getPropertiesGitHubKey_()
{
  const C_KEY_PREFIX = 'GitHub_'; 
  var key = C_KEY_PREFIX + SpreadsheetApp.getActive().getId();
  return key;
}
// returns string from saved propery
// returns `null` if nothing saved
function getElementFromUserMemory_(key)
{
  var props = getGoogleProperties_();
  return props.getProperty(key);
}
// separate function for ability to change method
function getGoogleProperties_()
{
  var props = PropertiesService.getUserProperties(); // change if needed
  return props;  
}
// saves string to memory
function saveElementToUserMemory_(key, value)
{
  var props = getGoogleProperties_();
  props.setProperty(key, value);  
}
function clearGitHubPassword()
{
  var props = getGoogleProperties_();  
  props.deleteProperty(getPropertiesGitHubKey_());
}


//  ______                   
// |  ____|                  
// | |__ ___  _ __ _ __ ___  
// |  __/ _ \| '__| '_ ` _ \ 
// | | | (_) | |  | | | | | |
// |_|  \___/|_|  |_| |_| |_|
//                                                     
// show the form
function setGitHubConnection_()
{
  return showConnectionForm_();  
}
function showConnectionForm_()
{
  var html = HtmlService.createTemplateFromFile('GitHubPassForm').evaluate().setWidth(450).setHeight(430);  
  return SpreadsheetApp.getUi().showModalDialog(html, '😸 Set GitHub Connection');       
}
// function used from userform to collect data
function getMainGitHubData()
{
  var data; // get connection elements from user memory
  var savedProp = getElementFromUserMemory_(getPropertiesGitHubKey_());
  if (savedProp)
  {
    data = JSON.parse(savedProp);    
  }
  return data;  
}
// function runs on form submit
function getGitHubConnectionResponse(data)
{
  // test connection
  try
  {
    // save data to memory
    saveElementToUserMemory_(getPropertiesGitHubKey_(), JSON.stringify(data)); 
    var json = getGitHubRateLimit_();
    Browser.msgBox('Success!\\nYou have ' + json.rate.remaining + " requests left this hour.");
  }
  catch(error)
  {
    Browser.msgBox(error + '\\n\\nPlease try again.');
    setGitHubConnection_();
    return -1;
  }
  

  return 0;
}

// get connection data
function getGitHubConnectionData_()
{
  // get from memory
  data = getMainGitHubData();
  if (data) { return data; }
  // use form
  setGitHubConnection_();
  return getMainGitHubData();  
}