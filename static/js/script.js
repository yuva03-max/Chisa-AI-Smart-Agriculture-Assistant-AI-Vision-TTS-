class KisanAIChat {
    constructor() {
        this.currentLanguage = 'ta';
        this.isRecording = false;
        this.recognition = null;
        this.currentAudio = null;
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.initializeSpeechRecognition();
        this.initializeNewFeatures();
        this.updateCurrentTime();
        this.updatePlaceholders();
    }

    initializeEventListeners() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleLanguageChange(e.target);
            });
        });

        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleVoiceRecording();
            });
        }

        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.closest('.quick-action-btn').getAttribute('data-question');
                document.getElementById('user-input').value = question;
                this.sendMessage();
            });
        });

        const imageUploadTrigger = document.getElementById('image-upload-trigger');
        if (imageUploadTrigger) {
            imageUploadTrigger.addEventListener('click', () => {
                document.getElementById('image-upload-input').click();
            });
        }

        const imageUploadInput = document.getElementById('image-upload-input');
        if (imageUploadInput) {
            imageUploadInput.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }

        const analyzeImageBtn = document.getElementById('analyze-image-btn');
        if (analyzeImageBtn) {
            analyzeImageBtn.addEventListener('click', () => {
                this.analyzeImage();
            });
        }

        const diseaseForm = document.getElementById('disease-upload-form');
        if (diseaseForm) {
            diseaseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadForDiseaseDetection();
            });
        }
    }

    initializeNewFeatures() {
        const cropCalendarForm = document.getElementById('crop-calendar-form');
        if (cropCalendarForm) {
            cropCalendarForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.getCropCalendar();
            });
        }

        const irrigationForm = document.getElementById('irrigation-guide-form');
        if (irrigationForm) {
            irrigationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.getIrrigationGuide();
            });
        }

        const marketForm = document.getElementById('market-prices-form');
        if (marketForm) {
            marketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.getMarketPrices();
            });
        }
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.currentLanguage === 'ta' ? 'ta-IN' : 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('user-input').value = transcript;
                this.sendMessage();
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                document.getElementById('voice-btn').classList.remove('recording');
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                document.getElementById('voice-btn').classList.remove('recording');
            };
        }
    }

    handleLanguageChange(target) {
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        this.currentLanguage = target.getAttribute('data-lang');
        
        if (this.recognition) {
            this.recognition.lang = this.currentLanguage === 'ta' ? 'ta-IN' : 'en-US';
        }

        this.updatePlaceholders();
        this.updateWelcomeMessage();
    }

    updatePlaceholders() {
        const userInput = document.getElementById('user-input');
        if (userInput) {
            if (this.currentLanguage === 'ta') {
                userInput.placeholder = 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்க...';
            } else {
                userInput.placeholder = 'Type your question here...';
            }
        }
    }

    updateWelcomeMessage() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            if (this.currentLanguage === 'ta') {
                this.addMessage('🌱 வணக்கம்! நான் உங்கள் வேளாண்மை உதவியாளர். நீங்கள் வேளாண்மை சம்பந்தப்பட்ட எந்த கேள்விகளையும் கேட்கலாம்.', 'bot');
            } else {
                this.addMessage('🌱 Welcome! I am your agricultural assistant. You can ask me any farming-related questions.', 'bot');
            }
        }
    }

    toggleVoiceRecording() {
        if (!this.recognition) {
            const msg = this.currentLanguage === 'ta' 
                ? 'குரல் அங்கீகாரம் உங்கள் உலாவியில் ஆதரிக்கப்படவில்லை.' 
                : 'Voice recognition is not supported in your browser.';
            this.showAlert(msg, 'warning');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            document.getElementById('voice-btn').classList.remove('recording');
        } else {
            this.recognition.start();
            this.isRecording = true;
            document.getElementById('voice-btn').classList.add('recording');
            const msg = this.currentLanguage === 'ta' ? 'கேட்டுக்கொண்டிருக்கிறது...' : 'Listening...';
            this.showAlert(msg, 'info');
        }
    }

    async sendMessage() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();

        if (!message) return;

        this.addMessage(message, 'user');
        userInput.value = '';
        this.showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    language: this.currentLanguage
                })
            });

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'bot', data.audio);
            } else {
                this.addMessage('Error: ' + data.error, 'bot');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            const msg = this.currentLanguage === 'ta' 
                ? 'பிணைய பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' 
                : 'Network error occurred. Please try again.';
            this.addMessage(msg, 'bot');
        }
    }

    async getCropCalendar() {
        const cropType = document.getElementById('crop-type').value;
        const language = document.getElementById('calendar-language').value;

        if (!cropType) {
            const msg = language === 'ta' 
                ? 'தயவுசெய்து பயிர் வகையைத் தேர்ந்தெடுக்கவும்.' 
                : 'Please select a crop type.';
            this.showAlert(msg, 'warning');
            return;
        }

        const loadingMsg = language === 'ta' 
            ? 'பயிர் காலண்டரை ஏற்றுகிறது...' 
            : 'Loading crop calendar...';
        this.showLoading('calendar-result', loadingMsg);

        try {
            const response = await fetch('/get_crop_calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    crop_type: cropType,
                    language: language
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayResult('calendar-result', data.calendar, data.audio);
            } else {
                this.displayResult('calendar-result', `<div class="alert alert-danger">${data.error}</div>`);
            }
        } catch (error) {
            console.error('Crop calendar error:', error);
            const msg = language === 'ta' 
                ? '<div class="alert alert-danger">பிணைய பிழை ஏற்பட்டது.</div>' 
                : '<div class="alert alert-danger">Network error occurred.</div>';
            this.displayResult('calendar-result', msg);
        }
    }

    async getIrrigationGuide() {
        const cropType = document.getElementById('irrigation-crop').value;
        const soilType = document.getElementById('soil-type').value;
        const language = document.getElementById('irrigation-language').value;

        if (!cropType || !soilType) {
            const msg = language === 'ta' 
                ? 'தயவுசெய்து பயிர் வகை மற்றும் மண் வகையைத் தேர்ந்தெடுக்கவும்.' 
                : 'Please select both crop type and soil type.';
            this.showAlert(msg, 'warning');
            return;
        }

        const loadingMsg = language === 'ta' 
            ? 'நீர்ப்பாசன வழிகாட்டியை ஏற்றுகிறது...' 
            : 'Loading irrigation guide...';
        this.showLoading('irrigation-result', loadingMsg);

        try {
            const response = await fetch('/get_irrigation_guide', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    crop_type: cropType,
                    soil_type: soilType,
                    language: language
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayResult('irrigation-result', data.guide, data.audio);
            } else {
                this.displayResult('irrigation-result', `<div class="alert alert-danger">${data.error}</div>`);
            }
        } catch (error) {
            console.error('Irrigation guide error:', error);
            const msg = language === 'ta' 
                ? '<div class="alert alert-danger">பிணைய பிழை ஏற்பட்டது.</div>' 
                : '<div class="alert alert-danger">Network error occurred.</div>';
            this.displayResult('irrigation-result', msg);
        }
    }

    async getMarketPrices() {
        const cropType = document.getElementById('market-crop').value;
        const district = document.getElementById('district').value;
        const language = document.getElementById('market-language').value;

        if (!cropType) {
            const msg = language === 'ta' 
                ? 'தயவுசெய்து பயிர் வகையைத் தேர்ந்தெடுக்கவும்.' 
                : 'Please select a crop type.';
            this.showAlert(msg, 'warning');
            return;
        }

        const loadingMsg = language === 'ta' 
            ? 'சந்தை விலைகளை ஏற்றுகிறது...' 
            : 'Loading market prices...';
        this.showLoading('market-result', loadingMsg);

        try {
            const response = await fetch('/get_market_prices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    crop_type: cropType,
                    district: district,
                    language: language
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayResult('market-result', data.prices, data.audio);
            } else {
                this.displayResult('market-result', `<div class="alert alert-danger">${data.error}</div>`);
            }
        } catch (error) {
            console.error('Market prices error:', error);
            const msg = language === 'ta' 
                ? '<div class="alert alert-danger">பிணைய பிழை ஏற்பட்டது.</div>' 
                : '<div class="alert alert-danger">Network error occurred.</div>';
            this.displayResult('market-result', msg);
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const preview = document.getElementById('image-preview');
        const analyzeBtn = document.getElementById('analyze-image-btn');
        const imageStatus = document.getElementById('image-status');

        if (preview) {
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.className = 'img-fluid rounded';
            preview.appendChild(img);
        }

        if (analyzeBtn) {
            analyzeBtn.disabled = false;
        }

        if (imageStatus) {
            const msg = this.currentLanguage === 'ta' 
                ? '<span class="text-success">பட பகுப்பாய்வுக்கு தயார்</span>' 
                : '<span class="text-success">Image ready for analysis</span>';
            imageStatus.innerHTML = msg;
        }
    }

    async analyzeImage() {
        const fileInput = document.getElementById('image-upload-input');
        if (!fileInput || !fileInput.files[0]) {
            const msg = this.currentLanguage === 'ta' 
                ? 'தயவுசெய்து முதலில் ஒரு படத்தைத் தேர்ந்தெடுக்கவும்.' 
                : 'Please select an image file first.';
            this.showAlert(msg, 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('language', this.currentLanguage);

        const msg = this.currentLanguage === 'ta' 
            ? 'பதிவேற்றப்பட்ட படத்தை பகுப்பாய்வு செய்கிறது...' 
            : 'Analyzing uploaded image...';
        this.addMessage(msg, 'bot');

        try {
            const response = await fetch('/analyze_image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.addMessage(data.analysis, 'bot', data.audio);
            } else {
                const errorMsg = this.currentLanguage === 'ta' 
                    ? `படம் பகுப்பாய்வு தோல்வியுற்றது: ${data.error}` 
                    : `Image analysis failed: ${data.error}`;
                this.addMessage(errorMsg, 'bot');
            }
        } catch (error) {
            console.error('Error analyzing image:', error);
            const errorMsg = this.currentLanguage === 'ta' 
                ? 'படம் பகுப்பாய்வின் போது பிணைய பிழை ஏற்பட்டது.' 
                : 'Network error occurred during image analysis.';
            this.addMessage(errorMsg, 'bot');
        }

        fileInput.value = '';
        const analyzeBtn = document.getElementById('analyze-image-btn');
        const imageStatus = document.getElementById('image-status');
        const preview = document.getElementById('image-preview');

        if (analyzeBtn) analyzeBtn.disabled = true;
        if (imageStatus) imageStatus.innerHTML = '';
        if (preview) preview.innerHTML = '';
    }

    async uploadForDiseaseDetection() {
        const fileInput = document.getElementById('disease-file-input');
        if (!fileInput || !fileInput.files[0]) {
            const msg = this.currentLanguage === 'ta' 
                ? 'தயவுசெய்து ஒரு படத்தைத் தேர்ந்தெடுக்கவும்.' 
                : 'Please select an image file.';
            this.showAlert(msg, 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('img', fileInput.files[0]);
        formData.append('language', this.currentLanguage);

        const resultDiv = document.getElementById('disease-result');
        if (resultDiv) {
            const loadingMsg = this.currentLanguage === 'ta' 
                ? '<div class="text-center"><div class="spinner-border text-success" role="status"></div><p class="mt-2">நோய்களுக்காக படத்தை பகுப்பாய்வு செய்கிறது...</p></div>' 
                : '<div class="text-center"><div class="spinner-border text-success" role="status"></div><p class="mt-2">Analyzing image for diseases...</p></div>';
            resultDiv.innerHTML = loadingMsg;
        }

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (resultDiv) {
                if (data.success) {
                    const title = this.currentLanguage === 'ta' 
                        ? '<h5><i class="fas fa-leaf me-2"></i>நோய் பகுப்பாய்வு முடிவு</h5>' 
                        : '<h5><i class="fas fa-leaf me-2"></i>Disease Analysis Result</h5>';
                    
                    let resultHTML = `<div class="feature-result-card">${title}<pre>${data.prediction}</pre>`;

                    if (data.imagepath) {
                        resultHTML += `<div class="mt-3 text-center">
                            <img src="${data.imagepath}" class="img-fluid rounded" alt="Analyzed Image" style="max-height: 200px;">
                        </div>`;
                    }

                    if (data.audio) {
                        const playBtn = this.currentLanguage === 'ta' 
                            ? '<i class="fas fa-volume-up me-1"></i> ஒலி இயக்கு' 
                            : '<i class="fas fa-volume-up me-1"></i> Play Audio';
                        const stopBtn = this.currentLanguage === 'ta' 
                            ? '<i class="fas fa-stop me-1"></i> நிறுத்து' 
                            : '<i class="fas fa-stop me-1"></i> Stop';
                        
                        resultHTML += `
                            <div class="audio-controls mt-3">
                                <button class="btn audio-btn" onclick="kisanAI.playAudio('${data.audio}')">
                                    ${playBtn}
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="kisanAI.stopAudio()">
                                    ${stopBtn}
                                </button>
                            </div>
                        `;
                    }

                    resultHTML += '</div>';
                    resultDiv.innerHTML = resultHTML;
                } else {
                    resultDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                }
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            if (resultDiv) {
                const errorMsg = this.currentLanguage === 'ta' 
                    ? '<div class="alert alert-danger">பிணைய பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.</div>' 
                    : '<div class="alert alert-danger">Network error occurred. Please try again.</div>';
                resultDiv.innerHTML = errorMsg;
            }
        }

        fileInput.value = '';
    }

    showLoading(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-success" role="status"></div>
                    <p class="mt-2 text-muted">${message}</p>
                </div>
            `;
        }
    }

    displayResult(elementId, content, audioBase64 = null) {
        const element = document.getElementById(elementId);
        if (element) {
            let html = `<div class="feature-result-card"><pre>${content}</pre>`;

            if (audioBase64) {
                const playBtn = this.currentLanguage === 'ta' 
                    ? '<i class="fas fa-volume-up me-1"></i> ஒலி இயக்கு' 
                    : '<i class="fas fa-volume-up me-1"></i> Play Audio';
                const stopBtn = this.currentLanguage === 'ta' 
                    ? '<i class="fas fa-stop me-1"></i> நிறுத்து' 
                    : '<i class="fas fa-stop me-1"></i> Stop';
                
                html += `
                    <div class="audio-controls mt-3">
                        <button class="btn audio-btn" onclick="kisanAI.playAudio('${audioBase64}')">
                            ${playBtn}
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="kisanAI.stopAudio()">
                            ${stopBtn}
                        </button>
                    </div>
                `;
            }

            html += '</div>';
            element.innerHTML = html;
        }
    }

    addMessage(content, sender, audioBase64 = null) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
        messageContent.appendChild(contentDiv);

        if (audioBase64 && sender === 'bot') {
            const audioContainer = document.createElement('div');
            audioContainer.className = 'audio-controls';

            const playButton = document.createElement('button');
            playButton.className = 'btn audio-btn btn-sm';
            const playText = this.currentLanguage === 'ta' ? 'ஒலி இயக்கு' : 'Play';
            playButton.innerHTML = `<i class="fas fa-volume-up me-1"></i> ${playText}`;
            playButton.onclick = () => this.playAudio(audioBase64);

            const stopButton = document.createElement('button');
            stopButton.className = 'btn btn-outline-secondary btn-sm';
            const stopText = this.currentLanguage === 'ta' ? 'நிறுத்து' : 'Stop';
            stopButton.innerHTML = `<i class="fas fa-stop me-1"></i> ${stopText}`;
            stopButton.onclick = () => this.stopAudio();

            audioContainer.appendChild(playButton);
            audioContainer.appendChild(stopButton);
            messageContent.appendChild(audioContainer);
        }

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();

        messageContent.appendChild(messageTime);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message bot';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    playAudio(audioBase64) {
        try {
            if (!audioBase64) {
                const msg = this.currentLanguage === 'ta' 
                    ? 'ஒலி உள்ளடக்கம் கிடைக்கவில்லை.' 
                    : 'No audio content available.';
                this.showAlert(msg, 'warning');
                return;
            }

            this.stopAudio();

            const audioBlob = this.base64ToBlob(audioBase64, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);

            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.play().catch(error => {
                console.error('Error playing audio:', error);
                const msg = this.currentLanguage === 'ta' 
                    ? 'ஒலி இயக்க முடியவில்லை.' 
                    : 'Could not play audio.';
                this.showAlert(msg, 'warning');
            });

            this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
            };

            const msg = this.currentLanguage === 'ta' 
                ? 'ஒலி இயங்குகிறது...' 
                : 'Playing audio...';
            this.showAlert(msg, 'info');
        } catch (error) {
            console.error('Error playing audio:', error);
            const msg = this.currentLanguage === 'ta' 
                ? 'ஒலி இயக்கம் தோல்வியுற்றது.' 
                : 'Audio playback failed.';
            this.showAlert(msg, 'warning');
        }
    }

    stopAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    base64ToBlob(base64, contentType = '') {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    }

    showAlert(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = this.getCurrentTime();
        }
    }
}

const kisanAI = new KisanAIChat();