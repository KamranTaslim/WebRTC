const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const toggleMicButton = document.getElementById("toggleMic");
const toggleVideoButton = document.getElementById("toggleVideo");

const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let localStream;
let peerConnection;

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
    localStream = stream;
    initializePeerConnection();
  })
  .catch((error) => console.error("Error accessing media devices.", error));

function initializePeerConnection() {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));
  peerConnection.ontrack = (event) =>
    (remoteVideo.srcObject = event.streams[0]);
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) socket.emit("ice-candidate", event.candidate);
  };

  socket.on("offer", async (offer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
  });

  socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  });

  socket.on("ice-candidate", (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });

  createOffer();
}

async function createOffer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
}

toggleMicButton.addEventListener("click", () => {
  localStream.getAudioTracks()[0].enabled =
    !localStream.getAudioTracks()[0].enabled;
  toggleMicButton.textContent = localStream.getAudioTracks()[0].enabled
    ? "Mute Mic"
    : "Unmute Mic";
});

toggleVideoButton.addEventListener("click", () => {
  localStream.getVideoTracks()[0].enabled =
    !localStream.getVideoTracks()[0].enabled;
  toggleVideoButton.textContent = localStream.getVideoTracks()[0].enabled
    ? "Stop Video"
    : "Start Video";
});
