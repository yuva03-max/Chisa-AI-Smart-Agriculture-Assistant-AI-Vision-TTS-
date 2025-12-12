# **Chisa AI – Intelligent Agricultural Assistant**

A farmer-friendly AI web application that provides **crop advice, disease detection, irrigation planning, market price insights, multilingual chat support**, and **plant image analysis**.

Chisa AI is built using **Flask (Python backend)** and a **modern responsive frontend** powered by HTML, CSS, JavaScript, and OpenAI APIs.
It is designed to support both **Tamil and English** farmers with real-time agricultural guidance.

---

## **🌟 Key Features**

### **1. AI Chat Assistant (Tamil & English)**

Interactive chatbot that gives farming advice, fertilizer suggestions, pest control tips, soil improvement techniques, and more.
Chat logic implemented in backend `/chat` route and frontend handlers.


### **2. Plant Disease Detection**

Upload plant images to automatically detect diseases and get:

* Disease name
* Symptoms
* Treatment
* Prevention
* Recommended fertilizers/pesticides
  Handled via `/upload` API using OpenAI Vision.


### **3. Image Analysis (General Plant Health)**

A separate image analysis module for detailed health assessment using `/analyze_image`.


### **4. Crop Calendar Generator**

Provides complete sowing → growth → irrigation → fertilizer → harvest schedule for crops like rice, sugarcane, tomato, etc.
Generated using `/get_crop_calendar`.


### **5. Irrigation Guide**

Gives personalized irrigation plans based on:

* Crop type
* Soil type
* Water quantity
* Best irrigation method
  Handled via `/get_irrigation_guide`.


### **6. Market Price Predictor**

Farmer-friendly price insights:

* Current price range
* Market trends
* Selling strategies
  Uses `/get_market_prices`.


### **7. Text-to-Speech (TTS) Output**

All AI responses are converted to audio for Tamil/English farmers.


### **8. Voice Input (Speech Recognition)**

Farmers can ask questions by speaking into the microphone.
Implemented in JavaScript speech recognition system.


## **📁 Project Structure**

/chisa-ai
│── app.py                 # Flask backend (APIs, TTS, Vision, Chat) 
│── templates/
│     └── index.html       # Main UI  
│── static/
│     ├── css/style.css    # UI/UX styling  
│     └── js/script.js     # Frontend logic  
│── uploads/               # Temporary image storage  
│── README.md              # Project documentation  

## **⚙️ How It Works (High-Level Architecture)**

### **Frontend**
* Uses **Bootstrap 5**, responsive cards, side navigation, chat UI
* Handles voice input, message sending, image uploads
* Dynamically updates UI components (result cards, alerts, loading screens)

### **Backend (Flask)**

Core operations include:

* Chat with OpenAI
* Image analysis via Vision API
* Crop calendar generation
* TTS audio output
* Request validation
* Error fallback when API fails

## **🚀 How to Run Locally**

### **1. Clone the Repository**

```bash
git clone https://github.com/yourusername/chisa-ai.git
cd chisa-ai
```

### **2. Install Dependencies**

```bash
pip install -r requirements.txt
```

### Required Python Packages

(derived from code imports)

```
Flask
gTTS
openai
```

### **3. Add Your OpenAI API Key**

Inside `app.py`, replace the placeholder:

```python
OPENAI_API_KEY = "YOUR_API_KEY"
```



### **4. Run the Server**

```bash
python app.py
```

The app will start on:

```
http://127.0.0.1:5000
```

---

## **🎨 UI/UX Highlights**
* Modern green theme inspired by farming
* Chat bubbles with timestamps
* Animated typing indicators
* Drag-and-drop image upload
* Mobile-friendly responsive design
  UI powered by `style.css`

## **🧠 Powered By**
* Flask
* OpenAI GPT-4o-mini (Chat + Vision)
* gTTS Text-to-Speech
* JavaScript SpeechRecognition API
* Bootstrap 5

## **📌 Future Enhancements**
* Real-time weather API
* Farmer profile dashboard
* Offline mode support
* Multi-language (Hindi, Telugu, Kannada)
* Crop yield prediction model

 **📜 License**
Open-source. You may remix, modify, or improve for educational or farming use.

