// IndexDB setup
let db;
const DB_NAME = "FaceAuthDB";
const STORE_NAME = "faceDescriptors";

const request = indexedDB.open(DB_NAME, 1);

request.onerror = (event) => {
  console.error("Database error:", event.target.error);
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, { keyPath: "id" });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  console.log("Database opened successfully");
};

// Variable declarations
const faceIdButton = document.getElementById("faceIdButton");
const registerButton = document.getElementById("registerButton");
const startCameraButton = document.getElementById("startCameraButton");
const faceResult = document.getElementById("faceResult");
const faceVideo = document.getElementById("faceVideo");
const faceCanvas = document.getElementById("faceCanvas");
const video = document.getElementById("video");
const canvas = document.getElementById("qrCanvas");
const canvasContext = canvas.getContext("2d", {
  willReadFrequently: true,
});
const resultElement = document.getElementById("result");

let modelsLoaded = false;
let videoReady = false;
let cameraStarted = false;

// Load face-api.js models
async function loadModels() {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
      ),
      faceapi.nets.faceLandmark68Net.loadFromUri(
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
      ),
      faceapi.nets.faceRecognitionNet.loadFromUri(
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
      ),
      faceapi.nets.ssdMobilenetv1.loadFromUri(
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
      ),
    ]);
    modelsLoaded = true;
    startCameraButton.disabled = false;
    updateResultMessage(
      faceResult,
      "Modellar yuklandi. Kamerani yoqish tugmasini bosing",
      true
    );
  } catch (error) {
    console.error("Model yuklashda xatolik:", error);
    setTimeout(loadModels, 2000);
  }
}

// Initialize models on page load
document.addEventListener("DOMContentLoaded", () => {
  loadModels();
});

let faceDetectionInterval;

async function waitForVideo() {
  return new Promise((resolve) => {
    if (faceVideo.readyState >= 2) {
      resolve();
    } else {
      faceVideo.onloadeddata = () => {
        resolve();
      };
    }
  });
}

// Add event listener for start camera button
startCameraButton.addEventListener("click", async () => {
  if (!cameraStarted) {
    startCameraButton.textContent = "Kamera yuklanmoqda...";
    startCameraButton.disabled = true;
    await startFaceDetection();
  }
});

async function startFaceDetection() {
  if (!modelsLoaded) {
    console.log("Modellar yuklanmagan, qayta urinilmoqda...");
    setTimeout(startFaceDetection, 1000);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    });
    faceVideo.srcObject = stream;

    await waitForVideo();
    videoReady = true;
    cameraStarted = true;

    faceCanvas.width = faceVideo.videoWidth;
    faceCanvas.height = faceVideo.videoHeight;

    // Enable buttons after camera is ready
    registerButton.disabled = false;
    faceIdButton.disabled = false;
    startCameraButton.textContent = "Kamera Yoqildi";
    updateResultMessage(
      faceResult,
      "Kamera muvaffaqiyatli yoqildi. Endi yuzni ro'yxatdan o'tkazish yoki autentifikatsiya qilish mumkin",
      true
    );

    faceDetectionInterval = setInterval(checkFacePresence, 1000);
  } catch (err) {
    console.error("Kamerani ishga tushirishda xatolik:", err);
    updateResultMessage(
      faceResult,
      "Kamerani ishga tushirishda xatolik. Qayta urinilmoqda...",
      false
    );
    startCameraButton.disabled = false;
    startCameraButton.textContent = "Kamerani Yoqish";
    setTimeout(startFaceDetection, 2000);
  }
}

async function checkFacePresence() {
  const detection = await faceapi
    .detectSingleFace(faceVideo, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (detection) {
    faceVideo.style.borderColor = "#198754"; // Bootstrap success color
  } else {
    faceVideo.style.borderColor = "#dc3545"; // Bootstrap danger color
  }
}

let isAuthenticating = false;

// Add event listener for authentication button
faceIdButton.addEventListener("click", async () => {
  if (!isAuthenticating) {
    isAuthenticating = true;
    faceIdButton.textContent = "Tekshirilmoqda...";
    await startFaceAuthentication();
  }
});

// Face registration functionality
registerButton.addEventListener("click", async () => {
  if (!videoReady) {
    updateResultMessage(
      faceResult,
      "Video tayyor emas. Iltimos, kamera ishga tushishini kuting",
      false
    );
    return;
  }

  try {
    const displaySize = {
      width: faceVideo.videoWidth,
      height: faceVideo.videoHeight,
    };

    // Update canvas dimensions
    faceCanvas.width = displaySize.width;
    faceCanvas.height = displaySize.height;

    const detection = await faceapi
      .detectSingleFace(faceVideo)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const descriptor = Array.from(detection.descriptor);

      // Draw detections and landmarks
      const detections = await faceapi
        .detectAllFaces(faceVideo)
        .withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = faceCanvas.getContext("2d");
      ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

      faceapi.draw.drawDetections(faceCanvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(faceCanvas, resizedDetections);

      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const faceData = {
        id: Date.now(),
        descriptor: descriptor,
        timestamp: new Date().toISOString(),
      };

      const addRequest = store.add(faceData);

      addRequest.onsuccess = () => {
        updateResultMessage(
          faceResult,
          "Yuz muvaffaqiyatli ro'yxatdan o'tkazildi!",
          true
        );
        faceVideo.style.borderColor = "#198754";
        console.log("Stored face data:", faceData);
      };

      addRequest.onerror = () => {
        updateResultMessage(
          faceResult,
          "Ro'yxatdan o'tkazishda xatolik yuz berdi",
          false
        );
        faceVideo.style.borderColor = "#dc3545";
      };
    } else {
      updateResultMessage(
        faceResult,
        "Yuz aniqlanmadi. Iltimos, qayta urinib ko'ring.",
        false
      );
      faceVideo.style.borderColor = "#dc3545";
    }
  } catch (error) {
    console.error("Registration error:", error);
    updateResultMessage(
      faceResult,
      "Ro'yxatdan o'tkazishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
      false
    );
    faceVideo.style.borderColor = "#dc3545";
  }
});

// Update face authentication
async function startFaceAuthentication() {
  if (!videoReady) {
    updateResultMessage(
      faceResult,
      "Video tayyor emas. Iltimos, kamera ishga tushishini kuting",
      false
    );
    return;
  }

  try {
    const displaySize = {
      width: faceVideo.videoWidth,
      height: faceVideo.videoHeight,
    };

    faceCanvas.width = displaySize.width;
    faceCanvas.height = displaySize.height;

    // Use more accurate face detection options
    const detection = await faceapi
      .detectSingleFace(
        faceVideo,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const currentDescriptor = detection.descriptor;

      // Draw detections and landmarks
      const detections = await faceapi
        .detectAllFaces(
          faceVideo,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 })
        )
        .withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = faceCanvas.getContext("2d");
      ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

      faceapi.draw.drawDetections(faceCanvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(faceCanvas, resizedDetections);

      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const storedFaces = request.result;
        let isMatch = false;
        let bestMatch = { distance: 1.0 };

        console.log("Stored faces count:", storedFaces.length);

        if (storedFaces.length === 0) {
          updateResultMessage(
            faceResult,
            "Hech qanday yuz topilmadi. Iltimos, avval ro'yxatdan o'ting.",
            false
          );
          faceVideo.style.borderColor = "#dc3545";
          return;
        }

        for (const face of storedFaces) {
          const distance = faceapi.euclideanDistance(
            currentDescriptor,
            new Float32Array(face.descriptor)
          );

          console.log("Face match distance:", distance);

          if (distance < bestMatch.distance) {
            bestMatch = {
              distance: distance,
              timestamp: face.timestamp,
            };
          }

          // More strict threshold (0.4 instead of 0.5)
          // Additional check for minimum confidence
          if (distance < 0.4) {
            isMatch = true;
            break;
          }
        }

        const matchPercentage = Math.round((1 - bestMatch.distance) * 100);

        if (isMatch && matchPercentage > 60) {
          const matchTime = new Date(bestMatch.timestamp).toLocaleString();
          updateResultMessage(
            faceResult,
            `Yuz tasdiqlandi! Xush kelibsiz! (Ro'yxatdan o'tgan vaqt: ${matchTime}, Moslik: ${matchPercentage}%)`,
            true
          );
          faceVideo.style.borderColor = "#198754";
        } else {
          updateResultMessage(
            faceResult,
            `Yuz tanilmadi. Eng yaqin moslik: ${matchPercentage}%. Iltimos, ro'yxatdan o'ting.`,
            false
          );
          faceVideo.style.borderColor = "#dc3545";
        }
      };

      request.onerror = () => {
        console.error("Database error:", request.error);
        updateResultMessage(
          faceResult,
          "Ma'lumotlar bazasidan o'qishda xatolik",
          false
        );
        faceVideo.style.borderColor = "#dc3545";
      };
    } else {
      updateResultMessage(
        faceResult,
        "Yuz aniqlanmadi. Iltimos, qayta urinib ko'ring.",
        false
      );
      faceVideo.style.borderColor = "#dc3545";
    }
  } catch (error) {
    console.error("Authentication error:", error);
    updateResultMessage(
      faceResult,
      "Autentifikatsiyada xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
      false
    );
    faceVideo.style.borderColor = "#dc3545";
  } finally {
    isAuthenticating = false;
    faceIdButton.textContent = "Authenticate Face";
  }
}

// QR Code Scanning
const qrButton = document.getElementById("qrButton");
let qrScanning = false;

qrButton.addEventListener("click", () => {
  if (!qrScanning) {
    startQRScanning();
    qrButton.textContent = "Stop QR Scanning";
    video.style.display = "block";
  } else {
    stopQRScanning();
    qrButton.textContent = "Start QR Code Scanning";
    video.style.display = "none";
  }
  qrScanning = !qrScanning;
});

function startQRScanning() {
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function (stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true);
      video.play();
      requestAnimationFrame(tick);
    })
    .catch(function (error) {
      console.error("Error accessing camera:", error);
      updateResultMessage(
        resultElement,
        "Kamerani ishga tushirishda xatolik yuz berdi",
        false
      );
    });
}

function stopQRScanning() {
  if (video.srcObject) {
    video.srcObject.getVideoTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
  updateResultMessage(resultElement, "", false);
}

function tick() {
  if (!qrScanning) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      updateResultMessage(resultElement, `QR Code: ${code.data}`, true);
      stopQRScanning();
      qrButton.textContent = "Start QR Code Scanning";
      qrScanning = false;
      video.style.display = "none";
    } else {
      requestAnimationFrame(tick);
    }
  } else {
    requestAnimationFrame(tick);
  }
}

// Update result message styling using Bootstrap classes
function updateResultMessage(element, text, isSuccess) {
  element.textContent = text;
  if (text) {
    element.classList.remove("d-none");
    element.classList.remove("alert-success", "alert-danger");
    element.classList.add(isSuccess ? "alert-success" : "alert-danger");
  } else {
    element.classList.add("d-none");
  }
}
