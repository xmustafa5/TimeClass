# Frontend Development Plan
## نظام توزيع المدرسين والحصص - Frontend Application

---

## PHASE 1: Project Foundation & UI Framework (Week 1)

### MODULE 1.1: Project Setup
**Objectives:**
- Establish Next.js project with TypeScript
- Configure styling and UI framework
- Set up project structure

**Tasks:**
- [x] Initialize Next.js with App Router
- [x] Configure TypeScript
- [x] Set up Tailwind CSS
- [x] Configure RTL (Right-to-Left) support for Arabic
- [x] Install and configure UI component library (shadcn/ui)
- [x] Set up Arabic fonts (Cairo)
- [x] Configure path aliases
- [x] Set up environment variables

**Deliverables:**
- Configured Next.js project
- RTL-ready styling system
- Arabic typography setup
- Development environment ready

### MODULE 1.2: Core Layout & Navigation
**Objectives:**
- Create the main application layout
- Implement responsive navigation
- Set up page structure

**Tasks:**
- [x] Create root layout with RTL support
- [x] Build Sidebar navigation component
- [x] Create responsive header component
- [x] Implement mobile navigation (hamburger menu)
- [x] Add breadcrumb navigation
- [x] Create loading states/skeletons
- [x] Build error boundary components
- [x] Implement 404 and error pages

**Deliverables:**
- Main application layout
- Responsive sidebar
- Mobile-friendly navigation
- Loading and error states

### MODULE 1.3: Shared Components Library
**Objectives:**
- Build reusable UI components
- Ensure consistent design system

**Tasks:**
- [x] Create Button component (variants: primary, secondary, danger)
- [x] Create Input component (text, number, time)
- [x] Create Select/Dropdown component
- [x] Create Modal/Dialog component
- [x] Create Table component with sorting
- [x] Create Card component
- [x] Create Badge/Tag component
- [x] Create Toast/Notification component (sonner)
- [x] Create Confirmation dialog component
- [x] Create Empty state component

**Deliverables:**
- Reusable component library
- Component documentation
- Storybook setup (optional)

**Success Criteria - Phase 1:**
- Application loads with Arabic RTL layout
- Navigation works on all screen sizes
- Shared components are reusable and consistent

---

## PHASE 2: Data Management & API Integration (Week 2)

### MODULE 2.1: State Management Setup
**Objectives:**
- Set up global state management
- Configure data fetching patterns

**Tasks:**
- [x] Install TanStack Query (React Query)
- [x] Set up QueryClientProvider
- [x] Configure staleTime and gcTime for caching
- [x] Create loading state management
- [x] Set up error state handling
- [x] Use React Context for UI-only state (modals, filters) - useModal hook created

**Deliverables:**
- TanStack Query setup
- Data fetching configuration
- Error/loading state patterns

### MODULE 2.2: API Client & Services
**Objectives:**
- Create type-safe API client
- Implement all API service functions

**Tasks:**
- [x] Create base API fetch utility
- [x] Implement Teachers service (CRUD)
- [x] Implement Grades service (CRUD)
- [x] Implement Sections service (CRUD)
- [x] Implement Rooms service (CRUD)
- [x] Implement Periods service (CRUD)
- [x] Implement Schedule service (CRUD + conflict check)
- [x] Add request/response interceptors
- [x] Implement error handling
- [x] Add retry logic for failed requests

**Deliverables:**
- Complete API service layer
- Type-safe API functions
- Error handling utilities

### MODULE 2.3: Custom Hooks
**Objectives:**
- Create reusable data hooks
- Simplify component data access

**Tasks:**
- [x] Create useTeachers hook
- [x] Create useGrades hook
- [x] Create useSections hook
- [x] Create useRooms hook
- [x] Create usePeriods hook
- [x] Create useSchedule hook
- [x] Create useConflictCheck hook
- [x] Create useToast hook (using sonner)
- [x] Create useModal hook
- [x] Create useLocalStorage hook

**Deliverables:**
- Custom hooks library
- Data fetching hooks
- Utility hooks

**Success Criteria - Phase 2:**
- All API calls working correctly
- Data caching reduces API calls
- Error states handled gracefully

---

## PHASE 3: Entity Management Pages (Week 3-4)

### MODULE 3.1: Teachers Management Page
**Objectives:**
- Complete teachers CRUD interface
- Implement table with actions

**Tasks:**
- [x] Create teachers list page
- [x] Build teachers table component
- [x] Implement "Add Teacher" modal
- [x] Add form validation (required fields, types) - React Hook Form + Zod
- [x] Implement edit teacher functionality
- [x] Implement delete with confirmation
- [x] Add search/filter functionality
- [x] Add pagination with page size selector
- [x] Show teacher's weekly period count
- [x] Add workdays selection (multi-select)
- [x] Implement bulk delete with selection checkboxes
- [x] Add export functionality (CSV & JSON)

**Deliverables:**
- Complete teachers management page
- CRUD operations working
- Search and filter working

### MODULE 3.2: Grades & Sections Management
**Objectives:**
- Build hierarchical grade-section interface
- Show tree structure (Grade → Sections)

**Tasks:**
- [x] Create grades page
- [x] Create sections page
- [x] Build grade cards with section count badges
- [x] Implement "Add Grade" modal
- [x] Implement "Add Section" modal (linked to grade)
- [x] Show section count per grade
- [x] Implement edit/delete functionality
- [ ] Add drag-and-drop reordering (optional)
- [x] Handle cascade delete warning (shows section count)
- [x] Add filter by grade (sections page)

**Deliverables:**
- Grades management page
- Sections management with grade filter
- Parent-child relationship handling

### MODULE 3.3: Rooms Management Page
**Objectives:**
- Implement rooms CRUD interface
- Categorize by room type

**Tasks:**
- [x] Create rooms page
- [x] Build rooms grid/cards layout
- [x] Implement room type badges (regular, lab, computer)
- [x] Implement "Add Room" modal
- [x] Add room capacity input
- [x] Implement edit functionality
- [x] Add filter by room type
- [x] Add search functionality
- [x] Show stats (total, labs, computer rooms)
- [ ] Show room utilization indicator (future)
- [ ] Add room availability view

**Deliverables:**
- Complete rooms management page
- Room type categorization
- Visual room cards

### MODULE 3.4: Periods Management Page
**Objectives:**
- Implement period time slots interface
- Visual timeline representation

**Tasks:**
- [x] Create periods page
- [x] Build timeline/list view with visual connectors
- [x] Implement "Add Period" modal
- [x] Add time picker components (HTML5 time input)
- [x] Validate time ranges (start < end) - Zod validation
- [x] Prevent overlapping periods (client-side real-time validation)
- [x] Show visual timeline with numbered circles
- [x] Show Arabic ordinal names (الأولى، الثانية...)
- [x] Format time in Arabic (ص/م)
- [x] Show stats (total periods, total hours, avg duration)
- [ ] Implement drag to reorder
- [ ] Add quick preset times

**Deliverables:**
- Complete periods management page
- Time validation
- Visual timeline

**Success Criteria - Phase 3:**
- All entity CRUD operations working
- Form validation prevents invalid data
- UI is intuitive and responsive

---

## PHASE 4: Schedule Management (Core Feature) (Week 5-6)

### MODULE 4.1: Weekly Schedule View
**Objectives:**
- Build the main schedule grid
- Display weekly timetable

**Tasks:**
- [x] Create schedule page
- [x] Build weekly grid component (days × periods)
- [x] Implement color coding per teacher
- [x] Add schedule entry cards (ScheduleEntryCard component)
- [x] Show teacher, subject, section, room in cell
- [x] Implement cell click to add entry
- [x] Add hover states with full details (Tooltip)
- [x] Implement responsive grid for mobile
- [ ] Add week navigation (if multi-week)
- [x] Implement print-friendly view

**Deliverables:**
- Weekly schedule grid
- Color-coded entries
- Interactive cells

### MODULE 4.2: Daily Schedule View
**Objectives:**
- Provide focused daily view
- Detailed single-day schedule

**Tasks:**
- [x] Build daily view toggle
- [x] Implement day selector
- [x] Create expanded daily cards
- [x] Show more details per entry
- [x] Add quick actions (edit, delete)
- [ ] Implement timeline view
- [ ] Add current time indicator
- [ ] Show breaks/free periods

**Deliverables:**
- Daily schedule view
- Day navigation
- Detailed entry cards

### MODULE 4.3: Schedule Entry Form
**Objectives:**
- Create intuitive schedule entry modal
- Integrate conflict checking

**Tasks:**
- [x] Build schedule entry modal
- [x] Add teacher dropdown (with subject)
- [x] Add section dropdown
- [x] Add room dropdown
- [x] Implement real-time conflict checking
- [x] Show conflict warnings before save
- [ ] Display available options only
- [x] Add subject override field
- [ ] Implement quick duplicate entry
- [x] Add entry editing functionality
- [x] Confirm before delete

**Deliverables:**
- Schedule entry form
- Real-time conflict feedback
- CRUD operations for entries

### MODULE 4.4: Conflict Prevention UI
**Objectives:**
- Visualize conflicts clearly
- Prevent invalid entries

**Tasks:**
- [x] Implement client-side conflict check
- [x] Show conflict type (teacher/room/section)
- [ ] Highlight conflicting entries in grid
- [x] Display Arabic error messages
- [ ] Suggest alternative slots
- [ ] Show teacher's other assignments
- [ ] Show room's other bookings
- [ ] Add conflict resolution wizard (optional)

**Deliverables:**
- Visual conflict indicators
- Clear error messaging
- Conflict prevention UI

### MODULE 4.5: Schedule Filters & Views
**Objectives:**
- Multiple schedule perspectives
- Filter by different criteria

**Tasks:**
- [x] Add filter by teacher (show teacher's schedule)
- [x] Add filter by section (show section's schedule)
- [x] Add filter by room (show room's schedule)
- [x] Add filter by grade
- [ ] Implement "My Schedule" view concept
- [ ] Add empty slots highlighting
- [x] Show utilization statistics
- [ ] Implement comparison view

**Deliverables:**
- Multiple filter options
- Different schedule perspectives
- Utilization insights

**Success Criteria - Phase 4:**
- Schedule displays correctly
- Conflicts are prevented
- CRUD operations work smoothly
- Mobile-friendly schedule view

---

## PHASE 5: Dashboard & Analytics (Week 7)

### MODULE 5.1: Main Dashboard
**Objectives:**
- Create informative dashboard
- Show key statistics

**Tasks:**
- [x] Create dashboard page
- [x] Add statistics cards (counts)
- [x] Fetch real data from API (TanStack Query hooks)
- [x] Show teacher count with workload summary
- [x] Show total scheduled periods
- [x] Show room utilization percentage
- [ ] Add recent activity feed
- [x] Implement quick actions
- [x] Add schedule completeness indicator
- [x] Add system status alerts (warnings/errors)
- [x] Add progress bars for completeness visualization

**Deliverables:**
- Dashboard with live statistics
- Quick action buttons
- Activity overview

### MODULE 5.2: Reports & Insights
**Objectives:**
- Provide useful reports
- Help administrators make decisions

**Tasks:**
- [ ] Create reports page
- [ ] Teacher workload report
- [ ] Room utilization report
- [ ] Empty slots report
- [ ] Grade-wise schedule summary
- [ ] Add charts/visualizations (Chart.js)
- [ ] Implement date range filtering
- [ ] Add export to PDF option

**Deliverables:**
- Reports page
- Visual charts
- Export functionality

**Success Criteria - Phase 5:**
- Dashboard shows accurate data
- Reports are useful and exportable
- Performance is optimized

---

## PHASE 6: Polish & Production Ready (Week 8)

### MODULE 6.1: UX Improvements
**Objectives:**
- Enhance user experience
- Add quality-of-life features

**Tasks:**
- [x] Add keyboard shortcuts (Alt+H/T/G/S/R/P/J for navigation, ? for help dialog)
- [ ] Implement undo/redo for schedule changes
- [ ] Add drag-and-drop for schedule entries
- [ ] Implement copy/paste schedule entries
- [ ] Add bulk operations UI
- [x] Improve loading states (enhanced skeletons with ARIA labels)
- [ ] Add success animations
- [ ] Implement auto-save

**Deliverables:**
- Enhanced UX features
- Keyboard navigation
- Smooth animations

### MODULE 6.2: Accessibility & i18n
**Objectives:**
- Ensure accessibility compliance
- Support Arabic language fully

**Tasks:**
- [x] Add ARIA labels (role="status", aria-label on loading states)
- [x] Ensure keyboard navigation (useKeyboardShortcuts hook)
- [ ] Test with screen readers
- [ ] Verify color contrast
- [x] Add focus indicators (focus-visible-ring CSS class)
- [x] Add skip link for keyboard users (SkipLink component)
- [x] Add reduced motion support (@media prefers-reduced-motion)
- [x] Add high contrast mode support (@media prefers-contrast)
- [ ] Support number formatting (Arabic numerals option)
- [ ] Add date formatting (Hijri option)

**Deliverables:**
- WCAG 2.1 AA compliance
- Full Arabic support
- Accessible components

### MODULE 6.3: Performance Optimization
**Objectives:**
- Optimize for speed
- Reduce bundle size

**Tasks:**
- [x] Implement code splitting (Next.js App Router automatic)
- [x] Add lazy loading for routes (Next.js automatic)
- [x] Add print styles for schedule
- [ ] Optimize images
- [ ] Implement virtual scrolling for large lists
- [ ] Add service worker for offline support
- [ ] Configure CDN caching
- [ ] Run Lighthouse audits
- [ ] Fix performance issues

**Deliverables:**
- Performance score >90
- Optimized bundle
- Fast initial load

### MODULE 6.4: Testing & Quality
**Objectives:**
- Ensure reliability
- Prevent regressions

**Tasks:**
- [ ] Write unit tests for components
- [ ] Write integration tests for pages
- [ ] Test form validations
- [ ] Test API error handling
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Set up E2E tests (Playwright)
- [ ] Configure CI/CD

**Deliverables:**
- Test suite
- CI/CD pipeline
- Quality assurance passed

**Success Criteria - Phase 6:**
- All features working smoothly
- Performance score >90
- No critical bugs
- Accessible and localized

---

## Dependencies

| Dependency | Required By | Risk Level |
|------------|-------------|------------|
| Backend API | All data features | High |
| Shared components | All pages | Medium |
| API services | All pages | High |
| State management | Data-dependent features | Medium |
| Teachers/Grades/Sections | Schedule page | High |

---

## Risk Management

### High Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend API not ready | Features blocked | Mock API, parallel development |
| Complex schedule grid | Poor performance | Virtual scrolling, optimization |
| Conflict UI confusion | User frustration | Clear messaging, UX testing |

### Medium Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Mobile responsiveness | Poor mobile UX | Mobile-first design, testing |
| Arabic RTL issues | Layout breaks | RTL testing, Tailwind RTL plugin |
| State management complexity | Bugs, maintenance | Simple patterns, documentation |

### Low Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser compatibility | Some users affected | Modern browsers only, polyfills |
| Third-party library issues | Feature delays | Vetted libraries, alternatives |

---

## Success Criteria Summary

| Phase | Key Metrics |
|-------|-------------|
| Phase 1 | RTL layout working, components ready |
| Phase 2 | API integration complete, data flows correctly |
| Phase 3 | All entity pages functional, CRUD working |
| Phase 4 | Schedule fully functional, conflicts prevented |
| Phase 5 | Dashboard accurate, reports useful |
| Phase 6 | Performance >90, tests pass, production ready |

---

## Progress Summary

### Completed Phases:
- **Phase 1:** ✅ Project Foundation & UI Framework - 100% Complete
- **Phase 2:** ✅ Data Management & API Integration - 100% Complete
- **Phase 3:** ✅ Entity Management Pages - 95% Complete (optional features remaining)
- **Phase 4:** ✅ Schedule Management - 85% Complete (core features done)
- **Phase 5:** ✅ Dashboard & Analytics - 80% Complete (dashboard done, reports pending)
- **Phase 6:** ✅ Polish & Production Ready - 60% Complete (UX and accessibility done)

### Current Status:
Phase 6 UX and accessibility improvements complete:
- Keyboard shortcuts (Alt+H/T/G/S/R/P/J for navigation, ? for help dialog)
- Skip link for keyboard users
- Enhanced loading skeletons with ARIA labels
- Focus indicators (focus-visible-ring class)
- Reduced motion support (@media prefers-reduced-motion)
- High contrast mode support (@media prefers-contrast)
- Print styles for schedule

## Next Steps

1. **Immediate:** Write unit tests for components (Vitest)
2. **Short-term:** Set up E2E tests (Playwright)
3. **Medium-term:** Configure CI/CD pipeline
4. **Long-term:** Performance audits and optimization

---

## Tech Stack Summary

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x
- **UI Components:** shadcn/ui
- **State Management:** TanStack Query (React Query) for server state
- **Forms:** React Hook Form + Zod
- **Charts:** Chart.js / Recharts
- **Testing:** Vitest + Playwright
- **Icons:** Lucide React

---

## File Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── page.tsx        # Home/Dashboard
│   │   │   ├── teachers/
│   │   │   ├── grades/
│   │   │   ├── sections/
│   │   │   ├── rooms/
│   │   │   ├── periods/
│   │   │   └── schedule/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── layout/             # Layout components
│   │   ├── teachers/           # Teacher-specific components
│   │   ├── schedule/           # Schedule-specific components
│   │   └── shared/             # Shared components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities
│   │   ├── api.ts              # API client
│   │   ├── utils.ts            # Helper functions
│   │   └── validations.ts      # Zod schemas
│   ├── stores/                 # Zustand stores
│   ├── types/                  # TypeScript types
│   └── constants/              # Constants, translations
├── public/
├── tests/
└── package.json
```
