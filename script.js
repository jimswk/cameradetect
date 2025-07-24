const video = document.getElementById('video');
const statusDiv = document.getElementById('status');

// Path ke folder models yang sudah Anda download
const MODEL_URL = '/models'; // Pastikan path ini benar!

// Muat semua model yang diperlukan sebelum memulai deteksi
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Untuk deteksi wajah yang cepat
    // faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Alternatif untuk deteksi wajah (lebih besar tapi bisa lebih akurat)
    // faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // Opsional: Untuk landmark wajah (mata, hidung, mulut)
    // faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL) // Opsional: Untuk pengenalan wajah
]).then(startVideo); // Setelah model dimuat, mulai video

async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();
        statusDiv.textContent = 'Kamera aktif. Menunggu wajah terkesan...';
        video.onloadedmetadata = () => {
            // Setelah video siap, mulai deteksi wajah
            detectFaces();
        };
    } catch (err) {
        statusDiv.textContent = 'Gagal mengakses kamera. Pastikan Anda mengizinkan akses kamera.';
        statusDiv.classList.add('error');
        console.error('Error accessing camera:', err);
    }
}

let faceDetected = false; // Flag untuk melacak apakah wajah sudah terdeteksi
let detectionInterval; // Variabel untuk menyimpan interval

function detectFaces() {
    // Jalankan deteksi wajah setiap 100ms (10 kali per detik)
    detectionInterval = setInterval(async () => {
        // Mendeteksi semua wajah dalam video
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        // Jika Anda menggunakan model ssdMobilenetv1, gunakan:
        // const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options());

        if (detections.length > 0) {
            // Wajah terdeteksi!
            if (!faceDetected) { // Hanya update jika sebelumnya tidak ada wajah
                statusDiv.textContent = 'Selamat datang!';
                statusDiv.classList.add('welcome');
                faceDetected = true;
                console.log('Wajah terdeteksi!');
            }
        } else {
            // Tiada wajah terdeteksi
            if (faceDetected) { // Hanya update jika sebelumnya ada wajah
                statusDiv.textContent = 'Tiada wajah terkesan.';
                statusDiv.classList.remove('welcome');
                faceDetected = false;
                console.log('Wajah hilang.');
            }
        }
    }, 100); // Deteksi setiap 100 milidetik
}

// Hentikan interval deteksi ketika halaman ditutup atau dinavigasi
window.addEventListener('beforeunload', () => {
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
});
