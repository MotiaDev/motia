# Integrate AI into Your Backend

Add AI capabilities to your Motia backend - from simple chatbots to complex ML pipelines, image recognition, and natural language processing.

## Quick Start - Add AI in 5 Minutes

### Simple AI Chat with OpenAI

```javascript
// Step 1: API endpoint
// steps/api/chat.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/ai/chat',
  middleware: ['authMiddleware'],
  emits: ['ai.chat.request']
}

exports.handler = async (req, { emit, state }) => {
  const chatId = crypto.randomUUID()
  
  await state.set('chats', chatId, {
    userId: req.user.id,
    message: req.body.message,
    status: 'processing'
  })
  
  await emit({
    topic: 'ai.chat.request',
    data: { chatId, message: req.body.message }
  })
  
  return { status: 202, body: { chatId } }
}
```

```python
# Step 2: Process with AI
# steps/ai/chat_response_step.py
import openai

config = {
    "type": "event",
    "subscribes": ["ai.chat.request"],
    "emits": ["ai.chat.complete"]
}

openai.api_key = os.environ.get('OPENAI_API_KEY')

async def handler(input_data, ctx):
    chat_id = input_data["chatId"]
    message = input_data["message"]
    
    # Call OpenAI
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": message}
        ]
    )
    
    ai_response = response.choices[0].message.content
    
    # Update chat
    chat = await ctx.state.get("chats", chat_id)
    chat["response"] = ai_response
    chat["status"] = "completed"
    await ctx.state.set("chats", chat_id, chat)
    
    await ctx.emit({
        "topic": "ai.chat.complete",
        "data": {"chatId": chat_id, "response": ai_response}
    })
```

That's it! Your AI endpoint is ready at `/ai/chat`.

## Common AI Use Cases

### 1. Text Analysis & NLP

```python
# steps/ai/analyze_text_step.py
import spacy
from textblob import TextBlob
from transformers import pipeline

config = {
    "type": "event",
    "subscribes": ["text.analyze"],
    "emits": ["text.analysis.complete"]
}

# Load models
nlp = spacy.load("en_core_web_sm")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")

async def handler(input_data, ctx):
    text_id = input_data["textId"]
    text = input_data["text"]
    
    # Analyze with multiple models
    doc = nlp(text)
    blob = TextBlob(text)
    
    analysis = {
        # Entities (people, places, organizations)
        "entities": [
            {"text": ent.text, "type": ent.label_} 
            for ent in doc.ents
        ],
        
        # Sentiment
        "sentiment": {
            "polarity": blob.sentiment.polarity,  # -1 to 1
            "subjectivity": blob.sentiment.subjectivity,  # 0 to 1
            "classification": classifier(text)[0]
        },
        
        # Key phrases
        "keyPhrases": [chunk.text for chunk in doc.noun_chunks][:10],
        
        # Summary (for longer texts)
        "summary": summarizer(text, max_length=130, min_length=30)[0]["summary_text"] if len(text) > 200 else text,
        
        # Language detection
        "language": doc.lang_,
        
        # Readability
        "readability": calculate_readability(text)
    }
    
    # Save results
    await ctx.state.set("text_analysis", text_id, analysis)
    
    await ctx.emit({
        "topic": "text.analysis.complete",
        "data": {"textId": text_id, "analysis": analysis}
    })

def calculate_readability(text):
    words = text.split()
    sentences = text.split('.')
    avg_word_length = sum(len(word) for word in words) / len(words)
    avg_sentence_length = len(words) / len(sentences)
    
    # Simple readability score
    score = 206.835 - 1.015 * avg_sentence_length - 84.6 * avg_word_length
    
    return {
        "score": max(0, min(100, score)),
        "level": "easy" if score > 60 else "moderate" if score > 30 else "difficult"
    }
```

### 2. Image Recognition & Analysis

```python
# steps/ai/analyze_image_step.py
from transformers import pipeline
from PIL import Image
import torch
import io

config = {
    "type": "event",
    "subscribes": ["image.analyze"],
    "emits": ["image.analysis.complete"]
}

# Load models
image_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")
object_detector = pipeline("object-detection", model="facebook/detr-resnet-50")
image_captioner = pipeline("image-to-text", model="Salesforce/blip-image-captioning-base")

async def handler(input_data, ctx):
    image_id = input_data["imageId"]
    
    # Get image
    image_data = await ctx.state.get("images", image_id)
    image = Image.open(io.BytesIO(image_data["buffer"]))
    
    # Run multiple AI models
    analysis = {
        # What's in the image
        "classification": image_classifier(image)[:5],
        
        # Detect objects with locations
        "objects": object_detector(image),
        
        # Generate description
        "caption": image_captioner(image)[0]["generated_text"],
        
        # Image properties
        "properties": analyze_image_properties(image),
        
        # Is it safe?
        "safety": check_image_safety(image)
    }
    
    # Save results
    await ctx.state.set("image_analysis", image_id, analysis)
    
    await ctx.emit({
        "topic": "image.analysis.complete",
        "data": {"imageId": image_id, "analysis": analysis}
    })

def analyze_image_properties(image):
    return {
        "width": image.width,
        "height": image.height,
        "format": image.format,
        "mode": image.mode,
        "hasTransparency": image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info)
    }

def check_image_safety(image):
    # Implement NSFW detection
    # For now, return mock safe result
    return {
        "safe": True,
        "confidence": 0.99
    }
```

### 3. Recommendation Engine

```python
# steps/ai/recommend_products_step.py
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

config = {
    "type": "event",
    "subscribes": ["recommend.products"],
    "emits": ["recommendations.ready"]
}

async def handler(input_data, ctx):
    user_id = input_data["userId"]
    context_item = input_data.get("currentItem")
    
    # Get user history and preferences
    history = await ctx.state.get("user_history", user_id) or []
    preferences = await ctx.state.get("user_preferences", user_id) or {}
    
    # Get all products
    products = await ctx.state.get_group("products") or []
    
    recommendations = []
    
    # Content-based filtering
    if context_item:
        similar = find_similar_products(context_item, products)
        recommendations.extend(similar[:5])
    
    # Collaborative filtering
    if history:
        collaborative = collaborative_recommendations(user_id, history, ctx)
        recommendations.extend(collaborative[:5])
    
    # Personalized recommendations based on preferences
    if preferences:
        personalized = preference_based_recommendations(preferences, products)
        recommendations.extend(personalized[:5])
    
    # Remove duplicates and already purchased
    seen = set(history)
    unique_recommendations = []
    for rec in recommendations:
        if rec["productId"] not in seen:
            unique_recommendations.append(rec)
            seen.add(rec["productId"])
    
    # Score and sort
    final_recommendations = score_recommendations(unique_recommendations[:10])
    
    await ctx.emit({
        "topic": "recommendations.ready",
        "data": {
            "userId": user_id,
            "recommendations": final_recommendations
        }
    })

def find_similar_products(item_id, products):
    # Find product
    item = next((p for p in products if p["id"] == item_id), None)
    if not item:
        return []
    
    # Create feature vectors from descriptions
    descriptions = [p.get("description", "") for p in products]
    vectorizer = TfidfVectorizer(max_features=100)
    vectors = vectorizer.fit_transform(descriptions)
    
    # Calculate similarities
    item_idx = next(i for i, p in enumerate(products) if p["id"] == item_id)
    similarities = cosine_similarity(vectors[item_idx:item_idx+1], vectors)[0]
    
    # Get top similar items
    similar_indices = similarities.argsort()[-6:-1][::-1]  # Top 5, excluding self
    
    return [
        {
            "productId": products[i]["id"],
            "score": float(similarities[i]),
            "reason": "similar_to_viewed"
        }
        for i in similar_indices
    ]
```

### 4. Conversational AI Assistant

```python
# steps/ai/assistant_step.py
from langchain import LLMChain, PromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
import json

config = {
    "type": "event",
    "subscribes": ["assistant.message"],
    "emits": ["assistant.response", "assistant.action"]
}

# Initialize LangChain
llm = ChatOpenAI(temperature=0.7, model="gpt-3.5-turbo")
memory = ConversationBufferMemory()

prompt = PromptTemplate(
    input_variables=["history", "input"],
    template="""You are a helpful assistant for an e-commerce platform.
    
Previous conversation:
{history}

User: {input}
Assistant: """
)

chain = LLMChain(llm=llm, memory=memory, prompt=prompt)

async def handler(input_data, ctx):
    session_id = input_data["sessionId"]
    message = input_data["message"]
    
    # Get or create conversation memory
    session_memory = await ctx.state.get("conversations", session_id)
    if session_memory:
        memory.chat_memory.messages = session_memory
    
    # Process with AI
    response = await chain.arun(input=message)
    
    # Detect intent and extract entities
    intent = detect_intent(message)
    entities = extract_entities(message)
    
    # Save conversation
    await ctx.state.set(
        "conversations", 
        session_id, 
        memory.chat_memory.messages
    )
    
    # Emit response
    await ctx.emit({
        "topic": "assistant.response",
        "data": {
            "sessionId": session_id,
            "message": response,
            "intent": intent,
            "entities": entities
        }
    })
    
    # If action needed, emit action event
    if intent in ["order.track", "product.search", "support.ticket"]:
        await ctx.emit({
            "topic": "assistant.action",
            "data": {
                "sessionId": session_id,
                "action": intent,
                "parameters": entities
            }
        })

def detect_intent(message):
    # Simple intent detection
    message_lower = message.lower()
    
    if any(word in message_lower for word in ["track", "order", "shipping"]):
        return "order.track"
    elif any(word in message_lower for word in ["search", "find", "looking for"]):
        return "product.search"
    elif any(word in message_lower for word in ["help", "support", "problem"]):
        return "support.ticket"
    else:
        return "general.chat"

def extract_entities(message):
    # Extract order numbers, product names, etc
    entities = {}
    
    # Order number pattern
    order_match = re.search(r'#(\d+)', message)
    if order_match:
        entities["orderId"] = order_match.group(1)
    
    return entities
```

### 5. Document Processing with OCR

```python
# steps/ai/process_document_step.py
import pytesseract
from pdf2image import convert_from_bytes
from transformers import pipeline
import cv2
import numpy as np

config = {
    "type": "event",
    "subscribes": ["document.process"],
    "emits": ["document.extracted"]
}

# Load models
ner = pipeline("ner", aggregation_strategy="simple")
classifier = pipeline("zero-shot-classification")

async def handler(input_data, ctx):
    doc_id = input_data["documentId"]
    doc_type = input_data.get("type", "invoice")
    
    # Get document
    doc_data = await ctx.state.get("documents", doc_id)
    
    # Convert to images if PDF
    if doc_data["mimeType"] == "application/pdf":
        images = convert_from_bytes(doc_data["buffer"])
    else:
        images = [Image.open(io.BytesIO(doc_data["buffer"]))]
    
    extracted_data = {
        "text": "",
        "entities": [],
        "fields": {},
        "confidence": 0
    }
    
    # Process each page
    for i, image in enumerate(images):
        # Enhance image for better OCR
        enhanced = enhance_image(np.array(image))
        
        # Extract text
        text = pytesseract.image_to_string(enhanced)
        extracted_data["text"] += text + "\n"
        
        # Extract entities
        entities = ner(text)
        extracted_data["entities"].extend(entities)
    
    # Extract specific fields based on document type
    if doc_type == "invoice":
        extracted_data["fields"] = extract_invoice_fields(extracted_data["text"])
    elif doc_type == "receipt":
        extracted_data["fields"] = extract_receipt_fields(extracted_data["text"])
    elif doc_type == "id":
        extracted_data["fields"] = extract_id_fields(extracted_data["text"])
    
    # Classify document if type unknown
    if not doc_type:
        candidate_labels = ["invoice", "receipt", "contract", "id document", "form"]
        result = classifier(extracted_data["text"][:500], candidate_labels)
        doc_type = result["labels"][0]
    
    # Save results
    await ctx.state.set("document_extracts", doc_id, {
        "type": doc_type,
        "extracted": extracted_data,
        "processedAt": datetime.now().isoformat()
    })
    
    await ctx.emit({
        "topic": "document.extracted",
        "data": {
            "documentId": doc_id,
            "type": doc_type,
            "fields": extracted_data["fields"]
        }
    })

def enhance_image(image):
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Denoise
    denoised = cv2.medianBlur(thresh, 3)
    
    return denoised

def extract_invoice_fields(text):
    fields = {}
    
    # Extract invoice number
    invoice_match = re.search(r'Invoice\s*#?\s*:?\s*(\w+)', text, re.IGNORECASE)
    if invoice_match:
        fields["invoiceNumber"] = invoice_match.group(1)
    
    # Extract total amount
    total_match = re.search(r'Total\s*:?\s*\$?([0-9,]+\.?\d*)', text, re.IGNORECASE)
    if total_match:
        fields["total"] = float(total_match.group(1).replace(',', ''))
    
    # Extract date
    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    if date_match:
        fields["date"] = date_match.group(1)
    
    return fields
```

## Advanced AI Patterns

### Speech Recognition & Synthesis

```python
# steps/ai/speech_processing_step.py
import speech_recognition as sr
from gtts import gTTS
import io

config = {
    "type": "event",
    "subscribes": ["audio.process"],
    "emits": ["speech.transcribed", "speech.synthesized"]
}

recognizer = sr.Recognizer()

async def handler(input_data, ctx):
    audio_id = input_data["audioId"]
    action = input_data["action"]  # "transcribe" or "synthesize"
    
    if action == "transcribe":
        # Get audio data
        audio_data = await ctx.state.get("audio_files", audio_id)
        
        # Convert to audio file
        audio_file = sr.AudioFile(io.BytesIO(audio_data["buffer"]))
        
        with audio_file as source:
            audio = recognizer.record(source)
        
        # Transcribe
        try:
            text = recognizer.recognize_google(audio)
            language = recognizer.recognize_google(audio, show_all=True)["lang"]
        except sr.UnknownValueError:
            text = ""
            language = "unknown"
        
        # Save and emit
        await ctx.state.set("transcriptions", audio_id, {
            "text": text,
            "language": language,
            "confidence": 0.95
        })
        
        await ctx.emit({
            "topic": "speech.transcribed",
            "data": {
                "audioId": audio_id,
                "text": text,
                "language": language
            }
        })
    
    elif action == "synthesize":
        text = input_data["text"]
        language = input_data.get("language", "en")
        
        # Generate speech
        tts = gTTS(text=text, lang=language)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        
        # Save audio
        await ctx.state.set("audio_files", audio_id, {
            "buffer": audio_buffer.getvalue(),
            "text": text,
            "language": language
        })
        
        await ctx.emit({
            "topic": "speech.synthesized",
            "data": {
                "audioId": audio_id,
                "duration": len(audio_buffer.getvalue()) / 16000  # Approximate
            }
        })
```

### Video Analysis with AI

```python
# steps/ai/video_analysis_step.py
import cv2
from transformers import pipeline
import mediapipe as mp

config = {
    "type": "event",
    "subscribes": ["video.analyze.ai"],
    "emits": ["video.ai.complete"]
}

# Load models
action_classifier = pipeline("video-classification", model="MCG-NJU/videomae-base")
emotion_detector = pipeline("image-classification", model="dima806/facial_emotions_image_detection")

# MediaPipe for pose detection
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

async def handler(input_data, ctx):
    video_id = input_data["videoId"]
    analysis_type = input_data.get("type", "full")
    
    # Get video
    video_data = await ctx.state.get("videos", video_id)
    
    # Create temporary file
    temp_path = f"/tmp/{video_id}.mp4"
    with open(temp_path, 'wb') as f:
        f.write(video_data["buffer"])
    
    cap = cv2.VideoCapture(temp_path)
    
    analysis = {
        "actions": [],
        "emotions": [],
        "poses": [],
        "highlights": []
    }
    
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Sample every 30 frames (1 second at 30fps)
        if frame_count % 30 == 0:
            timestamp = frame_count / 30
            
            # Detect actions
            if analysis_type in ["full", "actions"]:
                action = detect_action(frame, action_classifier)
                if action["confidence"] > 0.7:
                    analysis["actions"].append({
                        "timestamp": timestamp,
                        "action": action["label"],
                        "confidence": action["confidence"]
                    })
            
            # Detect emotions from faces
            if analysis_type in ["full", "emotions"]:
                emotions = detect_emotions(frame, emotion_detector)
                if emotions:
                    analysis["emotions"].append({
                        "timestamp": timestamp,
                        "emotions": emotions
                    })
            
            # Detect poses
            if analysis_type in ["full", "poses"]:
                pose_data = detect_pose(frame, pose)
                if pose_data:
                    analysis["poses"].append({
                        "timestamp": timestamp,
                        "pose": pose_data
                    })
        
        frame_count += 1
    
    cap.release()
    os.remove(temp_path)
    
    # Generate highlights
    analysis["highlights"] = generate_highlights(analysis)
    
    # Save results
    await ctx.state.set("video_ai_analysis", video_id, analysis)
    
    await ctx.emit({
        "topic": "video.ai.complete",
        "data": {
            "videoId": video_id,
            "summary": summarize_analysis(analysis)
        }
    })

def detect_emotions(frame, detector):
    # Detect faces first
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    emotions = []
    for (x, y, w, h) in faces:
        face = frame[y:y+h, x:x+w]
        result = detector(face)
        emotions.append({
            "position": {"x": x, "y": y, "w": w, "h": h},
            "emotion": result[0]["label"],
            "confidence": result[0]["score"]
        })
    
    return emotions

def generate_highlights(analysis):
    highlights = []
    
    # Find emotional peaks
    high_emotion_moments = [
        e for e in analysis["emotions"] 
        if any(em["confidence"] > 0.8 for em in e["emotions"])
    ]
    
    # Find action transitions
    action_changes = []
    for i in range(1, len(analysis["actions"])):
        if analysis["actions"][i]["action"] != analysis["actions"][i-1]["action"]:
            action_changes.append(analysis["actions"][i])
    
    # Combine and sort
    for moment in high_emotion_moments[:3]:
        highlights.append({
            "timestamp": moment["timestamp"],
            "type": "emotional_peak",
            "description": f"High emotion detected: {moment['emotions'][0]['emotion']}"
        })
    
    for change in action_changes[:3]:
        highlights.append({
            "timestamp": change["timestamp"],
            "type": "action_change",
            "description": f"Action changed to: {change['action']}"
        })
    
    return sorted(highlights, key=lambda x: x["timestamp"])
```

## Testing AI Integrations

```javascript
// tests/ai-integration.test.js
const { handler: chatHandler } = require('../steps/ai/chat_response_step')

test('AI chat responds correctly', async () => {
  const input = {
    chatId: '123',
    message: 'What products do you have?'
  }
  
  const context = {
    state: {
      get: jest.fn(),
      set: jest.fn()
    },
    emit: jest.fn()
  }
  
  await chatHandler(input, context)
  
  expect(context.emit).toHaveBeenCalledWith({
    topic: 'ai.chat.complete',
    data: expect.objectContaining({
      chatId: '123',
      response: expect.any(String)
    })
  })
})
```

## Best Practices

### 1. Handle AI Failures Gracefully
```python
try:
    result = model.predict(data)
except Exception as e:
    ctx.logger.error(f"AI model failed: {str(e)}")
    # Fallback to simpler logic or default response
    result = get_fallback_result(data)
```

### 2. Cache AI Results
```javascript
// Check cache first
const cached = await state.get('ai_cache', cacheKey)
if (cached && Date.now() - cached.timestamp < 3600000) {
  return cached.result
}

// Run AI model
const result = await runAIModel(data)

// Cache result
await state.set('ai_cache', cacheKey, {
  result,
  timestamp: Date.now()
})
```

### 3. Monitor AI Performance
```python
start_time = time.time()
result = model.predict(data)
inference_time = time.time() - start_time

await ctx.emit({
    "topic": "metrics.ai",
    "data": {
        "model": "sentiment-analysis",
        "inferenceTime": inference_time,
        "inputSize": len(data)
    }
})
```

## Next Steps

- Fine-tune models: See `train-custom-models.md`
- Add AI monitoring: See `monitor-ai-performance.md`
- Scale AI workloads: See `scale-ai-processing.md`
- Implement AI safety: See `ai-safety-practices.md`