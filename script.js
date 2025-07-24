const video = document.getElementById('video');
const statusDiv = document.getElementById('status');

// Path ke model (gunakan folder lokal atau CDN)
const MODEL_URL = '/models'; // Ganti dengan 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/' jika pakai CDN

// Muat model face-api.js
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
]).then(startVideo).catch(err => {
    statusDiv.textContent = 'Gagal memuat model face-api.js. Periksa folder /models atau koneksi internet.';
    statusDiv.classList.add('error');
    console.error('Error loading models:', err);
});

async function startVideo() {
    if (!video || !statusDiv) {
        document.body.innerHTML = '<p>Error: Elemen video atau status tidak ditemukan di HTML.</p>';
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play().catch(err => {
                statusDiv.textContent = 'Gagal memutar video. Pastikan kamera aktif.';
                statusDiv.classList.add('error');
                console.error('Error playing video:', err);
            });
            statusDiv.textContent = 'Kamera aktif. Menunggu wajah terdeteksi...';
            detectFaces();
        };
    } catch (err) {
        statusDiv.textContent = 'Gagal mengakses kamera. Pastikan Anda mengizinkan akses kamera.';
        statusDiv.classList.add('error');
        console.error('Error accessing camera:', err);
    }
}

let faceDetected = false;
let detectionInterval;

async function detectFaces() {
    detectionInterval = setInterval(async () => {
        try {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
            if (detections.length > 0) {
                if (!faceDetected) {
                    statusDiv.textContent = 'Selamat datang!';
                    statusDiv.classList.add('welcome');
                    faceDetected = true;
                    console.log('Wajah terdeteksi!');
                }
            } else {
                if (faceDetected) {
                    statusDiv.textContent = 'Tiada wajah terdeteksi.';
                    statusDiv.classList.remove('welcome');
                    faceDetected = false;
                    console.log('Wajah hilang.');
                }
            }
        } catch (err) {
            console.error('Error during face detection:', err);
        }
    }, 100);
}

// Hentikan deteksi dan stream saat halaman ditutup
window.addEventListener('beforeunload', () => {
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
});
