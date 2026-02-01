# Migration Plan: React/Base44 → Angular (Web) + Flutter (Mobile)

## User Story
Migrate the Whist card game scoring application from React/Base44 to Angular (web) and Flutter (mobile) with a FastAPI backend, while maintaining the same game functionality and Hebrew RTL UI. Design Phase 1 to be forward-compatible with Phase 2 (multi-user, real-time sharing) and Phase 3 (full card game simulation).

**See**: `docs/plan/future-phases.md` for Phase 2 & 3 requirements

## Current Architecture Understanding

### Existing Features
- **Home Screen**: 4-player name input → Start Game
- **Bidding Phase**: Trump suit selection + individual bids (0-13 tricks)
- **Tricks Phase**: Input actual tricks taken per player
- **Round Summary**: Score calculation and display
- **Score Table**: Cumulative scores across rounds
- **Game State**: Persisted via Base44 entities

### Current Tech Stack
- React with JSX
- Base44 platform (managed backend/database)
- shadcn/ui components
- Framer Motion animations
- Tailwind CSS
- React Router
- TanStack Query

### Game Logic (Core Business Rules)
- **Scoring Algorithm**: 
  - Bid 0 + Take 0: +50 (under) or +30 (over)
  - Bid 0 + Take tricks: -10 × tricks
  - Bid matches tricks: (bid²) + 10
  - Bid doesn't match: -10 × |bid - tricks|
- **Round Mode**: Total bids > 13 = "over", ≤ 13 = "under"
- **Game Flow**: Bidding → Tricks → Summary → Next Round

## Assumptions / Constraints / Open Questions

### Assumptions
- ✅ User wants to learn Angular and Flutter (educational goal)
- ✅ Both platforms should have identical game logic
- ✅ Hebrew RTL support required for both
- ✅ Dark theme with orange/amber accents maintained
- ✅ 4-player game structure remains the same

### Constraints
- ✅ **Backend Strategy**: FastAPI backend with MVVM architecture (DECIDED)
- ⚠️ **Shared Business Logic**: Backend will contain core game logic, frontends call API
  - Backend: FastAPI with SQLAlchemy models + Pydantic schemas
  - Frontends: HTTP clients to call backend API

### Decisions Made
1. **Backend**: FastAPI with MVVM architecture
   - Models: SQLAlchemy ORM (database layer)
   - ViewModels: Pydantic schemas (request/response validation)
   - Views: FastAPI route handlers (API endpoints)
   - Services: Business logic layer
   - Repositories: Data access layer
   - **See**: `docs/plan/backend-architecture.md` for full details

2. **Code Sharing**:
   - Backend contains core game logic (scoring, round mode calculation)
   - Frontends are thin clients that call backend API
   - Shared TypeScript package still useful for frontend validation/utilities

3. **Development Priority**:
   - Phase 1: Backend setup and core API
   - Phase 2: Angular frontend
   - Phase 3: Flutter frontend
   - **RECOMMENDATION**: Backend first, then Angular, then Flutter

4. **UI Framework Choices**:
   - Angular: Angular Material + Tailwind CSS
   - Flutter: Material Design 3
   - **RECOMMENDATION**: Custom components for exact design match

## Incremental Migration Plan

### Phase 0: Backend Setup (FastAPI with MVVM)
**Goal**: Create FastAPI backend with MVVM architecture and core game logic

#### Step 0.1: Backend Project Setup
- [ ] Create `backend/` directory structure
- [ ] Initialize Python virtual environment
- [ ] Install FastAPI, SQLAlchemy, Pydantic, Alembic
- [ ] Set up project structure (models, schemas, views, services, repositories)
- [ ] Configure database (SQLite for dev, PostgreSQL for prod)
- [ ] Set up Alembic for migrations
- [ ] Create `.env` file for configuration

**Deliverable**: Backend project structure ready

#### Step 0.2: Database Models (M in MVVM)
- [ ] Create `Game` model (SQLAlchemy) with Phase 2 fields (nullable)
  - Use UUID for primary key (forward compatible)
  - Add nullable Phase 2 fields: owner_id, name, player_user_ids, is_shared, share_code
  - Add Phase 3 field: game_mode (default 'scoring_only')
- [ ] Create `Round` model (SQLAlchemy)
- [ ] Set up relationships (Game → Rounds)
- [ ] Create base model class
- [ ] Write initial Alembic migration
- [ ] **Note**: Phase 2 models (User, GameParticipant) will be added later

**Deliverable**: Database models defined and migrated (Phase 1, forward compatible)

#### Step 0.3: Pydantic Schemas (VM in MVVM)
- [ ] Create `GameCreate` schema (request)
- [ ] Create `GameResponse` schema (response)
- [ ] Create `GameUpdate` schema (update)
- [ ] Create `RoundCreate` schema
- [ ] Create `RoundResponse` schema
- [ ] Create common schemas (errors, pagination)

**Deliverable**: Request/response schemas defined

#### Step 0.4: Business Logic Services
- [ ] Create `ScoringService` with scoring calculations
- [ ] Create `RoundService` for round management
- [ ] Create `GameService` for game orchestration
- [ ] Write unit tests for all services

**Deliverable**: Business logic services with tests

**Checkpoint**: `== RUN TESTS ==` - All service tests pass

#### Step 0.5: Repository Layer
- [ ] Create `BaseRepository` class
- [ ] Create `GameRepository` with CRUD operations
- [ ] Create `RoundRepository` with CRUD operations
- [ ] Write repository tests

**Deliverable**: Data access layer complete

#### Step 0.6: API Routes (V in MVVM)
- [ ] Create `/api/v1/games` endpoints:
  - POST `/games` - Create game
  - GET `/games/{id}` - Get game
  - PUT `/games/{id}` - Update game
  - DELETE `/games/{id}` - Delete game
- [ ] Create `/api/v1/games/{id}/rounds` endpoints:
  - POST `/rounds/bids` - Submit bids
  - POST `/rounds/tricks` - Submit tricks
  - GET `/rounds` - Get all rounds
- [ ] Add health check endpoint
- [ ] Configure CORS for Angular/Flutter

**Deliverable**: API endpoints working

**Checkpoint**: `== RUN TESTS ==` - API integration tests pass
**Checkpoint**: `== DEMO ==` - Test API with Postman/curl

#### Step 0.7: Error Handling & Validation
- [ ] Create custom exceptions
- [ ] Add exception handlers
- [ ] Add request validation
- [ ] Add response validation
- [ ] Add error response schemas

**Deliverable**: Robust error handling

#### Step 0.8: Documentation & Testing
- [ ] FastAPI auto-generated docs (Swagger) working
- [ ] Write integration tests for all endpoints
- [ ] Write E2E tests for game flow
- [ ] Document API endpoints

**Deliverable**: Complete backend with tests and docs

**Checkpoint**: `== RUN CR ==` - Code review backend implementation

---

### Phase 1: Project Setup & Frontend Integration
**Goal**: Set up Angular and Flutter projects, integrate with backend

#### Step 1.1: Create Project Structure
- [ ] Create `angular-web/` directory for Angular app
- [ ] Create `flutter-mobile/` directory for Flutter app
- [ ] Create `shared/` directory for shared TypeScript utilities (optional)
- [ ] Set up monorepo structure

**Deliverable**: Project structure with three main directories

#### Step 1.2: Frontend API Integration
- [ ] Create Angular `ApiService` with HTTP client
- [ ] Create Flutter `ApiService` with HTTP client
- [ ] Define TypeScript/Dart interfaces matching backend schemas
- [ ] Test API connectivity from both frontends
- [ ] Add error handling for API calls

**Deliverable**: Both frontends can communicate with backend

**Checkpoint**: `== DEMO ==` - Test API calls from Angular and Flutter

---

### Phase 2: Angular Web Application
**Goal**: Build complete Angular version with all features

#### Step 2.1: Angular Project Setup
- [ ] Initialize Angular project (`ng new` or standalone)
- [ ] Configure Tailwind CSS
- [ ] Set up Angular Material (optional)
- [ ] Configure RTL support for Hebrew
- [ ] Set up routing (Home, Game routes)
- [ ] Configure dark theme

**Deliverable**: Angular app with routing, RTL, and dark theme

#### Step 2.2: Core Services & State Management
- [ ] Create `GameService` that uses `ApiService` to call backend
- [ ] Create `GameState` interface/models matching backend schemas
- [ ] Implement RxJS observables for reactive state management
- [ ] Handle loading states and errors

**Deliverable**: Services that integrate with backend API

#### Step 2.3: Home Component
- [ ] Create `HomeComponent` with 4-player name input
- [ ] Implement form validation
- [ ] Add "Start Game" button with navigation
- [ ] Match existing UI (dark theme, Hebrew, orange accents)

**Deliverable**: Home screen matching current design

**Checkpoint**: `== DEMO ==` - Home screen working

#### Step 2.4: Game Components - Bidding Phase
- [ ] Create `BiddingPhaseComponent`
- [ ] Implement trump suit selection (5 buttons: No Trump, Spades, Clubs, Diamonds, Hearts)
- [ ] Implement bid input (0-13) for each player
- [ ] Show total bids and round mode calculation
- [ ] Add validation (total must be valid)
- [ ] Implement submit handler

**Deliverable**: Bidding phase fully functional

#### Step 2.5: Game Components - Tricks Phase
- [ ] Create `TricksPhaseComponent`
- [ ] Display each player's bid for reference
- [ ] Implement tricks input (0-13) for each player
- [ ] Show validation (total tricks must equal 13)
- [ ] Implement submit handler

**Deliverable**: Tricks phase fully functional

#### Step 2.6: Game Components - Round Summary
- [ ] Create `RoundSummaryComponent` (modal/dialog)
- [ ] Display bid vs actual tricks for each player
- [ ] Show calculated scores
- [ ] Display cumulative totals
- [ ] Add trophy icon for round winner
- [ ] Implement "Continue to next round" button

**Deliverable**: Round summary modal working

#### Step 2.7: Game Components - Score Table
- [ ] Create `ScoreTableComponent` (modal/dialog)
- [ ] Display cumulative scores across all rounds
- [ ] Show round-by-round breakdown
- [ ] Add "Reset Game" functionality
- [ ] Implement close handler

**Deliverable**: Score table modal working

#### Step 2.8: Game Page Integration
- [ ] Create `GameComponent` as main container
- [ ] Implement phase switching (bidding ↔ tricks)
- [ ] Add header with round number and phase indicator
- [ ] Add back navigation
- [ ] Add trophy button for score table
- [ ] Implement animations (Angular Animations API)

**Deliverable**: Complete game flow working

**Checkpoint**: `== RUN TESTS ==` - Angular app tests
**Checkpoint**: `== DEMO ==` - Full game flow working

#### Step 2.9: Polish & Styling
- [ ] Match exact UI from React version
- [ ] Ensure RTL layout works correctly
- [ ] Add loading states
- [ ] Add error handling
- [ ] Optimize animations
- [ ] Responsive design

**Deliverable**: Polished Angular app matching design

**Checkpoint**: `== RUN CR ==` - Code review Angular implementation

---

### Phase 3: Flutter Mobile Application
**Goal**: Build Flutter version with same functionality

#### Step 3.1: Flutter Project Setup
- [ ] Initialize Flutter project (`flutter create`)
- [ ] Configure project structure (lib/, assets/)
- [ ] Set up state management (Provider, Riverpod, or Bloc)
- [ ] Configure RTL support for Hebrew
- [ ] Set up dark theme
- [ ] Configure routing (go_router or Navigator 2.0)

**Deliverable**: Flutter app with routing, RTL, and dark theme

#### Step 3.2: API Integration & Services
- [ ] Create `lib/services/api_service.dart` to call backend
- [ ] Create `lib/services/game_service.dart` that uses API service
- [ ] Create game state models matching backend schemas
- [ ] Implement state management (Provider/Riverpod)
- [ ] Handle loading states and errors

**Deliverable**: Flutter services integrated with backend API

**Checkpoint**: `== RUN TESTS ==` - Flutter unit tests

#### Step 3.3: Home Screen
- [ ] Create `HomeScreen` widget
- [ ] Implement 4-player name input (TextFormField)
- [ ] Add form validation
- [ ] Add "Start Game" button
- [ ] Match UI design (dark theme, Hebrew, orange accents)

**Deliverable**: Home screen matching design

**Checkpoint**: `== DEMO ==` - Home screen working

#### Step 3.4: Game Screens - Bidding Phase
- [ ] Create `BiddingPhaseScreen`
- [ ] Implement trump suit selection (Row of buttons)
- [ ] Implement bid input (0-13) for each player
- [ ] Show total bids and round mode
- [ ] Add validation
- [ ] Implement submit handler

**Deliverable**: Bidding phase fully functional

#### Step 3.5: Game Screens - Tricks Phase
- [ ] Create `TricksPhaseScreen`
- [ ] Display each player's bid
- [ ] Implement tricks input (0-13) for each player
- [ ] Show validation (total = 13)
- [ ] Implement submit handler

**Deliverable**: Tricks phase fully functional

#### Step 3.6: Game Screens - Round Summary
- [ ] Create `RoundSummaryDialog` widget
- [ ] Display bid vs actual tricks
- [ ] Show calculated scores
- [ ] Display cumulative totals
- [ ] Add trophy icon for winner
- [ ] Implement "Continue" button

**Deliverable**: Round summary dialog working

#### Step 3.7: Game Screens - Score Table
- [ ] Create `ScoreTableDialog` widget
- [ ] Display cumulative scores
- [ ] Show round-by-round breakdown
- [ ] Add "Reset Game" functionality

**Deliverable**: Score table dialog working

#### Step 3.8: Game Screen Integration
- [ ] Create `GameScreen` as main container
- [ ] Implement phase switching (PageView or Navigator)
- [ ] Add AppBar with round number and phase
- [ ] Add back navigation
- [ ] Add trophy button for score table
- [ ] Implement animations (Flutter Animations)

**Deliverable**: Complete game flow working

**Checkpoint**: `== RUN TESTS ==` - Flutter app tests
**Checkpoint**: `== DEMO ==` - Full game flow working on mobile

#### Step 3.9: Polish & Mobile Optimization
- [ ] Match UI from Angular/web version
- [ ] Ensure RTL layout works
- [ ] Add loading states
- [ ] Add error handling
- [ ] Optimize for mobile (touch targets, spacing)
- [ ] Test on iOS and Android

**Deliverable**: Polished Flutter app

**Checkpoint**: `== RUN CR ==` - Code review Flutter implementation

---

### Phase 4: Polish & Optimization (Future)
**Goal**: Enhance application with additional features

#### Step 4.1: Authentication (Optional)
- [ ] Add JWT authentication to backend
- [ ] Add login/register endpoints
- [ ] Update frontends to handle auth
- [ ] Add protected routes

#### Step 4.2: Real-time Updates (Optional)
- [ ] Add WebSocket support to backend
- [ ] Implement real-time game state updates
- [ ] Update frontends to use WebSockets

#### Step 4.3: Advanced Features (Optional)
- [ ] Game history and statistics
- [ ] Multi-game support
- [ ] Export game data
- [ ] Social features (share games)

**Deliverable**: Enhanced application features

---

## Success Criteria

### Functional Requirements
- ✅ All game features work identically in both Angular and Flutter
- ✅ Hebrew RTL layout works correctly
- ✅ Dark theme with orange accents maintained
- ✅ Game state persists in backend database
- ✅ Score calculations match exactly
- ✅ All game phases flow correctly
- ✅ Backend API is well-documented and tested

### Technical Requirements
- ✅ Angular app runs on web browsers
- ✅ Flutter app runs on iOS and Android
- ✅ FastAPI backend runs and serves API
- ✅ Code is well-structured and maintainable
- ✅ Unit tests for game logic (backend)
- ✅ Integration tests for API endpoints
- ✅ No critical bugs or crashes
- ✅ **Forward compatible**: Database schema supports Phase 2 & 3

### Learning Goals
- ✅ User understands Angular architecture and patterns
- ✅ User understands Flutter architecture and patterns
- ✅ User understands FastAPI with MVVM architecture
- ✅ Code demonstrates best practices for all three frameworks

### Phase 2 & 3 Readiness
- ✅ Database schema includes nullable Phase 2 fields
- ✅ UUID primary keys (no conflicts in multi-user scenarios)
- ✅ Extensible status and mode enums
- ✅ Architecture supports adding authentication, real-time, and card mechanics

## Identified Risks

### Technical Risks
1. **RTL Support Complexity**: Hebrew RTL might need special handling in both frameworks
   - **Mitigation**: Test early, use framework-native RTL support

2. **State Management**: Different patterns in Angular vs Flutter
   - **Mitigation**: Use simple, clear patterns (Services in Angular, Provider/Riverpod in Flutter)

3. **Animation Differences**: Angular Animations vs Flutter Animations
   - **Mitigation**: Focus on functional animations, not pixel-perfect matching

4. **Backend Migration**: Moving away from Base44 might lose features
   - **Mitigation**: Start with local storage, add backend later if needed

### Scope Risks
1. **Feature Parity**: Might miss some edge cases from React version
   - **Mitigation**: Document all features before migration, test thoroughly

2. **Time Investment**: Learning two new frameworks takes time
   - **Mitigation**: Build incrementally, focus on core features first

## Recommended Approach

1. **Start with Backend** (FastAPI with MVVM) - Core game logic and API
2. **Then build Angular** (web is easier to test and debug)
3. **Then build Flutter** (reuse API integration patterns from Angular)
4. **Build incrementally** (one feature at a time)
5. **Test frequently** (after each major component)
6. **Frontends are thin clients** (all business logic in backend)

## Future Phases

### Phase 2: Multi-User, Real-Time, Game Sharing
- Multi-game support per user
- User authentication (provider TBD: Supabase/Firebase/Auth0)
- Game sharing with share codes
- Real-time updates (WebSockets)
- Row Level Security (RLS) for database
- Multiple game groups (x,y,z,w can play, also x,y,s,w, etc.)

**See**: `docs/plan/future-phases.md` for complete Phase 2 architecture

### Phase 3: Full Card Game Simulation
- Card shuffling and dealing
- Remote play (full game remotely)
- Scoring-only mode (current functionality)
- Card game mechanics (play cards, track tricks)

**See**: `docs/plan/future-phases.md` for complete Phase 3 architecture

## Next Steps

1. **Get approval** for this migration plan
2. **Review backend architecture** (see `docs/plan/backend-architecture.md`)
3. **Review future phases** (see `docs/plan/future-phases.md`)
4. **Start Phase 0** - Backend setup with FastAPI and MVVM architecture (forward compatible)

---

**Plan Status**: ⏳ Awaiting Approval
