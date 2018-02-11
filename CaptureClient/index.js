
var g_account = '';
var g_SignalingIP = '';
var g_RoomName = '';
var g_ChatIP = '';
var ws;
var notID = 0;

function $(id) {
  return document.getElementById(id);
}

function index_comment(msg, depth){
   $('log').value += msg + '\n';
   return;
}

function index_message_log( msg, tag_name, depth ){
   if( typeof tag_name === 'undefined' ){
      $('log').value += msg + '\n';
      return;
   }
   if( typeof depth == 'undefined' ){
      $('log').value += '[' + tag_name + ']' +msg + '\n';
   }else{
      var tab='';
      var ii;
      for(ii=0; ii<depth; ii++){
         tab = tab + '   ';
      }
      tab = tab + '';
      $('log').value += tab + '[' + tag_name + ']' +msg + '\n';
   }
}
function windowalert(){
   chrome.app.window.create('alert.html', {
       innerBounds: {
         width: 400,
         height: 400,
         minWidth: 200,
         minHeight: 200,
//         alwaysOnTop: true,
       }
     });
}

// List of sample notifications. These are further customized 
// in the code according the UI settings.
var notOptions = [
   {
      type : "basic",
      title: "Alert",
      message: "Please enter your name in 10 characters or less.",
      expandedMessage: "",
   },
   {
      type : "image",
      title: "Image Notification",
      message: "Short message plus an image",
   },
   {
      type : "list",
      title: "Setting List Notification",
      message: "List of items in a message",
      items: [
         { title: "Item1", message: "This is item 1"},
         { title: "Item2", message: "This is item 2"},
         { title: "Item3", message: "This is item 3"},
         { title: "Item4", message: "This is item 4"},
         { title: "Item5", message: "This is item 5"},
         { title: "Item6", message: "This is item 6"},
      ]
   },
   {
      type : "progress",
      title: "Progress Notification",
      message: "Short message plus an image",
      progress: 60
   }
   
];

function getKey(key, callback) {
  chrome.storage.local.get(key, function(data) {
    var value = data[key];
    callback(value); // This calls the callback with the correct value
  });
}

function showNotification() {
   var options = null;
   // AlertÇÕ0î‘ñ⁄
   options = notOptions[0];
   options.iconUrl = 'contentSettings.png';
   options.buttons = [];
   chrome.notifications.create("id"+notID++, options, creationCallback);
}

function showNotificationList(tmplist) {
   var options = null;
   // ListÇÕ2î‘ñ⁄
   options = notOptions[2];
   options.iconUrl = 'contentSettings.png';
   options.items = tmplist;
   options.buttons = [];
   chrome.notifications.create("id"+notID++, options, creationCallback);
}

function creationCallback(notID) {
   //log("Succesfully created " + notID + " notification");
}

document.addEventListener('DOMContentLoaded', function() {
  index_comment('This is a Capture Client.');

  setTimeout(function() {
     chrome.storage.local.get("input_chatipaddress", function (value) {
        var port = 50000;
        var address = ('ws://' + value.input_chatipaddress + ':' + port);
        
        ws = new WebSocket(address);
        ws.addEventListener('open', function() {
           index_message_log('Connected', 'ChatLog', 0);
        });
        ws.addEventListener('close', function() {
        index_message_log('Connection lost', 'ChatLog', 0);
        $('input').disabled = true;
    });
  
    ws.addEventListener('message', function(e) {
         var n=1;
         var m=10;
         var accountname = e.data.slice(0,10).replace(/\s+/g, "");
         var comment = e.data.slice(10)
        
         index_message_log(comment, accountname, 0);
        $('log').scrollTop = $('log').scrollHeight;
      });
  });
  $('input_text').addEventListener('keydown', function(e) {
     var target = e.target;
     //index_message_log(target.tagName , 'target.tagName ', 0);
     //index_message_log(target.type , 'target.type ', 0);
     //index_message_log(target.id , 'target.id ', 0);
     if (target.tagName === 'INPUT' && target.type === 'text'){
       switch (target.id) {
       case 'input_text':
          if (ws && ws.readyState == 1 && e.keyCode == 13) {
            ws.send(g_account + this.value);
            this.value = '';
          }
           break;
       case 'ip_address':
          this.value = '';
           break;
       }
    }
  });
    
  $('input_account').addEventListener('keydown', function(e) {
     var target = e.target;
     //index_message_log(target.tagName , 'target.tagName ', 0);
     //index_message_log(target.type , 'target.type ', 0);
     //index_message_log(target.id , 'target.id ', 0);
     if (target.tagName === 'INPUT' && target.type === 'text'){
       switch (target.id) {
       case 'input_account':
          if (e.keyCode == 13) {
             if( this.value.length > 10 ) {
                // ì¸óÕï∂éöêîÇ™10ï∂éöÇÊÇËÇ‡ëΩÇØÇÍÇŒ
                //chrome.alarms.create("test", when:{minute: 0, second: 0, millisecond: 0});
                //windowalert();
                showNotification();
             }
             g_account = ("          " +   this.value).substr(-10);
             var tmpitems = [
                { title: "AccountName", message: g_account},
                { title: "SignalingIP", message: g_SignalingIP},
                { title: "RoomName", message: g_RoomName},
                { title: "ChatIP", message: g_ChatIP},
             ];
             showNotificationList(tmpitems);
             
             index_message_log(g_account , 'AccountName', 0);
             chrome.storage.local.set({'input_account': g_account}, function () {});
             this.value = g_account;
          }
           break;
       }
    }
  });
  $('input_ipaddress').addEventListener('keydown', function(e) {
     var target = e.target;
     //index_message_log(target.tagName , 'target.tagName ', 0);
     //index_message_log(target.type , 'target.type ', 0);
     //index_message_log(target.id , 'target.id ', 0);
     if (target.tagName === 'INPUT' && target.type === 'text'){
       switch (target.id) {
       case 'input_ipaddress':
          if (e.keyCode == 13) {
             g_SignalingIP = this.value;
             var tmpitems = [
                { title: "AccountName", message: g_account},
                { title: "SignalingIP", message: g_SignalingIP},
                { title: "RoomName", message: g_RoomName},
                { title: "ChatIP", message: g_ChatIP},
             ];
             showNotificationList(tmpitems);
             
             index_message_log(g_SignalingIP , 'SignalingServerIP', 0);
             chrome.storage.local.set({'input_ipaddress': g_SignalingIP}, function () {});
             this.value = g_SignalingIP;
          }
           break;
       }
    }
  });
  $('input_roomname').addEventListener('keydown', function(e) {
     var target = e.target;
     //index_message_log(target.tagName , 'target.tagName ', 0);
     //index_message_log(target.type , 'target.type ', 0);
     //index_message_log(target.id , 'target.id ', 0);
     if (target.tagName === 'INPUT' && target.type === 'text'){
       switch (target.id) {
       case 'input_roomname':
          if (e.keyCode == 13) {
             g_RoomName = this.value;
             var tmpitems = [
                { title: "AccountName", message: g_account},
                { title: "SignalingIP", message: g_SignalingIP},
                { title: "RoomName", message: g_RoomName},
                { title: "ChatIP", message: g_ChatIP},
             ];
             showNotificationList(tmpitems);
             
             index_message_log(g_RoomName , 'RoomName', 0);
             chrome.storage.local.set({'input_roomname': g_RoomName}, function () {});
             this.value = g_RoomName;
          }
           break;
       }
    }
  });
  $('input_chatipaddress').addEventListener('keydown', function(e) {
     var target = e.target;
     //index_message_log(target.tagName , 'target.tagName ', 0);
     //index_message_log(target.type , 'target.type ', 0);
     //index_message_log(target.id , 'target.id ', 0);
     if (target.tagName === 'INPUT' && target.type === 'text'){
       switch (target.id) {
       case 'input_chatipaddress':
          if (e.keyCode == 13) {
             g_ChatIP = this.value;
             var tmpitems = [
                { title: "AccountName", message: g_account},
                { title: "SignalingIP", message: g_SignalingIP},
                { title: "RoomName", message: g_RoomName},
                { title: "ChatIP", message: g_ChatIP},
             ];
             showNotificationList(tmpitems);
             
             index_message_log(g_ChatIP , 'ChatServerIP', 0);
             chrome.storage.local.set({'input_chatipaddress': g_ChatIP}, function () {});
             this.value = g_ChatIP;
          }
           break;
       }
    }
  });
  
  g_account =  "          " + 'hoge'.substr(-10);
  g_SignalingIP =  "localhost";
  g_RoomName =  "Global";
  g_ChatIP = "localhost";
  getKey('input_account', get_input_account);
  getKey('input_ipaddress', get_input_ipaddress);
  getKey('input_roomname', get_input_roomname);
  getKey('input_chatipaddress', get_input_chatipaddress);

}, 1e3);
});


//######   Get Strage Value : START    ######
     function get_input_account(input_account){
        if( typeof imput_account != 'undefined' ) {
           var accountname = ("          " +  input_account).substr(-10);
           index_message_log( accountname , 'AccountName', 0);
           $('input_account').value = accountname;
           g_account = accountname;
        }else{
           g_account = "";
           $('input_account').value = g_account;
           chrome.storage.local.set({'input_account': g_account}, function () {});
        }
     }
     
     function get_input_ipaddress(input_ipaddress){
        if( typeof input_ipaddress != 'undefined' ) {
           index_message_log(input_ipaddress , 'SignalingServerIP', 0);
           $('input_ipaddress').value = input_ipaddress;
           g_SignalingIP = input_ipaddress;
        }else{
           g_SignalingIP = "";
           $('input_account').value = g_SignalingIP;
           chrome.storage.local.set({'input_ipaddress': g_SignalingIP}, function () {});
        }
     }
     
     function get_input_roomname(input_roomname){
        if( typeof input_roomname != 'undefined' ) {
           index_message_log(input_roomname , 'RoomName', 0);
           $('input_roomname').value = input_roomname;
           g_RoomName = input_roomname;
        }else{
           g_RoomName = "";
           $('input_account').value = g_RoomName;
           chrome.storage.local.set({'input_roomname': g_RoomName}, function () {});
        }
     }
     
     function get_input_chatipaddress(input_chatipaddress){
        if( typeof input_chatipaddress != 'undefined' ) {
           index_message_log(input_chatipaddress , 'ChatServerIP', 0);
           $('input_chatipaddress').value = input_chatipaddress;
           g_ChatIP = input_chatipaddress;
        }else{
           g_ChatIP = "";
           $('input_account').value = g_ChatIP;
           chrome.storage.local.set({'input_chatipaddress': g_ChatIP}, function () {});
        }
     }
//######   Get Strage Value : END    ######