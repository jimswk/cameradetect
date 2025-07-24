// Tambahkan event listener untuk menunggu library siap
document.addEventListener('DOMContentLoaded', () => {
    // Cek setiap 100ms apakah faceapi sudah terdefinisi
    const checkFaceAPI = setInterval(() => {
        if (typeof faceapi !== 'undefined') {
            clearInterval(checkFaceAPI);
            initFaceDetection();
        }
    }, 100);

    // Timeout setelah 10 detik jika library gagal dimuat
    setTimeout(() => {
        clearInterval(checkFaceAPI);
        if (typeof faceapi === 'undefined') {
            console.error("Gagal memuat face-api.js");
            document.getElementById('greeting').textContent = 
                "Error: Aplikasi tidak dapat dimuat. Silahkan refresh halaman.";
        }
    }, 10000);
});

async function initFaceDetection() {
    try {
        // Tambahkan model ageNet
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/models'),
            faceapi.nets.ageGenderNet.loadFromUri('/models') // Model baru untuk deteksi usia
        ]);
        
        startVideo();
    } catch (error) {
        console.error("Error loading models:", error);
        document.getElementById('greeting').textContent = 
            "Error: Gagal memuat model deteksi wajah.";
    }
}

function detectFaces() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const greeting = document.getElementById('greeting');
    const agePrediction = document.getElementById('agePrediction');
    const displaySize = { width: video.width, height: video.height };
    
    faceapi.matchDimensions(canvas, displaySize);
    
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceExpressions().withAgeAndGender(); // Tambahkan age and gender detection
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        
        if (detections.length > 0) {
            // Deteksi ekspresi (sebelumnya)
            const expressions = detections[0].expressions;
            const dominantExpression = Object.entries(expressions)
                .reduce((a, b) => a[1] > b[1] ? a : b)[0];
            
            // Deteksi usia dan gender
            const age = Math.round(detections[0].age);
            const gender = detections[0].gender;
            const genderText = gender === 'male' ? 'Laki-laki' : 'Perempuan';
            
            const greetings = {
                'happy': `Hai ${genderText}! Senang melihat Anda tersenyum! 😊`,
                'sad': `${genderText}, jangan sedih, semuanya akan baik-baik saja. 😢`,
                'angry': `Tenang ya ${genderText}, jangan marah-marah. 😠`,
                'fearful': `Jangan takut ${genderText}, ini hanya aplikasi sederhana. 😨`,
                'disgusted': `Ada yang tidak Anda sukai ${genderText}? 😖`,
                'surprised': `Wah ${genderText}, terkejut ya? 😲`,
                'neutral': `Halo ${genderText}! Selamat datang. 😐`
            };
            
            greeting.textContent = greetings[dominantExpression] || greetings['neutral'];
            agePrediction.textContent = `Usia: ${age} tahun (${genderText})`;
            
            // Gambar informasi usia di canvas
            new faceapi.draw.DrawTextField(
                [`${age} tahun`, `${genderText}`],
                detections[0].detection.box.bottomRight
            ).draw(canvas);
            
        } else {
            greeting.textContent = 'Silahkan hadapkan wajah Anda ke kamera';
            agePrediction.textContent = 'Usia: -';
        }
    }, 100);
}
