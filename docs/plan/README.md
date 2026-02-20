# Whist Game - Migration & Architecture Plan

## Overview

This directory contains the complete planning documentation for migrating the Whist card game scoring application from React/Base44 to Angular (web) + Flutter (mobile) + FastAPI (backend).

## Document Structure

### 📋 Main Planning Documents

1. **`migration-to-angular-flutter.md`**
   - Complete migration plan with step-by-step tasks
   - Phase 0: Backend setup (FastAPI with MVVM)
   - Phase 1: Angular web application
   - Phase 2: Flutter mobile application
   - Phase 3: Polish & optimization
   - Success criteria and checkpoints

2. **`architecture.md`**
   - Complete system architecture
   - Component/widget hierarchies
   - Service layer diagrams
   - Data flow diagrams
   - Technology stack decisions
   - RTL support strategy
   - Testing strategy

3. **`backend-architecture.md`**
   - FastAPI backend architecture with MVVM pattern
   - Database schema (Phase 1, forward compatible)
   - API endpoint design
   - Service layer details
   - Repository pattern
   - Error handling
   - Frontend integration examples

4. **`future-phases.md`**
   - Phase 2: Multi-user, real-time, game sharing
   - Phase 3: Full card game simulation
   - Database schema for future phases
   - Authentication provider comparison
   - Real-time architecture (WebSockets)
   - Migration paths between phases

5. **`websocket-evaluation.md`**
   - How WebSockets are used today (backend + frontend)
   - Evaluation of alternatives (SSE, polling, managed services)
   - Recommendations and migration path for real-time game updates

6. **`managed-realtime-implementation.md`**
   - Implementing Supabase Realtime or Firebase alongside Neon
   - Backend publisher (Supabase Broadcast API) and frontend subscriber
   - Optional switch between WebSocket and managed real-time via environment

## Phase Overview

### Phase 1: Current Scope (Single Game, Backend)
**Goal**: Build complete application with FastAPI backend, Angular web, and Flutter mobile

**Features**:
- ✅ Single game per session
- ✅ FastAPI backend with MVVM architecture
- ✅ Angular web application
- ✅ Flutter mobile application
- ✅ Scoring logic (no card dealing)
- ✅ Hebrew RTL support
- ✅ Dark theme with orange accents

**Technology Stack**:
- Backend: FastAPI + SQLAlchemy + PostgreSQL/SQLite
- Frontend: Angular 18+ (web) + Flutter 3.x (mobile)
- Database: PostgreSQL (prod) / SQLite (dev)

### Phase 2: Multi-User, Real-Time, Game Sharing (Future)
**Goal**: Add multi-user support, game sharing, and real-time updates

**Features**:
- 🔄 Multiple games per user
- 🔄 User authentication (provider TBD)
- 🔄 Game sharing with share codes
- 🔄 Real-time updates (WebSockets)
- 🔄 Row Level Security (RLS)
- 🔄 Multiple game groups

**Technology Additions**:
- Authentication: Supabase/Firebase/Auth0 (TBD)
- Real-time: FastAPI WebSockets or Supabase Realtime
- RLS: Database-level security policies

### Phase 3: Full Card Game Simulation (Future)
**Goal**: Add full card game mechanics with remote play

**Features**:
- 🔮 Card shuffling and dealing
- 🔮 Remote play (full game remotely)
- 🔮 Scoring-only mode (Phase 1 functionality)
- 🔮 Card game mechanics (play cards, track tricks)

**Technology Additions**:
- Card game engine
- Trick tracking system
- Game mode selection

## Architecture Highlights

### Backend (FastAPI with MVVM)

```
Models (M)      → SQLAlchemy ORM (database entities)
ViewModels (VM) → Pydantic schemas (request/response)
Views (V)       → FastAPI route handlers (API endpoints)
Services        → Business logic layer
Repositories    → Data access layer
```

### Frontend (Angular & Flutter)

```
Thin Clients → HTTP API calls → FastAPI Backend
                ↓
         Business Logic (Backend)
                ↓
         Database (PostgreSQL)
```

### Key Design Decisions

1. **UUID Primary Keys**: Forward compatible with multi-user scenarios
2. **Nullable Phase 2 Fields**: Backward compatible migration path
3. **JSON for Flexible Data**: Easy to extend without schema changes
4. **Separate Rounds Table**: Supports game history and future card data
5. **Extensible Enums**: Status and mode can be extended

## Quick Start Guide

### For Developers

1. **Read the migration plan**: `migration-to-angular-flutter.md`
2. **Understand the architecture**: `architecture.md`
3. **Review backend design**: `backend-architecture.md`
4. **Plan for future**: `future-phases.md`

### Implementation Order

1. **Phase 0**: Backend setup (FastAPI + MVVM)
2. **Phase 1**: Angular web application
3. **Phase 2**: Flutter mobile application
4. **Phase 3**: Polish & optimization

### Future Phases (Not in Current Scope)

- Phase 2: Multi-user features (see `future-phases.md`)
- Phase 3: Card game mechanics (see `future-phases.md`)

## Key Files Reference

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `migration-to-angular-flutter.md` | Step-by-step implementation plan | Before starting implementation |
| `architecture.md` | System architecture overview | To understand overall design |
| `backend-architecture.md` | Backend design details | When building backend |
| `future-phases.md` | Future features planning | To understand roadmap |
| `websocket-evaluation.md` | Real-time transport evaluation & WebSocket usage | When changing or scaling real-time updates |
| `managed-realtime-implementation.md` | Supabase/Firebase real-time implementation | When adding or using managed real-time |

## Success Criteria

### Phase 1 (Current)
- ✅ All game features work in Angular and Flutter
- ✅ Backend API is complete and tested
- ✅ Hebrew RTL support
- ✅ Dark theme maintained
- ✅ Forward compatible with Phase 2 & 3

### Phase 2 (Future)
- 🔄 Multi-user support
- 🔄 Game sharing
- 🔄 Real-time updates
- 🔄 RLS implemented

### Phase 3 (Future)
- 🔮 Full card game simulation
- 🔮 Remote play support
- 🔮 Game mode selection

## Questions & Decisions

### Decided ✅
- FastAPI backend with MVVM architecture
- Angular for web, Flutter for mobile
- PostgreSQL/SQLite database
- UUID primary keys
- Forward compatible schema design

### To Be Decided in Phase 2 🔄
- Authentication provider (Supabase vs Firebase vs Auth0)
- Real-time solution (FastAPI WebSockets vs Supabase Realtime)
- Hosting platform

### To Be Decided in Phase 3 🔮
- Card game engine implementation
- Remote play architecture
- Game mode selection UI

## Next Steps

1. ✅ Review all planning documents
2. ✅ Get approval for architecture
3. ⏳ Start Phase 0: Backend setup
4. ⏳ Implement Phase 1: Angular + Flutter
5. 🔄 Plan Phase 2: Multi-user features
6. 🔮 Plan Phase 3: Card game mechanics

---

**Status**: 📋 Planning Complete - Ready for Implementation

**Last Updated**: Phase 1 planning with forward compatibility for Phase 2 & 3
