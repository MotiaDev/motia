# Multi-Language Workflow Command

Combine TypeScript, Python, and Ruby in unified workflows.

## Language Strengths

- **TypeScript**: APIs, orchestration, web logic
- **Python**: AI/ML, data science, algorithms
- **Ruby**: Data processing, reports, file manipulation

## TypeScript → Python

```typescript
// steps/api/analyze.step.ts
export const handler = async (req, { emit, state }) => {
  const analysisId = crypto.randomUUID()
  
  await state.set('analyses', analysisId, {
    text: req.body.text,
    status: 'pending'
  })
  
  await emit({
    topic: 'text.analyze',
    data: { analysisId, text: req.body.text }
  })
  
  return { status: 202, body: { analysisId } }
}
```

```python
# steps/ml/analyze_text_step.py
import spacy
from transformers import pipeline

config = {
    "type": "event",
    "name": "AnalyzeText",
    "subscribes": ["text.analyze"],
    "emits": ["analysis.complete"]
}

nlp = spacy.load("en_core_web_sm")
sentiment = pipeline("sentiment-analysis")

async def handler(input_data, ctx):
    doc = nlp(input_data["text"])
    result = {
        "entities": [{"text": e.text, "label": e.label_} for e in doc.ents],
        "sentiment": sentiment(input_data["text"][:512])[0]
    }
    
    await ctx.emit({
        "topic": "analysis.complete",
        "data": {"analysisId": input_data["analysisId"], "result": result}
    })
```

## TypeScript → Ruby

```typescript
// Trigger export
await emit({
  topic: 'export.requested',
  data: { format: 'xlsx', query: filters }
})
```

```ruby
# steps/export/generate_report.step.rb
require 'axlsx'

def config
  {
    type: 'event',
    name: 'GenerateReport',
    subscribes: ['export.requested'],
    emits: ['export.completed']
  }
end

def handler(input, context)
  data = fetch_data(input['query'], context)
  
  Axlsx::Package.new do |p|
    p.workbook.add_worksheet(name: "Export") do |sheet|
      sheet.add_row data.first.keys
      data.each { |row| sheet.add_row row.values }
    end
    p.serialize("/tmp/export.xlsx")
  end
  
  url = upload_file("/tmp/export.xlsx", context)
  
  context.emit(
    topic: 'export.completed',
    data: { url: url, recordCount: data.length }
  )
end
```

## Python → Ruby Pipeline

```python
# ML processing → Ruby reporting
await ctx.emit({
    "topic": "ml.results.ready",
    "data": {
        "datasetId": dataset_id,
        "clusters": clusters,
        "statistics": stats
    }
})
```

```ruby
# Generate visual report from ML results
def handler(input, context)
  ml_results = input['clusters']
  generate_pdf_report(ml_results)
  generate_charts(ml_results)
  send_email_report()
end
```

## Complete Workflow Example

1. **API** (TypeScript): Receive image upload
2. **AI** (Python): Detect objects, classify
3. **Processing** (Ruby): Generate thumbnails, optimize
4. **Storage** (TypeScript): Save to S3, update DB
5. **Notification** (TypeScript): Send completion email

## Best Practices

- Use language strengths appropriately
- Pass minimal data between languages
- Store intermediate results in state
- Handle language-specific errors
- Test each component independently