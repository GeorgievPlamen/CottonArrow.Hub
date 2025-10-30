// TAB A (Offerer)

// STEP 1: create PC and datachannel
const pcA = new RTCPeerConnection({
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
});

const dcA = pcA.createDataChannel("chat");
dcA.onopen = () => console.log("✅ [A] DataChannel open");
dcA.onmessage = (e) => console.log("📩 [A] got:", e.data);

// STEP 4 (later): A will send candidates to B
pcA.onicecandidate = (event) => {
  if (event.candidate) {
    const msg = {
      type: "candidate",
      candidate: event.candidate,
    };
    console.log("➡️ [A -> B] COPY THIS CANDIDATE:", JSON.stringify(msg));
  } else {
    console.log("[A] ICE gathering finished");
  }
};

// STEP 1 (continued): A creates offer and shows it
const offer = await pcA.createOffer();
await pcA.setLocalDescription(offer);

// 👉 THIS is what you copy to B as STEP 2
const offerMsg = {
  type: "offer",
  sdp: offer.sdp,
};
console.log("📤 STEP 2 - COPY TO B:", JSON.stringify(offerMsg));

// STEP 3 will be done by calling window.fromB(...) after B replies
window.fromB = async (msg) => {
  if (msg.type === "answer") {
    // STEP 3: paste B's answer here
    await pcA.setRemoteDescription({
      type: "answer",
      sdp: msg.sdp,
    });
    console.log("✅ [A] STEP 3 done: remote ANSWER set");
  } else if (msg.type === "candidate") {
    // STEP 5: B sends candidates, A adds them
    await pcA.addIceCandidate(msg.candidate);
    console.log("✅ [A] added candidate from B");
  }
};

// helper after it's connected
window.sendFromA = (text) => dcA.send(text);
