// TAB B (Answerer)

// STEP 2 (on B): you'll call fromA(...) with A's offer
const pcB = new RTCPeerConnection({
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

pcB.ondatachannel = (e) => {
  const ch = e.channel;
  ch.onopen = () => console.log("✅ [B] DataChannel open");
  ch.onmessage = (ev) => console.log("📩 [B] got:", ev.data);
  window.sendFromB = (text) => ch.send(text);
};

// STEP 5 (later): B will send its candidates to A
pcB.onicecandidate = (event) => {
  if (event.candidate) {
    const msg = {
      type: "candidate",
      candidate: event.candidate,
    };
    console.log("➡️ [B -> A] COPY THIS CANDIDATE:", JSON.stringify(msg));
  } else {
    console.log("[B] ICE gathering finished");
  }
};

// This will be called in STEP 2:
window.fromA = async (msg) => {
  if (msg.type === "offer") {
    console.log("📥 [B] STEP 2 received OFFER from A");

    // STEP 2a: set remote offer
    await pcB.setRemoteDescription({
      type: "offer",
      sdp: msg.sdp,
    });

    // STEP 3 (on B side): create answer
    const answer = await pcB.createAnswer();
    await pcB.setLocalDescription(answer);

    // 👉 This is what you copy back to A as STEP 3
    const answerMsg = {
      type: "answer",
      sdp: answer.sdp,
    };
    console.log("📤 STEP 3 - COPY TO A:", JSON.stringify(answerMsg));
  } else if (msg.type === "candidate") {
    // STEP 4: A sends candidates, B adds them
    await pcB.addIceCandidate(msg.candidate);
    console.log("✅ [B] added candidate from A");
  }
};
