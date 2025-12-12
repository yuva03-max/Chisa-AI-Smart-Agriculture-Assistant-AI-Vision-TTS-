import os
from flask import Flask, render_template, request, jsonify, send_from_directory
import uuid
from datetime import datetime, timezone, timedelta
import base64
from gtts import gTTS
import io
from openai import OpenAI

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'dev-secret-key')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# === OpenAI API Configuration ===
OPENAI_API_KEY = "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"  # Replace with your actual API key
client = OpenAI(api_key=OPENAI_API_KEY)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

def ask_llm(system_prompt, user_prompt, language='ta'):
    """Call OpenAI ChatCompletion for text responses."""
    try:
        if OPENAI_API_KEY == "YOUR_API_KEY_HERE":
            return get_fallback_response(user_prompt, language)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM Error (OpenAI): {e}")
        return get_fallback_response(user_prompt, language)

def ask_vision(image_path, system_prompt, language='ta'):
    """Vision API for OpenAI with base64 image."""
    try:
        if OPENAI_API_KEY == "YOUR_API_KEY_HERE":
            return get_vision_fallback(language)

        with open(image_path, 'rb') as img_file:
            image_bytes = img_file.read()
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        ext = image_path.rsplit('.', 1)[1].lower()
        mime_type = 'image/jpeg' if ext in ['jpg', 'jpeg'] else f'image/{ext}'

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_b64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Analyze this plant image and provide detailed information."
                        }
                    ]
                }
            ],
            temperature=0.7,
            max_tokens=1200
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Vision Error (OpenAI): {e}")
        return get_vision_fallback(language)

def get_fallback_response(message, language):
    if language == 'ta':
        return "மன்னிக்கவும், தற்போது AI சேவை கிடைக்கவில்லை. தயவு செய்து பின்னர் முயற்சிக்கவும். உங்கள் கேள்விக்கு உள்ளூர் வேளாண்மை அலுவலகத்தை அணுகலாம்."
    return "Sorry, AI service is currently unavailable. Please try again later. You can also contact your local agriculture office for assistance."

def get_vision_fallback(language):
    if language == 'ta':
        return """🌿 **பட பகுப்பாய்வு**

AI சேவை தற்போது கிடைக்கவில்லை. 

💡 **பொது பரிந்துரைகள்:**
• தெளிவான இலை படங்களை பயன்படுத்தவும்
• நல்ல ஒளியில் படம் எடுக்கவும்
• உள்ளூர் வேளாண்மை அலுவலகத்தை தொடர்பு கொள்ளவும்"""
    return """🌿 **Image Analysis**

AI service is currently unavailable.

💡 **General Recommendations:**
• Use clear leaf images
• Take photos in good lighting
• Contact your local agriculture office for assistance"""

def text_to_speech(text, language='ta'):
    try:
        if not text or text.strip() == "":
            return None

        clean_text = text.replace('**', '').replace('*', '').replace('#', '').replace('•', '')
        lang = 'ta' if language == 'ta' else 'en'

        tts = gTTS(text=clean_text[:500], lang=lang, slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        return base64.b64encode(audio_buffer.read()).decode('utf-8')
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

def get_ist_timestamp():
    ist = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist).strftime('%Y-%m-%d %H:%M IST')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400

        message = data.get('message', '')
        language = data.get('language', 'ta')

        if not message:
            return jsonify({'error': 'Empty message'}), 400

        if language == 'ta':
            system_prompt = """நீங்கள் ஒரு வேளாண்மை நிபுணர் உதவியாளர். தமிழ் விவசாயிகளுக்கு உதவி செய்யுங்கள்.
            விவசாயம், பயிர்கள், உரங்கள், பூச்சி கட்டுப்பாடு, நீர்ப்பாசனம் பற்றிய கேள்விகளுக்கு பதிலளியுங்கள்.
            நடைமுறை ஆலோசனைகளை வழங்குங்கள். பதில்களை சுருக்கமாகவும், புரிந்துகொள்ள எளிதாகவும் வைக்கவும்."""
        else:
            system_prompt = """You are an agricultural expert assistant helping farmers.
            Answer questions about farming, crops, fertilizers, pest control, and irrigation.
            Provide practical, actionable advice. Keep responses concise and easy to understand."""

        response = ask_llm(system_prompt, message, language)
        audio_base64 = text_to_speech(response, language)

        return jsonify({
            'success': True,
            'response': response,
            'audio': audio_base64,
            'timestamp': get_ist_timestamp()
        })
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'img' not in request.files:
            return jsonify({'error': 'No file selected'}), 400

        file = request.files['img']
        language = request.form.get('language', 'ta')

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and file.filename and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = str(uuid.uuid4()) + '.' + ext
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            if language == 'ta':
                system_prompt = """இந்த தாவர படத்தை பகுப்பாய்வு செய்து நோய்களை கண்டறியுங்கள்.
                தமிழில் பதிலளியுங்கள். பின்வருவனவற்றை சேர்க்கவும்:
                1. கண்டறியப்பட்ட நோய் அல்லது நிலை
                2. அறிகுறிகள் விளக்கம்
                3. சிகிச்சை பரிந்துரைகள்
                4. தடுப்பு நடவடிக்கைகள்
                5. பயன்படுத்த வேண்டிய உரங்கள் அல்லது மருந்துகள்"""
            else:
                system_prompt = """Analyze this plant image and detect any diseases.
                Provide response in English including:
                1. Detected disease or condition
                2. Symptoms explanation
                3. Treatment recommendations
                4. Prevention measures
                5. Recommended fertilizers or pesticides"""

            prediction = ask_vision(filepath, system_prompt, language)
            audio_base64 = text_to_speech(prediction, language)

            return jsonify({
                'success': True,
                'prediction': prediction,
                'imagepath': f'/uploads/{filename}',
                'audio': audio_base64,
                'timestamp': get_ist_timestamp()
            })
        else:
            return jsonify({'error': 'Invalid file type. Please upload PNG, JPG, or JPEG.'}), 400
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image selected'}), 400

        file = request.files['image']
        language = request.form.get('language', 'ta')

        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400

        if file and file.filename and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = str(uuid.uuid4()) + '.' + ext
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            if language == 'ta':
                system_prompt = """இந்த தாவர படத்தை விரிவாக பகுப்பாய்வு செய்யுங்கள்.
                தமிழில் பதிலளியுங்கள். பின்வருவனவற்றை சேர்க்கவும்:
                1. தாவரத்தின் ஆரோக்கிய நிலை
                2. கண்டறியப்பட்ட பிரச்சனைகள்
                3. விரிவான சிகிச்சை திட்டம்
                4. பராமரிப்பு குறிப்புகள்"""
            else:
                system_prompt = """Analyze this plant image in detail.
                Provide response in English including:
                1. Plant health status
                2. Identified problems
                3. Detailed treatment plan
                4. Maintenance tips"""

            analysis = ask_vision(filepath, system_prompt, language)
            audio_base64 = text_to_speech(analysis, language)

            return jsonify({
                'success': True,
                'analysis': analysis,
                'imagepath': f'/uploads/{filename}',
                'audio': audio_base64,
                'timestamp': get_ist_timestamp()
            })
        else:
            return jsonify({'error': 'Invalid file type'}), 400
    except Exception as e:
        print(f"Analyze image error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_crop_calendar', methods=['POST'])
def get_crop_calendar():
    try:
        data = request.get_json()
        crop_type = data.get('crop_type', '')
        language = data.get('language', 'ta')

        if not crop_type:
            return jsonify({'error': 'Crop type is required'}), 400

        if language == 'ta':
            system_prompt = f"""நீங்கள் ஒரு வேளாண்மை நிபுணர். {crop_type} பயிருக்கான விரிவான பயிர் காலண்டரை வழங்குங்கள்.
            பின்வருவனவற்றை சேர்க்கவும்:
            🌱 விதைப்பு காலம்
            ⏰ வளர்ச்சி காலம்
            💧 நீர்ப்பாசன அட்டவணை
            🌿 உரம் திட்டம்
            🔬 முக்கிய நடவடிக்கைகள்
            📅 அறுவடை நேரம்
            தமிழில் பதிலளியுங்கள்."""
        else:
            system_prompt = f"""You are an agricultural expert. Provide a detailed crop calendar for {crop_type}.
            Include:
            🌱 Sowing season
            ⏰ Growth period
            💧 Irrigation schedule
            🌿 Fertilizer plan
            🔬 Key activities
            📅 Harvest time
            Respond in English."""

        calendar_data = ask_llm(system_prompt, f"Provide crop calendar for {crop_type}", language)
        audio_base64 = text_to_speech(calendar_data, language)

        return jsonify({
            'success': True,
            'calendar': calendar_data,
            'audio': audio_base64,
            'timestamp': get_ist_timestamp()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_irrigation_guide', methods=['POST'])
def get_irrigation_guide():
    try:
        data = request.get_json()
        crop_type = data.get('crop_type', '')
        soil_type = data.get('soil_type', '')
        language = data.get('language', 'ta')

        if not crop_type or not soil_type:
            return jsonify({'error': 'Crop type and soil type are required'}), 400

        if language == 'ta':
            system_prompt = f"""நீங்கள் ஒரு நீர்ப்பாசன நிபுணர். {crop_type} பயிருக்கு {soil_type} மண்ணில் நீர்ப்பாசன வழிகாட்டி வழங்குங்கள்.
            பின்வருவனவற்றை சேர்க்கவும்:
            💧 நீர்ப்பாசன அட்டவணை
            ⏰ சிறந்த நேரம்
            📊 நீர் அளவு
            🔧 நீர்ப்பாசன முறைகள்
            💡 நீர் சேமிப்பு குறிப்புகள்
            தமிழில் பதிலளியுங்கள்."""
        else:
            system_prompt = f"""You are an irrigation expert. Provide irrigation guide for {crop_type} in {soil_type} soil.
            Include:
            💧 Irrigation schedule
            ⏰ Best timing
            📊 Water quantity
            🔧 Irrigation methods
            💡 Water saving tips
            Respond in English."""

        guide_data = ask_llm(system_prompt, f"Irrigation guide for {crop_type} in {soil_type} soil", language)
        audio_base64 = text_to_speech(guide_data, language)

        return jsonify({
            'success': True,
            'guide': guide_data,
            'audio': audio_base64,
            'timestamp': get_ist_timestamp()
        })
    except Exception as e:
        print(f"Irrigation guide error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_market_prices', methods=['POST'])
def get_market_prices():
    try:
        data = request.get_json()
        crop_type = data.get('crop_type', '')
        district = data.get('district', '')
        language = data.get('language', 'ta')

        if not crop_type:
            return jsonify({'error': 'Crop type is required'}), 400

        if language == 'ta':
            system_prompt = f"""நீங்கள் ஒரு விவசாய சந்தை நிபுணர். {crop_type} பயிருக்கான சந்தை விலை தகவல்களை வழங்குங்கள்.
            {f'மாவட்டம்: {district}' if district else ''}
            பின்வருவனவற்றை சேர்க்கவும்:
            💰 தற்போதைய விலை வரம்பு
            📊 சந்தை போக்கு
            🏪 விற்பனை உத்திகள்
            💡 சிறந்த விற்பனை நேரம்
            ⚠️ கவனிக்க வேண்டியவை
            தமிழில் பதிலளியுங்கள்."""
        else:
            system_prompt = f"""You are an agricultural market expert. Provide market price information for {crop_type}.
            {f'District: {district}' if district else ''}
            Include:
            💰 Current price range
            📊 Market trends
            🏪 Selling strategies
            💡 Best selling time
            ⚠️ Things to watch out for
            Respond in English."""

        prices_data = ask_llm(system_prompt, f"Market prices for {crop_type}", language)
        audio_base64 = text_to_speech(prices_data, language)

        return jsonify({
            'success': True,
            'prices': prices_data,
            'audio': audio_base64,
            'timestamp': get_ist_timestamp()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)