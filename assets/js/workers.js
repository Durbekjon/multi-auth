const tinyFaceDetectorModel = {
  modelTopology: [
    {
      weights: [
        {
          name: "conv0/filters",
          shape: [3, 3, 3, 16],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.009007044399485869,
            min: -1.2069439495311063,
          },
        },
        {
          name: "conv0/bias",
          shape: [16],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.005263455241334205,
            min: -0.9211046672334858,
          },
        },
        {
          name: "conv1/depthwise_filter",
          shape: [3, 3, 16, 1],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.004001977630690033,
            min: -0.5042491814669441,
          },
        },
        {
          name: "conv1/pointwise_filter",
          shape: [1, 1, 16, 32],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.013836609615999109,
            min: -1.411334180831909,
          },
        },
        {
          name: "conv1/bias",
          shape: [32],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.0015159862590771096,
            min: -0.30926119685173037,
          },
        },
        {
          name: "conv2/depthwise_filter",
          shape: [3, 3, 32, 1],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.002666276225856706,
            min: -0.317286870876948,
          },
        },
        {
          name: "conv2/pointwise_filter",
          shape: [1, 1, 32, 64],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.015265831292844286,
            min: -1.6792414422128714,
          },
        },
        {
          name: "conv2/bias",
          shape: [64],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.0020280554598453,
            min: -0.37113414915168985,
          },
        },
        {
          name: "conv3/depthwise_filter",
          shape: [3, 3, 64, 1],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.006100742489683862,
            min: -0.8907084034938438,
          },
        },
        {
          name: "conv3/pointwise_filter",
          shape: [1, 1, 64, 128],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.016276211832083907,
            min: -2.0508026908425725,
          },
        },
        {
          name: "conv3/bias",
          shape: [128],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.003394414279975143,
            min: -0.7637432129944072,
          },
        },
        {
          name: "conv4/depthwise_filter",
          shape: [3, 3, 128, 1],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.006716050119961009,
            min: -0.8059260143953211,
          },
        },
        {
          name: "conv4/pointwise_filter",
          shape: [1, 1, 128, 256],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.021875603993733724,
            min: -2.8875797271728514,
          },
        },
        {
          name: "conv4/bias",
          shape: [256],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.0041141652009066415,
            min: -0.8187188749804216,
          },
        },
        {
          name: "conv5/depthwise_filter",
          shape: [3, 3, 256, 1],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.008423839597141042,
            min: -0.9013508368940915,
          },
        },
        {
          name: "conv5/pointwise_filter",
          shape: [1, 1, 256, 512],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.030007277283014035,
            min: -3.8709387695088107,
          },
        },
        {
          name: "conv5/bias",
          shape: [512],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.008402082966823203,
            min: -1.4871686851277068,
          },
        },
        {
          name: "conv8/filters",
          shape: [1, 1, 512, 25],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.028336129469030042,
            min: -4.675461362389957,
          },
        },
        {
          name: "conv8/bias",
          shape: [25],
          dtype: "float32",
          quantization: {
            dtype: "uint8",
            scale: 0.002268134028303857,
            min: -0.41053225912299807,
          },
        },
      ],
      paths: ["tiny_face_detector_model-shard1"],
    },
  ],
  weightSpecs: [
    // bu "weightsManifest"[0].weights
  ],
  weightData: new Uint8Array([
    /* ... */
  ]).buffer,
};

let modelsLoaded = false;

async function loadModels() {
  try {
    const modelPath = "assets/models/";
    await faceapi.nets.tinyFaceDetector.load(
      modelPath + "tiny_face_detector_model-weights_manifest.json"
    );
    await faceapi.nets.faceLandmark68Net.load(
      modelPath + "face_landmark_68_model-weights_manifest.json"
    );
    await faceapi.nets.faceRecognitionNet.load(
      modelPath + "face_recognition_model-weights_manifest.json"
    );
    await faceapi.nets.ssdMobilenetv1.load(
      modelPath + "ssd_mobilenetv1_model-weights_manifest.json"
    );
    modelsLoaded = true;
    console.log("Face API modellari yuklandi");
  } catch (error) {
    console.error("Face API modellarini yuklashda xatolik:", error);
    setTimeout(loadModels, 2000);
  }
}

// Sahifa yuklanganda modellarni yuklash
document.addEventListener("DOMContentLoaded", () => {
  loadModels();
});
// IndexedDB setup
let db;
const DB_NAME = "FaceAuthDB";
const STORE_NAME = "workers";
const DB_VERSION = 3; // Versiyani oshiramiz

const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = (event) => {
    console.error("Database error:", event.target.error);
    reject(event.target.error);
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    console.log("Database upgrade needed");

    // Eski store ni o'chirib, yangisini yaratamiz
    if (db.objectStoreNames.contains(STORE_NAME)) {
      db.deleteObjectStore(STORE_NAME);
    }

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
    resolve(db);
  };
});

async function getAllWorkers() {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addWorker(worker) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request2 = store.getAll();
    request2.onsuccess = () => {
      const data = request2.result;
      const qrCode =
        data.length > 0 ? data[data.length - 1].qrCode + 1 : 130250;
      worker.qrCode = qrCode;
      console.log(worker);
      const request = store.add(worker);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    };

    request2.onerror = () => reject(request2.error);
  });
}

async function updateWorker(worker) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(worker);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteWorkerById(workerId) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(workerId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// UI Elements
const searchInput = document.getElementById("searchInput");
const loadingSpinner = document.getElementById("loadingSpinner");
const paginationContainer = document.getElementById("paginationContainer");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const paginationInfo = document.getElementById("paginationInfo");

// Pagination state
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let filteredWorkers = [];
let workers = [];

function createWorkerCard(worker) {
  return `
          <tr>
            <td>
              <img src="${worker.image}"
                   alt="${worker.name}"
                   class="rounded-circle"
                   style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${worker.name}</td>
            <td>${worker.position}</td>
            <td>${worker.militaryRank}</td>
            <td>${worker.qkType}</td>
            <td>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" onclick="viewQRCode(${worker.id})" title="QR kodni ko'rish">
                  <i class="bi bi-qr-code"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="updateFaceData(${worker.id})" title="Yuz ma'lumotlarini yangilash">
                  <i class="bi bi-person-bounding-box"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" onclick="editWorker(${worker.id})" title="Tahrirlash">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteWorker(${worker.id})" title="O'chirish">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
}

function updatePaginationInfo() {
  const totalItems = filteredWorkers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  paginationInfo.textContent = `${startItem}-${endItem} / ${totalItems}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;
}

async function renderWorkers(workersToRender = workers) {
  loadingSpinner.classList.add("active");

  try {
    if (!workersToRender.length) {
      workersToRender = await getAllWorkers();
      workers = workersToRender;
    }

    filteredWorkers = workersToRender;
    const totalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE);

    if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageWorkers = filteredWorkers.slice(start, end);

    const container = document.getElementById("workersTableBody");
    container.innerHTML = pageWorkers.length
      ? pageWorkers.map((worker) => createWorkerCard(worker)).join("")
      : '<tr><td colspan="6" class="text-center"><h3>Ishchilar topilmadi</h3></td></tr>';

    updatePaginationInfo();
  } catch (error) {
    console.error("Error rendering workers:", error);
    const container = document.getElementById("workersTableBody");
    container.innerHTML =
      '<tr><td colspan="6" class="text-center"><h3>Ma\'lumotlarni yuklashda xatolik yuz berdi</h3></td></tr>';
  } finally {
    loadingSpinner.classList.remove("active");
  }
}

// Pagination event listeners
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderWorkers(filteredWorkers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderWorkers(filteredWorkers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Search with debounce
let searchTimeout;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  loadingSpinner.classList.add("active");

  searchTimeout = setTimeout(async () => {
    const searchTerm = e.target.value.toLowerCase();
    const allWorkers = await getAllWorkers();
    const filtered = allWorkers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(searchTerm) ||
        worker.position.toLowerCase().includes(searchTerm) ||
        worker.militaryRank.toLowerCase().includes(searchTerm) ||
        worker.qkType.toLowerCase().includes(searchTerm)
    );

    currentPage = 1;
    renderWorkers(filtered);
  }, 300);
});

// Action functions
async function viewQRCode(workerId) {
  try {
    const worker = await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(workerId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!worker || !worker.qrCode) {
      alert("Ishchi yoki QR kodi topilmadi");
      return;
    }

    // QR kod modalini yaratish
    const modalHtml = `
            <div class="modal fade" id="qrCodeModal" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">QR kod</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body text-center">
                    <div id="qrcode" class="mb-3"></div>
                    <button class="btn btn-primary" onclick="downloadQRCode()">
                      <i class="bi bi-download"></i> Yuklab olish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;

    // Modal oynani qo'shish
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = new bootstrap.Modal(document.getElementById("qrCodeModal"));
    const qrcodeElement = document.getElementById("qrcode");

    // QR kodni yaratish
    const qr = qrcode(0, "M");
    qr.addData(worker.qrCode.toString()); // Faqat QR kod raqamini qo'shish
    qr.make();
    qrcodeElement.innerHTML = qr.createImgTag(5);

    modal.show();

    // Modal yopilganda QR kod elementini tozalash
    document
      .getElementById("qrCodeModal")
      .addEventListener("hidden.bs.modal", () => {
        qrcodeElement.innerHTML = "";
        document.getElementById("qrCodeModal").remove();
      });
  } catch (error) {
    console.error("QR kod yaratishda xatolik:", error);
    alert("QR kod yaratishda xatolik yuz berdi");
  }
}

// QR kodni yuklab olish
function downloadQRCode() {
  const qrImage = document.querySelector("#qrcode img");
  if (qrImage) {
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = qrImage.src;
    link.click();
  }
}

async function updateFaceData(workerId) {
  try {
    // Kamerani ishga tushirish
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    });

    // Modal oynani yaratish
    const modalHtml = `
            <div class="modal fade" id="faceRegistrationModal" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Yuz ma'lumotlarini yangilash</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <div id="faceContainer" class="mb-4">
                      <video id="faceVideo" autoplay muted playsinline style="width: 100%; border-radius: 8px;"></video>
                      <canvas id="faceCanvas" style="position: absolute; top: 0; left: 0;"></canvas>
                    </div>
                    <div id="faceResult" class="alert" role="alert"></div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Bekor qilish</button>
                    <button type="button" class="btn btn-primary" id="registerFaceButton">Yuzni ro'yxatdan o'tkazish</button>
                  </div>
                </div>
              </div>
            </div>
          `;

    // Modal oynani qo'shish
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = new bootstrap.Modal(
      document.getElementById("faceRegistrationModal")
    );
    const faceVideo = document.getElementById("faceVideo");
    const faceCanvas = document.getElementById("faceCanvas");
    const faceResult = document.getElementById("faceResult");
    const registerFaceButton = document.getElementById("registerFaceButton");

    // Videoni modal oynaga qo'shish
    faceVideo.srcObject = stream;

    // Canvas o'lchamlarini o'rnatish
    faceVideo.onloadedmetadata = () => {
      faceCanvas.width = faceVideo.videoWidth;
      faceCanvas.height = faceVideo.videoHeight;
    };

    // Yuz ro'yxatdan o'tkazish
    registerFaceButton.addEventListener("click", async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(faceVideo)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const descriptor = Array.from(detection.descriptor);

          // Yuz ma'lumotlarini IndexedDB ga saqlash
          const transaction = db.transaction([STORE_NAME], "readwrite");
          const store = transaction.objectStore(STORE_NAME);
          const worker = await new Promise((resolve, reject) => {
            const request = store.get(workerId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          if (worker) {
            worker.faceDescriptor = descriptor;
            await new Promise((resolve, reject) => {
              const request = store.put(worker);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            });

            updateResultMessage(
              faceResult,
              "Yuz ma'lumotlari muvaffaqiyatli yangilandi!",
              true
            );
            setTimeout(() => {
              modal.hide();
              // Kamerani to'xtatish
              stream.getTracks().forEach((track) => track.stop());
            }, 2000);
          }
        } else {
          updateResultMessage(
            faceResult,
            "Yuz aniqlanmadi. Iltimos, qayta urinib ko'ring.",
            false
          );
        }
      } catch (error) {
        console.error("Yuz ro'yxatdan o'tkazishda xatolik:", error);
        updateResultMessage(
          faceResult,
          "Yuz ro'yxatdan o'tkazishda xatolik yuz berdi",
          false
        );
      }
    });

    // Modal yopilganda kamerani to'xtatish
    document
      .getElementById("faceRegistrationModal")
      .addEventListener("hidden.bs.modal", () => {
        stream.getTracks().forEach((track) => track.stop());
      });

    modal.show();
  } catch (error) {
    console.error("Kamerani ishga tushirishda xatolik:", error);
    alert("Kamerani ishga tushirishda xatolik yuz berdi");
  }
}

// Result message funksiyasi
function updateResultMessage(element, text, isSuccess) {
  element.textContent = text;
  element.classList.remove("d-none", "alert-success", "alert-danger");
  element.classList.add(isSuccess ? "alert-success" : "alert-danger");
}

async function editWorker(workerId) {
  try {
    const worker = await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(workerId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!worker) {
      alert("Ishchi topilmadi");
      return;
    }

    // Tahrirlash formasi
    const modalHtml = `
            <div class="modal fade" id="editWorkerModal" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Ishchini tahrirlash</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <form id="editWorkerForm">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label for="editWorkerName" class="form-label">F.I.O</label>
                          <input type="text" class="form-control" id="editWorkerName" value="${worker.name}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label for="editWorkerPosition" class="form-label">Lavozim</label>
                          <input type="text" class="form-control" id="editWorkerPosition" value="${worker.position}" required>
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label for="editWorkerMilitaryRank" class="form-label">Harbiy unvon</label>
                          <input type="text" class="form-control" id="editWorkerMilitaryRank" value="${worker.militaryRank}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label for="editWorkerQKType" class="form-label">QK turi</label>
                          <select class="form-select" id="editWorkerQKType" required>
                            <option value="mudofaa">Mudofaa vazirligi</option>
                            <option value="fvv">Favqulodda vaziyatlar vazirligi</option>
                            <option value="dxx">Davlat xavfsizlik xizmati</option>
                            <option value="dxx-chegara">Davlat xavfsizlik xizmati chegara qo'shinlari</option>
                            <option value="ichki">Ichki ishlar vazirligi</option>
                            <option value="gvardiya">Milliy gvardiya</option>
                            <option value="bojxona">Maxsus operatsiya kuchlari qo'mondonligi</option>
                          </select>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label for="editWorkerImage" class="form-label">Rasm</label>
                        <input type="file" class="form-control" id="editWorkerImage" accept="image/*">
                        <div id="editImagePreview" class="mt-2 text-center">
                          <img src="${worker.image}" class="img-thumbnail" style="max-height: 200px;">
                        </div>
                      </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Bekor qilish</button>
                    <button type="button" class="btn btn-primary" onclick="saveEditWorker(${workerId})">Saqlash</button>
                  </div>
                </div>
              </div>
            </div>
          `;

    // Modal oynani qo'shish
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = new bootstrap.Modal(
      document.getElementById("editWorkerModal")
    );

    // Rasmni yangilash
    document
      .getElementById("editWorkerImage")
      .addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const preview = document.getElementById("editImagePreview");
            preview.innerHTML = `<img src="${e.target.result}" class="img-thumbnail" style="max-height: 200px;">`;
          };
          reader.readAsDataURL(file);
        }
      });

    modal.show();

    // Modal yopilganda formani tozalash
    document
      .getElementById("editWorkerModal")
      .addEventListener("hidden.bs.modal", () => {
        document.getElementById("editWorkerModal").remove();
      });
  } catch (error) {
    console.error("Ishchini tahrirlashda xatolik:", error);
    alert("Ishchini tahrirlashda xatolik yuz berdi");
  }
}

async function saveEditWorker(workerId) {
  const form = document.getElementById("editWorkerForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    const imageFile = document.getElementById("editWorkerImage").files[0];
    let imageBase64 = document.querySelector("#editImagePreview img").src;

    if (imageFile) {
      imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(imageFile);
      });
    }

    const db = await dbPromise;
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(workerId);

    const worker = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const updatedWorker = {
      id: workerId,
      name: document.getElementById("editWorkerName").value,
      position: document.getElementById("editWorkerPosition").value,
      militaryRank: document.getElementById("editWorkerMilitaryRank").value,
      qkType: document.getElementById("editWorkerQKType").value,
      image: imageBase64,
      faceDescriptor: worker.faceDescriptor,
      qrCode: worker.qrCode,
    };
    console.log(updatedWorker);
    await updateWorker(updatedWorker);
    workers = await getAllWorkers();
    renderWorkers();
    bootstrap.Modal.getInstance(
      document.getElementById("editWorkerModal")
    ).hide();
  } catch (error) {
    console.error("Ishchini saqlashda xatolik:", error);
    alert("Ishchini saqlashda xatolik yuz berdi");
  }
}

async function deleteWorker(workerId) {
  try {
    if (confirm("Ishchini o'chirishni xohlaysizmi?")) {
      await deleteWorkerById(workerId);
      workers = await getAllWorkers();
      renderWorkers();
    }
  } catch (error) {
    console.error("Error deleting worker:", error);
    alert("Ishchini o'chirishda xatolik yuz berdi");
  }
}

// Modal functions
let addWorkerModal;

function showAddWorkerModal() {
  if (!addWorkerModal) {
    addWorkerModal = new bootstrap.Modal(
      document.getElementById("addWorkerModal")
    );
  }
  document.getElementById("addWorkerForm").reset();
  document.getElementById("imagePreview").innerHTML = "";
  addWorkerModal.show();
}

// Image preview
document.getElementById("workerImage").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById("imagePreview");
      preview.innerHTML = `<img src="${e.target.result}" class="img-thumbnail" style="max-height: 200px;">`;
    };
    reader.readAsDataURL(file);
  }
});

async function saveNewWorker() {
  const form = document.getElementById("addWorkerForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const imageFile = document.getElementById("workerImage").files[0];
  if (!imageFile) {
    alert("Iltimos, rasmni tanlang");
    return;
  }

  try {
    // Convert image to base64
    const imageBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(imageFile);
    });

    const newWorker = {
      name: document.getElementById("workerName").value,
      position: document.getElementById("workerPosition").value,
      militaryRank: document.getElementById("workerMilitaryRank").value,
      qkType: document.getElementById("workerQKType").value,
      image: imageBase64,
    };

    await addWorker(newWorker);
    workers = await getAllWorkers();
    renderWorkers();
    addWorkerModal.hide();
  } catch (error) {
    console.error("Error saving worker:", error);
    alert("Ishchi qo'shishda xatolik yuz berdi");
  }
}

// Initial render
renderWorkers();
