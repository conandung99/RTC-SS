/////////////////////////////////////////////////////////////////
// Javascript file used to make a visio call between 2 clients //
/////////////////////////////////////////////////////////////////

//-- Global variables declarations--//
var localVideo;
var remoteVideo;
var guest;
var message;
var url;
var localStream;
var started = false;
var channelReady = false;
var pc;
var connection;
var room;
// Set up audio and video regardless of what devices are present.
var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

  var isVideoMuted = false;
  var isAudioMuted = false;

// var pcConfig = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
var pcConfig = {
	iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  },
  {
   urls: 'stun:ss-turn2.xirsys.com'
 },
 {
  urls: 'stun:numb.viagenie.ca'
},
{
  urls: 'stun:faq.quduiba.com:4478'
},
{
  urls: [
        'turn:webrtcweb.com:7788', // coTURN 7788+8877
        'turn:webrtcweb.com:8877',
        'turn:webrtcweb.com:4455' // restund udp
        ],
        credential: 'muazkh',
        username: 'muazkh'
      },
      {
        urls: [
        "turn:ss-turn2.xirsys.com:80?transport=udp",       
        "turn:ss-turn2.xirsys.com:3478?transport=udp",       
        "turn:ss-turn2.xirsys.com:80?transport=tcp",       
        "turn:ss-turn2.xirsys.com:3478?transport=tcp",       
        "turns:ss-turn2.xirsys.com:443?transport=tcp",       
    "turns:ss-turn2.xirsys.com:5349?transport=tcp" // restund udp
    ],
    credential: "6c9a9b2a-50b1-11e9-ae20-322c48b34491",
    username: "Hf97t7jl8yWOLiiTz2xDhEzWuaFjvETaScZfkHVyOlvAxghSQLcw6mSKrKxwnnk3AAAAAFybq4Fjb25hbmR1bmc5OQ=="
  },
  {
    url: 'turn:faq.quduiba.com:4478',
    credential: 'MzFiMTU3MGM1NDExNTVlZjNhNDk0NjYwODk3MzNmMjA0NzhjODA4Mw==',
    username: '1436436296:048645111'
  },
  {
    url: 'turn:numb.viagenie.ca',
    credential: 'muazkh',
    username: 'webrtc@live.com'
  }
  ]
};
var pcConstraints = {"optional": [{"DtlsSrtpKeyAgreement": true}]};
// var constraints = {
//   video: {
//     mandatory: {
//       chromeMediaSource: 'desktop',
//       maxWidth: screen.width > 1920 ? 1920 : screen.width,
//       maxHeight: screen.height > 1080 ? 1080 : screen.height
//       resolution: 'hd720'
//     },
//     optional: [{ googTemporalLayeredScreencast: true }]
//   }
// };
var constraints = {
  video: {
    cursor: "never",
    frameRate: 120,
    resolution: 'hd720'
  },
  audio: false
}
var offerConstraints = {"optional": [], "mandatory": {}};
var mediaConstraints = {"audio": true, "video": {"mandatory": {}, "optional": []}};
// var turnUrl = 'https://computeengineondemand.appspot.com/turn?username=710350690&key=4080218913';
var turnUrl = 'https://computeengineondemand.appspot.com/turn?username=787340420&key=4080218913';
// var turnUrl = 'https://apprtc.diveinedu.com/turn.php?username=048645111&key=diveinedu';
var stereo = false;
/**
 * The first function to be launched
 * @return {void}
 */
 initialize = function() {
  console.log("Initializing");
  localVideo = $("#localVideo");
  remoteVideo = $("#remoteVideo");
  openChannel();
    //maybeRequestTurn();
    doGetUserMedia();
  };

/**
 * Allow to reset the status in the footer
 * @return {void}
 */
 resetStatus = function() {

    /**
     * if you aren't the guest it provides you a link to invite someone in the footer
     */
     if (!guest) {
      setStatus("<div class=\"alert\">Waiting for someone to join: <a href=\""+window.location.href+"?room="+room+"\">"+window.location.href+"?room="+room+"</a></div>");
    } else {
      setStatus("Initializing...");
    }
  };

/**
 * Set the footer
 * @param {string} state : string to be placed in the footer
 */
 setStatus = function(state) {
  $('#footer').html(state);
};

maybeRequestTurn = function () {
  // for (var i = 0, len = pcConfig.iceServers.length; i < len; i++) {
  //   if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
  //     turnDone = true;
  //     return;
  //   }
  // }
  console.log("Request Turn XMLHttpRequest!");
  // var currentDomain = document.domain;
  // if (currentDomain.search('localhost') === -1 &&
  //     currentDomain.search('apprtc') === -1) {
  //   console.log("localhost || apprtc!");
  //   // Not authorized domain. Try with default STUN instead.
  //   turnDone = true;
  //   return;
  // }

  // No TURN server. Get one from computeengineondemand.appspot.com.
  xmlhttp = new XMLHttpRequest();
  console.log("get XMLHttpRequest!");
  xmlhttp.onreadystatechange = onTurnResult;
  xmlhttp.open('GET', turnUrl, true);
  xmlhttp.send();
};

onTurnResult = function () {
  if (xmlhttp.readyState !== 4)
    return;

  if (xmlhttp.status === 200) {
    var turnServer = JSON.parse(xmlhttp.responseText);
    // Create a turnUri using the polyfill (adapter.js).
    var iceServer = createIceServer(turnServer.uris[0], turnServer.username,
      turnServer.password);
    console.log("Get Turn: " + iceServer);
    pcConfig.iceServers.push(iceServer);
  } else {
    console.log('Request for TURN server failed.');
  }
  // If TURN request failed, continue the call with default STUN.
  turnDone = true;
  maybeStart();
};


/**
 * Declare the socket (websocket) and open it
 * declare the event attached to the socket
 * @return {void}
 */
 var HOST = window.location.href.replace(/^http/, 'ws');
 console.log('Host is : ' + HOST);
// if(location.port == 8080)
// 	HOST = 'ws://localhost';
openChannel = function() {

  connection = new WebSocket(HOST + ':3000/');
// connection = new WebSocket('ws://webrtc-ss.herokuapp.com:9449/');

  // When the connection is open, send some data to the server
  connection.onopen = onChannelOpened;

  // Log errors
  connection.onerror = function (error) {
    console.log('WebSocket Error ' + error);
  };

  // Log messages from the server
  connection.onmessage = onChannelMessage;

  connection.onclose = onChannelClosed;
};

/**
 * get the media (audio or video) of the user
 * @return {void}
 */
 doGetUserMedia = function() {
  navigator.mediaDevices.getDisplayMedia(constraints).then(stream => {
    onUserMediaSuccess(stream);
    console.log('Requested access to local media with mediaConstraints:\n' +
     '  \'' + JSON.stringify(mediaConstraints) + '\'');
  });
  // try {
  //   getUserMedia(constraints, onUserMediaSuccess,
  //               onUserMediaError);
  //   console.log('Requested access to local media with mediaConstraints:\n' +
  //            '  \'' + JSON.stringify(mediaConstraints) + '\'');
  // } catch (e) {
  //   alert('getUserMedia() failed. Is this a WebRTC capable browser?');
  //   console.log('getUserMedia failed with exception: ' + e.message);
  // }
};

/**
 * Callback function for getUserMedia() on success getting the media
 * create an url for the current stream
 * @param  {stream} stream : contains the video and/or audio streams
 * @return {void}
 */
 onUserMediaSuccess = function(stream) {
  console.log("onUserMediaSuccess");
    // Call the polyfill wrapper to attach the media stream to this element.
    attachMediaStream(localVideo[0], stream);
    localVideo.css("opacity", "1");
    localStream = stream;
    // Caller creates PeerConnection.
    if (guest) maybeStart();
  };

/**
 * Callback function for getUserMedia() on fail getting the media
 * @param  {error} error : informations about the error
 * @return {void}
 */
 onUserMediaError = function(error) {
  console.log("Failed to get access to local media. Error code was " + error.code);
  alert("Failed to get access to local media. Error code was " + error.code + ".");
};

/**
 * Verify all parameters and start the peer connection and add the stream to this peer connection
 * @return {void}
 */
 maybeStart = function() {
  if (!started && localStream && channelReady) {
    setStatus("Connecting...");
    console.log("Creating PeerConnection.");
    createPeerConnection();
    console.log("Adding local stream.");
    pc.addStream(localStream);
    started = true;
    if (guest)
      doCall();
  }
};

doCall = function () {
 var constraints = mergeConstraints(offerConstraints, sdpConstraints);
 console.log('Sending offer to peer, with constraints: \n' +
  '  \'' + JSON.stringify(constraints) + '\'.');
    // pc.createOffer(setLocalAndSendMessage, null, constraints);
    pc.createOffer(constraints).then(function(offer) {
    	return setLocalAndSendMessage(offer);
    });
  };

  doAnswer = function () {
    console.log("Sending answer to peer.");
  // pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
  pc.createAnswer(sdpConstraints).then(function(answer) {
  	return setLocalAndSendMessage(answer);
  });
};

mergeConstraints = function (cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
};

setLocalAndSendMessage = function (sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  onSignalingMessage(sessionDescription);
};

/**
 * Set parameter for creating a peer connection and add a callback function for messagin by peer connection
 * @return {void}
 */
 createPeerConnection = function() {
  try {
    // Create an RTCPeerConnection via the polyfill (adapter.js).
    // pc = new RTCPeerConnection(pcConfig, pcConstraints);
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = onIceCandidate;
    console.log('Created RTCPeerConnnection with:\n' +
      '  config: \'' + JSON.stringify(pcConfig) + '\';\n' +
      '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.');
    return;
  }

  pc.onaddstream = onRemoteStreamAdded;
  pc.onremovestream = onRemoteStreamRemoved;
};

/**
 * Function called by the peerConnection method for the signaling process between clients
 * @param  {message} message : generated by the peerConnection API to send SDP message
 * @return {void}
 */
 onSignalingMessage = function(message) {
  console.log("onSignalingMessage " + message);
  message = JSON.stringify(message);
  connection.send(message);
};

/**
 * Call when the user click on the "Hang Up" button
 * Close the peerconnection and tells to the websocket server you're leaving
 * @return {void}
 */
 onHangup = function() {
  console.log("Hanging up.");
  localVideo.css("opacity", "0");
  remoteVideo.css("opacity", "0");
  $("#locallive").addClass('hide');
  $("#remotelive").addClass('hide');
  pc.close();
  pc = null;
  connection.close();
  setStatus("<div class=\"alert alert-info\">You have left the call.</div>");
};

/**
 * Called when the channel with the server is opened
 * if you're the guest the connection is establishing by calling maybeStart()
 * @return {void}
 */
 onChannelOpened = function() {
  console.log('Channel opened.');
  channelReady = true;
  if(location.search.substring(1,5) == "room") {
    room = location.search.substring(6);
    message = JSON.stringify({"type" : "INVITE", "value" : room});
    console.log(message);
    connection.send(message);
    guest =1;
  }
  else{
    message = JSON.stringify({"type" : "GETROOM", "value" : ""});
    console.log(message);
    connection.send(message);
    guest =0;
  }
  if (guest) maybeStart();
};

/**
 * Called when the client receive a message from the websocket server
 * @param  {message} message : SDP message
 * @return {void}
 */
 onChannelMessage = function(message) {
  message = JSON.parse(message.data);
  console.log(message);
  console.log('S->C: ' + message["value"]);

  switch(message["type"]) {
    case "GETROOM" :
    room = message["value"];
    console.log(room);
    resetStatus();
    guest = 0;
    break;
    case "candidate" :
    var candidate = new RTCIceCandidate({
      sdpMLineIndex:message.label,
      candidate:message.candidate
    });

    pc.addIceCandidate(candidate);

    break;
    case "offer" :

      // Callee creates PeerConnection
      if (!guest && !started)
        maybeStart();

      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
      break;
      case "answer" :
      pc.setRemoteDescription(new RTCSessionDescription(message));
      break;
      case "BYE" :
      onChannelBye();
      break;
    }
  };

/**
 * Called when the other client is leaving
 * @return {void}
 */
 onChannelBye = function() {
  console.log('Session terminated.');
  remoteVideo.css("opacity", "0");
  $("#remotelive").addClass('hide');
    //remoteVideo.attr("src",null);
    guest = 0;
    started = false;
    setStatus("<div class=\"alert alert-info\">Your partner have left the call.</div>");
  };

/**
 * log the error
 * @return {void}
 */
 onChannelError = function() {
  console.log('Channel error.');
};

/**
 * log that the channel is closed
 * @return {[type]}
 */
 onChannelClosed = function() {
  console.log('Channel closed.');
};

/**
 * Called when the peer connection is connecting
 * @param  {message} message
 * @return {void}
 */
 onSessionConnecting = function(message) {
  console.log("Session connecting.");
};

/**
 * Called when the session between clients is established
 * @param  {message} message
 * @return {void}
 */
 onSessionOpened = function(message) {
  console.log("Session opened.");
    // Caller creates PeerConnection.
    if (guest) maybeStart();
  };

/**
 * Get the remote stream and add it to the page with an url
 * @param  {event} event : event given by the browser
 * @return {void}
 */
 onRemoteStreamAdded = function(event) {
  console.log("Remote stream added.");
  attachMediaStream(remoteVideo[0], event.stream);
  remoteVideo.css("opacity", "1");
  $("#remotelive").removeClass('hide');
  setStatus("<div class=\"alert alert-success\">Is currently in video conference <button id=\"hangup\" class=\"btn btn-mini btn-danger pull-right\" onclick=\"onHangup()\">Hang Up</button></div>");
};

onIceCandidate = function(event) {
  if (event.candidate) {
    onSignalingMessage({type: 'candidate',
     label: event.candidate.sdpMLineIndex,
     id: event.candidate.sdpMid,
     candidate: event.candidate.candidate});
  } else {
    console.log("End of candidates.");
  }
};

/**
 * Called when the remote stream has been removed
 * @param  {event} event : event given by the browser
 * @return {void}
 */
 onRemoteStreamRemoved = function(event) {
  console.log("Remote stream removed.");
};

// Set Opus as the default audio codec if it's present.
preferOpus = function (sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex = null;

  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('m=audio') !== -1) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === null)
    return sdp;

  // If Opus is available, set it as the default in m line.
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload)
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
};

extractSdp = function (sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return (result && result.length == 2)? result[1]: null;
};

// Set the selected codec to the first in m line.
setDefaultCodec = function (mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    if (elements[i] !== payload)
      newLine[index++] = elements[i];
  }
  return newLine.join(' ');
};

// Strip CN from sdp before CN constraints is ready.
removeCN = function (sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
};
