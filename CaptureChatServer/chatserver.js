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
var port = 50000;
if (http.Server && http.WebSocketServer) {
  // Listen for HTTP connections.
  var server = new http.Server();
  var wsServer = new http.WebSocketServer(server);
  server.listen(port);

  server.addEventListener('request', function(req) {
    var url = req.headers.url;
    if (url == '/')
      url = '/index.html';
    // Serve the pages of this chrome application.
    req.serveUrl(url);
    return true;
  });

  // A list of connected websockets.
  var connectedSockets = [];

  wsServer.addEventListener('request', function(req) {
    index_message_log('request');
    var socket = req.accept();
    connectedSockets.push(socket);

    // When a message is received on one socket, rebroadcast it on all
    // connected sockets.
    socket.addEventListener('message', function(e) {
      index_message_log('[message]'+e.data);
      for (var i = 0; i < connectedSockets.length; i++)
        connectedSockets[i].send(e.data);
    });

    // When a socket is closed, remove it from the list of connected sockets.
    socket.addEventListener('close', function() {
      index_message_log('close');
      for (var i = 0; i < connectedSockets.length; i++) {
        if (connectedSockets[i] == socket) {
          connectedSockets.splice(i, 1);
          break;
        }
      }
    });
    return true;
  });
}