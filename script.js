// Muat model face-api.js terlebih dahulu
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

// Fungsi untuk memulai video
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                detectFaces();
            };
        })
        .catch(err => {
            console.error("Error accessing camera: ", err);
            document.getElementById('greeting').textContent = 
                "Error: Kamera tidak dapat diakses. Pastikan Anda memberikan izin kamera.";
        });
}

// Fungsi untuk mendeteksi wajah
function detectFaces() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const greeting = document.getElementById('greeting');
    const displaySize = { width: video.width, height: video.height };
    
    faceapi.matchDimensions(canvas, displaySize);
    
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceExpressions();
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        
        if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const dominantExpression = Object.entries(expressions)
                .reduce((a, b) => a[1] > b[1] ? a : b)[0];
            
            const greetings = {
                'happy': 'Hai! Senang melihat Anda tersenyum! 😊',
                'sad': 'Jangan sedih, semuanya akan baik-baik saja. 😢',
                'angry': 'Tenang ya, jangan marah-marah. 😠',
                'fearful': 'Jangan takut, ini hanya aplikasi sederhana. 😨',
                'disgusted': 'Ada yang tidak Anda sukai? 😖',
                'surprised': 'Wah, terkejut ya? 😲',
                'neutral': 'Halo! Selamat datang di aplikasi deteksi wajah. 😐'
            };
            
            greeting.textContent = greetings[dominantExpression] || greetings['neutral'];
        } else {
            greeting.textContent = 'Silahkan hadapkan wajah Anda ke kamera';
        }
    }, 100);
}
