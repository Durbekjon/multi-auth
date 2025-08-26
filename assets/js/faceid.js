// FaceID functionality
// All theme toggle functionality has been removed

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
const statusIndicator = document.getElementById("statusIndicator");
const scanningOverlay = document.getElementById("scanningOverlay");
const cameraPreview = document.getElementById("cameraPreview");

let modelsLoaded = false;
let videoReady = false;
let cameraStarted = false;
let isAuthenticating = false;
let faceDetectionInterval;
let currentStream = null;
let hasCameraPermission = false;
let audioPlayed = false; // Track if audio has been played

// UI Helper Functions
function setStatusIndicator(active) {
  if (statusIndicator) {
    statusIndicator.classList.toggle('active', active);
  }
}

function setScanningState(scanning) {
  if (scanningOverlay) {
    scanningOverlay.classList.toggle('scanning', scanning);
  }
  if (cameraPreview) {
    cameraPreview.classList.toggle('scanning', scanning);
  }
}

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
      "Kamera tayyor. Yuzingizni kameraga ko'rsating...",
      true
    );

    // Set scanning state
    setScanningState(true);

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
          updateResultMessage(faceResult, "Yuz aniqlandi! Tekshirilmoqda...", false, true);
          setScanningState(false);
          setStatusIndicator(true);
          isAuthenticating = true;
          await startFaceAuthentication();
        } else {
          if (!isAuthenticating) {
            setScanningState(true);
            setStatusIndicator(false);
          }
        }
      } catch (error) {
        console.error("Face detection error:", error);
        setScanningState(false);
        setStatusIndicator(false);
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
    updateResultMessage(faceResult, "AI modellar yuklanmoqda...", false, true);
    
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
    updateResultMessage(faceResult, "Modellar yuklandi. Kamera ishga tushirilmoqda...", false, true);
    await restartCamera();
  } catch (error) {
    console.error("Model yuklashda xatolik:", error);
    updateResultMessage(faceResult, "Model yuklashda xatolik. Qayta urinilmoqda...", false, true);
    setTimeout(loadModels, 2000);
  }
}

// Initialize models on page load
document.addEventListener("DOMContentLoaded", () => {
  // Set initial UI state
  setScanningState(false);
  setStatusIndicator(false);
  updateResultMessage(faceResult, "Sistema ishga tushirilmoqda...", false, true);
  
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
  
  // Reset UI state
  setScanningState(false);
  setStatusIndicator(false);

  try {
    updateResultMessage(faceResult, "Qayta ishga tushirilmoqda...", false, true);
    await restartCamera();
  } catch (err) {
    console.error("Refresh button error:", err);
    updateResultMessage(
      faceResult,
      "Kamerani qayta ishga tushirishda xatolik yuz berdi",
      false
    );
    setScanningState(false);
    setStatusIndicator(false);
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
          
          // Stop scanning and show success
          setScanningState(false);
          setStatusIndicator(true);
          
          updateResultMessage(
            faceResult,
            `✅ Autentifikatsiya muvaffaqiyatli! Xush kelibsiz, ${worker.name}!`,
            true
          );
          
          const workerCard = `
            <div class="worker-card-modern">
              <div class="card-body text-center p-4">
                <div class="success-badge mb-3">
                  <i class="bi bi-check-circle-fill me-2"></i>
                  Tasdiqlandi • ${matchPercentage}% moslik
                </div>
                
                <img
                  src="${worker.image}"
                  class="worker-avatar"
                  alt="${worker.name}"
                />
                
                <h3 class="card-title mb-3">${worker.name}</h3>
                
                <div class="row text-center mb-3">
                  <div class="col-md-6 mb-2">
                    <div class="badge bg-primary fs-6 p-2">
                      <i class="bi bi-person-badge me-1"></i>
                      ${worker.position}
                    </div>
                  </div>
                  <div class="col-md-6 mb-2">
                    <div class="badge bg-success fs-6 p-2">
                      <i class="bi bi-award me-1"></i>
                      ${worker.militaryRank}
                    </div>
                  </div>
                </div>
                
                <div class="d-flex justify-content-center align-items-center">
                  <img
                    src="assets/logos/${worker.qkType}.png"
                    alt="${worker.qkType}"
                    class="img-fluid"
                    style="max-width: 80px; max-height: 80px; border-radius: 10px;"
                  />
                  <div class="ms-3 text-start">
                    <small class="text-muted d-block">QK turi</small>
                    <strong>${worker.qkType}</strong>
                  </div>
                </div>
                
                <div class="mt-3 text-muted">
                  <small>
                    <i class="bi bi-clock me-1"></i>
                    ${new Date().toLocaleString('uz-UZ')}
                  </small>
                </div>
              </div>
            </div>
          `;
          
          const workerContainer = document.getElementById("workerCardContainer");
          workerContainer.innerHTML = workerCard;
          workerContainer.style.display = "block";
          workerContainer.classList.add("worker-display");

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
          // Stop scanning and show failure
          setScanningState(false);
          setStatusIndicator(false);
          
          updateResultMessage(
            faceResult,
            `❌ Yuz tanilmadi. Eng yaqin moslik: ${matchPercentage}%. Iltimos, ro'yxatdan o'ting yoki qayta urinib ko'ring.`,
            false
          );

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

// Update result message styling with enhanced UI
function updateResultMessage(element, text, isSuccess, showSpinner = false) {
  if (!element) return;
  
  // Clear existing content
  element.innerHTML = '';
  
  // Add spinner if needed
  if (showSpinner) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    element.appendChild(spinner);
  }
  
  // Add text
  const textNode = document.createTextNode(text);
  element.appendChild(textNode);
  
  if (text) {
    element.classList.remove("d-none");
    element.classList.remove("alert-success", "alert-danger", "alert-info", "alert-warning");
    
    if (showSpinner) {
      element.classList.add("alert-info");
    } else {
      element.classList.add(isSuccess ? "alert-success" : "alert-danger");
    }
  } else {
    element.classList.add("d-none");
  }
  
  // Update status indicator
  setStatusIndicator(isSuccess && !showSpinner);
}

// Sahifa yopilganda kamerani to'xtatish
window.addEventListener("beforeunload", () => {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
});
