const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const statusDiv = document.getElementById('status');

let lastFrameData = null; // Menyimpan data piksel dari frame sebelumnya
const threshold = 30; // Ambang batas perubahan piksel untuk mendeteksi gerakan
const minPixelsChanged = 500; // Jumlah minimum piksel yang berubah untuk dianggap sebagai gerakan

// Fungsi untuk mendapatkan akses kamera
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        statusDiv.textContent = 'Kamera aktif. Mengesan pergerakan...';
        video.play();
        video.onloadedmetadata = () => {
            // Setelah video dimuat, mulai proses deteksi
            requestAnimationFrame(detectMotion);
        };
    } catch (err) {
        statusDiv.textContent = 'Gagal mengakses kamera. Pastikan Anda mengizinkan akses kamera.';
        statusDiv.classList.add('error'); // Tambahkan kelas error jika ada
        console.error('Error accessing camera:', err);
    }
}

// Fungsi deteksi gerakan
function detectMotion() {
    // Pastikan video sudah siap dan dimainkan
    if (video.paused || video.ended) {
        requestAnimationFrame(detectMotion);
        return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height).data;

    if (lastFrameData) {
        let changedPixels = 0;
        // Kita hanya akan memeriksa setiap beberapa piksel untuk efisiensi
        for (let i = 0; i < currentFrameData.length; i += 4 * 10) { // Lewati 10 piksel
            const rDiff = Math.abs(currentFrameData[i] - lastFrameData[i]);
            const gDiff = Math.abs(currentFrameData[i + 1] - lastFrameData[i + 1]);
            const bDiff = Math.abs(currentFrameData[i + 2] - lastFrameData[i + 2]);

            // Jika perbedaan warna (rata-rata RGB) melebihi ambang batas
            if ((rDiff + gDiff + bDiff) / 3 > threshold) {
                changedPixels++;
            }
        }

        if (changedPixels > minPixelsChanged) {
            statusDiv.textContent = 'PERGERAKAN DIKESAN!';
            statusDiv.classList.add('detected');
        } else {
            statusDiv.textContent = 'Tiada pergerakan.';
            statusDiv.classList.remove('detected');
        }
    }

    lastFrameData = currentFrameData;
    requestAnimationFrame(detectMotion); // Lanjutkan deteksi di frame berikutnya
}

// Mulai setup kamera saat halaman dimuat
setupCamera();