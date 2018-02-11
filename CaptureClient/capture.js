
var debug_flg = false;

function $(id) {
  return document.getElementById(id);
}

function debug_log(msg, tag_name, depth){
   var temptext='';
   if( typeof tag_name === 'undefined' ){
      temptext = msg + '\n';
   }
   else if( typeof depth == 'undefined' ){
     temptext  += '[' + tag_name + ']' +msg + '\n';
   }else{
      var tab='';
      var ii;
      for(ii=0; ii<depth; ii++){
         tab = tab + '   ';
      }
      tab = tab + '';
      temptext = tab + '[' + tag_name + ']' +msg + '\n';
   }

   if(debug_flg){
     $('log').value += temptext;
   }
}

function log(msg, depth){
   var temptext='';
   var tag_name = 'log';
   if( typeof tag_name === 'undefined' ){
      temptext = msg + '\n';
   }
   else if( typeof depth == 'undefined' ){
     temptext  += '[' + tag_name + ']' +msg + '\n';
   }else{
      var tab='';
      var ii;
      for(ii=0; ii<depth; ii++){
         tab = tab + '   ';
      }
      tab = tab + '';
      temptext = tab + '[' + tag_name + ']' +msg + '\n';
   }

   $('log').value += temptext;
}

function error(msg, depth){
   var temptext='';
   var tag_name = 'ERR';
   if( typeof tag_name === 'undefined' ){
      temptext = msg + '\n';
   }
   else if( typeof depth == 'undefined' ){
     temptext  += '[' + tag_name + ']' +msg + '\n';
   }else{
      var tab='';
      var ii;
      for(ii=0; ii<depth; ii++){
         tab = tab + '   ';
      }
      tab = tab + '';
      temptext = tab + '[' + tag_name + ']' +msg + '\n';
   }

   $('log').value += temptext;
}

var remoteVideo = document.querySelector('video');
var constraints = {
  mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
 }
};

function detachVideo(id) {
  if (id) { 
    var conn = getConnection(id);
    if (conn) {
      remoteVideo.pause();
      remoteVideo.src = "";
    }
  }
  else {
    // force detach
    remoteVideo.pause();
    remoteVideo.src = "";
  }
}

// -------------- multi connections --------------------
var MAX_CONNECTION_COUNT = 1;
var connections = {}; // Connection hash
function Connection() { // Connection Class
  var self = this;
  var id = "";  // socket.id of partner
  var peerconnection = null; // RTCPeerConnection instance
}

function getConnection(id) {
  debug_log('getConnection(id=' + id + ')');
  var con = null;
  con = connections[id];
  debug_log('connections[id]=' + connections[id]);
  return con;
}

function addConnection(id, connection) {
  debug_log('addConnection[id=' + id + ']');
  connections[id] = connection;
}

  function getConnectionCount() {
    var count = 0;
    var id;
    for (id in connections) {
      count++;
    }
 
    debug_log('getConnectionCount=' + count);
    return count;
  }
 
  function isConnectPossible() {
    if (getConnectionCount() < MAX_CONNECTION_COUNT)
      return true;
    else
      return false;
  }
 
  function getConnectionIndex(id_to_lookup) {
    var index = 0;
    for (var id in connections) {
      if (id == id_to_lookup) {
        return index;
      }
 
      index++;
    }
 
    // not found
    return -1;
  }
 
  function getConnectionIndex(id_to_lookup) {
    var index = 0;
    for (var id in connections) {
      if (id == id_to_lookup) {
        return index;
      }
 
      index++;
    }
 
    // not found
    return -1;
  }
function stopConnection(id) {
  var conn = connections[id];
  if(conn) {
    log('stop and delete connection with id=' + id);
    conn.peerconnection.close();
    conn.peerconnection = null;
    delete connections[id];
  }
  else {
    log('try to stop connection, but not found id=' + id);
  }
}

function isPeerStarted() {
  if (getConnectionCount() > 0) {
    return true;
  }
  else {
    return false;
  }
}


// ---- socket ------
// create socket
var socketReady = false;
var socket;
var signaling_port = 9001;

function getKey(key, callback) {
  chrome.storage.local.get(key, function(data) {
    var value = data[key];
    callback(value); // This calls the callback with the correct value
  });
}

// use getKey()
function start_signalingserver_connect(input_ipaddress) {
    var signaling_URL = 'http://'+ input_ipaddress + ':' + signaling_port + '/'
    debug_log('try connection to signaling server = ' + input_ipaddress);;
    socket = io.connect(signaling_URL);

    debug_log('try socket.on ');
   // socket: channel connected
   socket.on('connect', onOpened)
        .on('message', onMessage)
        .on('user disconnected', onUserDisconnect);
}

function restart_signalingserver(){
   getKey('input_ipaddress', start_signalingserver_connect);
}

getKey('input_ipaddress', start_signalingserver_connect);

function socketemit_roomname(input_roomname){
  var roomname = input_roomname;
  if( roomname == '' || typeof roomname === 'undefined'){
     roomname = '_defaultroom';
  }
  socket.emit('enter', roomname);
  
  log('enter to ' + roomname);
}

function onOpened(evt) {
  log('socket opened.');
  socketReady = true;

  getKey('input_roomname', socketemit_roomname);
}

// socket: accept connection request
function onMessage(evt) {
  var id = evt.from;
  var target = evt.sendto;
  var conn = getConnection(id);

  debug_log('onMessage() evt.type='+ evt.type);

  if (evt.type === 'talk_ready') {
    if (conn) {
      error('already connected');
      return;  // already connected
    }

    if (isConnectPossible()) {
      socket.json.send({type: "talk_request", sendto: id });
    }
    else {
      error('max connections. so ignore call');
    }
    return;
  }
  else if (evt.type === 'offer') {
    log('Received offer, set offer, sending answer....');
    onOffer(evt);   
  }
  else if (evt.type === 'candidate' && isPeerStarted()) {
    log('Received ICE candidate...');
    onCandidate(evt);
  }
  else if (evt.type === 'end_talk') { 
    log("got talker bye.");
    detachVideo(id); // force detach video
    stopConnection(id);
  }

}

function onUserDisconnect(evt) {
  log("disconnected");
  if (evt) {
    detachVideo(evt.id); // force detach video
    stopConnection(evt.id);
  }
}

function onOffer(evt) {
  debug_log("Received offer...");
  setOffer(evt);
  sendAnswer(evt);
}

function onCandidate(evt) {
  var id = evt.from;
  var conn = getConnection(id);
  if (! conn) {
     error('peerConnection not exist!');
     return;
  }
  
  var candidate = new RTCIceCandidate({sdpMLineIndex:evt.sdpMLineIndex, sdpMid:evt.sdpMid, candidate:evt.candidate});
  debug_log("Received Candidate...");
  conn.peerconnection.addIceCandidate(candidate);
}

function sendSDP(sdp) {
  var text = JSON.stringify(sdp);
  debug_log("---sending sdp text ---");
  //log(text);

  // send via socket
  socket.json.send(sdp);
}

function sendCandidate(candidate) {
  var text = JSON.stringify(candidate);
  debug_log("---sending candidate text ---");
  debug_log(text);

  // send via socket
  socket.json.send(candidate);
}


// ---------------------- connection handling -----------------------
function prepareNewConnection(id) {
  var pc_config = {"iceServers":[]};
  var peer = null;
  try {
    peer = new webkitRTCPeerConnection(pc_config);
  } catch (e) {
    debug_log("Failed to create PeerConnection, exception: " + e.message);
  }
  var conn = new Connection();
  conn.id = id;
  conn.peerconnection = peer;
  peer.id = id;
  addConnection(id, conn);

  // send any ice candidates to the other peer
  peer.onicecandidate = function (evt) {
    if (evt.candidate) {
      debug_log('evt.candidate');
      sendCandidate({type: "candidate", 
                        sendto: conn.id,
                        sdpMLineIndex: evt.candidate.sdpMLineIndex,
                        sdpMid: evt.candidate.sdpMid,
                        candidate: evt.candidate.candidate});
    } else {
      debug_log("on ice event. phase=" + evt.eventPhase);
    }
  };

  //log('Adding local stream...');
  //peer.addStream(localStream);

  peer.addEventListener("addstream", onRemoteStreamAdded, false);
  peer.addEventListener("removestream", onRemoteStreamRemoved, false);

  // when remote adds a stream, hand it on to the local video element
  function onRemoteStreamAdded(event) {
    debug_log("Added remote stream");
    //attachVideo(this.id, event.stream);
    document.querySelector('video').src = URL.createObjectURL(event.stream);
  }

  // when remote removes a stream, remove it from the local video element
  function onRemoteStreamRemoved(event) {
    log("Remove remote stream");
    detachVideo(this.id);
  }

  return conn;
}

function setOffer(evt) {
  var id = evt.from;
  var conn = getConnection(id);
  if (! conn) {
    conn = prepareNewConnection(id);
    conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt));
  }
  else {
    error('peerConnection alreay exist!');
  }
}

function sendAnswer(evt) {
  debug_log('sending Answer. Creating remote session description...' );
  var id = evt.from;
  var conn = getConnection(id);
  if (! conn) {
    error('peerConnection not exist!');
    return;
  }

  conn.peerconnection.createAnswer(function (sessionDescription) { 
    // in case of success
    conn.peerconnection.setLocalDescription(sessionDescription);
    sessionDescription.sendto = id;
    sendSDP(sessionDescription);
  }, function () { // in case of error
    debug_log("Create Answer failed");
  }, constraints);
}

function sendRequest() {
  if (! socketReady) {
    error("Socket is not connected to server. Please reload and try again.");
    return;
  }

  // call others, in same room
  debug_log("send request in same room, ask for offer");
  socket.json.send({type: "talk_request"});

}

// stop the connection upon user request
function hangUp() {
  log("Hang up.");
  socket.json.send({type: "bye"});
  //detachVideo(null);
  //stopAllConnections();
}

function storageClear(){
   chrome.storage.local.clear(function() {
       var error = chrome.runtime.lastError;
       if (error) {
           error(error);
       }
   });
}

document.addEventListener('click', function(evt) {
    if( evt.target.getAttribute("id") == "sendRequest" ){
        sendRequest();
    }
    if( evt.target.getAttribute("id") == "hangUp" ){
      hangUp();
    }
    if( evt.target.getAttribute("id") == "ButtonSettingClear" ){
      storageClear();
    }
}, false);
