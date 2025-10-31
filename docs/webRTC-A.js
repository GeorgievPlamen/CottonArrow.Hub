const configuration = {
  iceServers: [
    { urls: "stun:localhost:3478" },
    {
      urls: [
        "turn:localhost:3478?transport=udp",
        "turn:localhost:3478?transport=tcp",
      ],
      username: "test",
      credential: "test",
    },
  ],
};

const peerConnection = new RTCPeerConnection(configuration);

// We must create a data channel, otherwise no ICE candidates will be gathered = nothing to send.
const dataChannel = peerConnection.createDataChannel("chat");

dataChannel.addEventListener('message', event => {
  const message = event.data;
  console.log("message: ", message);
  console.log(event);
});

// RTCPeerConnection will search for ICE candidates as the connection to the remote peer is setting up
// Tricle ICE - send as they are gathered - not at completion to reduce setup time
peerConnection.addEventListener("icecandidate", (event) => {
  if (event.candidate) {
    console.log("\n Ice candidate found:");
    console.log(event.candidate); // Send these trough WS
    console.log("\n------------------------");
  }
});

//Once ICE candidates are being received, we should expect the state for our peer connection will eventually change to a connected state.
peerConnection.addEventListener('connectionstatechange', event => {
  console.log("\nOn 'connectionstatechange'");
  console.log("connectionState", peerConnection.connectionState);
  console.log(event);
  console.log("\n------------------------");
  if (peerConnection.connectionState === 'connected') {
    // Peers connected!
    console.log("\nConnected!")
    console.log(event);
    console.log("\n------------------------");
  }
});

const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
console.log(offer);

// Send offer to B
// After getting asnwer from B set remote description

// Answer from B
await peerConnection.setRemoteDescription({
  "sdp": "v=0\r\no=- 6638035031954284144 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:xRG9\r\na=ice-pwd:fzZgoHapoP9WYPAJ0KAgmrNq\r\na=ice-options:trickle\r\na=fingerprint:sha-256 97:5D:79:3D:AA:12:8B:24:1A:11:F4:22:03:4C:B6:BF:67:B7:5D:04:6D:2B:B4:D2:00:ED:ED:CA:71:67:C3:6F\r\na=setup:active\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n",
  "type": "answer"
});

// This should be handled from WS
// Listen for remote ICE candidates and add to local RTCPeerConnection
// MUST be final step (remote description has to be set before this)
// RTCPeerConnection handles the order and connection from the candidates
try {
  const iceCandidate = {
    "candidate": "candidate:1101200126 1 udp 2113937151 23717649-54a3-459d-964c-4f35da78a4f8.local 57586 typ host generation 0 ufrag 5swe network-cost 999",
    "sdpMid": "0",
    "sdpMLineIndex": 0,
    "usernameFragment": "5swe"
  };
  await peerConnection.addIceCandidate(iceCandidate);
} catch (e) {
  console.error("Error adding received ice candidate", e);
}