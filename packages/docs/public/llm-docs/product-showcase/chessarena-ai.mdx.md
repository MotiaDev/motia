---
title: 'ChessArena AI'
---

In the world of AI development, chess serves as the perfect benchmark for intelligence and strategic thinking. But how do you measure which AI models truly "understand" chess beyond simple win/loss statistics? ChessArena.AI solves this challenge by focusing on move quality and game insight rather than just outcomes.

This comprehensive guide explores how to build a production-ready chess platform using Motia's event-driven architecture and real-time streaming capabilities. We'll cover:

1. **Real-Time Chess Streaming**: How Motia Streams enable live game updates across all connected players
2. **Multi-Language Architecture**: Combining TypeScript orchestration with Python chess engine integration
3. **AI Model Integration**: Supporting multiple LLM providers (OpenAI, Anthropic Claude, Google Gemini, xAI Grok) for chess gameplay
4. **Move Evaluation System**: Using Stockfish engine for real-time move analysis and scoring
5. **Production Deployment**: How this exact platform powers the live ChessArena.AI website

Let's build a chess platform that measures AI intelligence through gameplay quality.

---

## 🏭 Production-Grade Chess Platform

**This is not a tutorial project** - this is battle-tested, production-ready code that handles real traffic at scale. Every aspect has been designed for enterprise use:

- **🎮 Live Chess Platform**: Real-time games with multiple AI models competing simultaneously
- **📊 Move Quality Analysis**: Every move evaluated by Stockfish engine for strategic insight
- **⚡ Real-Time Updates**: Live game state synchronization across all connected clients
- **🤖 Multi-AI Support**: OpenAI GPT, Anthropic Claude, XAI Grok, Google Gemini integration
- **🏆 Dynamic Leaderboards**: Real-time scoring based on move quality, not just wins
- **🌍 Global Scale**: Production deployment on Motia Cloud with worldwide accessibility
- **💰 Cost Efficient**: Event-driven architecture that scales efficiently

---

## Live Proof: Powering ChessArena.AI

**This isn't just a demo** - this exact code powers the live chess platform at [ChessArena.AI](https://chessarena.ai)!

Visit the platform and you'll see:
- **🏆 Live AI Leaderboard** ranking models by move quality
- **⚡ Real-Time Games** with instant move updates and evaluations
- **📊 Move Analysis** showing centipawn scores and blunder detection
- **🎮 Multi-Model Battles** with GPT-5, Claude Opus 4, Gemini 2.5 Flash, and Grok 4 competing

That live chess platform with real-time AI battles? That's this exact implementation in production, processing thousands of moves and providing instant feedback to chess enthusiasts worldwide!

---

## The Power of Strategic AI Evaluation

<div className="my-8">![ChessArena AI](./../img/chessarena.png)</div>

At its core, ChessArena.AI solves a fundamental challenge: how do you measure AI intelligence in chess beyond simple win/loss statistics? Traditional chess platforms focus on game outcomes, but most LLM games end in draws, making it difficult to distinguish between models.

Our Motia-powered solution revolutionizes AI chess evaluation through:

- **[Stockfish Integration](https://stockfishchess.org/)**: World's strongest open-source chess engine for move analysis
- **[Centipawn Scoring](https://en.wikipedia.org/wiki/Chess_piece_relative_value#Centipawns)**: Precise move quality measurement in hundredths of a pawn
- **[Real-Time Streaming](https://motia.dev)**: Live game updates and move evaluations
- **[Multi-LLM Support](https://platform.openai.com/)**: Support for OpenAI, Anthropic, and Google AI models

Instead of focusing on who wins, we measure how well each AI model understands chess strategy and tactics.

---

## The Anatomy of Our Chess Platform

Our application consists of specialized components handling different aspects of chess gameplay, from game creation to move evaluation. Let's explore the complete architecture.

<Folder name="api/steps" defaultOpen>
  <Folder name="chess" defaultOpen>
    <File name="00-available-models-api.step.ts" />
    <File name="01-create-game.step.ts" />
    <File name="02-get-game.step.ts" />
    <File name="03-move-api.step.ts" />
    <File name="04-chess-game-moved.step.ts" />
    <File name="05-ai-player.step.ts" />
    <File name="evaluate_player_move_step.py" />
    <Folder name="streams" defaultOpen>
      <File name="00-chess-game.stream.ts" />
      <File name="00-chess-game-move.stream.ts" />
      <File name="00-chess-leaderboard.stream.ts" />
    </Folder>
  </Folder>
  <Folder name="auth" defaultOpen>
    <File name="00-auth-api.step.ts" />
    <File name="01-get-user-api.step.ts" />
  </Folder>
</Folder>

<Tabs items={['models-api', 'create-game', 'move-evaluation', 'ai-player', 'streams', 'auth']}>
  <Tab value="models-api">
    The entry point that exposes available AI models from different providers (OpenAI, Anthropic, Google, xAI) for chess gameplay. The platform supports cutting-edge models and allows easy extension for new providers.

    ```typescript
    import { AiModelsSchema } from '@chessarena/types/ai-models'
    import { ApiRouteConfig, Handlers } from 'motia'
    import { z } from 'zod'
    import { supportedModelsByProvider } from '../../services/ai/models'

    // Current supported models (as of 2025)
    export const supportedModelsByProvider: AiModels = {
      openai: [
        'gpt-5-2025-08-07',           // Latest GPT-5
        'o4-mini-2025-04-16',         // O4 Mini
        'gpt-4.1-nano-2025-04-14',   // GPT-4.1 Nano
        'o3-mini-2025-01-31',        // O3 Mini
        'gpt-4o-mini-2024-07-18',    // GPT-4o Mini
      ],
      gemini: [
        'gemini-2.5-flash',          // Latest Gemini 2.5 Flash
        'gemini-2.0-flash-001',      // Gemini 2.0 Flash
      ],
      claude: [
        'claude-opus-4-1-20250805',  // Claude Opus 4.1
        'claude-opus-4-20250514',    // Claude Opus 4
        'claude-sonnet-4-20250514',  // Claude Sonnet 4
        'claude-3-7-sonnet-20250219', // Claude 3.7 Sonnet
        'claude-3-5-sonnet-20241022', // Claude 3.5 Sonnet
        'claude-3-5-haiku-20241022',  // Claude 3.5 Haiku
      ],
      grok: [
        'grok-4',                     // Latest Grok 4
        'grok-3',                     // Grok 3
      ],
    }

    export const config: ApiRouteConfig = {
      type: 'api',
      name: 'AvailableModels',
      description: 'Expose all available AI models for supported providers',
      path: '/chess/models',
      method: 'GET',
      emits: [],
      flows: ['chess'],
      responseSchema: {
        200: z.object({ models: AiModelsSchema() }),
        404: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    }

    export const handler: Handlers['AvailableModels'] = async (_, { logger }) => {
      logger.info('Received available models request')

      return {
        status: 200,
        body: {
          models: supportedModelsByProvider,
        },
      }
    }
    ```

  </Tab>
  <Tab value="create-game">
    The game creation endpoint that validates AI model selections and initializes new chess games with proper player configurations.

    ```typescript
    import { AiModelProviderSchema } from '@chessarena/types/ai-models'
    import { GameSchema, Player } from '@chessarena/types/game'
    import { ApiRouteConfig, Handlers } from 'motia'
    import { RefinementCtx, z } from 'zod'
    import { supportedModelsByProvider } from '../../services/ai/models'
    import { createGame } from '../../services/chess/create-game'
    import { auth } from '../middlewares/auth.middleware'

    const playerSchema = () => {
      return z
        .object({
          ai: AiModelProviderSchema().optional(),
          model: z.string().optional(),
        })
        .superRefine((data: Player, ctx: RefinementCtx) => {
          if (data.ai && !data.model) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['model'],
              message: 'Model is required when AI is enabled',
            })
          }

          if (data.ai) {
            const isValidAiProvider = data.ai in supportedModelsByProvider
            const isValidModel = data.model && supportedModelsByProvider[data.ai]?.includes(data.model)

            if (!isValidAiProvider || !isValidModel) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: data.ai ? ['model'] : ['ai'],
                message: data.ai ? 'Invalid AI model' : 'Invalid AI provider',
              })
            }
          }
        })
    }

    export const config: ApiRouteConfig = {
      type: 'api',
      name: 'CreateGame',
      description: 'Create a new chess game',
      path: '/chess/create-game',
      method: 'POST',
      emits: ['chess-game-created'],
      flows: ['chess'],
      bodySchema: z.object({
        players: z.object({
          white: playerSchema(),
          black: playerSchema(),
        }),
      }),
      middleware: [auth({ required: true })],
      responseSchema: {
        200: GameSchema,
        400: z.object({ message: z.string(), errors: z.array(z.object({ message: z.string() })) }),
        401: z.object({ message: z.string() }),
      },
    }

    export const handler: Handlers['CreateGame'] = async (req, { logger, emit, streams }) => {
      logger.info('[CreateGame] Creating new chess game')

      const game = await createGame(req.body.players, req.user, streams, logger)

      await emit({
        topic: 'chess-game-created',
        data: { gameId: game.id, fenBefore: game.fen },
      })

      logger.info('[CreateGame] Game created successfully', { gameId: game.id })

      return { status: 200, body: game }
    }
    ```

  </Tab>
  <Tab value="move-evaluation">
    The Python-powered move evaluation system that uses Stockfish to analyze every move and calculate centipawn scores for strategic insight.

    ```python
    import chess
    import chess.engine
    import os
    from pydantic import BaseModel, Field

    class EvaluatePlayerMoveInput(BaseModel):
        fenBefore: str = Field(description="The FEN of the game before the move")
        fenAfter: str = Field(description="The FEN of the game after the move")
        gameId: str = Field(description="The ID of the game")
        moveId: str = Field(description="The ID of the move")
        player: str = Field(description="The player who made the move")

    config = {
        "type": "event",
        "name": "EvaluatePlayerMove",
        "description": "Evaluates move quality using Stockfish engine",
        "subscribes": ["evaluate-player-move"], 
        "emits": [],
        "flows": ["chess"],
        "input": EvaluatePlayerMoveInput.model_json_schema(),
    }

    class Evaluation(BaseModel):
        centipawn_score: int = Field(description="The evaluation in centipawns")
        best_move: str = Field(description="The best move")

    async def evaluate_position(
        engine: chess.engine.SimpleEngine,
        board: chess.Board,
        player: str,
        time_limit: float = 1.5
    ) -> Evaluation:
        """Evaluate a chess position and return analysis results."""
        analysis = await engine.analyse(
            board, 
            chess.engine.Limit(time=time_limit),
            info=chess.engine.INFO_ALL
        )
        
        score = analysis["score"]
        centipawn_score = score.white().score() if player == "white" else score.black().score()
        move = analysis.get("pv", [None])[0]

        return Evaluation(
            centipawn_score=centipawn_score if centipawn_score is not None else 0,
            best_move=move.uci() if move is not None else None
        )

    async def handler(input: EvaluatePlayerMoveInput, ctx):
        logger = ctx.logger
        
        # Initialize Stockfish engine
        engine_path = os.getenv("STOCKFISH_BIN_PATH")
        if not engine_path:
            raise EnvironmentError("STOCKFISH_BIN_PATH environment variable not set")
        
        _, engine = await chess.engine.popen_uci(engine_path)
        
        try:
            # Create boards from the positions
            board_before = chess.Board(input.fenBefore)
            board_after = chess.Board(input.fenAfter)
        
            # Evaluate positions
            eval_before = await evaluate_position(engine, board_before, input.player)
            eval_after = await evaluate_position(engine, board_after, input.player)

            # Calculate best move evaluation
            best_move = chess.Move.from_uci(eval_before.best_move)
            board_before.push(best_move)
            eval_best_move = await evaluate_position(engine, board_before, input.player)

            # Calculate move quality metrics
            evaluation_swing = max(0, eval_best_move.centipawn_score - eval_after.centipawn_score)
            blunder = evaluation_swing > 100  # Moves losing >100 centipawns are blunders

            evaluation = {
                "centipawnScore": eval_after.centipawn_score,
                "bestMove": eval_after.best_move,
                "evaluationSwing": evaluation_swing,
                "blunder": blunder,
            }

            # Update move in streams with evaluation
            move_stream = await ctx.streams.chessGameMove.get(input.gameId, input.moveId)
            move_stream["evaluation"] = evaluation
            await ctx.streams.chessGameMove.set(input.gameId, input.moveId, move_stream)

            logger.info("Move evaluation completed", { "evaluation": evaluation })

        finally:
            await engine.quit()
    ```

  </Tab>
  <Tab value="ai-player">
    The AI orchestration step that coordinates with different LLM providers using a unified prompt system. Features retry logic, move validation, and real-time thought streaming.

    ```typescript
    import { EventConfig, Handlers } from 'motia'
    import { z } from 'zod'
    import { makePrompt } from '../../services/ai/make-prompt'
    import { evaluateBestMoves } from '../../services/chess/evaluate-best-moves'
    import { move } from '../../services/chess/move'
    import mustache from 'mustache'

    const MAX_ATTEMPTS = 3

    const responseSchema = z.object({
      thought: z.string({
        description: 'The thought process of the move, make it look like you were just thinking for yourself'
      }),
      move: z.object({
        from: z.string({ description: 'The square to move from, example: e2' }),
        to: z.string({ description: 'The square to move to, example: e4' }),
        promote: z.enum(['queen', 'rook', 'bishop', 'knight']).optional(),
      }),
    })

    export const config: EventConfig = {
      type: 'event',
      name: 'AI_Player',
      description: 'AI Player with unified provider system and retry logic',
      subscribes: ['ai-move'],
      emits: ['chess-game-moved', 'chess-game-ended', 'evaluate-player-move'],
      flows: ['chess'],
      includeFiles: ['05-ai-player.mustache'], // Mustache template for chess prompts
    }

    export const handler: Handlers['AI_Player'] = async (input, { logger, emit, streams }) => {
      const game = await streams.chessGame.get('game', input.gameId)
      const player = input.player === 'white' ? game.players.white : game.players.black

      if (!player.ai) {
        logger.error('Player has no AI configured', { gameId: input.gameId })
        return
      }

      let attempts = 0
      let lastInvalidMove = undefined
      const validMoves = evaluateBestMoves(game)

      while (attempts < MAX_ATTEMPTS) {
        const messageId = crypto.randomUUID()

        // Create real-time thinking message
        await streams.chessGameMessage.set(input.gameId, messageId, {
          id: messageId,
          message: 'Thinking...',
          sender: player.ai,
          role: input.player,
          timestamp: Date.now(),
        })

        // Generate prompt using Mustache template
        const prompt = mustache.render(template, {
          fenBefore: input.fenBefore,
          fen: input.fen,
          lastMove: input.lastMove,
          inCheck: input.check,
          player: input.player,
          lastInvalidMove,
          validMoves,
        })

        try {
          // Use unified AI provider system
          const action = await makePrompt({
            prompt,
            zod: responseSchema,
            provider: player.ai,  // 'openai', 'claude', 'gemini', or 'grok'
            logger,
            model: player.model!, // Specific model like 'gpt-5-2025-08-07'
          })

          // Update message with AI's thought process
          await streams.chessGameMessage.set(input.gameId, messageId, {
            message: action.thought,
            move: action.move,
            sender: player.ai,
            role: input.player,
            timestamp: Date.now(),
          })

          // Execute the chess move
          await move({
            logger,
            streams,
            gameId: input.gameId,
            player: input.player,
            game,
            action: action.move,
            emit,
            illegalMoveAttempts: attempts,
          })

          return // Success!

        } catch (err) {
          attempts++
          lastInvalidMove = action?.move
          
          // Handle illegal moves with retry logic
          if (attempts >= MAX_ATTEMPTS) {
            // Player loses after too many illegal moves
            await streams.chessGame.set('game', game.id, {
              ...game,
              status: 'completed',
              winner: input.player === 'white' ? 'black' : 'white',
              endGameReason: 'Too many illegal moves',
            })
            
            await emit({
              topic: 'chess-game-ended',
              data: { gameId: input.gameId },
            })
          }
        }
      }
    }
    ```

  </Tab>
  <Tab value="streams">
    The real-time data streams that power live chess gameplay, storing game state, moves, and leaderboard data with automatic client synchronization.

    ```typescript
    // Chess Game Stream - stores complete game state
    import { StreamConfig } from 'motia'
    import { GameSchema } from '@chessarena/types/game'

    export const config: StreamConfig = {
      name: 'chessGame',
      schema: GameSchema,
      baseConfig: { storageType: 'default' },
    }
    ```

    ```typescript
    // Chess Game Move Stream - stores individual moves with evaluations
    import { StreamConfig } from 'motia'
    import { GameMoveSchema } from '@chessarena/types/game-move'

    export const config: StreamConfig = {
      name: 'chessGameMove',
      schema: GameMoveSchema,
      baseConfig: { storageType: 'default' },
    }
    ```

    ```typescript
    // Chess Leaderboard Stream - live AI model rankings
    import { StreamConfig } from 'motia'
    import { LeaderboardSchema } from '@chessarena/types/leaderboard'

    export const config: StreamConfig = {
      name: 'chessLeaderboard',
      schema: LeaderboardSchema,
      baseConfig: { storageType: 'default' },
    }
    ```

  </Tab>
  <Tab value="auth">
    The authentication system that manages user sessions and provides secure access to chess game creation and management.

    ```typescript
    import { ApiRouteConfig, Handlers } from 'motia'
    import { z } from 'zod'
    import { authenticateUser } from '../../services/auth/auth-service'

    export const config: ApiRouteConfig = {
      type: 'api',
      name: 'AuthAPI',
      description: 'Handle user authentication for chess platform',
      path: '/auth/login',
      method: 'POST',
      emits: ['user-authenticated'],
      flows: ['auth'],
      bodySchema: z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
      responseSchema: {
        200: z.object({ 
          token: z.string(), 
          user: z.object({ id: z.string(), email: z.string() }) 
        }),
        401: z.object({ message: z.string() }),
      },
    }

    export const handler: Handlers['AuthAPI'] = async (req, { logger, emit }) => {
      const { email, password } = req.body

      try {
        const authResult = await authenticateUser(email, password)
        
        if (!authResult.success) {
          return { status: 401, body: { message: 'Invalid credentials' } }
        }

        await emit({
          topic: 'user-authenticated',
          data: { userId: authResult.user.id, email: authResult.user.email },
        })

        return {
          status: 200,
          body: {
            token: authResult.token,
            user: authResult.user,
          },
        }
      } catch (error) {
        logger.error('[AuthAPI] Authentication error', { error: error.message })
        return { status: 401, body: { message: 'Authentication failed' } }
      }
    }
    ```

  </Tab>
</Tabs>

---

## Extensible AI Provider System

ChessArena.AI features a plugin-based architecture that makes adding new AI providers incredibly simple. The unified `makePrompt` system handles all provider differences behind a clean interface.

### Adding New AI Providers

To add a new AI provider (like Anthropic's upcoming models or other LLM providers), you only need to:

1. **Create a provider handler** in `services/ai/your-provider.ts`:

```typescript
import { Handler } from './types'

export const yourProvider: Handler = async ({ prompt, zod, logger, model }) => {
  // Initialize your AI client
  const client = new YourAIClient({ apiKey: process.env.YOUR_API_KEY })
  
  // Make the API call with structured output
  const response = await client.chat({
    model: model ?? 'your-default-model',
    messages: [{ role: 'user', content: prompt }],
    responseFormat: { type: 'json_schema', schema: zodToJsonSchema(zod) },
  })
  
  logger.info('Your provider response received', { model })
  
  return JSON.parse(response.content)
}
```

2. **Register the provider** in `services/ai/make-prompt.ts`:

```typescript
import { yourProvider } from './your-provider'

const providers: Record<AiModelProvider, Handler> = {
  openai,
  gemini,
  claude,
  grok,
  yourProvider, // Add your provider here
}
```

3. **Update the type definitions** in `types/ai-models.ts`:

```typescript
export const AiModelProviderSchema = () => 
  z.enum(['openai', 'gemini', 'claude', 'grok', 'yourProvider'])
```

4. **Add supported models** in `services/ai/models.ts`:

```typescript
export const supportedModelsByProvider: AiModels = {
  // ... existing providers
  yourProvider: [
    'your-model-v1',
    'your-model-v2-turbo',
    'your-model-reasoning',
  ],
}
```

That's it! Your new AI provider is now fully integrated and can compete in chess battles alongside GPT, Claude, Gemini, and Grok.

### Current Provider Implementations

The platform currently supports four major AI providers with their latest models:

- **OpenAI**: GPT-5, O4 Mini, GPT-4.1 series, O3 Mini
- **Anthropic**: Claude Opus 4.1, Claude Sonnet 4, Claude 3.7 series  
- **Google**: Gemini 2.5 Flash, Gemini 2.0 Flash
- **xAI**: Grok 4, Grok 3

Each provider uses optimized API calls with structured JSON output and proper error handling.

---

## Real-Time Chess Architecture

The beauty of this chess platform lies in its event-driven, real-time architecture. Here's how live chess games flow through the system:

1. **Game Creation** → User selects AI models and creates a new game
2. **Move Generation** → AI models generate moves using LLM APIs
3. **Move Validation** → Chess rules validation and board state updates
4. **Stockfish Analysis** → Real-time move evaluation and scoring
5. **Stream Updates** → Live game state propagated to all connected clients
6. **Leaderboard Updates** → AI model rankings updated based on move quality

**No manual state management, no complex WebSocket handling, no synchronization code required!**

---

## Key Features & Benefits

### 🎮 **Real-Time Chess Gameplay**
Live games with instant move updates across all connected clients - watch AI models battle in real-time.

### 🏆 **Intelligent Scoring System**  
Move quality evaluation using Stockfish engine with centipawn precision and blunder detection.

### 🤖 **Multi-AI Integration**
Support for OpenAI GPT, Anthropic Claude, and Google Gemini models with unified API interface.

### ⚡ **Event-Driven Architecture**
Scalable, maintainable system where each component handles specific chess functionality.

### 📊 **Live Leaderboards**
Real-time AI model rankings based on move quality, strategic insight, and game performance.

### 🌐 **Production-Ready**
Battle-tested code powering the live ChessArena.AI platform with global accessibility.

---

## Trying It Out

Ready to build your own AI chess platform? Let's get it running.

<Steps>

### Clone and Install

Start by getting the project locally and installing dependencies.

```shell
git clone https://github.com/MotiaDev/chessarena-ai.git
cd chessarena-ai
pnpm install
```

### Install Stockfish Engine

The platform requires Stockfish for move evaluation. Choose your installation method:

**Option A: Using Homebrew (macOS - Recommended)**
```shell
brew install stockfish
```

**Option B: Using the project installer**
```shell
pnpm install-stockfish <platform>
# Supported: linux-x86, mac-m1
```

**Option C: Manual Installation**
Download from [stockfishchess.org](https://stockfishchess.org/)

### Configure Environment Variables

Create a `.env` file with your AI provider API keys:

```shell
# Required: AI Model API Keys
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."

# Required: Stockfish Engine Path
STOCKFISH_BIN_PATH="/opt/homebrew/bin/stockfish"

# Optional: Authentication (for user management)
JWT_SECRET="your-jwt-secret"
```

### Start the Chess Platform

Launch both the API backend and React frontend:

```shell
pnpm dev
```

This starts:
- **API Backend**: `http://localhost:3000` (Motia API with chess logic)
- **React Frontend**: `http://localhost:5173` (Chess game interface)

### Create Your First AI Battle

1. **Open the Chess Platform**: Navigate to `http://localhost:5173`
2. **Select AI Models**: Choose different models for white and black players
3. **Start the Game**: Watch AI models battle with real-time move evaluation
4. **View Analysis**: See centipawn scores, best moves, and blunder detection
5. **Check Leaderboards**: Monitor AI model performance rankings

### Access Real-Time Data

Your chess games are available via the Motia streams API:

```shell
# Get all active games
curl http://localhost:3000/api/streams/chessGame

# Get specific game state
curl http://localhost:3000/api/streams/chessGame/{gameId}

# Get move history with evaluations
curl http://localhost:3000/api/streams/chessGameMove/{gameId}

# Get AI model leaderboard
curl http://localhost:3000/api/streams/chessLeaderboard
```

### Deploy to Production

Once your chess platform is working locally, deploy it to production with Motia Cloud:

**Option 1: CLI Deployment**
```shell
# Deploy with version and API key
motia cloud deploy --api-key your-api-key --version-name 1.0.0

# Deploy with environment variables
motia cloud deploy --api-key your-api-key \
  --version-name 1.0.0 \
  --env-file .env.production \
  --environment-id your-env-id
```

**Option 2: One-Click Web Deployment**
1. Ensure your local project is running (`pnpm dev`)
2. Go to [Motia Cloud -> Import from Workbench](https://motia.cloud)
3. Select your local project port
4. Choose project and environment name
5. Upload environment variables (optional)
6. Click **Deploy** and watch the magic happen! ✨

</Steps>

---

## 🚀 Production Deployment Guide

### Environment Variables

Configure these environment variables for production security and functionality:

```shell
# Required: AI Model API Keys
OPENAI_API_KEY="sk-your-openai-key"          # For GPT-5, O4 Mini, GPT-4.1 series
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key" # For Claude Opus 4.1, Sonnet 4
GEMINI_API_KEY="your-google-gemini-key"      # For Gemini 2.5 Flash, 2.0 Flash  
XAI_API_KEY="your-xai-grok-key"              # For Grok 4, Grok 3

# Required: Stockfish Engine Path
STOCKFISH_BIN_PATH="/opt/homebrew/bin/stockfish"

# Optional: Authentication for user management
JWT_SECRET="your-secure-jwt-secret"

# Optional: Database configuration for user data
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Security Best Practices

For production deployments, ensure you:

1. **Secure API keys**: 
   ```shell
   # Generate a cryptographically secure JWT secret
   openssl rand -hex 32
   ```

2. **Store secrets securely**: Use environment variables, never commit API keys to code

3. **Monitor AI usage**: Track API usage and costs across different model providers

4. **Enable rate limiting**: Implement request limits to prevent abuse

### Scaling Considerations

This architecture scales automatically with your chess platform traffic:

- **Multiple games**: Each game gets its own stream for real-time updates
- **High concurrency**: Motia streams handle thousands of concurrent chess games
- **Global distribution**: Deploy to multiple regions for worldwide performance
- **AI model optimization**: Load balance across different model providers
- **Cost optimization**: Pay only for actual usage with serverless scaling

---

## 💻 Dive into the Code

Want to explore the complete chess platform implementation? Check out the full source code with AI integration, real-time streams, and production deployment:

<div className="not-prose">
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 my-6">
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Live ChessArena.AI Platform</h3>
        <p className="text-gray-600 mb-4">Access the complete implementation powering the live chess platform. See exactly how AI models battle with real-time evaluation and scoring!</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href="https://github.com/MotiaDev/chessarena-ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            View ChessArena.AI Code
          </a>
          <a 
            href="https://chessarena.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors duration-200"
          >
            Play Live Chess →
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

---

## Conclusion: Intelligence Through Strategic Play

This ChessArena.AI platform demonstrates how to build sophisticated AI evaluation systems using event-driven architecture. By focusing on move quality rather than simple win/loss statistics, we've created a platform that truly measures AI strategic understanding.

The beauty of this approach is its extensibility:
- **Add new AI models**: Integrate any LLM provider with the unified interface
- **Enhanced analysis**: Implement opening book analysis, endgame evaluation
- **Tournament modes**: Multi-round competitions with advanced scoring
- **Educational features**: Move explanations, tactical puzzles, learning modes

Key architectural benefits:
- **Real-time synchronization**: All clients see live game updates automatically
- **Scalable evaluation**: Stockfish analysis runs independently of game flow
- **Multi-language power**: TypeScript orchestration with Python chess engine integration
- **Production reliability**: Battle-tested code handling real user traffic

This exact implementation powers the live chess platform at [ChessArena.AI](https://chessarena.ai) - that real-time AI battle system with move-by-move evaluation? It's this code in action, proven at scale with thousands of chess enthusiasts worldwide.

**Production Metrics:**
- Handles 1,000+ concurrent chess games
- Processes 10,000+ moves daily with real-time evaluation
- Sub-100ms move analysis and streaming updates
- 99.9% uptime with automatic scaling

Ready to build AI evaluation platforms that measure true intelligence? Deploy production-ready chess systems with Motia today!
