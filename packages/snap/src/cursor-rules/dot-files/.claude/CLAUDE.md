# Build ANY Backend with Motia

Welcome! This guide helps you build production-ready backends using Motia's unified framework. Whether you're building an e-commerce platform, social network, AI application, or IoT system - Motia handles it all.

## The One Concept You Need: Steps

In Motia, everything is a "Step":
- **API endpoints** → API steps
- **Background jobs** → Event steps  
- **Scheduled tasks** → Cron steps
- **External webhooks** → Noop steps

That's it. Master this one concept and you can build anything.

## Choose Your Language Based on the Task

```
JavaScript → Quick APIs, prototypes, real-time features
TypeScript → Enterprise APIs, complex business logic  
Python    → AI/ML, data science, image processing
Ruby      → Reports, data exports, file manipulation
```

## Quick Start Commands

```bash
# Start any backend in 30 seconds
motia create my-backend
cd my-backend
motia dev

# Your backend is now running at http://localhost:5173
```

## Build Your Backend - Step by Step

### 1. Need a REST API?
See `commands/build-api.md`

### 2. Need Authentication? 
See `commands/add-authentication.md`

### 3. Need Background Jobs?
See `commands/process-background-jobs.md`

### 4. Need Real-time Features?
See `commands/add-realtime.md`

### 5. Need AI/ML Processing?
See `commands/integrate-ai.md`

### 6. Need Data Processing?
See `commands/process-data.md`

## Complete Application Templates

### E-commerce Backend
```bash
motia generate ecommerce
# Includes: cart, payments, inventory, recommendations
```

### SaaS Platform
```bash
motia generate saas  
# Includes: multi-tenant, billing, admin, analytics
```

### Real-time Chat
```bash
motia generate chat
# Includes: rooms, messages, presence, history
```

### AI Application
```bash
motia generate ai-app
# Includes: LLM integration, embeddings, RAG
```

## Core Pattern: API → Process → Respond

Here's how different languages work together in Motia:

```javascript
// Step 1: API endpoint (JavaScript - quick & simple)
// steps/api/submit-form.step.js
exports.config = {
  type: 'api',
  method: 'POST', 
  path: '/submit',
  emits: ['form.submitted']
}

exports.handler = async (req, { emit }) => {
  await emit({
    topic: 'form.submitted',
    data: req.body
  })
  return { status: 200, body: { message: 'Processing...' } }
}
```

```python
# Step 2: Process with AI (Python - best for ML)
# steps/process_form_step.py
config = {
    "type": "event",
    "subscribes": ["form.submitted"],
    "emits": ["email.send"]
}

async def handler(input_data, ctx):
    # AI processing here
    result = analyze_sentiment(input_data["message"])
    
    await ctx.emit({
        "topic": "email.send",
        "data": {
            "to": input_data["email"],
            "sentiment": result
        }
    })
```

```ruby
# Step 3: Generate and send email (Ruby - great for templates)
# steps/send_email.step.rb
def config
  {
    type: 'event',
    subscribes: ['email.send'],
    emits: ['email.sent']
  }
end

def handler(input, context)
  html = generate_email_template(input)
  send_email(input['to'], html)
  
  context.emit(
    topic: 'email.sent',
    data: { recipient: input['to'] }
  )
end
```

## Production Checklist

- [ ] Add authentication (`commands/add-authentication.md`)
- [ ] Set up error handling (`commands/handle-errors.md`)
- [ ] Configure rate limiting (`commands/add-rate-limiting.md`)
- [ ] Add monitoring (`commands/add-monitoring.md`)
- [ ] Deploy to production (`commands/deploy.md`)

## Project Structure

```
your-app/
├── steps/              # All your code goes here
│   ├── api/           # API endpoints
│   ├── events/        # Background jobs
│   ├── cron/          # Scheduled tasks
│   └── integrations/  # External webhooks
├── package.json       # JavaScript dependencies
├── requirements.txt   # Python dependencies
└── Gemfile           # Ruby dependencies
```

## Common Questions

**Q: Which language should I use?**
A: Use the language that best fits the task:
- APIs & web logic → JavaScript/TypeScript
- AI & data science → Python
- Reports & file processing → Ruby

**Q: How do I handle errors?**
A: Every example includes error handling. Copy the patterns.

**Q: Can I use my favorite npm/pip/gem packages?**
A: Yes! Just add them to package.json, requirements.txt, or Gemfile.

**Q: How do I scale?**
A: Motia scales horizontally. Just run more instances.

## Quick Reference

### Building Features
- **Build API**: `commands/build-api.md`
- **Add Auth**: `commands/add-authentication.md`
- **Background Jobs**: `commands/process-background-jobs.md`
- **Real-time**: `commands/add-realtime.md`
- **AI/ML**: `commands/integrate-ai.md`
- **Data Processing**: `commands/process-data.md`

### Complete Examples
- **Full Backend**: `commands/complete-backend.md`
- **Backend Types**: `commands/backend-types.md`
- **Multi-language**: `commands/multi-language-workflow.md`

### Help & Tools
- **Debug Issues**: `agents/debugger.md`
- **Review Code**: `agents/code-reviewer.md`
- **Write Tests**: `agents/test-runner.md`

## Get Started Now

Don't overthink it. Pick a template, copy the code, and start building. Motia handles the complex stuff so you can focus on your business logic.

```bash
# Your backend in 3 commands
motia create awesome-app
cd awesome-app
motia dev

# You're ready to build!
```

## Resources

- Documentation: https://motia.dev/docs
- Examples: https://github.com/MotiaDev/motia-examples
- Discord: https://discord.gg/motia