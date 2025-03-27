// Dark mode toggle
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  body.classList.add("dark-mode");
  themeToggle.textContent = "🌙";
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  if (body.classList.contains("dark-mode")) {
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "🌓";
    localStorage.setItem("theme", "light");
  }
});

// IndexDB setup
let db;
const DB_NAME = "FaceAuthDB";
const STORE_NAME = "workers";

const request = indexedDB.open(DB_NAME, 2);

request.onerror = (event) => {
  console.error("Database error:", event.target.error);
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, {
      keyPath: "id",
      autoIncrement: true,
    });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  console.log("Database opened successfully");
};

// Variable declarations
const refreshButton = document.getElementById("refreshButton");
const faceResult = document.getElementById("faceResult");
const faceVideo = document.getElementById("faceVideo");
const faceCanvas = document.getElementById("faceCanvas");

let modelsLoaded = false;
let videoReady = false;
let cameraStarted = false;
let isAuthenticating = false;
let faceDetectionInterval;
let currentStream = null;
let hasCameraPermission = false;

// Kamera ruxsatini olish
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    });
    currentStream = stream;
    hasCameraPermission = true;
    return stream;
  } catch (err) {
    console.error("Kamera ruxsati berilmadi:", err);
    hasCameraPermission = false;
    throw err;
  }
}

// Kamera oqimini qayta ishga tushirish
async function restartCamera() {
  if (!hasCameraPermission) {
    try {
      await requestCameraPermission();
    } catch (err) {
      updateResultMessage(
        faceResult,
        "Kamera ruxsati berilmadi. Iltimos, kamera ruxsatini bering.",
        false
      );
      return;
    }
  }

  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    });
    currentStream = stream;
    faceVideo.srcObject = stream;

    await waitForVideo();
    videoReady = true;
    cameraStarted = true;

    faceCanvas.width = faceVideo.videoWidth;
    faceCanvas.height = faceVideo.videoHeight;

    updateResultMessage(
      faceResult,
      "Kamera muvaffaqiyatli yoqildi. Yuzni aniqlash kutilmoqda...",
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
    refreshButton.classList.remove("d-none");
  }
}

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
    updateResultMessage(faceResult, "Modellar yuklanmoqda...", true);
    await restartCamera();
  } catch (error) {
    console.error("Model yuklashda xatolik:", error);
    setTimeout(loadModels, 2000);
  }
}

// Initialize models on page load
document.addEventListener("DOMContentLoaded", () => {
  loadModels();
});

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

async function checkFacePresence() {
  if (isAuthenticating) return;

  const detection = await faceapi
    .detectSingleFace(faceVideo, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (detection) {
    faceVideo.style.borderColor = "#198754";
    clearInterval(faceDetectionInterval);
    isAuthenticating = true;
    await startFaceAuthentication();
  } else {
    faceVideo.style.borderColor = "#dc3545";
  }
}

// Refresh button event listener
refreshButton.addEventListener("click", async (e) => {
  e.preventDefault();
  refreshButton.classList.add("d-none");
  isAuthenticating = false;
  faceResult.classList.add("d-none");
  await restartCamera();
});

// Sahifa yopilganda kamerani to'xtatish
window.addEventListener("beforeunload", () => {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
});

// Face authentication
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

    const detection = await faceapi
      .detectSingleFace(
        faceVideo,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const currentDescriptor = detection.descriptor;

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
        const workers = request.result;
        let isMatch = false;
        let bestMatch = { distance: 1.0, worker: null };

        if (workers.length === 0) {
          updateResultMessage(
            faceResult,
            "Hech qanday ishchi topilmadi. Iltimos, avval ro'yxatdan o'ting.",
            false
          );
          faceVideo.style.borderColor = "#dc3545";
          refreshButton.classList.remove("d-none");
          return;
        }

        for (const worker of workers) {
          if (worker.faceDescriptor) {
            const distance = faceapi.euclideanDistance(
              currentDescriptor,
              new Float32Array(worker.faceDescriptor)
            );

            if (distance < bestMatch.distance) {
              bestMatch = {
                distance: distance,
                worker: worker,
              };
            }

            if (distance < 0.4) {
              isMatch = true;
              break;
            }
          }
        }

        const matchPercentage = Math.round((1 - bestMatch.distance) * 100);

        if (isMatch && matchPercentage > 60) {
          const worker = bestMatch.worker;
          updateResultMessage(
            faceResult,
            `Yuz tasdiqlandi! Xush kelibsiz, ${worker.name}! (Lavozim: ${worker.position}, Harbiy unvon: ${worker.militaryRank}, QK turi: ${worker.qkType}, Moslik: ${matchPercentage}%)`,
            true
          );
          faceVideo.style.borderColor = "#198754";
          const audio = new Audio("./assets/audios/welcome.mp3");
          audio.addEventListener("error", (e) => {
            console.error("Audio xatolik:", e.target.error);
          });
          audio.play();
        } else {
          updateResultMessage(
            faceResult,
            `Yuz tanilmadi. Eng yaqin moslik: ${matchPercentage}%. Iltimos, ro'yxatdan o'ting.`,
            false
          );
          faceVideo.style.borderColor = "#dc3545";
        }
        refreshButton.classList.remove("d-none");
      };

      request.onerror = () => {
        console.error("Database error:", request.error);
        updateResultMessage(
          faceResult,
          "Ma'lumotlar bazasidan o'qishda xatolik",
          false
        );
        faceVideo.style.borderColor = "#dc3545";
        refreshButton.classList.remove("d-none");
      };
    } else {
      updateResultMessage(
        faceResult,
        "Yuz aniqlanmadi. Iltimos, qayta urinib ko'ring.",
        false
      );
      faceVideo.style.borderColor = "#dc3545";
      refreshButton.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Authentication error:", error);
    updateResultMessage(
      faceResult,
      "Autentifikatsiyada xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
      false
    );
    faceVideo.style.borderColor = "#dc3545";
    refreshButton.classList.remove("d-none");
  }
}

// Update result message styling
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
