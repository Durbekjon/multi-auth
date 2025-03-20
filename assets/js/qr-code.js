const video = document.getElementById("video");
const canvas = document.getElementById("qrCanvas");
const canvasContext = canvas.getContext("2d", {
  willReadFrequently: true,
});
const resultElement = document.getElementById("result");
const qrButton = document.getElementById("qrButton");

let qrScanning = false;
let mediaStream = null;

const qrCodes = Array.from({ length: 250 }, (_, i) => i + 130000);

// Binary search orqali QR kodni qidirish (O(log n) murakkablik)
const findQRCode = (id) => {
  let left = 0;
  let right = qrCodes.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = qrCodes[mid];

    if (midValue === id) {
      return {
        found: true,
        index: mid,
        value: midValue,
      };
    }

    if (midValue < id) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return {
    found: false,
    nearestValue: qrCodes[left] || qrCodes[right],
    nearestIndex: left || right,
  };
};

// QR kodni tekshirish
const validateQRCode = (code) => {
  try {
    console.log("QR kodni tekshirish boshlandi:", code);
    if (isNaN(Number(code))) {
      return {
        isValid: false,
        message: "QR kod raqam emas",
      };
    }

    const searchResult = findQRCode(code);
    if (searchResult.found) {
      return {
        isValid: true,
        message: `QR kod tasdiqlandi: ${code}`,
      };
    } else {
      return {
        isValid: false,
        message: `Noto'g'ri QR kod. Eng yaqin kod: ${searchResult.nearestValue}`,
      };
    }
  } catch (error) {
    console.error("QR kodni tekshirishda xatolik:", error);
    return {
      isValid: false,
      message: "QR kodni tekshirishda xatolik yuz berdi",
    };
  }
};

window.addEventListener("beforeunload", () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
});

qrButton.addEventListener("click", async () => {
  try {
    if (!qrScanning) {
      await startQRScanning();
      qrButton.textContent = "To'xtatish";
      video.style.display = "block";
    } else {
      stopQRScanning();
      qrButton.textContent = "QR Kodni Skanerlash";
      video.style.display = "none";
    }
    qrScanning = !qrScanning;
  } catch (error) {
    console.error("QR skanerlashda xatolik:", error);
    updateResultMessage(
      resultElement,
      "QR skanerlashda xatolik yuz berdi: " + error.message,
      false
    );
  }
});

async function startQRScanning() {
  try {
    console.log("Kamera ruxsati so'ralmoqda...");

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (error) {
      // Agar orqa kamera ishlamasa, old kamerani ishlatamiz
      console.log("Orqa kamera ishlamadi, old kamerani sinab ko'ramiz");
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    }

    console.log("Kamera ruxsati olindi");

    video.srcObject = mediaStream;
    video.setAttribute("playsinline", true);

    // Video elementining tayyor bo'lishini kutish
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        console.log("Video metadata yuklandi");
        resolve();
      };
    });

    await video.play();
    console.log("Video ijro etilmoqda");

    // Canvas o'lchamlarini video o'lchamlariga moslashtirish
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    console.log("Canvas o'lchamlari:", canvas.width, "x", canvas.height);

    requestAnimationFrame(tick);
    return true;
  } catch (error) {
    console.error("Kamerani ishga tushirishda xatolik:", error);

    let errorMessage = "Kamerani ishga tushirishda xatolik yuz berdi";
    if (error.name === "NotAllowedError") {
      errorMessage = "Kameradan foydalanish uchun ruxsat berilmadi";
    } else if (error.name === "NotFoundError") {
      errorMessage = "Kamera topilmadi";
    } else if (error.name === "NotReadableError") {
      errorMessage = "Kamera band yoki ishlamayapti";
    } else if (error.name === "OverconstrainedError") {
      errorMessage = "Kamera parametrlari qo'llab-quvvatlanmaydi";
      // Eng oddiy parametrlar bilan qayta urinib ko'ramiz
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        console.log("Kamera oddiy parametrlar bilan ishga tushdi");
        video.srcObject = mediaStream;
        video.setAttribute("playsinline", true);
        await video.play();
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        requestAnimationFrame(tick);
        return true;
      } catch (retryError) {
        console.error("Qayta urinishda ham xatolik:", retryError);
      }
    }

    updateResultMessage(resultElement, errorMessage, false);
    throw error;
  }
}

function stopQRScanning() {
  console.log("QR skanerlash to'xtatilmoqda...");

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      track.stop();
      console.log("Kamera to'xtatildi");
    });
    mediaStream = null;
  }

  video.srcObject = null;
  updateResultMessage(resultElement, "", false);
}

function tick() {
  if (!qrScanning) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    try {
      // Canvas o'lchamlarini video o'lchamlariga moslashtirish
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(
          "Canvas o'lchamlari yangilandi:",
          canvas.width,
          "x",
          canvas.height
        );
      }

      // Video kadrni canvasga chizish
      canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Debug uchun canvas ko'rsatish
      canvas.style.display = "block";
      canvas.style.position = "fixed";
      canvas.style.top = "10px";
      canvas.style.right = "10px";
      canvas.style.width = "200px";
      canvas.style.height = "150px";
      canvas.style.border = "2px solid red";
      canvas.style.zIndex = "9999";

      // Rasm ma'lumotlarini olish
      const imageData = canvasContext.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      console.log("Rasm ma'lumotlari:", {
        width: imageData.width,
        height: imageData.height,
        dataLength: imageData.data.length,
        hasData: imageData.data.some((x) => x !== 0),
      });

      // QR kodni aniqlash
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
        grayscaleWeights: {
          red: 0.299,
          green: 0.587,
          blue: 0.114,
          useIntegerApproximation: false,
        },
      });

      if (code) {
        console.log("QR kod ma'lumotlari:", {
          data: code.data,
          location: code.location,
          numBits: code.numBits,
        });

        // QR kod topilgan joyni belgilash
        canvasContext.beginPath();
        canvasContext.moveTo(
          code.location.topLeftCorner.x,
          code.location.topLeftCorner.y
        );
        canvasContext.lineTo(
          code.location.topRightCorner.x,
          code.location.topRightCorner.y
        );
        canvasContext.lineTo(
          code.location.bottomRightCorner.x,
          code.location.bottomRightCorner.y
        );
        canvasContext.lineTo(
          code.location.bottomLeftCorner.x,
          code.location.bottomLeftCorner.y
        );
        canvasContext.lineTo(
          code.location.topLeftCorner.x,
          code.location.topLeftCorner.y
        );
        canvasContext.lineWidth = 4;
        canvasContext.strokeStyle = "#FF3B58";
        canvasContext.stroke();

        const validation = validateQRCode(code.data);
        updateResultMessage(
          resultElement,
          validation.message,
          validation.isValid
        );

        if (validation.isValid) {
          stopQRScanning();
          qrButton.textContent = "QR Kodni Skanerlash";
          qrScanning = false;
          video.style.display = "none";
          canvas.style.display = "none";
        } else {
          requestAnimationFrame(tick);
        }
      } else {
        console.log("QR kod topilmadi");
        requestAnimationFrame(tick);
      }
    } catch (error) {
      console.error("Kadrni qayta ishlashda xatolik:", error);
      requestAnimationFrame(tick);
    }
  } else {
    console.log("Video tayyor emas:", video.readyState);
    requestAnimationFrame(tick);
  }
}

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
