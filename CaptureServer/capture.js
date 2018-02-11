
var debug_flg = true;

var localVideo = document.getElementById('local-video');
var localStream = null;  
var mediaConstraints = {'mandatory': {'OfferToReceiveAudio':false, 'OfferToReceiveVideo':false }};

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

var desktop_sharing = false;
var localStream = null;
function toggle() {
    if (!desktop_sharing) {
        chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], onAccessApproved);
    } else {
        desktop_sharing = false;

        if (localStream)
            localStream.stop();
        localStream = null;

        debug_log('Desktop sharing stopped...', 'LOG', 1);
    }
}

function onAccessApproved(desktop_id) {
    if (!desktop_id) {
        log('Desktop Capture access rejected.');
        return;
    }
    desktop_sharing = true;
    //document.querySelector('button').innerHTML = "Disable Capture";
    log("Desktop sharing started.. desktop_id:" + desktop_id );

    navigator.webkitGetUserMedia({
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: desktop_id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
            }
        }
    }, gotStream, getUserMediaError);

    function gotStream(stream) {
        localStream = stream;
        document.querySelector('video').src = URL.createObjectURL(stream);
               
        stream.onended = function() {
            if (desktop_sharing) {
                toggle();
            }
        };
    }


    function getUserMediaError(e) {
      error('getUserMediaError: ' + JSON.stringify(e, null, '---'));
    }
}

  function isLocalStreamStarted() {
    if (localStream) {
      return true;
    }
    else {
      return false;
    }
  }
 
  // -------------- multi connections --------------------
  var MAX_CONNECTION_COUNT = 10;
  var connections = {}; // Connection hash
  function Connection() { // Connection Class
    var self = this;
    var id = "";  // socket.id of partner
    var peerconnection = null; // RTCPeerConnection instance
  }
 
  function getConnection(id) {
    log('getConnection(id=' + id + ')');
    var con = null;
    con = connections[id];
    return con;
  }
 
  function addConnection(id, connection) {
    log('addConnection[id=' + id + ']');
    connections[id] = connection;
  }
 
  function getConnectionCount() {
    var count = 0;
    for (var id in connections) {
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
 
  function deleteConnection(id) {
    delete connections[id];
  }
 
  function stopAllConnections() {
    for (var id in connections) {
      var conn = connections[id];
      conn.peerconnection.close();
      conn.peerconnection = null;
      delete connections[id];
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

function getKey(key, callback) {
  chrome.storage.local.get(key, function(data) {
    var value = data[key];
    callback(value); // This calls the callback with the correct value
  });
}

// use getKey()
function start_signalingserver_connect(input_ipaddress) {
	var signaling_port = 9001;
    var signaling_URL = 'http://'+ input_ipaddress + ':' + signaling_port + '/';
    debug_log('try connection to signaling server = ' + input_ipaddress);
    socket = io.connect(signaling_URL);

    debug_log('try socket.on ');
   // socket: channel connected
   socket.on('connect', onOpened)
        .on('message', onMessage)
        .on('user disconnected', onUserDisconnect);
        
  
   function onOpened(evt) {
     debug_log('socket opened.');
     socketReady = true;

     getKey('input_roomname', socketemit_roomname);
   }

   // socket: accept connection request
   function onMessage(evt) {
     var id = evt.from;
     var target = evt.sendto;
     var conn = getConnection(id);
 
     if (evt.type === 'talk_request') {
       if (! isLocalStreamStarted()) {
         error('local stream not started. ignore request');
         return;
       }
 
       log("receive request, start offer.");
       sendOffer(id);
       return;
     }
     else if (evt.type === 'answer' && isPeerStarted()) {  
       log('Received answer, settinng answer SDP');
       onAnswer(evt);
     } else if (evt.type === 'candidate' && isPeerStarted()) { 
       log('Received ICE candidate...');
       onCandidate(evt);
     }
     else if (evt.type === 'bye') { 
       log("got bye.");
       stopConnection(id);
     }
   }
 
   function onUserDisconnect(evt) {
     log("disconnected");
     if (evt) {
       stopConnection(evt.id);
     }
   }
   
  function onAnswer(evt) {
    log("Received Answer...");
    setAnswer(evt);
  }
  
  function onCandidate(evt) {
   var id = evt.from;
    var conn = getConnection(id);
    if (! conn) {
      error('peerConnection not exist!');
      return;
    }
   
    var candidate = new RTCIceCandidate({sdpMLineIndex:evt.sdpMLineIndex, sdpMid:evt.sdpMid, candidate:evt.candidate});
    log("Received Candidate...");
    conn.peerconnection.addIceCandidate(candidate);
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

 
  function sendSDP(sdp) {
    var text = JSON.stringify(sdp);
    log("---sending sdp text ---");
    //log(text);
 
    // send via socket
    socket.json.send(sdp);
  }
  
  function sendCandidate(candidate) {
    var text = JSON.stringify(candidate);
    log("---sending candidate text ---");
    log(text);
 
    // send via socket
    socket.json.send(candidate);
  }
  
  // ---------------------- video handling -----------------------
  // start local video
  function startVideo() {
    toggle();
  }
 
  // stop local video
  function stopVideo() {
    hangUp();
 
    localVideo.src = "";
    localStream.stop();
    localStream = null;
  }
 
  // ---------------------- connection handling -----------------------
  function prepareNewConnection(id) {
    var pc_config = {"iceServers":[]};
    var peer = null;
    try {
      peer = new webkitRTCPeerConnection(pc_config);
    } catch (e) {
      log("Failed to create PeerConnection, exception: " + e.message);
    }
    var conn = new Connection();
    conn.id = id;
    conn.peerconnection = peer;
    peer.id = id;
    addConnection(id, conn);
 
    // send any ice candidates to the other peer
    peer.onicecandidate = function (evt) {
      if (evt.candidate) {
        log(evt.candidate);
        sendCandidate({type: "candidate", 
                          sendto: conn.id,
                          sdpMLineIndex: evt.candidate.sdpMLineIndex,
                          sdpMid: evt.candidate.sdpMid,
                          candidate: evt.candidate.candidate});
      } else {
        log("ICE event. phase=" + evt.eventPhase);
        //conn.established = true;
      }
    };
 
    log('Adding local stream...');
    peer.addStream(localStream);
 
    return conn;
  }
 
  function sendOffer(id) {
    log('sendOffer(id = ' + id + ')');
    var conn = getConnection(id);
    if (!conn) {
      conn = prepareNewConnection(id);
    }
 
    conn.peerconnection.createOffer(function (sessionDescription) { // in case of success
      conn.peerconnection.setLocalDescription(sessionDescription);
      sessionDescription.sendto = id;
      sendSDP(sessionDescription);
    }, function () { // in case of error
      log("Create Offer failed");
    }, mediaConstraints);
  }
 
  function setAnswer(evt) {
    var id = evt.from;
    var conn = getConnection(id);
    if (! conn) {
       error('peerConnection not exist!');
       return;
    }
    conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt));
  }
  
  // -------- handling user UI event -----
  function tellReady() {
    if (! isLocalStreamStarted()) {
      error("Local stream not running yet. Please [Start Video] or [Start Screen].");
      return;
    }
    if (! socketReady) {
      error("Socket is not connected to server. Please reload and try again.");
      return;
    }
 
    // call others, in same room
    log("tell ready to others in same room, befeore offer");
    socket.json.send({type: "talk_ready"});
  }
 
  
  // stop the connection upon user request
  function hangUp() {
    log("Hang up.");
    socket.json.send({type: "end_talk"});
    stopAllConnections();
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
  
  // e.target: ÉCÉxÉìÉgî≠ê∂åπ 
    if( evt.target.getAttribute("id") == "ButtonCaptureStart" ){
        toggle();
    }
    if( evt.target.getAttribute("id") == "ButtonCaptureStop" ){
      stopVideo();
    }
    if( evt.target.getAttribute("id") == "tellReady" ){
      tellReady();
    }
    if( evt.target.getAttribute("id") == "ButtonSettingClear" ){
      storageClear();
    }
}, false);
