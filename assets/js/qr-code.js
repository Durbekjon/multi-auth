document.addEventListener("DOMContentLoaded", function () {
  const qrResult = document.getElementById("qr-result");
  let html5QrCode = null;
  let isScanning = false;
  let db = null;

  // IndexedDB ni ishga tushirish
  const request = indexedDB.open("FaceAuthDB", 3);

  request.onerror = (event) => {
    console.error("IndexedDB xatosi:", event.target.error);
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    const store = db.createObjectStore("workers", {
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
  };

  async function startScanning() {
    try {
      if (!(await initializeScanner())) {
        return;
      }

      const config = {
        fps: 60,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        {
          facingMode: "user",
        },
        config,
        onScanSuccess,
        onScanError
      );
      isScanning = true;
      qrResult.style.display = "block";
      qrResult.innerHTML = `
        <div class="alert alert-info">
          QR kodni kameraga ko'rsating...
        </div>
      `;
    } catch (err) {
      console.error("Asosiy xatolik:", err);
      showError(getErrorMessage(err));
    }
  }

  async function restartScanning() {
    try {
      if (html5QrCode) {
        await html5QrCode.stop();
        html5QrCode = null;
      }

      // Kamera streamini to'liq to'xtatish
      const readerElement = document.getElementById("reader");
      if (readerElement) {
        const videoElement = readerElement.querySelector("video");
        if (videoElement && videoElement.srcObject) {
          const tracks = videoElement.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        }
      }

      await startScanning();
    } catch (err) {
      console.error("Qayta skanerlashda xatolik:", err);
      showError(getErrorMessage(err));
    }
  }

  function setupRefreshButton() {
    const refreshButton = document.getElementById("refreshButton");
    if (refreshButton) {
      refreshButton.addEventListener("click", async () => {
        try {
          await restartScanning();
        } catch (err) {
          console.error("Refresh button xatolik:", err);
          showError(getErrorMessage(err));
        }
      });
    }
  }

  async function initializeScanner() {
    if (html5QrCode) {
      return true;
    }
    try {
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        throw new Error("Reader elementi topilmadi");
      }
      html5QrCode = new Html5Qrcode("reader");
      return true;
    } catch (error) {
      console.error("Scanner yaratishda xatolik:", error);
      return false;
    }
  }

  async function checkResult(result) {
    return new Promise((resolve) => {
      // First, check if the QR code number is within the valid range
      const number = parseInt(result);
      console.log(!isNaN(number));
      if (!isNaN(number)) {
        if (number >= 130000 && number <= 13249) {
          console.log("QR code number:", number);
          return resolve({
            status: "success",
            message: "Muvaffaqqiyatli!",
          });
        }

        console.log("QR code number:", number); // Search for the worker using the QR code number
        const transaction = db.transaction(["workers"], "readonly");
        const store = transaction.objectStore("workers");
        const index = store.index("qrCode");
        const request = index.get(number);

        request.onsuccess = () => {
          const employee = request.result;
          console.log(employee);
          if (employee) {
            // Create worker card HTML
            const workerCard = `
              <div class="card worker-card mb-4">
                <div class="row g-0">
                  <div class="col-md-4">
                    <img src="${employee.image}" class="img-fluid rounded-start" alt="${employee.name}">
                  </div>
                  <div class="col-md-8">
                    <div class="card-body">
                      <h5 class="card-title">F.I.SH:  ${employee.name}</h5>
                      <p class="card-text mb-1">
                        <span class="badge bg-primary">Lavozim: ${employee.position}</span>
                      </p>
                      <p class="card-text mb-1">
                        <span class="badge bg-secondary">Harbiy unvon: ${employee.militaryRank}</span>
                      </p>
                      <img src="assets/logos/${employee.qkType}.png" width="250" height="250" alt="${employee.qkType}" class="img-fluid qk-logo">
                    </div>
                  </div>
                </div>
              </div>
            `;

            // Show the card
            const qrResult = document.getElementById("qr-result");
            qrResult.innerHTML = workerCard;
            qrResult.style.display = "block";
          } else {
            resolve({
              status: "error",
              message: "Noto'g'ri QR kod",
            });
          }
        };

        request.onerror = () => {
          resolve({
            status: "error",
            message: "Xizmat ko'rsatishda xatolik yuz berdi",
          });
        };
      } else {
        resolve({
          status: "error",
          message: "Noto'g'ri QR kod formati",
        });
      }
      refreshButton.style.display = "block";
    });
  }

  async function onScanSuccess(decodedText) {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
        html5QrCode = null;
        isScanning = false;

        const result = await checkResult(decodedText);
        qrResult.style.display = "block";
        qrResult.innerHTML = ` 
          <div class="card ${
            result.status === "success" ? "border-success" : "border-danger"
          }">
            <div class="card-body">
              <h5 class="card-title ${
                result.status === "success" ? "text-success" : "text-danger"
              }">
                ${result.status === "success" ? "Muvaffaqiyatli!" : "Xatolik!"}
              </h5>
              <p class="card-text">${result.message}</p>
            </div>
          </div>
          <div class="btn-group mb-3">
            <button id="refreshButton" class="btn btn-primary">
              <i class="bi bi-arrow-clockwise"></i> Qayta tekshirish
            </button>
          </div>
        `;

        // Set up the refresh button click handler after creating the button
        const refreshButton = document.getElementById("refreshButton");
        if (refreshButton) {
          refreshButton.addEventListener("click", async () => {
            try {
              await restartScanning();
            } catch (err) {
              console.error("Refresh button xatolik:", err);
              showError(getErrorMessage(err));
            }
          });
        }
      } catch (error) {
        console.error("Kamerani to'xtatishda xatolik:", error);
        showError("Kamerani to'xtatishda xatolik yuz berdi");
      }
    }
  }

  function onScanError(errorMessage) {
    if (!errorMessage.includes("No MultiFormat Readers")) {
      console.log("Skanerlash xatosi:", errorMessage);
    }
  }

  function getErrorMessage(err) {
    switch (err.name) {
      case "NotAllowedError":
        return "Kameradan foydalanish uchun ruxsat berilmadi. Iltimos, brauzer sozlamalaridan kameraga ruxsat bering.";
      case "NotFoundError":
        return "Kamera topilmadi. Iltimos, kamera mavjudligini tekshiring.";
      case "NotReadableError":
        return "Kameraga ulanib bo'lmadi. Kamera boshqa dastur tomonidan band bo'lishi mumkin.";
      case "SecurityError":
        return "Xavfsizlik xatosi. Iltimos, HTTPS protokolidan foydalaning.";
      default:
        return (
          "Kamerani ishga tushirishda xatolik: " +
          (err.message || "Noma'lum xato")
        );
    }
  }

  function showError(message) {
    console.error(message);
    qrResult.style.display = "block";
    qrResult.innerHTML = `
      <div class="card border-danger">
        <div class="card-body">
          <h5 class="card-title text-danger">Xatolik!</h5>
          <p class="card-text">${message}</p>
        </div>
      </div>
      <div class="btn-group mb-3">
        <button id="refreshButton" class="btn btn-primary">
          <i class="bi bi-arrow-clockwise"></i> Qayta tekshirish
        </button>
      </div>
    `;
  }

  // Avtomatik skanerlashni boshlash
  startScanning();
  setupRefreshButton();
});
