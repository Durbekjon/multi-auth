document.addEventListener("DOMContentLoaded", function () {
  const qrResult = document.getElementById("qr-result");
  const statusIndicator = document.getElementById("statusIndicator");
  const qrOverlay = document.getElementById("qrOverlay");
  const scannerPreview = document.getElementById("scannerPreview");
  let html5QrCode = null;
  let isScanning = false;
  let db = null;

  // UI Helper Functions
  function setStatusIndicator(active) {
    if (statusIndicator) {
      statusIndicator.classList.toggle('active', active);
    }
  }

  function setScanningState(scanning) {
    if (qrOverlay) {
      qrOverlay.classList.toggle('scanning', scanning);
    }
    if (scannerPreview) {
      scannerPreview.classList.toggle('scanning', scanning);
    }
  }

  // Enhanced result message function
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
      element.style.display = "block";
    } else {
      element.classList.add("d-none");
      element.style.display = "none";
    }
    
    // Update status indicator
    setStatusIndicator(isSuccess && !showSpinner);
  }

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
      updateResultMessage(qrResult, "QR skaner ishga tushirilmoqda...", false, true);
      
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
      setScanningState(true);
      setStatusIndicator(false);
      
      updateResultMessage(qrResult, "QR kodni kameraga ko'rsating...", true);
    } catch (err) {
      console.error("Asosiy xatolik:", err);
      setScanningState(false);
      setStatusIndicator(false);
      showError(getErrorMessage(err));
    }
  }

  async function restartScanning() {
    try {
      updateResultMessage(qrResult, "Qayta ishga tushirilmoqda...", false, true);
      setScanningState(false);
      setStatusIndicator(false);
      
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

      // Hide worker display
      const workerDisplay = document.getElementById("worker-display");
      if (workerDisplay) {
        workerDisplay.style.display = "none";
      }

      await startScanning();
    } catch (err) {
      console.error("Qayta skanerlashda xatolik:", err);
      setScanningState(false);
      setStatusIndicator(false);
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
            // Stop scanning animations
            setScanningState(false);
            setStatusIndicator(true);
            
            // Update status message
            updateResultMessage(qrResult, `✅ QR kod muvaffaqiyatli o'qildi! Xush kelibsiz, ${employee.name}!`, true);
            
            // Create modern worker card HTML
            const workerCard = `
              <div class="worker-card-qr">
                <div class="card-body text-center p-4">
                  <div class="success-badge-qr mb-3">
                    <i class="bi bi-qr-code-scan me-2"></i>
                    QR Kod Tasdiqlandi
                  </div>
                  
                  <img
                    src="${employee.image}"
                    class="worker-avatar-qr"
                    alt="${employee.name}"
                  />
                  
                  <h3 class="card-title mb-3">${employee.name}</h3>
                  
                  <div class="row text-center mb-3">
                    <div class="col-md-6 mb-2">
                      <div class="badge bg-primary fs-6 p-2">
                        <i class="bi bi-person-badge me-1"></i>
                        ${employee.position}
                      </div>
                    </div>
                    <div class="col-md-6 mb-2">
                      <div class="badge bg-success fs-6 p-2">
                        <i class="bi bi-award me-1"></i>
                        ${employee.militaryRank}
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-flex justify-content-center align-items-center">
                    <img
                      src="assets/logos/${employee.qkType}.png"
                      alt="${employee.qkType}"
                      class="img-fluid"
                      style="max-width: 80px; max-height: 80px; border-radius: 10px;"
                    />
                    <div class="ms-3 text-start">
                      <small class="text-muted d-block">QK turi</small>
                      <strong>${employee.qkType}</strong>
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

            // Show the card
            const workerDisplay = document.getElementById("worker-display");
            workerDisplay.innerHTML = workerCard;
            workerDisplay.style.display = "block";
            workerDisplay.classList.add("worker-display");
            
            // Show refresh button
            const refreshButton = document.getElementById("refreshButton");
            if (refreshButton) {
              refreshButton.classList.remove("d-none");
            }
            
            resolve({
              status: "success",
              message: "Muvaffaqiyatli!",
            });
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
        
        // Stop scanning animation temporarily
        setScanningState(false);
        updateResultMessage(qrResult, "QR kod o'qilmoqda...", false, true);

        const result = await checkResult(decodedText);
        
        if (result.status !== "success") {
          // Show error message if QR code is invalid
          setScanningState(false);
          setStatusIndicator(false);
          updateResultMessage(qrResult, `❌ ${result.message}`, false);
          
          // Show refresh button
          const refreshButton = document.getElementById("refreshButton");
          if (refreshButton) {
            refreshButton.classList.remove("d-none");
          }
        }

        // Set up the refresh button click handler
        const refreshButton = document.getElementById("refreshButton");
        if (refreshButton) {
          refreshButton.removeEventListener("click", restartScanning); // Remove existing listener
          refreshButton.addEventListener("click", async () => {
            try {
              await restartScanning();
            } catch (err) {
              console.error("Refresh button xatolik:", err);
              setScanningState(false);
              setStatusIndicator(false);
              showError(getErrorMessage(err));
            }
          });
        }
      } catch (error) {
        console.error("Kamerani to'xtatishda xatolik:", error);
        setScanningState(false);
        setStatusIndicator(false);
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
    setScanningState(false);
    setStatusIndicator(false);
    updateResultMessage(qrResult, `❌ ${message}`, false);
    
    // Show refresh button
    const refreshButton = document.getElementById("refreshButton");
    if (refreshButton) {
      refreshButton.classList.remove("d-none");
    }
  }

  // Set initial UI state
  setScanningState(false);
  setStatusIndicator(false);
  updateResultMessage(qrResult, "QR skaner yuklanmoqda...", false, true);
  
  // Avtomatik skanerlashni boshlash
  startScanning();
  setupRefreshButton();
});
