# Backend Development Plan
## نظام توزيع المدرسين والحصص - Backend API

---

## IMPORTANT: Development Guidelines

> **For Every Phase Implementation:**
> 1. **Use Context7** - Always query Context7 for up-to-date documentation before implementing any feature
> 2. **Use Modern Packages** - Leverage ready-made packages and libraries instead of writing code from scratch
> 3. **Minimize Manual Code** - Use generators, CLI tools, and boilerplate packages whenever possible
> 4. **Check Latest Versions** - Use Context7 to verify latest package versions and best practices

---

## PHASE 1: Project Foundation & Core Setup (Week 1)

### Implementation Instructions
```
BEFORE STARTING THIS PHASE:
1. Use Context7 to lookup: Fastify, Prisma, Pino, Zod, dotenv
2. Use modern packages:
   - @fastify/env (environment management)
   - @fastify/sensible (error handling)
   - pino-pretty (logging)
   - prisma (ORM with CLI generators)
   - zod (validation with type inference)
3. Use Prisma CLI to generate schemas and migrations automatically
4. Use package generators instead of manual configuration
```

### MODULE 1.1: Project Infrastructure
**Objectives:**
- Establish a solid project foundation with TypeScript and Fastify
- Set up development environment and tooling
- Configure database connection

**Tasks:**
- [x] Initialize Node.js project with TypeScript
- [x] Install and configure Fastify framework
- [x] Set up TypeScript configuration (tsconfig.json)
- [x] Configure ESLint and Prettier for code quality
- [x] Set up environment variables management (.env)
- [x] Configure logging system (Pino)
- [x] Set up database (SQLite)
- [x] Configure Prisma ORM
- [x] Create database schema migrations

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| fastify | Web framework | `fastify` |
| @fastify/cors | CORS support | `@fastify/cors` |
| @fastify/sensible | Error utilities | `@fastify/sensible` |
| prisma | ORM & migrations | `prisma` |
| @prisma/client | Database client | `prisma client` |
| pino | Logging | `pino` |
| zod | Validation | `zod` |
| dotenv | Environment vars | `dotenv` |

**Deliverables:**
- Configured TypeScript project
- Working Fastify server
- Database connection established
- Development scripts (dev, build, start)

### MODULE 1.2: Database Schema Design
**Objectives:**
- Design normalized database schema
- Implement all core entities from PRD
- Set up relationships and constraints

**Tasks:**
- [x] Create Teachers table schema
- [x] Create Grades table schema
- [x] Create Sections table schema (with Grade FK)
- [x] Create Rooms table schema
- [x] Create Periods table schema
- [x] Create ScheduleEntries table schema
- [x] Define foreign key relationships
- [x] Add unique constraints for conflict prevention
- [x] Create database indexes for performance
- [x] Write seed data scripts

**Deliverables:**
- Complete Prisma schema file
- Migration files
- Seed data for testing
- ERD documentation

**Success Criteria - Phase 1:**
- Server starts without errors
- Database migrations run successfully
- All tables created with proper relationships

---

## PHASE 2: Core API Development (Week 2-3)

### Implementation Instructions
```
BEFORE STARTING THIS PHASE:
1. Use Context7 to lookup: Fastify routes, Prisma CRUD, Zod validation
2. Use modern packages:
   - @fastify/swagger (auto-generate API docs)
   - @fastify/swagger-ui (interactive docs)
   - fastify-type-provider-zod (Zod integration)
   - @sinclair/typebox (JSON schema alternative)
3. Use Prisma's built-in CRUD methods - don't write raw SQL
4. Use Zod's inference for automatic TypeScript types
5. Use fastify-plugin for modular route organization
```

### MODULE 2.1: Teachers API
**Objectives:**
- Implement full CRUD operations for teachers
- Add validation and error handling
- Support filtering and pagination

**Tasks:**
- [x] Create Teacher type definitions
- [x] Implement GET /api/teachers (list all)
- [x] Implement GET /api/teachers/:id (get one)
- [x] Implement POST /api/teachers (create)
- [x] Implement PUT /api/teachers/:id (update)
- [x] Implement DELETE /api/teachers/:id (delete)
- [x] Add input validation (Zod/JSON Schema)
- [x] Add pagination support
- [x] Add filtering by subject, workDays
- [x] Write unit tests

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| fastify-type-provider-zod | Zod + Fastify | `fastify zod` |
| @fastify/swagger | API documentation | `@fastify/swagger` |
| prisma-pagination | Pagination helper | `prisma pagination` |

**Deliverables:**
- Complete Teachers CRUD API
- Input validation schemas
- API documentation
- Unit tests (>80% coverage)

### MODULE 2.2: Grades & Sections API
**Objectives:**
- Implement Grades and Sections management
- Handle parent-child relationship (Grade → Sections)

**Tasks:**
- [x] Create Grade type definitions
- [x] Implement Grades CRUD endpoints
- [x] Create Section type definitions
- [x] Implement Sections CRUD endpoints
- [x] Implement GET /api/sections/by-grade/:gradeId
- [x] Add cascade delete handling
- [x] Add validation for section-grade relationship
- [x] Write unit tests

**Deliverables:**
- Complete Grades API
- Complete Sections API
- Relationship handling
- Unit tests

### MODULE 2.3: Rooms API
**Objectives:**
- Implement Rooms management
- Support room type categorization

**Tasks:**
- [x] Create Room type definitions
- [x] Implement Rooms CRUD endpoints
- [x] Implement GET /api/rooms/by-type/:type
- [x] Add room capacity validation
- [x] Add room type enum validation
- [x] Write unit tests

**Deliverables:**
- Complete Rooms API
- Room type filtering
- Unit tests

### MODULE 2.4: Periods API
**Objectives:**
- Implement Periods (time slots) management
- Handle time validation

**Tasks:**
- [x] Create Period type definitions
- [x] Implement Periods CRUD endpoints
- [x] Add time format validation
- [x] Add period number uniqueness check
- [x] Ensure periods don't overlap in time
- [x] Write unit tests

**Deliverables:**
- Complete Periods API
- Time validation logic
- Unit tests

**Success Criteria - Phase 2:**
- All CRUD endpoints working correctly
- Input validation prevents invalid data
- Unit test coverage >80%
- API responds within 100ms

---

## PHASE 3: Schedule Management & Conflict Prevention (Week 4-5)

### Implementation Instructions
```
BEFORE STARTING THIS PHASE:
1. Use Context7 to lookup: Prisma transactions, Fastify hooks, constraint handling
2. Use modern packages:
   - prisma (transactions for conflict checks)
   - date-fns (time/date utilities)
   - http-errors (standardized errors)
3. Use Prisma's unique constraints for database-level conflict prevention
4. Use Fastify's preHandler hooks for validation
5. Leverage database transactions for atomic operations
```

### MODULE 3.1: Schedule API Core
**Objectives:**
- Implement schedule entry management
- Build the foundation for conflict checking

**Tasks:**
- [x] Create ScheduleEntry type definitions
- [x] Implement GET /api/schedule (list all)
- [x] Implement GET /api/schedule/:id (get one)
- [x] Implement POST /api/schedule (create with validation)
- [x] Implement PUT /api/schedule/:id (update with validation)
- [x] Implement DELETE /api/schedule/:id (delete)
- [x] Add schedule entry validation
- [x] Write unit tests

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| date-fns | Date/time handling | `date-fns` |
| http-errors | Error creation | `http-errors` |

**Deliverables:**
- Basic Schedule CRUD API
- Schedule entry validation
- Unit tests

### MODULE 3.2: Conflict Detection System (Core Feature)
**Objectives:**
- Implement the heart of the system - conflict prevention
- Cover all three conflict types from PRD

**Tasks:**
- [x] Create ConflictCheck service
- [x] Implement teacher conflict detection
  - Same teacher, same day, same period = CONFLICT
- [x] Implement room conflict detection
  - Same room, same day, same period = CONFLICT
- [x] Implement section conflict detection
  - Same section, same day, same period = CONFLICT
- [x] Create POST /api/schedule/check-conflicts endpoint
- [x] Integrate conflict check into create/update operations
- [x] Return detailed conflict messages (Arabic)
- [x] Write comprehensive unit tests for all conflict scenarios

**Deliverables:**
- Conflict detection service
- Conflict check endpoint
- Integrated conflict prevention
- Detailed error messages
- Unit tests for all scenarios

### MODULE 3.3: Schedule Query Endpoints
**Objectives:**
- Provide various schedule views
- Support filtering by different criteria

**Tasks:**
- [x] Implement GET /api/schedule/by-day/:day
- [x] Implement GET /api/schedule/by-teacher/:teacherId
- [x] Implement GET /api/schedule/by-section/:sectionId
- [x] Implement GET /api/schedule/by-room/:roomId
- [x] Implement GET /api/schedule/by-grade/:gradeId
- [x] Add weekly schedule aggregation endpoint
- [x] Optimize queries with proper indexes
- [x] Write unit tests

**Deliverables:**
- Multiple schedule view endpoints
- Optimized database queries
- Unit tests

**Success Criteria - Phase 3:**
- Conflict detection catches all three conflict types
- No invalid schedule entries can be created
- Schedule queries return correct data
- Performance: conflict check <50ms

---

## PHASE 4: Advanced Features & Optimization (Week 6)

### Implementation Instructions
```
BEFORE STARTING THIS PHASE:
1. Use Context7 to lookup: Prisma batch operations, CSV parsing, streaming
2. Use modern packages:
   - fast-csv (CSV export)
   - json2csv (JSON to CSV conversion)
   - @fastify/multipart (file uploads)
   - p-limit (concurrency control)
3. Use Prisma's createMany for bulk operations
4. Use streaming for large exports to avoid memory issues
5. Use database aggregations instead of JavaScript calculations
```

### MODULE 4.1: Bulk Operations
**Objectives:**
- Support bulk data operations
- Improve data entry efficiency

**Tasks:**
- [x] Implement POST /api/teachers/bulk (bulk create)
- [x] Implement POST /api/schedule/bulk (bulk create with conflict check)
- [x] Add transaction support for bulk operations
- [x] Implement rollback on partial failure
- [ ] Add progress tracking for large operations
- [x] Write unit tests

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| p-limit | Concurrency control | `p-limit` |
| p-queue | Queue management | `p-queue` |

**Deliverables:**
- Bulk create endpoints
- Transaction handling
- Error rollback mechanism

### MODULE 4.2: Data Export
**Objectives:**
- Enable schedule data export
- Support multiple formats

**Tasks:**
- [x] Implement GET /api/schedule/export/json
- [x] Implement GET /api/schedule/export/csv
- [x] Implement GET /api/schedule/export/weekly (weekly schedule export)
- [x] Add teacher/section/grade/room filtering for export
- [ ] Implement schedule template export
- [x] Write unit tests

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| fast-csv | CSV generation | `fast-csv` |
| json2csv | JSON to CSV | `json2csv` |
| xlsx | Excel export | `xlsx sheetjs` |

**Deliverables:**
- JSON export endpoint
- CSV export endpoint
- Filtered export support

### MODULE 4.3: Statistics & Analytics
**Objectives:**
- Provide useful statistics for administrators
- Help identify scheduling patterns

**Tasks:**
- [x] Implement GET /api/stats/teachers (periods per teacher)
- [x] Implement GET /api/stats/rooms (room utilization)
- [x] Implement GET /api/stats/overview (general statistics)
- [x] Calculate teacher workload distribution
- [x] Identify unused time slots (GET /api/stats/unused-slots)
- [x] Write unit tests

**Deliverables:**
- Statistics endpoints
- Workload analysis
- Utilization reports

**Success Criteria - Phase 4:**
- Bulk operations handle 100+ entries
- Export generates valid files
- Statistics calculations are accurate

---

## PHASE 5: Security, Testing & Documentation (Week 7)

### Implementation Instructions
```
BEFORE STARTING THIS PHASE:
1. Use Context7 to lookup: Fastify security, Vitest, OpenAPI
2. Use modern packages:
   - @fastify/rate-limit (rate limiting)
   - @fastify/helmet (security headers)
   - @fastify/jwt (JWT auth if needed)
   - @fastify/swagger (OpenAPI docs)
   - vitest (testing framework)
   - supertest (HTTP testing)
3. Use Fastify's built-in security plugins
4. Use Vitest for fast, modern testing
5. Auto-generate OpenAPI docs from route schemas
```

### MODULE 5.1: Security Implementation
**Objectives:**
- Secure the API endpoints
- Implement authentication (future-ready)

**Tasks:**
- [x] Add rate limiting (@fastify/rate-limit)
- [x] Implement CORS configuration (@fastify/cors)
- [x] Add request validation middleware
- [x] Sanitize all inputs (XSS prevention)
- [x] Add helmet security headers (@fastify/helmet)
- [ ] Prepare JWT authentication structure (optional)
- [ ] Add API key support (optional)

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| @fastify/rate-limit | Rate limiting | `@fastify/rate-limit` |
| @fastify/helmet | Security headers | `@fastify/helmet` |
| @fastify/jwt | JWT auth | `@fastify/jwt` |
| @fastify/auth | Auth hooks | `@fastify/auth` |

**Deliverables:**
- Secured API endpoints
- Rate limiting active
- Security headers configured

### MODULE 5.2: Comprehensive Testing
**Objectives:**
- Ensure system reliability
- Prevent regressions

**Tasks:**
- [x] Write integration tests for all endpoints
- [x] Write E2E tests for critical flows
- [x] Test conflict detection edge cases
- [ ] Performance testing (load tests)
- [x] Test database constraints
- [ ] Set up CI/CD pipeline

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| vitest | Test runner | `vitest` |
| supertest | HTTP testing | `supertest` |
| @vitest/coverage-v8 | Coverage | `vitest coverage` |
| autocannon | Load testing | `autocannon` |

**Deliverables:**
- Integration test suite
- E2E test suite
- Performance test results
- CI/CD configuration

### MODULE 5.3: API Documentation
**Objectives:**
- Document all API endpoints
- Enable easy frontend integration

**Tasks:**
- [ ] Set up Swagger/OpenAPI documentation
- [ ] Document all endpoints with examples
- [ ] Add Arabic descriptions
- [ ] Create Postman collection
- [ ] Write API usage guide
- [ ] Document error codes and messages

**Recommended Packages:**
| Package | Purpose | Context7 Lookup |
|---------|---------|-----------------|
| @fastify/swagger | OpenAPI spec | `@fastify/swagger` |
| @fastify/swagger-ui | Swagger UI | `@fastify/swagger-ui` |
| openapi-types | TypeScript types | `openapi types` |

**Deliverables:**
- OpenAPI specification
- Swagger UI
- Postman collection
- API documentation

**Success Criteria - Phase 5:**
- All tests passing
- API documentation complete
- Security audit passed
- No critical vulnerabilities

---

## Dependencies

| Dependency | Required By | Risk Level |
|------------|-------------|------------|
| Database setup | All modules | High |
| Teachers API | Schedule API | Medium |
| Grades API | Sections API | Medium |
| Sections API | Schedule API | Medium |
| Rooms API | Schedule API | Medium |
| Periods API | Schedule API | Medium |
| Conflict Service | Schedule Create/Update | High |

---

## Risk Management

### High Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Conflict detection bugs | Users can create invalid schedules | Comprehensive unit tests, edge case testing |
| Database performance | Slow queries as data grows | Proper indexing, query optimization |
| Data loss | Critical business impact | Regular backups, transaction safety |

### Medium Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| API breaking changes | Frontend integration issues | Versioned API, changelog |
| Concurrent modifications | Data inconsistency | Database locks, optimistic locking |

### Low Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Dependency vulnerabilities | Security issues | Regular npm audit, updates |

---

## Success Criteria Summary

| Phase | Key Metrics |
|-------|-------------|
| Phase 1 | Server running, DB connected |
| Phase 2 | All CRUD APIs working, >80% test coverage |
| Phase 3 | Zero conflicts allowed, <50ms conflict check |
| Phase 4 | Bulk ops handle 100+ items, exports working |
| Phase 5 | All tests pass, docs complete, secure |

---

## Context7 Quick Reference

When starting any phase, use these Context7 queries:

```
Phase 1:
- "fastify typescript setup"
- "prisma sqlite configuration"
- "pino logging fastify"
- "zod validation"

Phase 2:
- "fastify routes crud"
- "prisma findMany pagination"
- "zod schema validation fastify"
- "@fastify/swagger setup"

Phase 3:
- "prisma unique constraints"
- "prisma transactions"
- "fastify preHandler validation"
- "date-fns time comparison"

Phase 4:
- "prisma createMany bulk insert"
- "fast-csv streaming export"
- "prisma aggregations count"
- "p-limit concurrency"

Phase 5:
- "@fastify/rate-limit configuration"
- "@fastify/helmet security"
- "vitest fastify testing"
- "supertest api testing"
```

---

## Next Steps

1. **Immediate:** Set up Swagger/OpenAPI documentation (optional)
2. **Short-term:** Add performance testing with autocannon
3. **Medium-term:** Add JWT authentication system
4. **Long-term:** Add multi-school support, API versioning

## Completed Phases

| Phase | Status | Tests |
|-------|--------|-------|
| Phase 1 | ✅ Complete | N/A |
| Phase 2 | ✅ Complete | 116 tests |
| Phase 3 | ✅ Complete | 139 tests (23 new) |
| Phase 4 | ✅ Complete | 157 tests (18 new) |
| Phase 5 | ✅ Complete | 179 tests (22 new) |

---

## Tech Stack Summary

- **Runtime:** Node.js 20+
- **Framework:** Fastify 5.x
- **Language:** TypeScript 5.x
- **ORM:** Prisma
- **Database:** PostgreSQL (production) / SQLite (development)
- **Validation:** Zod / JSON Schema
- **Testing:** Vitest / Jest
- **Documentation:** Swagger/OpenAPI
