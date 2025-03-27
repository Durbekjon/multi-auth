// IndexedDB ni ishga tushirish
let db;
const DB_NAME = "QrCodesDB";
const DB_VERSION = 1;
const STORE_NAME = "qrcodes";

// Ma'lumotlar bazasini yaratish
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject("DB xatosi: " + event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// QR kodni bazadan qidirish
async function findQRCode(code) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB topilmadi");
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(Number(code));

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject("Qidirishda xatolik: " + request.error);
    };
  });
}

// Test uchun ma'lumotlarni qo'shish
async function addTestData() {
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  // Test ma'lumotlari
  store.clear();
  for (let i = 130000; i <= 130249; i++) {
    store.put({ id: i, data: `QR Code ${i}` });
  }
  const req = await store.getAll();
  req.onsuccess = () => {
    console.log(req.result);
  };
  return true;
}

// DB ni ishga tushirish va test ma'lumotlarni qo'shish
initDB()
  .then(() => {
    console.log("DB muvaffaqiyatli yaratildi");
    addTestData().then(() => {
      console.log("Test malumotlar qo'shildi");
    });
  })
  .catch((error) => {
    console.error("DB xatosi:", error);
  });
