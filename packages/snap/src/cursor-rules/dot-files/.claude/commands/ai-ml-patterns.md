# AI/ML Patterns with Python

Build AI-powered applications using Python for ML processing within Motia workflows.

## LLM Integration

### API Endpoint (TypeScript)
```typescript
// steps/api/ai/chat.step.ts
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AIChatAPI',
  method: 'POST',
  path: '/ai/chat',
  middleware: [authMiddleware],
  bodySchema: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
    })),
    model: z.enum(['gpt-4', 'claude-3', 'llama-2']).optional(),
    temperature: z.number().min(0).max(2).optional()
  }),
  emits: ['ai.chat.requested']
}

export const handler: Handlers['AIChatAPI'] = async (req, { emit, state }) => {
  const chatId = crypto.randomUUID()
  
  await state.set('chats', chatId, {
    userId: req.user.userId,
    messages: req.body.messages,
    status: 'processing',
    createdAt: new Date().toISOString()
  })
  
  await emit({
    topic: 'ai.chat.requested',
    data: {
      chatId,
      ...req.body,
      userId: req.user.userId
    }
  })
  
  return { 
    status: 202, 
    body: { chatId, status: 'processing' } 
  }
}
```

### AI Processing (Python)
```python
# steps/ai/process_chat_step.py
from openai import OpenAI
import anthropic
from transformers import pipeline
import asyncio
import json

config = {
    "type": "event",
    "name": "ProcessAIChat",
    "subscribes": ["ai.chat.requested"],
    "emits": ["ai.chat.completed", "ai.chat.streamed"],
    "input": {
        "type": "object",
        "properties": {
            "chatId": {"type": "string"},
            "messages": {"type": "array"},
            "model": {"type": "string"},
            "temperature": {"type": "number"}
        }
    }
}

# Initialize AI clients
openai_client = OpenAI()
claude_client = anthropic.Anthropic()

async def handler(input_data, ctx):
    chat_id = input_data["chatId"]
    messages = input_data["messages"]
    model = input_data.get("model", "gpt-4")
    temperature = input_data.get("temperature", 0.7)
    
    try:
        if model.startswith("gpt"):
            response = await process_openai(messages, model, temperature, ctx)
        elif model.startswith("claude"):
            response = await process_claude(messages, model, temperature, ctx)
        else:
            response = await process_local_llm(messages, model, ctx)
        
        # Store response
        await ctx.state.set("chats", chat_id, {
            **input_data,
            "response": response,
            "status": "completed",
            "completedAt": datetime.now().isoformat()
        })
        
        # Emit completion
        await ctx.emit({
            "topic": "ai.chat.completed",
            "data": {
                "chatId": chat_id,
                "response": response,
                "model": model,
                "usage": response.get("usage", {})
            }
        })
        
    except Exception as e:
        ctx.logger.error(f"AI processing failed: {str(e)}")
        await ctx.state.set("chats", chat_id, {
            **input_data,
            "status": "failed",
            "error": str(e)
        })

async def process_openai(messages, model, temperature, ctx):
    # Stream response
    stream = openai_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        stream=True
    )
    
    full_response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_response += content
            
            # Emit streaming update
            await ctx.emit({
                "topic": "ai.chat.streamed",
                "data": {
                    "chatId": input_data["chatId"],
                    "chunk": content
                }
            })
    
    return {
        "content": full_response,
        "model": model,
        "finishReason": "stop"
    }
```

## Document Analysis Pipeline

### Upload Handler (TypeScript)
```typescript
// steps/api/documents/analyze.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AnalyzeDocument',
  method: 'POST',
  path: '/documents/analyze',
  middleware: [authMiddleware, multer().single('document')],
  emits: ['document.analyze.requested']
}

export const handler = async (req, { emit, state }) => {
  const file = req.file
  const analysisId = crypto.randomUUID()
  
  // Store document
  await state.set('documents', analysisId, {
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    content: file.buffer,
    userId: req.user.userId
  })
  
  await emit({
    topic: 'document.analyze.requested',
    data: { analysisId, mimetype: file.mimetype }
  })
  
  return { status: 202, body: { analysisId } }
}
```

### Document Processing (Python)
```python
# steps/ai/analyze_document_step.py
import PyPDF2
import docx
import pandas as pd
import pytesseract
from PIL import Image
import io
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

config = {
    "type": "event",
    "name": "AnalyzeDocument",
    "subscribes": ["document.analyze.requested"],
    "emits": ["document.analysis.completed", "embeddings.generated"]
}

# Initialize models
embedder = SentenceTransformer('all-MiniLM-L6-v2')
summarizer = pipeline("summarization")

async def handler(input_data, ctx):
    analysis_id = input_data["analysisId"]
    
    try:
        # Get document
        doc_data = await ctx.state.get("documents", analysis_id)
        content_buffer = doc_data["content"]
        mimetype = doc_data["mimetype"]
        
        # Extract text based on type
        if mimetype == "application/pdf":
            text = extract_pdf_text(content_buffer)
        elif mimetype.startswith("image/"):
            text = extract_image_text(content_buffer)
        elif "word" in mimetype:
            text = extract_docx_text(content_buffer)
        else:
            text = content_buffer.decode('utf-8')
        
        # Analyze document
        analysis = {
            "text": text,
            "wordCount": len(text.split()),
            "language": detect_language(text),
            "entities": extract_entities(text),
            "keywords": extract_keywords(text),
            "summary": generate_summary(text),
            "sentiment": analyze_sentiment(text),
            "topics": extract_topics(text)
        }
        
        # Generate embeddings
        embeddings = generate_embeddings(text)
        
        # Store results
        await ctx.state.set("analyses", analysis_id, {
            **analysis,
            "status": "completed",
            "analyzedAt": datetime.now().isoformat()
        })
        
        # Store embeddings for semantic search
        await ctx.emit({
            "topic": "embeddings.generated",
            "data": {
                "documentId": analysis_id,
                "embeddings": embeddings.tolist(),
                "chunks": create_chunks(text)
            }
        })
        
        await ctx.emit({
            "topic": "document.analysis.completed",
            "data": {
                "analysisId": analysis_id,
                "summary": analysis["summary"],
                "insights": generate_insights(analysis)
            }
        })
        
    except Exception as e:
        ctx.logger.error(f"Document analysis failed: {str(e)}")
        raise

def extract_pdf_text(buffer):
    pdf_file = io.BytesIO(buffer)
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def extract_entities(text):
    import spacy
    nlp = spacy.load("en_core_web_sm")
    doc = nlp(text[:1000000])  # Limit for performance
    
    entities = {}
    for ent in doc.ents:
        if ent.label_ not in entities:
            entities[ent.label_] = []
        entities[ent.label_].append(ent.text)
    
    return entities

def generate_embeddings(text):
    # Split into chunks
    chunks = create_chunks(text, chunk_size=512)
    
    # Generate embeddings
    embeddings = embedder.encode(chunks)
    
    return embeddings

def create_chunks(text, chunk_size=512):
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size // 2):  # 50% overlap
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks
```

## Computer Vision Pipeline

### Image Upload (TypeScript)
```typescript
// steps/api/vision/analyze-image.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AnalyzeImage',
  method: 'POST',
  path: '/vision/analyze',
  middleware: [authMiddleware, multer().single('image')],
  emits: ['image.analysis.requested']
}
```

### Vision Processing (Python)
```python
# steps/ai/process_image_vision_step.py
import torch
import cv2
import numpy as np
from transformers import pipeline, DetrImageProcessor, DetrForObjectDetection
from PIL import Image
import io

config = {
    "type": "event",
    "name": "ProcessImageVision",
    "subscribes": ["image.analysis.requested"],
    "emits": ["image.analysis.completed", "thumbnails.generate"]
}

# Initialize models
object_detector = pipeline("object-detection", model="facebook/detr-resnet-50")
image_classifier = pipeline("image-classification")
image_captioner = pipeline("image-to-text", model="Salesforce/blip-image-captioning-base")

async def handler(input_data, ctx):
    image_id = input_data["imageId"]
    
    try:
        # Get image
        image_data = await ctx.state.get("images", image_id)
        image_buffer = image_data["buffer"]
        
        # Load image
        image = Image.open(io.BytesIO(image_buffer))
        
        # Object detection
        objects = object_detector(image)
        
        # Image classification
        classifications = image_classifier(image)
        
        # Generate caption
        caption = image_captioner(image)[0]["generated_text"]
        
        # Face detection
        faces = detect_faces(image)
        
        # Color analysis
        colors = analyze_colors(image)
        
        # Text extraction (OCR)
        text = extract_text_from_image(image)
        
        results = {
            "objects": objects,
            "classifications": classifications[:5],
            "caption": caption,
            "faces": faces,
            "dominantColors": colors,
            "extractedText": text,
            "metadata": {
                "width": image.width,
                "height": image.height,
                "format": image.format
            }
        }
        
        # Store results
        await ctx.state.set("vision_results", image_id, results)
        
        # Emit for thumbnail generation
        await ctx.emit({
            "topic": "thumbnails.generate",
            "data": {
                "imageId": image_id,
                "detectedObjects": [obj["label"] for obj in objects]
            }
        })
        
        await ctx.emit({
            "topic": "image.analysis.completed",
            "data": {
                "imageId": image_id,
                "results": results
            }
        })
        
    except Exception as e:
        ctx.logger.error(f"Image analysis failed: {str(e)}")

def detect_faces(image):
    # Convert PIL to OpenCV
    img_array = np.array(image)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # Face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    return [{"x": int(x), "y": int(y), "w": int(w), "h": int(h)} for x, y, w, h in faces]

def analyze_colors(image):
    # Convert to RGB array
    img_array = np.array(image)
    pixels = img_array.reshape(-1, 3)
    
    # K-means clustering for dominant colors
    from sklearn.cluster import KMeans
    kmeans = KMeans(n_clusters=5, random_state=0)
    kmeans.fit(pixels)
    
    colors = []
    for color in kmeans.cluster_centers_:
        colors.append({
            "rgb": color.astype(int).tolist(),
            "hex": '#{:02x}{:02x}{:02x}'.format(int(color[0]), int(color[1]), int(color[2]))
        })
    
    return colors
```

## Data Science Pipeline

### Data Ingestion (TypeScript)
```typescript
// steps/api/data/upload-dataset.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UploadDataset',
  method: 'POST',
  path: '/data/upload',
  middleware: [authMiddleware, multer().single('dataset')],
  emits: ['dataset.process.requested']
}
```

### Data Processing (Python)
```python
# steps/ml/process_dataset_step.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN
from sklearn.ensemble import IsolationForest
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64

config = {
    "type": "event",
    "name": "ProcessDataset",
    "subscribes": ["dataset.process.requested"],
    "emits": ["dataset.analysis.completed", "report.generate"]
}

async def handler(input_data, ctx):
    dataset_id = input_data["datasetId"]
    analysis_type = input_data.get("analysisType", "exploratory")
    
    try:
        # Load dataset
        dataset_info = await ctx.state.get("datasets", dataset_id)
        df = pd.read_csv(io.BytesIO(dataset_info["content"]))
        
        ctx.logger.info(f"Processing dataset: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Data profiling
        profile = {
            "shape": df.shape,
            "columns": list(df.columns),
            "dtypes": df.dtypes.to_dict(),
            "missing": df.isnull().sum().to_dict(),
            "summary": df.describe().to_dict()
        }
        
        # Perform analysis based on type
        if analysis_type == "exploratory":
            results = perform_eda(df)
        elif analysis_type == "clustering":
            results = perform_clustering(df)
        elif analysis_type == "anomaly":
            results = detect_anomalies(df)
        elif analysis_type == "prediction":
            results = build_predictive_model(df, input_data.get("target"))
        
        # Generate visualizations
        visualizations = generate_visualizations(df, results)
        
        # Store results
        await ctx.state.set("analyses", dataset_id, {
            "profile": profile,
            "results": results,
            "visualizations": visualizations,
            "completedAt": datetime.now().isoformat()
        })
        
        # Emit for report generation
        await ctx.emit({
            "topic": "report.generate",
            "data": {
                "datasetId": dataset_id,
                "analysisType": analysis_type,
                "format": "pdf"
            }
        })
        
    except Exception as e:
        ctx.logger.error(f"Dataset processing failed: {str(e)}")

def perform_clustering(df):
    # Prepare data
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    X = df[numeric_cols].fillna(0)
    
    # Standardize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # PCA for visualization
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    
    # Find optimal clusters
    inertias = []
    K = range(1, min(10, len(df)))
    for k in K:
        kmeans = KMeans(n_clusters=k, random_state=42)
        kmeans.fit(X_scaled)
        inertias.append(kmeans.inertia_)
    
    # Use elbow method
    optimal_k = find_elbow(inertias)
    
    # Final clustering
    kmeans = KMeans(n_clusters=optimal_k, random_state=42)
    clusters = kmeans.fit_predict(X_scaled)
    
    # DBSCAN for comparison
    dbscan = DBSCAN(eps=0.5, min_samples=5)
    dbscan_clusters = dbscan.fit_predict(X_scaled)
    
    return {
        "optimal_clusters": optimal_k,
        "kmeans_labels": clusters.tolist(),
        "dbscan_labels": dbscan_clusters.tolist(),
        "pca_components": X_pca.tolist(),
        "explained_variance": pca.explained_variance_ratio_.tolist(),
        "cluster_centers": kmeans.cluster_centers_.tolist()
    }

def generate_visualizations(df, results):
    visualizations = {}
    
    # Correlation heatmap
    plt.figure(figsize=(10, 8))
    numeric_df = df.select_dtypes(include=[np.number])
    sns.heatmap(numeric_df.corr(), annot=True, cmap='coolwarm')
    
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    visualizations['correlation'] = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    # Distribution plots
    for col in numeric_df.columns[:5]:  # First 5 numeric columns
        plt.figure(figsize=(8, 6))
        sns.histplot(df[col], kde=True)
        plt.title(f'Distribution of {col}')
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        visualizations[f'dist_{col}'] = base64.b64encode(buffer.read()).decode()
        plt.close()
    
    return visualizations
```

### Report Generation (Ruby)
```ruby
# steps/reporting/generate_analysis_report.step.rb
require 'prawn'
require 'json'
require 'base64'

def config
  {
    type: 'event',
    name: 'GenerateAnalysisReport',
    subscribes: ['report.generate'],
    emits: ['report.completed', 'notification.send']
  }
end

def handler(input, context)
  dataset_id = input['datasetId']
  analysis_type = input['analysisType']
  
  begin
    # Get analysis results
    analysis = context.state.get('analyses', dataset_id)
    profile = analysis['profile']
    results = analysis['results']
    visualizations = analysis['visualizations']
    
    # Generate PDF report
    report_path = "/tmp/analysis_#{dataset_id}.pdf"
    
    Prawn::Document.generate(report_path, page_size: 'A4') do |pdf|
      # Title page
      pdf.font_size 24
      pdf.text "Data Analysis Report", align: :center, style: :bold
      pdf.move_down 20
      
      pdf.font_size 14
      pdf.text "Analysis Type: #{analysis_type.capitalize}"
      pdf.text "Generated: #{Time.now.strftime('%Y-%m-%d %H:%M')}"
      
      # Dataset overview
      pdf.start_new_page
      pdf.font_size 18
      pdf.text "Dataset Overview", style: :bold
      pdf.move_down 10
      
      pdf.font_size 12
      pdf.text "• Shape: #{profile['shape'][0]} rows × #{profile['shape'][1]} columns"
      pdf.text "• Columns: #{profile['columns'].join(', ')}"
      
      # Missing data summary
      if profile['missing'].any? { |_, v| v > 0 }
        pdf.move_down 10
        pdf.text "Missing Data:", style: :bold
        profile['missing'].each do |col, count|
          pdf.text "  • #{col}: #{count} (#{(count.to_f / profile['shape'][0] * 100).round(2)}%)"
        end
      end
      
      # Analysis results
      pdf.start_new_page
      pdf.font_size 18
      pdf.text "Analysis Results", style: :bold
      pdf.move_down 10
      
      case analysis_type
      when 'clustering'
        add_clustering_results(pdf, results)
      when 'anomaly'
        add_anomaly_results(pdf, results)
      when 'exploratory'
        add_eda_results(pdf, results)
      end
      
      # Visualizations
      visualizations.each do |name, img_data|
        pdf.start_new_page
        pdf.text name.humanize, size: 16, style: :bold
        pdf.move_down 10
        
        # Decode and embed image
        img = StringIO.new(Base64.decode64(img_data))
        pdf.image img, fit: [500, 700]
      end
    end
    
    # Upload report
    report_url = upload_to_storage(report_path, context)
    
    # Clean up
    File.delete(report_path)
    
    # Emit completion
    context.emit(
      topic: 'report.completed',
      data: {
        datasetId: dataset_id,
        reportUrl: report_url,
        analysisType: analysis_type
      }
    )
    
    # Send notification
    context.emit(
      topic: 'notification.send',
      data: {
        type: 'email',
        subject: "Analysis Report Ready: #{analysis_type.capitalize}",
        body: "Your data analysis report is ready. Download it here: #{report_url}"
      }
    )
    
  rescue => e
    context.logger.error("Report generation failed: #{e.message}")
    raise
  end
end

def add_clustering_results(pdf, results)
  pdf.text "Clustering Analysis:", style: :bold
  pdf.text "• Optimal clusters: #{results['optimal_clusters']}"
  pdf.text "• Algorithm: K-Means with #{results['optimal_clusters']} clusters"
  pdf.text "• Variance explained by PCA: #{(results['explained_variance'][0] * 100).round(2)}%"
  
  # Cluster distribution
  cluster_counts = results['kmeans_labels'].group_by(&:itself).transform_values(&:count)
  pdf.move_down 10
  pdf.text "Cluster Distribution:"
  cluster_counts.each do |cluster, count|
    pdf.text "  • Cluster #{cluster}: #{count} points"
  end
end
```