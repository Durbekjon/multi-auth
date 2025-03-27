document.addEventListener("DOMContentLoaded", function () {
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
  const qrResult = document.getElementById("qr-result");
  let html5QrCode = null;
  let isScanning = false;
  let db = null;

  // IndexedDB ni ishga tushirish
  const request = indexedDB.open("FaceAuthDB", 1);

  request.onerror = (event) => {
    console.error("IndexedDB xatosi:", event.target.error);
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("employees")) {
      const store = db.createObjectStore("employees", { keyPath: "qr" });
      store.createIndex("name", "name", { unique: false });
      store.createIndex("surname", "surname", { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("IndexedDB muvaffaqiyatli ochildi");
    // Test ma'lumotlarini qo'shish
    addTestData();
  };

  // Test ma'lumotlarini qo'shish
  function addTestData() {
    const transaction = db.transaction(["employees"], "readwrite");
    const store = transaction.objectStore("employees");

    // Test ma'lumotlari
    const testData = [
      { qr: "130001", name: "John", surname: "Doe" },
      { qr: "130002", name: "Jane", surname: "Smith" },
      { qr: "130003", name: "Mike", surname: "Johnson" },
    ];

    testData.forEach((data) => {
      store.put(data);
    });

    transaction.oncomplete = () => {
      console.log("Test ma'lumotlari qo'shildi");
    };
  }

  // Tema sozlamalari
  const themes = {
    light: {
      "--bg-color": "#ffffff",
      "--text-color": "#000000",
      "--box-bg": "#f8f9fa",
      "--result-bg": "rgba(0, 0, 0, 0.05)",
    },
    dark: {
      "--bg-color": "#121212",
      "--text-color": "#ffffff",
      "--box-bg": "#1e1e1e",
      "--result-bg": "rgba(255, 255, 255, 0.1)",
    },
  };

  // Tema almashtirish
  function setTheme(theme) {
    const root = document.documentElement;
    Object.entries(themes[theme]).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    themeToggle.innerHTML =
      theme === "light"
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
  }

  // Saqlangan temani yuklash
  setTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme =
      document.documentElement.style.getPropertyValue("--bg-color") ===
      "#ffffff"
        ? "dark"
        : "light";
    setTheme(currentTheme);
    localStorage.setItem("theme", currentTheme);
  });

  if (!qrResult) {
    console.error("Kerakli elementlar topilmadi!");
    return;
  }

  async function initializeScanner() {
    if (!html5QrCode) {
      try {
        html5QrCode = new Html5Qrcode("reader");
      } catch (error) {
        console.error("Scanner yaratishda xatolik:", error);
        showError("QR skanner yaratishda xatolik yuz berdi");
        return false;
      }
    }
    return true;
  }

  async function startScanning() {
    try {
      if (!(await initializeScanner())) {
        return;
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
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

  async function checkResult(result) {
    return new Promise((resolve) => {
      // Raqam tekshiruvi
      const number = parseInt(result);
      if (!isNaN(number) && number >= 130000 && number <= 130249) {
        resolve({
          status: "success",
          message: "Passed",
        });
        return;
      }

      // IndexedDB dan qidirish
      const transaction = db.transaction(["employees"], "readonly");
      const store = transaction.objectStore("employees");
      const request = store.get(result);

      request.onsuccess = () => {
        const employee = request.result;
        if (employee) {
          resolve({
            status: "success",
            message: `Xodim: ${employee.name} ${employee.surname}`,
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
    });
  }

  async function onScanSuccess(decodedText, decodedResult) {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
        isScanning = false;

        // Natijani tekshirish
        const result = await checkResult(decodedText);

        // Natijani ko'rsatish
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
          <button class="btn btn-primary mt-3" onclick="startScanning()">
            Qayta Skanerlash
          </button>
        `;

        // Ovozli signal
        try {
          const audio = new Audio(
            "data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
          );
          audio.play();
        } catch (error) {
          console.log("Ovozli signal ishlamadi");
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
      <button class="btn btn-primary mt-3" onclick="startScanning()">
        Qayta Skanerlash
      </button>
    `;
  }

  // Avtomatik skanerlashni boshlash
  startScanning();
});
