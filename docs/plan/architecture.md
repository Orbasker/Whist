# Architecture Plan: Angular (Web) + Flutter (Mobile)

## Project Structure

```
Wist/
├── shared/                          # Shared game logic (TypeScript)
│   ├── src/
│   │   ├── game-logic/
│   │   │   ├── scoring.ts          # Score calculation functions
│   │   │   ├── game-state.ts       # Game state interfaces
│   │   │   ├── round-mode.ts       # Round mode calculation
│   │   │   └── trump-suit.ts       # Trump suit types/enums
│   │   ├── types/
│   │   │   ├── game.types.ts       # Shared TypeScript interfaces
│   │   │   └── index.ts
│   │   └── index.ts                # Package exports
│   ├── package.json
│   └── tsconfig.json
│
├── angular-web/                     # Angular web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/               # Core module (singletons)
│   │   │   │   ├── services/
│   │   │   │   │   ├── game.service.ts
│   │   │   │   │   ├── storage.service.ts
│   │   │   │   │   └── navigation.service.ts
│   │   │   │   └── models/
│   │   │   │       ├── game-state.model.ts
│   │   │   │       ├── player.model.ts
│   │   │   │       └── round.model.ts
│   │   │   │
│   │   │   ├── features/           # Feature modules
│   │   │   │   ├── home/
│   │   │   │   │   ├── home.component.ts
│   │   │   │   │   ├── home.component.html
│   │   │   │   │   ├── home.component.scss
│   │   │   │   │   └── home.component.spec.ts
│   │   │   │   │
│   │   │   │   └── game/
│   │   │   │       ├── game.component.ts
│   │   │   │       ├── game.component.html
│   │   │   │       ├── game.component.scss
│   │   │   │       ├── components/
│   │   │   │       │   ├── bidding-phase/
│   │   │   │       │   │   ├── bidding-phase.component.ts
│   │   │   │       │   │   ├── bidding-phase.component.html
│   │   │   │       │   │   └── bidding-phase.component.scss
│   │   │   │       │   ├── tricks-phase/
│   │   │   │       │   ├── round-summary/
│   │   │   │       │   └── score-table/
│   │   │   │       └── game.component.spec.ts
│   │   │   │
│   │   │   ├── shared/             # Shared UI components
│   │   │   │   ├── components/
│   │   │   │   │   ├── player-input/
│   │   │   │   │   ├── bid-selector/
│   │   │   │   │   ├── trump-selector/
│   │   │   │   │   └── score-display/
│   │   │   │   └── directives/
│   │   │   │       └── rtl.directive.ts
│   │   │   │
│   │   │   ├── app.component.ts
│   │   │   ├── app.component.html
│   │   │   ├── app.component.scss
│   │   │   ├── app.config.ts       # App configuration
│   │   │   └── app.routes.ts       # Routing configuration
│   │   │
│   │   ├── assets/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   │
│   │   ├── styles/
│   │   │   ├── _variables.scss    # CSS variables (colors, spacing)
│   │   │   ├── _theme.scss         # Dark theme
│   │   │   ├── _rtl.scss           # RTL-specific styles
│   │   │   └── styles.scss         # Global styles
│   │   │
│   │   ├── environments/
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   │
│   │   └── main.ts
│   │
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── flutter-mobile/                 # Flutter mobile application
│   ├── lib/
│   │   ├── main.dart
│   │   │
│   │   ├── core/                   # Core functionality
│   │   │   ├── services/
│   │   │   │   ├── game_service.dart
│   │   │   │   ├── storage_service.dart
│   │   │   │   └── navigation_service.dart
│   │   │   ├── models/
│   │   │   │   ├── game_state.dart
│   │   │   │   ├── player.dart
│   │   │   │   └── round.dart
│   │   │   └── utils/
│   │   │       ├── scoring.dart    # Ported from shared/
│   │   │       ├── round_mode.dart
│   │   │       └── trump_suit.dart
│   │   │
│   │   ├── features/               # Feature modules
│   │   │   ├── home/
│   │   │   │   ├── home_screen.dart
│   │   │   │   ├── widgets/
│   │   │   │   │   └── player_input_field.dart
│   │   │   │   └── home_screen_test.dart
│   │   │   │
│   │   │   └── game/
│   │   │       ├── game_screen.dart
│   │   │       ├── screens/
│   │   │       │   ├── bidding_phase_screen.dart
│   │   │       │   ├── tricks_phase_screen.dart
│   │   │       ├── widgets/
│   │   │       │   ├── bidding_phase/
│   │   │       │   │   ├── trump_selector.dart
│   │   │       │   │   └── bid_input_grid.dart
│   │   │       │   ├── tricks_phase/
│   │   │       │   │   └── tricks_input_grid.dart
│   │   │       │   ├── round_summary_dialog.dart
│   │   │       │   └── score_table_dialog.dart
│   │   │       └── game_screen_test.dart
│   │   │
│   │   ├── shared/                 # Shared UI widgets
│   │   │   ├── widgets/
│   │   │   │   ├── player_card.dart
│   │   │   │   ├── bid_button.dart
│   │   │   │   ├── score_display.dart
│   │   │   │   └── loading_indicator.dart
│   │   │   └── theme/
│   │   │       ├── app_theme.dart
│   │   │       └── colors.dart
│   │   │
│   │   └── routes/
│   │       └── app_router.dart
│   │
│   ├── assets/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── test/
│   │   ├── unit/
│   │   │   ├── scoring_test.dart
│   │   │   └── game_service_test.dart
│   │   └── widget/
│   │       └── home_screen_test.dart
│   │
│   ├── pubspec.yaml
│   └── analysis_options.yaml
│
└── docs/
    ├── plan/
    │   ├── migration-to-angular-flutter.md
    │   └── architecture.md
    └── README.md
```

---

## Angular Architecture

### Component Hierarchy

```
AppComponent
├── RouterOutlet
    ├── HomeComponent (route: /)
    │   └── PlayerInputFormComponent (x4)
    │
    └── GameComponent (route: /game)
        ├── GameHeaderComponent
        │   ├── BackButtonComponent
        │   ├── RoundIndicatorComponent
        │   └── TrophyButtonComponent
        │
        ├── BiddingPhaseComponent (conditional)
        │   ├── TrumpSelectorComponent
        │   │   └── TrumpButtonComponent (x5)
        │   ├── BidInputComponent (x4)
        │   │   └── BidButtonGridComponent (0-13)
        │   └── TotalBidsDisplayComponent
        │
        ├── TricksPhaseComponent (conditional)
        │   └── TricksInputComponent (x4)
        │       ├── PlayerBidDisplayComponent
        │       └── TricksButtonGridComponent (0-13)
        │
        ├── ScoreTableDialogComponent (modal)
        │   ├── ScoreTableComponent
        │   └── ResetGameButtonComponent
        │
        └── RoundSummaryDialogComponent (modal)
            ├── PlayerResultCardComponent (x4)
            └── ContinueButtonComponent
```

### Service Layer

```
┌─────────────────────────────────────────┐
│         GameService (Singleton)         │
│  - gameState$: Observable<GameState>    │
│  - currentPhase$: Observable<Phase>     │
│  - loadGame(gameId: string)             │
│  - createGame(players: string[])        │
│  - submitBids(bids: number[], trump)    │
│  - submitTricks(tricks: number[])       │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         ApiService (HTTP Client)         │
│  - createGame(players) → POST /games   │
│  - getGame(id) → GET /games/{id}        │
│  - submitBids() → POST /rounds/bids     │
│  - submitTricks() → POST /rounds/tricks │
└─────────────────────────────────────────┘
              │
              ▼
        FastAPI Backend
    (Business Logic + Database)
```

### State Management Flow

```
User Action
    │
    ▼
Component Event
    │
    ▼
GameService Method
    │
    ▼
ApiService HTTP Call
    │
    ▼
FastAPI Backend
    │
    ├──► Validate (Pydantic)
    │
    ├──► Business Logic (Service)
    │
    ├──► Persist (Repository → Database)
    │
    └──► Return Response
            │
            ▼
    GameService Updates Observable
            │
            ▼
    Component Updates (async pipe)
```

### Data Models

```typescript
// game-state.model.ts
interface GameState {
  id: string;
  players: string[];
  scores: number[];
  rounds: Round[];
  currentRound: number;
  status: 'active' | 'completed';
}

interface Round {
  round: number;
  bids: number[];
  tricks: number[];
  scores: number[];
  mode: 'over' | 'under';
  trumpSuit: TrumpSuit | null;
}

type TrumpSuit = 'spades' | 'clubs' | 'diamonds' | 'hearts' | 'no-trump';
type Phase = 'bidding' | 'tricks';
```

---

## Flutter Architecture

### Widget Tree

```
MaterialApp
└── AppRouter
    ├── HomeRoute
    │   └── HomeScreen
    │       └── PlayerInputForm
    │           └── PlayerInputField (x4)
    │
    └── GameRoute
        └── GameScreen
            ├── AppBar
            │   ├── BackButton
            │   ├── RoundIndicator
            │   └── TrophyButton
            │
            ├── BiddingPhaseScreen (conditional)
            │   ├── TrumpSelector
            │   │   └── TrumpButton (x5)
            │   ├── BidInputGrid (x4)
            │   │   └── BidButton (0-13)
            │   └── TotalBidsDisplay
            │
            ├── TricksPhaseScreen (conditional)
            │   └── TricksInputGrid (x4)
            │       ├── PlayerBidDisplay
            │       └── TricksButton (0-13)
            │
            ├── ScoreTableDialog (modal)
            │   └── ScoreTable
            │
            └── RoundSummaryDialog (modal)
                └── PlayerResultCard (x4)
```

### State Management (Provider/Riverpod)

```
┌─────────────────────────────────────────┐
│      GameNotifier (ChangeNotifier)     │
│  - GameState gameState                 │
│  - Phase currentPhase                  │
│  - loadGame(String gameId)             │
│  - createGame(List<String> players)    │
│  - submitBids(List<int> bids, Trump)   │
│  - submitTricks(List<int> tricks)      │
│  - calculateScore(int bid, int tricks) │
└─────────────────────────────────────────┘
              │
              ├─────────────────┐
              │                 │
              ▼                 ▼
┌─────────────────────┐  ┌─────────────────────┐
│  StorageService     │  │  ScoringUtils       │
│  - saveGame()       │  │  (ported from       │
│  - loadGame()       │  │   shared/)          │
│  - deleteGame()     │  │  - calculateScore() │
└─────────────────────┘  └─────────────────────┘
```

### Data Models (Dart)

```dart
// models/game_state.dart
class GameState {
  final String id;
  final List<String> players;
  final List<int> scores;
  final List<Round> rounds;
  final int currentRound;
  final GameStatus status;
}

class Round {
  final int round;
  final List<int> bids;
  final List<int> tricks;
  final List<int> scores;
  final RoundMode mode;
  final TrumpSuit? trumpSuit;
}

enum TrumpSuit { spades, clubs, diamonds, hearts, noTrump }
enum RoundMode { over, under }
enum GameStatus { active, completed }
enum Phase { bidding, tricks }
```

---

## Shared Logic Architecture

### TypeScript Package (shared/)

```typescript
// shared/src/game-logic/scoring.ts
export function calculateScore(
  bid: number,
  tricks: number,
  roundMode: 'over' | 'under'
): number {
  if (bid === 0) {
    if (tricks === 0) {
      return roundMode === 'under' ? 50 : 30;
    } else {
      return -10 * tricks;
    }
  } else {
    if (bid === tricks) {
      return (bid * bid) + 10;
    } else {
      return -10 * Math.abs(bid - tricks);
    }
  }
}

// shared/src/game-logic/round-mode.ts
export function getRoundMode(totalBids: number): 'over' | 'under' {
  return totalBids > 13 ? 'over' : 'under';
}
```

### Dart Port (flutter-mobile/lib/core/utils/)

```dart
// scoring.dart
int calculateScore(int bid, int tricks, RoundMode roundMode) {
  if (bid == 0) {
    if (tricks == 0) {
      return roundMode == RoundMode.under ? 50 : 30;
    } else {
      return -10 * tricks;
    }
  } else {
    if (bid == tricks) {
      return (bid * bid) + 10;
    } else {
      return -10 * (bid - tricks).abs();
    }
  }
}
```

---

## Backend Architecture

### FastAPI with MVVM Pattern

**See**: `docs/plan/backend-architecture.md` for complete backend architecture details.

#### Architecture Layers
- **Models**: SQLAlchemy ORM models (database entities)
- **ViewModels**: Pydantic schemas (request/response validation)
- **Views**: FastAPI route handlers (API endpoints)
- **Services**: Business logic layer (scoring, game management)
- **Repositories**: Data access layer (CRUD operations)

#### Key Endpoints
```
POST   /api/v1/games                    # Create game
GET    /api/v1/games/{id}              # Get game
PUT    /api/v1/games/{id}              # Update game
POST   /api/v1/games/{id}/rounds/bids  # Submit bids
POST   /api/v1/games/{id}/rounds/tricks # Submit tricks
GET    /api/v1/games/{id}/rounds       # Get rounds
```

#### Frontend Integration
- **Angular**: `ApiService` with `HttpClient` → calls backend
- **Flutter**: `ApiService` with `http` package → calls backend
- **No local storage**: All data persisted in backend database

---

## Technology Stack

### Backend
- **Framework**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+
- **Validation**: Pydantic v2
- **Database**: PostgreSQL (prod) / SQLite (dev)
- **Migrations**: Alembic
- **Testing**: pytest + pytest-asyncio

### Angular Web
- **Framework**: Angular 18+ (Standalone Components)
- **State Management**: RxJS Observables + Services
- **Styling**: Tailwind CSS + SCSS
- **UI Components**: Angular Material (optional) + Custom Components
- **Routing**: Angular Router
- **Animations**: Angular Animations API
- **API Client**: Angular HttpClient → FastAPI backend
- **Testing**: Jasmine + Karma (or Jest)

### Flutter Mobile
- **Framework**: Flutter 3.x
- **State Management**: Provider or Riverpod
- **Styling**: Material Design 3 + Custom Theme
- **UI Components**: Material Widgets + Custom Widgets
- **Routing**: go_router or Navigator 2.0
- **Animations**: Flutter Animations
- **API Client**: http package → FastAPI backend
- **Testing**: Flutter Test + Integration Test

### Shared Logic
- **Backend**: Core game logic in FastAPI (Python)
  - Scoring calculations
  - Round mode calculation
  - Game state management
- **Frontend**: Thin clients, no business logic
  - TypeScript interfaces matching backend schemas
  - Dart classes matching backend schemas
- **Testing**: pytest (backend) + Jest/Flutter Test (frontends)

---

## Data Flow Diagrams

### Game Creation Flow

```
User Input (4 names)
    │
    ▼
HomeComponent
    │
    ▼
GameService.createGame(players)
    │
    ├──► Generate GameState
    │
    └──► StorageService.saveGame()
            │
            ▼
    Navigate to /game
            │
            ▼
    GameComponent loads state
```

### Bidding Phase Flow

```
User selects trump + bids
    │
    ▼
BiddingPhaseComponent
    │
    ▼
GameService.submitBids(bids, trump)
    │
    ├──► Calculate round mode
    │
    ├──► Update gameState
    │
    └──► StorageService.saveGame()
            │
            ▼
    Switch to TricksPhaseComponent
```

### Tricks Phase Flow

```
User inputs tricks
    │
    ▼
TricksPhaseComponent
    │
    ▼
GameService.submitTricks(tricks)
    │
    ├──► Calculate scores (ScoringService)
    │
    ├──► Update cumulative scores
    │
    ├──► Create Round object
    │
    ├──► Increment currentRound
    │
    └──► StorageService.saveGame()
            │
            ▼
    Show RoundSummaryDialog
            │
            ▼
    User clicks "Continue"
            │
            ▼
    Return to BiddingPhaseComponent
```

---

## RTL (Hebrew) Support

### Angular
- **HTML**: `dir="rtl"` on root element
- **CSS**: Tailwind RTL utilities (`rtl:`, `ltr:`)
- **SCSS**: `_rtl.scss` with RTL-specific overrides
- **Icons**: Mirror icons where needed

### Flutter
- **MaterialApp**: `localizationsDelegates` with Hebrew
- **Directionality**: `Directionality.of(context)`
- **Text**: `TextDirection.rtl` for Hebrew text
- **Layout**: `Row` with `mainAxisAlignment: MainAxisAlignment.end`

---

## Theme & Styling

### Color Palette
```scss
// Dark theme colors
$slate-900: #0f172a;
$slate-800: #1e293b;
$slate-700: #334155;
$amber-500: #f59e0b;
$amber-400: #fbbf24;
```

### Angular Styling Strategy
- **Global**: Tailwind CSS utilities
- **Components**: Component-scoped SCSS
- **Theme**: CSS variables for colors
- **RTL**: Tailwind RTL utilities

### Flutter Styling Strategy
- **Theme**: `ThemeData` in `app_theme.dart`
- **Colors**: `Colors` class with custom palette
- **Text Styles**: `TextTheme` with Hebrew font support
- **Components**: Custom widgets with theme-aware styling

---

## Testing Strategy

### Angular
- **Unit Tests**: Services, utilities, pure functions
- **Component Tests**: Component logic, inputs/outputs
- **Integration Tests**: Full game flow

### Flutter
- **Unit Tests**: Services, utilities, models
- **Widget Tests**: UI components, interactions
- **Integration Tests**: Full game flow on emulator

### Shared Logic
- **TypeScript**: Jest tests for all scoring functions
- **Dart**: Flutter Test for ported logic

---

## Performance Considerations

### Angular
- **Change Detection**: OnPush strategy for components
- **Lazy Loading**: Feature modules lazy-loaded
- **Observables**: Use `async` pipe, avoid manual subscriptions
- **Animations**: Use Angular Animations (GPU-accelerated)

### Flutter
- **Widget Rebuilds**: Use `const` constructors, `Provider.select()`
- **State Management**: Minimize rebuilds with selective listening
- **Animations**: Use `AnimatedContainer`, `AnimatedOpacity`
- **Lists**: Use `ListView.builder` for dynamic lists

---

## Security & Data

### Storage
- **Angular**: localStorage (browser)
- **Flutter**: shared_preferences (device)
- **Future**: Backend API with authentication

### Validation
- **Input Validation**: Form validators in both platforms
- **Game Rules**: Enforced in service layer
- **Error Handling**: User-friendly error messages

---

## Deployment

### Angular
- **Build**: `ng build --configuration production`
- **Hosting**: Static hosting (Vercel, Netlify, GitHub Pages)
- **Environment**: Environment files for config

### Flutter
- **Build**: `flutter build apk` / `flutter build ios`
- **Distribution**: Google Play Store, Apple App Store
- **CI/CD**: GitHub Actions for automated builds

---

## Questions for Review

1. **State Management**: 
   - Angular: RxJS + Services (simple) vs NgRx (complex)
   - Flutter: Provider (simple) vs Riverpod vs Bloc
   - **Recommendation**: Start simple, upgrade if needed

2. **UI Framework**:
   - Angular: Angular Material vs Custom Components
   - Flutter: Material Design vs Cupertino vs Custom
   - **Recommendation**: Custom for exact design match

3. **Shared Logic**:
   - Keep TypeScript package + manual Dart port?
   - Or use code generation?
   - **Recommendation**: Manual port for learning

4. **Backend**:
   - Start with local storage only?
   - Or include backend from start?
   - **Recommendation**: Local storage first, backend later

---

**Status**: ⏳ Awaiting Review & Approval
