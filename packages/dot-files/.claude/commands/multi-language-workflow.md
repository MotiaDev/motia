# Multi-Language Workflows

Build powerful workflows that leverage the strengths of JavaScript, Python, and Ruby working together seamlessly in Motia.

## The Power of Each Language

```
JavaScript → Fast APIs, real-time features, web logic
Python    → AI/ML, data science, computer vision, NLP
Ruby      → File processing, reports, data transformation
TypeScript → Type-safe enterprise applications
```

## Quick Example: Process Upload with AI

Here's a complete workflow showing all languages working together:

```javascript
// 1. JavaScript API - Fast upload handling
// steps/api/upload-document.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/documents/upload',
  emits: ['document.uploaded']
}

exports.handler = async (req, { emit, state }) => {
  const docId = crypto.randomUUID()
  
  await state.set('documents', docId, {
    name: req.body.name,
    content: req.body.content,
    uploadedAt: new Date()
  })
  
  await emit({
    topic: 'document.uploaded',
    data: { docId }
  })
  
  return { status: 202, body: { docId, status: 'processing' } }
}
```

```python
# 2. Python - AI Analysis
# steps/ai/analyze_document_step.py
import spacy
from transformers import pipeline

config = {
    "type": "event",
    "subscribes": ["document.uploaded"],
    "emits": ["document.analyzed"]
}

nlp = spacy.load("en_core_web_sm")
sentiment = pipeline("sentiment-analysis")
summarizer = pipeline("summarization")

async def handler(input_data, ctx):
    doc_id = input_data["docId"]
    
    # Get document
    doc_data = await ctx.state.get("documents", doc_id)
    text = doc_data["content"]
    
    # AI Analysis
    doc = nlp(text)
    
    analysis = {
        "entities": [(ent.text, ent.label_) for ent in doc.ents],
        "sentiment": sentiment(text[:512])[0],
        "summary": summarizer(text, max_length=100)[0]["summary_text"],
        "keywords": extract_keywords(doc),
        "language": doc.lang_
    }
    
    # Save results
    await ctx.state.set("analyses", doc_id, analysis)
    
    await ctx.emit({
        "topic": "document.analyzed",
        "data": {"docId": doc_id, "analysis": analysis}
    })
```

```ruby
# 3. Ruby - Generate PDF Report
# steps/reports/generate_document_report.step.rb
require 'prawn'
require 'gruff'

def config
  {
    type: 'event',
    subscribes: ['document.analyzed'],
    emits: ['report.generated', 'email.send']
  }
end

def handler(input, context)
  doc_id = input['docId']
  
  # Get data
  document = context.state.get('documents', doc_id)
  analysis = context.state.get('analyses', doc_id)
  
  # Generate PDF
  pdf_path = generate_pdf_report(document, analysis)
  
  # Upload to storage
  report_url = upload_file(pdf_path)
  
  # Update document
  document['reportUrl'] = report_url
  document['status'] = 'completed'
  context.state.set('documents', doc_id, document)
  
  # Send email
  context.emit(
    topic: 'email.send',
    data: {
      to: document['userEmail'],
      subject: 'Your document analysis is ready',
      attachmentUrl: report_url
    }
  )
end

def generate_pdf_report(document, analysis)
  Prawn::Document.generate("/tmp/report_#{document['id']}.pdf") do |pdf|
    # Title
    pdf.text document['name'], size: 24, style: :bold
    pdf.move_down 20
    
    # Summary
    pdf.text "Summary", size: 18, style: :bold
    pdf.text analysis['summary']
    pdf.move_down 15
    
    # Sentiment
    sentiment = analysis['sentiment']
    pdf.text "Sentiment: #{sentiment['label']} (#{(sentiment['score'] * 100).round}% confidence)"
    pdf.move_down 15
    
    # Entities
    if analysis['entities'].any?
      pdf.text "Key Entities", size: 16, style: :bold
      analysis['entities'].each do |text, type|
        pdf.text "• #{text} (#{type})"
      end
    end
    
    # Add charts
    add_keyword_chart(pdf, analysis['keywords'])
  end
end
```

## Real-World Multi-Language Patterns

### 1. E-commerce with Recommendations

```javascript
// JavaScript: Handle cart operations
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/cart/add',
  emits: ['cart.updated', 'recommendation.request']
}

exports.handler = async (req, { emit, state }) => {
  const { productId, quantity } = req.body
  const userId = req.user.id
  
  // Update cart
  const cart = await updateCart(userId, productId, quantity, state)
  
  // Request recommendations
  await emit({
    topic: 'recommendation.request',
    data: { userId, productId, cartItems: cart.items }
  })
  
  return { status: 200, body: cart }
}
```

```python
# Python: Generate ML recommendations
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import numpy as np

config = {
    "type": "event",
    "subscribes": ["recommendation.request"],
    "emits": ["recommendations.ready"]
}

async def handler(input_data, ctx):
    user_id = input_data["userId"]
    product_id = input_data["productId"]
    
    # Get user history and product features
    history = await ctx.state.get("user_history", user_id) or []
    products_df = await load_product_features(ctx)
    
    # Generate recommendations using collaborative filtering
    recommendations = generate_recommendations(
        user_id,
        product_id,
        history,
        products_df
    )
    
    # Cache recommendations
    await ctx.state.set(
        "recommendations",
        user_id,
        recommendations[:10],
        3600  # 1 hour TTL
    )
    
    await ctx.emit({
        "topic": "recommendations.ready",
        "data": {
            "userId": user_id,
            "recommendations": recommendations[:5]
        }
    })

def generate_recommendations(user_id, product_id, history, products_df):
    # Build user profile from history
    user_profile = build_user_profile(history, products_df)
    
    # Find similar products
    product_features = products_df[products_df['id'] == product_id].iloc[0]
    similarities = cosine_similarity(
        [product_features[feature_columns]],
        products_df[feature_columns]
    )[0]
    
    # Get top recommendations
    recommendations = []
    for idx in similarities.argsort()[-20:][::-1]:
        if products_df.iloc[idx]['id'] not in history:
            recommendations.append({
                "productId": products_df.iloc[idx]['id'],
                "score": float(similarities[idx]),
                "reason": "similar_to_cart_item"
            })
    
    return recommendations
```

### 2. Video Processing Pipeline

```javascript
// JavaScript: Handle upload
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/videos/upload',
  middleware: ['authMiddleware', 'multer'],
  emits: ['video.uploaded']
}

exports.handler = async (req, { emit, state }) => {
  const videoId = crypto.randomUUID()
  const file = req.file
  
  // Store video
  await state.set('videos', videoId, {
    originalName: file.originalname,
    size: file.size,
    buffer: file.buffer,
    userId: req.user.id,
    status: 'processing'
  })
  
  await emit({
    topic: 'video.uploaded',
    data: { videoId, userId: req.user.id }
  })
  
  return { status: 202, body: { videoId, status: 'processing' } }
}
```

```python
# Python: Extract frames and analyze
import cv2
import numpy as np
from transformers import pipeline

config = {
    "type": "event",
    "subscribes": ["video.uploaded"],
    "emits": ["video.analyzed", "thumbnails.generate"]
}

# Load models
object_detector = pipeline("object-detection")
scene_classifier = pipeline("image-classification")

async def handler(input_data, ctx):
    video_id = input_data["videoId"]
    
    # Get video
    video_data = await ctx.state.get("videos", video_id)
    
    # Process video
    frames = extract_key_frames(video_data["buffer"])
    
    analysis = {
        "duration": get_video_duration(video_data["buffer"]),
        "fps": get_fps(video_data["buffer"]),
        "resolution": get_resolution(video_data["buffer"]),
        "scenes": [],
        "objects_detected": set(),
        "key_frames": []
    }
    
    # Analyze key frames
    for i, frame in enumerate(frames):
        # Detect objects
        objects = object_detector(frame)
        for obj in objects:
            analysis["objects_detected"].add(obj["label"])
        
        # Classify scene
        scene = scene_classifier(frame)[0]
        analysis["scenes"].append({
            "timestamp": i * 10,  # Every 10 seconds
            "type": scene["label"],
            "confidence": scene["score"]
        })
        
        # Save key frame
        frame_id = f"{video_id}_frame_{i}"
        await ctx.state.set("frames", frame_id, {
            "image": frame,
            "timestamp": i * 10
        })
        analysis["key_frames"].append(frame_id)
    
    # Convert set to list for JSON
    analysis["objects_detected"] = list(analysis["objects_detected"])
    
    # Save analysis
    await ctx.state.set("video_analysis", video_id, analysis)
    
    # Request thumbnail generation
    await ctx.emit({
        "topic": "thumbnails.generate",
        "data": {
            "videoId": video_id,
            "frameIds": analysis["key_frames"][:3]
        }
    })

def extract_key_frames(video_buffer, interval=10):
    # Create temporary file
    temp_path = f"/tmp/{uuid.uuid4()}.mp4"
    with open(temp_path, 'wb') as f:
        f.write(video_buffer)
    
    cap = cv2.VideoCapture(temp_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []
    
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Extract frame every 'interval' seconds
        if frame_count % (fps * interval) == 0:
            frames.append(frame)
        
        frame_count += 1
    
    cap.release()
    os.remove(temp_path)
    
    return frames
```

```ruby
# Ruby: Generate video thumbnails and montage
require 'mini_magick'

def config
  {
    type: 'event',
    subscribes: ['thumbnails.generate'],
    emits: ['video.ready']
  }
end

def handler(input, context)
  video_id = input['videoId']
  frame_ids = input['frameIds']
  
  thumbnails = []
  
  # Generate thumbnails from frames
  frame_ids.each_with_index do |frame_id, index|
    frame_data = context.state.get('frames', frame_id)
    
    # Create thumbnail
    image = MiniMagick::Image.read(frame_data['image'])
    image.resize '320x180'
    image.quality 85
    
    # Add timestamp overlay
    image.combine_options do |c|
      c.gravity 'SouthEast'
      c.pointsize '14'
      c.fill 'white'
      c.stroke 'black'
      c.strokewidth '1'
      c.annotate '+5+5', format_time(frame_data['timestamp'])
    end
    
    # Save thumbnail
    thumb_path = "/tmp/thumb_#{video_id}_#{index}.jpg"
    image.write(thumb_path)
    
    thumbnails << {
      url: upload_file(thumb_path),
      timestamp: frame_data['timestamp']
    }
  end
  
  # Create montage preview
  montage = MiniMagick::Tool::Montage.new
  thumbnails.each { |t| montage << t[:path] }
  montage.geometry '320x180+10+10'
  montage.tile '3x1'
  montage_path = "/tmp/preview_#{video_id}.jpg"
  montage << montage_path
  montage.call
  
  preview_url = upload_file(montage_path)
  
  # Update video status
  video = context.state.get('videos', video_id)
  video['status'] = 'ready'
  video['thumbnails'] = thumbnails
  video['previewUrl'] = preview_url
  context.state.set('videos', video_id, video)
  
  # Notify completion
  context.emit(
    topic: 'video.ready',
    data: {
      videoId: video_id,
      thumbnails: thumbnails,
      previewUrl: preview_url
    }
  )
end

def format_time(seconds)
  Time.at(seconds).utc.strftime("%M:%S")
end
```

### 3. Data Pipeline: API → Python → Ruby

```javascript
// JavaScript: Ingest data via API
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/data/import',
  emits: ['data.received']
}

exports.handler = async (req, { emit, state }) => {
  const batchId = crypto.randomUUID()
  
  await state.set('import_batches', batchId, {
    data: req.body.data,
    format: req.body.format,
    timestamp: new Date()
  })
  
  await emit({
    topic: 'data.received',
    data: { batchId, recordCount: req.body.data.length }
  })
  
  return { status: 202, body: { batchId, status: 'processing' } }
}
```

```python
# Python: Clean and analyze data
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

config = {
    "type": "event",
    "subscribes": ["data.received"],
    "emits": ["data.analyzed"]
}

async def handler(input_data, ctx):
    batch_id = input_data["batchId"]
    
    # Get data
    batch = await ctx.state.get("import_batches", batch_id)
    df = pd.DataFrame(batch["data"])
    
    # Clean data
    df = df.dropna()
    df = remove_outliers(df)
    
    # Analyze
    analysis = {
        "shape": df.shape,
        "dtypes": df.dtypes.to_dict(),
        "missing": df.isnull().sum().to_dict(),
        "statistics": df.describe().to_dict(),
        "correlations": df.corr().to_dict()
    }
    
    # Perform PCA
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 2:
        scaler = StandardScaler()
        scaled = scaler.fit_transform(df[numeric_cols])
        pca = PCA(n_components=2)
        components = pca.fit_transform(scaled)
        
        analysis["pca"] = {
            "explained_variance": pca.explained_variance_ratio_.tolist(),
            "components": components.tolist()
        }
    
    # Save cleaned data and analysis
    await ctx.state.set("cleaned_data", batch_id, df.to_dict('records'))
    await ctx.state.set("analysis", batch_id, analysis)
    
    await ctx.emit({
        "topic": "data.analyzed",
        "data": {"batchId": batch_id}
    })

def remove_outliers(df):
    # Remove outliers using IQR method
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
    
    return df
```

```ruby
# Ruby: Generate comprehensive report
require 'axlsx'
require 'prawn'
require 'json'

def config
  {
    type: 'event',
    subscribes: ['data.analyzed'],
    emits: ['report.ready']
  }
end

def handler(input, context)
  batch_id = input['batchId']
  
  # Get all data
  cleaned_data = context.state.get('cleaned_data', batch_id)
  analysis = context.state.get('analysis', batch_id)
  
  # Generate Excel report
  excel_path = generate_excel_report(cleaned_data, analysis, batch_id)
  
  # Generate PDF summary
  pdf_path = generate_pdf_summary(analysis, batch_id)
  
  # Upload files
  excel_url = upload_file(excel_path, "reports/#{batch_id}.xlsx")
  pdf_url = upload_file(pdf_path, "reports/#{batch_id}.pdf")
  
  # Update batch status
  batch = context.state.get('import_batches', batch_id)
  batch['status'] = 'completed'
  batch['reports'] = {
    'excel' => excel_url,
    'pdf' => pdf_url
  }
  context.state.set('import_batches', batch_id, batch)
  
  context.emit(
    topic: 'report.ready',
    data: {
      batchId: batch_id,
      excelUrl: excel_url,
      pdfUrl: pdf_url
    }
  )
end

def generate_excel_report(data, analysis, batch_id)
  package = Axlsx::Package.new
  workbook = package.workbook
  
  # Data sheet
  workbook.add_worksheet(name: "Cleaned Data") do |sheet|
    # Headers
    sheet.add_row data.first.keys
    
    # Data
    data.each do |row|
      sheet.add_row row.values
    end
  end
  
  # Statistics sheet
  workbook.add_worksheet(name: "Statistics") do |sheet|
    sheet.add_row ["Metric", "Value"]
    sheet.add_row ["Total Records", data.length]
    sheet.add_row ["Columns", analysis['shape'][1]]
    
    # Add statistics
    analysis['statistics'].each do |col, stats|
      sheet.add_row [col, ""], style: :bold
      stats.each do |stat, value|
        sheet.add_row ["  #{stat}", value.round(2)]
      end
    end
  end
  
  # Correlation sheet
  if analysis['correlations']
    workbook.add_worksheet(name: "Correlations") do |sheet|
      cols = analysis['correlations'].keys
      sheet.add_row [''] + cols
      
      cols.each do |row_col|
        row = [row_col]
        cols.each do |col_col|
          row << analysis['correlations'][row_col][col_col].round(3)
        end
        sheet.add_row row
      end
    end
  end
  
  file_path = "/tmp/report_#{batch_id}.xlsx"
  package.serialize(file_path)
  file_path
end
```

## Best Practices for Multi-Language Workflows

### 1. Clear Language Boundaries
```
JavaScript: Web-facing APIs, real-time features
Python: Heavy computation, AI/ML, data science
Ruby: File generation, data transformation, reporting
```

### 2. Use State for Communication
```javascript
// JavaScript writes
await state.set('jobs', jobId, { status: 'pending', data })

# Python reads and updates
job = await ctx.state.get('jobs', job_id)
# ... process ...
await ctx.state.set('jobs', job_id, {...job, 'status': 'completed'})

# Ruby reads results
job = context.state.get('jobs', job_id)
```

### 3. Event-Driven Flow
```
API → emit('data.received')
     ↓
Python subscribes → processes → emit('data.processed')
                               ↓
                    Ruby subscribes → generates report
```

### 4. Error Handling Across Languages
Each language handler should handle its own errors and emit failure events:

```python
try:
    result = process_data(input_data)
    await ctx.emit({"topic": "success", "data": result})
except Exception as e:
    ctx.logger.error(f"Processing failed: {str(e)}")
    await ctx.emit({"topic": "failed", "data": {"error": str(e)}})
```

## Testing Multi-Language Workflows

```javascript
// Test the complete flow
test('document processing workflow', async () => {
  // Trigger API
  const response = await request(app)
    .post('/documents/upload')
    .send({ name: 'test.txt', content: 'Hello world' })
  
  expect(response.status).toBe(202)
  const { docId } = response.body
  
  // Wait for processing
  await waitFor(async () => {
    const doc = await state.get('documents', docId)
    expect(doc.status).toBe('completed')
  })
  
  // Check all steps completed
  const analysis = await state.get('analyses', docId)
  expect(analysis).toBeDefined()
  expect(analysis.sentiment).toBeDefined()
  
  const doc = await state.get('documents', docId)
  expect(doc.reportUrl).toBeDefined()
})
```

## Next Steps

- Optimize language boundaries: See `language-selection-guide.md`
- Handle language-specific errors: See `cross-language-errors.md`
- Deploy multi-language apps: See `deploy-mixed-stack.md`
- Monitor performance: See `language-metrics.md`