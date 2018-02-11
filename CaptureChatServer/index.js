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

var port = 9999;
document.addEventListener('DOMContentLoaded', function() {
  index_comment('This is a test of an HTTP and WebSocket server. This application is ' +
      'serving its own source code on port ' + port + '. Each client ' +
      'connects to the server on a WebSocket and all messages received on ' +
      'one WebSocket are echoed to all connected clients - i.e. a chat ' +
      'server. Enjoy!');
// FIXME: Wait for 1s so that HTTP Server socket is listening...
setTimeout(function() {
  var address = ('ws://localhost:' + port + '/');
  var ws = new WebSocket(address);
  ws.addEventListener('open', function() {
    index_message_log('Connected', 'ChatLog', 0);
  });
  ws.addEventListener('close', function() {
    index_message_log('Connection lost', 'ChatLog', 0);
    $('input').disabled = true;
  });
  ws.addEventListener('message', function(e) {
    index_message_log(e.data, 'ChatLog', 0);
  });
  $('input').addEventListener('keydown', function(e) {
    if (ws && ws.readyState == 1 && e.keyCode == 13) {
      ws.send(this.value);
      this.value = '';
    }
  });
  //before_connection();
}, 1e3);
});

