// Dark mode toggle
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  body.classList.add("dark-mode");
  themeToggle.textContent = "";
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  if (body.classList.contains("dark-mode")) {
    themeToggle.textContent = "";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "";
    localStorage.setItem("theme", "light");
  }
});

// IndexDB setup
let db;
const DB_NAME = "FaceAuthDB";
const STORE_NAME = "workers";

const request = indexedDB.open(DB_NAME, 3);

request.onerror = (event) => {
  console.error("Database error:", event.target.error);
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const store = db.createObjectStore(STORE_NAME, {
    keyPath: "id",
    autoIncrement: true,
  });

  store.createIndex("name", "name", { unique: false });
  store.createIndex("position", "position", { unique: false });
  store.createIndex("militaryRank", "militaryRank", { unique: false });
  store.createIndex("qkType", "qkType", { unique: false });
  store.createIndex("qrCode", "qrCode", { unique: true });
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
let audioPlayed = false; // Track if audio has been played

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

// Video elementni o'zgartirish
faceVideo.style.maxWidth = "100%";
faceVideo.style.maxHeight = "100%";
faceVideo.style.objectFit = "contain";

// Video streamni to'g'ri qo'yish
async function setupVideoStream() {
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

  faceVideo.srcObject = currentStream;

  faceVideo.addEventListener("loadedmetadata", () => {
    faceVideo.play();

    const container = faceVideo.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    if (containerWidth > 0 && containerHeight > 0) {
      faceVideo.width = containerWidth;
      faceVideo.height = containerHeight;
    }
  });
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
    await setupVideoStream();

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

    // Clear any existing interval
    if (faceDetectionInterval) {
      clearInterval(faceDetectionInterval);
    }

    // Start face detection with a more robust configuration
    faceDetectionInterval = setInterval(async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(
            faceVideo,
            new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.7,
            })
          )
          .withFaceLandmarks();

        if (detection) {
          faceVideo.style.borderColor = "#198754";
          isAuthenticating = true;
          await startFaceAuthentication();
        } else {
          faceVideo.style.borderColor = "#dc3545";
        }
      } catch (error) {
        console.error("Face detection error:", error);
        faceVideo.style.borderColor = "#dc3545";
      }
    }, 1000);
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
    const modelPath = "assets/models/";
    await faceapi.nets.tinyFaceDetector.load(
      modelPath
      // + "tiny_face_detector_model-weights_manifest.json"
    );
    await faceapi.nets.faceLandmark68Net.load(
      modelPath
      // + "face_landmark_68_model-weights_manifest.json"
    );
    await faceapi.nets.faceRecognitionNet.load(
      modelPath
      // + "face_recognition_model-weights_manifest.json"
    );
    await faceapi.nets.ssdMobilenetv1.load(
      modelPath
      // + "ssd_mobilenetv1_model-weights_manifest.json"
    );
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

  // Show face container and hide worker card
  document.getElementById("faceContainer").style.display = "block";
  document.getElementById("workerCardContainer").style.display = "none";

  // Reset authentication state
  isAuthenticating = false;
  audioPlayed = false; // Reset audio played flag

  try {
    await restartCamera();
  } catch (err) {
    console.error("Refresh button error:", err);
    updateResultMessage(
      faceResult,
      "Kamerani qayta ishga tushirishda xatolik yuz berdi",
      false
    );
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
          const workerCard = `
            <div class="d-flex align-items-center justify-content-center" style="width: 100%;">
              <div class="card worker-card mb-4 border-0 shadow-sm flex-grow-1" style="width: 100%;">
                <div class="row g-0 align-items-center">
                  <div class="col-md-3 text-center">
                    <img
                      src="${worker.image}"
                      class="img-fluid rounded-circle"
                      alt="${worker.name}"
                    />
                  </div>
                  <div class="col-md-6">
                    <div class="card-body text-center">
                      <h5 class="card-title">F.I.SH: ${worker.name}</h5>
                      <p class="card-text">
                        <span class="badge bg-primary">Lavozim: ${worker.position}</span>
                        <span class="badge bg-secondary">Harbiy unvon: ${worker.militaryRank}</span>
                      </p>
                      <img
                        src="assets/logos/${worker.qkType}.png"
                        alt="${worker.qkType}"
                        class="img-fluid qk-logo"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
          document.getElementById("workerCardContainer").innerHTML = workerCard;
          document.getElementById("workerCardContainer").style.display =
            "block";

          // Hide face container
          document.getElementById("faceContainer").style.display = "none";

          faceVideo.style.borderColor = "#198754";

          // Play audio only once
          if (!audioPlayed) {
            const audio = new Audio("./assets/audios/welcome.mp3");
            audio.addEventListener("error", (e) => {
              console.error("Audio xatolik:", e.target.error);
            });
            audio.play();
            audioPlayed = true; // Mark audio as played
          }

          // Stop face detection
          if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
          }

          // Show refresh button
          refreshButton.classList.remove("d-none");
        } else {
          updateResultMessage(
            faceResult,
            `Yuz tanilmadi. Eng yaqin moslik: ${matchPercentage}%. Iltimos, ro'yxatdan o'ting.`,
            false
          );
          faceVideo.style.borderColor = "#dc3545";

          // Stop face detection
          if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
          }

          // Show refresh button
          refreshButton.classList.remove("d-none");
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

        // Stop face detection
        if (faceDetectionInterval) {
          clearInterval(faceDetectionInterval);
        }

        // Show refresh button
        refreshButton.classList.remove("d-none");
      };
    } else {
      updateResultMessage(
        faceResult,
        "Yuz aniqlanmadi. Iltimos, qayta urinib ko'ring.",
        false
      );
      faceVideo.style.borderColor = "#dc3545";

      // Stop face detection
      if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
      }

      // Show refresh button
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

    // Stop face detection
    if (faceDetectionInterval) {
      clearInterval(faceDetectionInterval);
    }

    // Show refresh button
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

// Sahifa yopilganda kamerani to'xtatish
window.addEventListener("beforeunload", () => {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
});
