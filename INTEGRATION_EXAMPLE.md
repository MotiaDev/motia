# Esempio di Integrazione di Motia in un Progetto Esistente

Questa guida mostra come integrare Motia in diversi tipi di progetti esistenti.

## 📦 Scenario 1: Progetto Node.js/Express Esistente

### Struttura Iniziale del Progetto

```
my-express-app/
├── src/
│   ├── routes/
│   │   └── users.js
│   └── app.js
├── package.json
└── server.js
```

### Passaggi di Integrazione

#### 1. Installa Motia

```powershell
npm install motia
```

#### 2. Inizializza Motia

```powershell
npx motia install
```

Questo crea una directory `steps/` nella root del progetto.

#### 3. Crea Steps Motia

Crea `steps/api/user-registration.step.ts`:

```typescript
export const config = {
  name: 'UserRegistration',
  type: 'api',
  path: '/api/users/register',
  method: 'POST',
  emits: ['user.registered']
};

export const handler = async (req, { emit, logger }) => {
  const { email, name } = req.body;

  // Valida i dati
  if (!email || !name) {
    return {
      status: 400,
      body: { error: 'Email e nome sono obbligatori' }
    };
  }

  // Emetti evento per elaborazione asincrona
  await emit({
    topic: 'user.registered',
    data: { email, name, timestamp: Date.now() }
  });

  logger.info('Nuovo utente registrato', { email });

  return {
    status: 201,
    body: {
      success: true,
      message: 'Registrazione completata'
    }
  };
};
```

Crea `steps/events/send-welcome-email.step.ts`:

```typescript
export const config = {
  name: 'SendWelcomeEmail',
  type: 'event',
  subscribes: ['user.registered']
};

export const handler = async (input, { logger }) => {
  const { email, name } = input.data;

  // Simula invio email
  logger.info('Invio email di benvenuto', { email, name });

  // Qui puoi integrare un servizio email reale
  // await sendEmail({ to: email, template: 'welcome', data: { name } });

  return { success: true };
};
```

#### 4. Integra Motia con Express

Modifica `server.js`:

```javascript
const express = require('express');
const { MotiaServer } = require('motia');

const app = express();
const port = process.env.PORT || 3000;

// Middleware Express esistenti
app.use(express.json());

// Route Express esistenti
app.get('/', (req, res) => {
  res.send('App principale');
});

// Inizializza Motia
const motia = new MotiaServer({
  stepsDir: './steps',
  prefix: '/motia'  // Opzionale: prefisso per le route Motia
});

// Integra Motia come middleware
motia.attach(app);

// Avvia il server
app.listen(port, () => {
  console.log(`Server in ascolto su porta ${port}`);
  console.log(`Motia workbench: http://localhost:${port}/motia`);
});
```

#### 5. Struttura Finale

```
my-express-app/
├── src/
│   ├── routes/
│   │   └── users.js
│   └── app.js
├── steps/                      # ← Nuovo!
│   ├── api/
│   │   └── user-registration.step.ts
│   └── events/
│       └── send-welcome-email.step.ts
├── package.json
└── server.js
```

#### 6. Avvia l'Applicazione

```powershell
# Opzione 1: Usa il server esistente con Motia integrato
node server.js

# Opzione 2: Usa Motia standalone (consigliato per sviluppo)
npx motia dev
```

---

## 📦 Scenario 2: Progetto Next.js

### Integrazione in Next.js

#### 1. Installa Motia

```powershell
npm install motia
```

#### 2. Crea API Route per Motia

Crea `pages/api/motia/[...path].ts`:

```typescript
import { createMotiaHandler } from 'motia';

export default createMotiaHandler({
  stepsDir: './steps'
});

export const config = {
  api: {
    bodyParser: false,
  },
};
```

#### 3. Crea Steps

Crea `steps/api/products.step.ts`:

```typescript
export const config = {
  name: 'GetProducts',
  type: 'api',
  path: '/products',
  method: 'GET'
};

export const handler = async (req, { logger }) => {
  logger.info('Fetching products');

  const products = [
    { id: 1, name: 'Prodotto 1', price: 29.99 },
    { id: 2, name: 'Prodotto 2', price: 39.99 }
  ];

  return {
    status: 200,
    body: { products }
  };
};
```

#### 4. Usa l'API da Next.js

Crea `pages/products.tsx`:

```typescript
import { useEffect, useState } from 'react';

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/motia/products')
      .then(res => res.json())
      .then(data => setProducts(data.products));
  }, []);

  return (
    <div>
      <h1>Prodotti</h1>
      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name} - €{p.price}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📦 Scenario 3: Progetto React + Backend Separato

### Architettura

```
my-fullstack-app/
├── frontend/           # React app
│   ├── src/
│   └── package.json
├── backend/            # Motia backend
│   ├── steps/
│   └── package.json
└── docker-compose.yml  # Opzionale
```

### Setup Backend (Motia)

```powershell
cd backend
npm install motia
npx motia install
```

Crea `backend/steps/api/data.step.ts`:

```typescript
export const config = {
  name: 'GetData',
  type: 'api',
  path: '/data',
  method: 'GET',
  cors: true  // Abilita CORS per il frontend
};

export const handler = async (req, { logger }) => {
  return {
    status: 200,
    body: {
      data: [1, 2, 3, 4, 5],
      timestamp: Date.now()
    }
  };
};
```

Crea `backend/motia.config.js`:

```javascript
module.exports = {
  port: 4000,
  cors: {
    origin: 'http://localhost:3000',  // URL del frontend
    credentials: true
  }
};
```

### Setup Frontend (React)

Crea `frontend/src/services/api.ts`:

```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export async function fetchData() {
  const response = await fetch(`${API_URL}/data`);
  return response.json();
}
```

Crea `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:4000
```

### Avvio dell'Applicazione

```powershell
# Terminale 1: Backend
cd backend
npx motia dev

# Terminale 2: Frontend
cd frontend
npm start
```

---

## 📦 Scenario 4: Microservizi con Motia

### Architettura

```
microservices-app/
├── auth-service/       # Servizio autenticazione
│   └── steps/
├── payment-service/    # Servizio pagamenti
│   └── steps/
├── notification-service/ # Servizio notifiche
│   └── steps/
└── shared/
    └── events.ts       # Definizioni eventi condivisi
```

### Servizio Autenticazione

`auth-service/steps/api/login.step.ts`:

```typescript
export const config = {
  name: 'Login',
  type: 'api',
  path: '/auth/login',
  method: 'POST',
  emits: ['user.logged_in']
};

export const handler = async (req, { emit, logger }) => {
  const { email, password } = req.body;

  // Logica di autenticazione
  const token = 'jwt-token-here';

  // Emetti evento per altri servizi
  await emit({
    topic: 'user.logged_in',
    data: { email, timestamp: Date.now() }
  });

  return {
    status: 200,
    body: { token }
  };
};
```

### Servizio Notifiche

`notification-service/steps/events/user-login-notification.step.ts`:

```typescript
export const config = {
  name: 'UserLoginNotification',
  type: 'event',
  subscribes: ['user.logged_in']
};

export const handler = async (input, { logger }) => {
  const { email } = input.data;

  logger.info('Invio notifica di login', { email });

  // Logica per inviare notifica
  // await sendNotification({ email, message: 'Nuovo accesso rilevato' });

  return { success: true };
};
```

### Configurazione Condivisa

`shared/events.ts`:

```typescript
export const EVENTS = {
  USER_LOGGED_IN: 'user.logged_in',
  USER_REGISTERED: 'user.registered',
  PAYMENT_COMPLETED: 'payment.completed',
  // ... altri eventi
};
```

---

## 🔧 Configurazione Avanzata

### File motia.config.js Completo

```javascript
module.exports = {
  // Porta del server
  port: process.env.PORT || 3000,

  // Directory degli steps
  stepsDir: './steps',

  // Configurazione CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json'
  },

  // Code/Queue configuration
  queue: {
    adapter: 'redis',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  },

  // State management
  state: {
    adapter: 'redis',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  },

  // Streaming
  streams: {
    enabled: true,
    adapter: 'redis'
  }
};
```

---

## 🐛 Debugging e Testing

### Testing di Steps

Crea `steps/__tests__/user-registration.test.ts`:

```typescript
import { testStep } from 'motia/testing';
import { config, handler } from '../api/user-registration.step';

describe('UserRegistration Step', () => {
  it('should register a new user', async () => {
    const result = await testStep(handler, {
      body: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });

    expect(result.status).toBe(201);
    expect(result.body.success).toBe(true);
  });

  it('should validate required fields', async () => {
    const result = await testStep(handler, {
      body: {}
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBeDefined();
  });
});
```

### Eseguire i Test

```powershell
npm test
```

---

## 📚 Best Practices

### 1. Organizzazione degli Steps

```
steps/
├── api/              # API endpoints
│   ├── users/
│   ├── products/
│   └── orders/
├── events/           # Event handlers
│   ├── notifications/
│   └── analytics/
├── cron/             # Scheduled jobs
│   └── cleanup/
└── shared/           # Codice condiviso
    ├── validators/
    └── utils/
```

### 2. Gestione degli Errori

```typescript
export const handler = async (req, { logger }) => {
  try {
    // Logica dello step
    return { status: 200, body: { success: true } };
  } catch (error) {
    logger.error('Errore nello step', { error });
    return {
      status: 500,
      body: { error: 'Errore interno del server' }
    };
  }
};
```

### 3. Validazione Input

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});

export const handler = async (req, { logger }) => {
  const validation = schema.safeParse(req.body);

  if (!validation.success) {
    return {
      status: 400,
      body: { errors: validation.error.errors }
    };
  }

  // Procedi con i dati validati
  const { email, name } = validation.data;
  // ...
};
```

---

## 🚀 Deploy in Produzione

### 1. Build per Produzione

```powershell
npm run build
```

### 2. Variabili d'Ambiente

Crea `.env.production`:

```env
NODE_ENV=production
PORT=8080
REDIS_HOST=production-redis.example.com
REDIS_PORT=6379
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 3. Avvia in Produzione

```powershell
NODE_ENV=production npx motia start
```

---

## 💡 Suggerimenti

1. **Usa TypeScript** per una migliore type safety
2. **Organizza gli steps** in directory logiche
3. **Testa gli steps** regolarmente
4. **Monitora le performance** usando il workbench
5. **Documenta i tuoi steps** con commenti chiari
6. **Usa variabili d'ambiente** per configurazioni sensibili
7. **Implementa logging** appropriato
8. **Gestisci gli errori** in modo robusto

---

Per ulteriori esempi, visita: https://github.com/MotiaDev/motia-examples
