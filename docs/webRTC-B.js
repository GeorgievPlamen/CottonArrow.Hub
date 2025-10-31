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

let dataChannel;

peerConnection.addEventListener('datachannel', event => {
  dataChannel = event.channel;

  dataChannel.send("Hello from B");

  dataChannel.addEventListener('message', event => {
    const message = event.data;
    console.log("message: ", message);
    console.log(event);
  });
});

// Paste offer from A here
const offerFromA = new RTCSessionDescription({
  "sdp": "v=0\r\no=- 3139971188289383210 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:5swe\r\na=ice-pwd:zo2T+1neompxy3byyQhCLRLm\r\na=ice-options:trickle\r\na=fingerprint:sha-256 3C:11:A6:D4:AE:2D:03:66:87:E4:90:9E:84:26:C8:C1:F4:07:B6:9E:97:95:E4:78:23:8A:BB:07:5C:03:2C:BD\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n",
  "type": "offer"
});

peerConnection.setRemoteDescription(offerFromA);
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);
console.log(answer);

// Back to A