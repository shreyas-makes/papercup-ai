# Papercup Implementation Checklist

This checklist covers all aspects of implementing the Papercup browser-based international calling platform, following our frontend-first development approach.

## Project Setup

### Initial Configuration
- [x] Initialize Rails 8 application
- [x] Configure PostgreSQL database
- [x] Setup Tailwind CSS
- [x] Configure Stimulus.js
- [x] Setup Turbo
- [x] Add Work Sans font
- [x] Create basic layout structure
- [x] Configure environment variables
- [x] Setup Git repository

### Dependency Installation
- [ ] Install core Rails gems
  - [ ] webrtc-rails
  - [ ] twilio-ruby
  - [ ] stripe
  - [ ] devise
  - [ ] omniauth-google-oauth2
  - [ ] sidekiq
  - [ ] redis
- [ ] Install frontend dependencies
  - [ ] jsbundling-rails
  - [x] stimulus-rails
  - [x] turbo-rails
  - [x] tailwindcss-rails
- [ ] Install API and data handling gems
  - [ ] jsonapi-serializer
  - [ ] phonelib
  - [ ] money-rails
  - [ ] chartkick
  - [ ] groupdate

## Frontend Implementation

### Dialer Interface
- [x] Create country selector component
  - [x] Implement searchable dropdown
  - [x] Add country flags
  - [x] Connect to phone input
- [x] Implement phone number input field
  - [x] Add formatting as user types
  - [x] Add clear button
  - [x] Validate number format
- [x] Build keypad component
  - [x] Create 3x4 grid layout
  - [x] Style circular buttons
  - [x] Implement click handlers
  - [x] Add keyboard support
- [x] Create call button
  - [x] Style green circular button
  - [x] Add hover/active states
  - [x] Implement click handler

### Top Navigation
- [x] Implement minimal top bar
  - [x] Add credit balance display
  - [x] Create user profile dropdown
  - [ ] Add "Add Credits" button
- [x] Create profile dropdown menu
  - [ ] Display user email
  - [x] Add "View Call History" option
  - [x] Add "Add Credits" option
  - [x] Include sign out button

### Call History
- [x] Create call history container
  - [x] Add "Recent Calls" header
  - [x] Implement scrollable list
  - [x] Style individual call entries
- [x] Build call entry component
  - [x] Show phone number
  - [x] Display date/time
  - [x] Show call duration
  - [x] Add country flag if available
- [x] Implement empty state
  - [x] Create "No calls yet" message
  - [x] Add appropriate styling

### Active Call Interface
- [x] Build call screen overlay
  - [x] Create fixed position container
  - [x] Add fade-in animation
  - [x] Style according to specifications
- [x] Implement call information display
  - [x] Show dialed number
  - [x] Create duration timer
  - [x] Display current credit balance
  - [x] Add call status indicator
- [x] Create end call button
  - [x] Style red circular button
  - [x] Add hover state
  - [x] Implement click handler

### Credits Interface
- [x] Implement credit purchase screen
  - [x] Create two-panel layout
  - [x] Design credit package options
  - [ ] Add "How it works" section
- [x] Build credit package selection
  - [x] Create three-tier system UI
  - [x] Style selected state
  - [x] Show price/minute breakdown
- [ ] Implement payment modal
  - [ ] Create Stripe Elements integration
  - [ ] Add progress indicator
  - [ ] Style confirmation state

### Notifications & Errors
- [x] Implement low balance warning
  - [x] Create persistent banner
  - [x] Style with yellow background
  - [x] Add dismiss button
- [x] Build error notifications
  - [x] Create toast component
  - [x] Add different styles by severity
  - [x] Implement auto-dismiss
- [x] Add loading states
  - [x] Create skeleton loaders
  - [x] Implement spinner animations
  - [x] Add disabled states for buttons

## Backend Implementation

### Database Models
- [ ] Create User model (Devise)
  - [ ] Add email, credits, timezone fields
  - [ ] Configure Devise modules
  - [ ] Setup Money-Rails integration
- [ ] Implement Call model
  - [ ] Add required fields
  - [ ] Create associations
  - [ ] Add validations
- [ ] Create CreditTransaction model
  - [ ] Add transaction fields
  - [ ] Link to users
  - [ ] Add validations
- [ ] Implement CallRate model
  - [ ] Add country/prefix fields
  - [ ] Create lookup methods
  - [ ] Setup database indexes

### Authentication
- [ ] Configure Devise
  - [ ] Setup views
  - [ ] Customize controllers
  - [ ] Add validations
- [ ] Implement Google OAuth
  - [ ] Add OmniAuth configuration
  - [ ] Create callback controller
  - [ ] Handle user creation/linking
- [ ] Setup JWT authentication
  - [ ] Create token generation
  - [ ] Implement validation
  - [ ] Add secure storage

### API Endpoints
- [ ] Create Calls controller
  - [ ] Implement create endpoint
  - [ ] Add update functionality
  - [ ] Build history endpoint
- [ ] Build Credits controller
  - [ ] Create purchase endpoint
  - [ ] Add balance check
  - [ ] Implement history endpoint
- [ ] Implement WebRTC token endpoint
  - [ ] Create secure token generation
  - [ ] Add ICE server configuration
  - [ ] Implement validation
- [ ] Add Countries/Rates API
  - [ ] Create country list endpoint
  - [ ] Implement rate lookup
  - [ ] Add validation

### Background Jobs
- [ ] Setup Sidekiq
  - [ ] Configure Redis
  - [ ] Add monitoring
  - [ ] Create job queues
- [ ] Implement call processing jobs
  - [ ] Create InitiateCallJob
  - [ ] Add UpdateCallStatusJob
  - [ ] Build CallBillingJob
  - [ ] Implement CallHangupJob
- [ ] Create payment processing jobs
  - [ ] Add StripeWebhookJob
  - [ ] Create CreditTransactionJob
- [ ] Add utility jobs
  - [ ] Implement RateImportJob
  - [ ] Create FraudDetectionJob

## Admin Panel Implementation

### Core Admin Setup
- [ ] Configure Speedrail Admin Panel
  - [ ] Run admin panel setup commands
  - [ ] Configure admin routes
  - [ ] Set up admin authentication
  - [ ] Customize admin layout with Papercup branding
- [ ] Create admin user roles
  - [ ] Super admin for full access
  - [ ] Call operations admin for monitoring calls
  - [ ] Finance admin for payment management
  - [ ] Support admin for customer issues

### Resource Management Pages
- [ ] Create Users admin page
  - [ ] Configure table columns (email, credits, call count)
  - [ ] Add filters for user status and balance
  - [ ] Implement custom actions (add credits, suspend user)
  - [ ] Add user details dashboard with call history
- [ ] Build Calls admin page
  - [ ] Set up table with call details
  - [ ] Add filters for date ranges, call status
  - [ ] Create custom actions (refund call)
  - [ ] Implement call quality metrics view
- [ ] Implement Call Rates admin
  - [ ] Create table-backed page for rates
  - [ ] Add bulk import/export functionality
  - [ ] Implement rate editor
  - [ ] Add validation for overlapping prefixes
- [ ] Create Credit Transactions admin
  - [ ] Set up transaction table
  - [ ] Add filters for transaction types
  - [ ] Create transaction details view
  - [ ] Implement manual credit adjustments

### Custom Admin Functionality
- [ ] Build system dashboard
  - [ ] Create custom dashboard page
  - [ ] Add key metrics overview (daily calls, revenue)
  - [ ] Implement real-time charts
  - [ ] Add system health indicators
- [ ] Implement operational tools
  - [ ] Create rate import tool
  - [ ] Add call testing interface
  - [ ] Build WebRTC diagnostics
  - [ ] Implement server status monitor
- [ ] Add reporting features
  - [ ] Create daily/weekly/monthly reports
  - [ ] Implement export functionality
  - [ ] Add scheduled report generation
  - [ ] Build custom report builder

### Admin API Extensions
- [ ] Create admin-only API endpoints
  - [ ] Admin authentication with scoped tokens
  - [ ] User management endpoints
  - [ ] System configuration API
  - [ ] Reporting data endpoints
- [ ] Implement admin notifications
  - [ ] System alerts for abnormal patterns
  - [ ] Low balance threshold notifications
  - [ ] Error rate monitoring
  - [ ] Server health alerts

## A/B Testing Implementation

### Testing Framework Setup
- [ ] Configure Speedrail A/B testing
  - [ ] Set up A/B testing database tables
  - [ ] Configure test segment allocation
  - [ ] Implement visitor tracking
  - [ ] Create test management interface

### Test Implementation
- [ ] Create pricing display tests
  - [ ] Design multiple pricing presentations
  - [ ] Implement variant rendering
  - [ ] Set up conversion tracking
  - [ ] Configure results analysis
- [ ] Build onboarding flow tests
  - [ ] Create alternative onboarding sequences
  - [ ] Set up step tracking
  - [ ] Implement completion analytics
  - [ ] Design dashboard for results
- [ ] Implement UI element tests
  - [ ] Test different call button designs
  - [ ] Create variant keypad layouts
  - [ ] Test alternative color schemes
  - [ ] Measure engagement metrics

### Analytics Integration
- [ ] Connect test results to analytics
  - [ ] Track test cohorts long-term
  - [ ] Measure revenue impact
  - [ ] Analyze user retention differences
  - [ ] Create segment performance reports
- [ ] Implement automatic test optimization
  - [ ] Set up multi-armed bandit algorithms
  - [ ] Create automatic variant allocation
  - [ ] Implement early stopping rules
  - [ ] Build continuous improvement workflow

## WebRTC Implementation

### Server Configuration
- [ ] Setup STUN servers
  - [ ] Configure public STUN servers
  - [ ] Add fallback servers
  - [ ] Add monitoring
- [ ] Implement WebRTC token generation
  - [ ] Create secure credentials
  - [ ] Add expiration
  - [ ] Implement validation
- [ ] Configure SIP gateway
  - [ ] Setup Twilio integration
  - [ ] Implement call routing
  - [ ] Add failure handling

### Browser Integration
- [ ] Implement browser WebRTC
  - [ ] Create RTCPeerConnection setup
  - [ ] Add ICE candidate handling
  - [ ] Implement media stream control
- [ ] Add call quality monitoring
  - [ ] Collect statistics
  - [ ] Send reports to server
  - [ ] Implement fallback scenarios
- [ ] Create browser permissions handling
  - [ ] Request microphone access
  - [ ] Add helpful error messages
  - [ ] Implement retry logic

### Call Processing
- [ ] Implement call service
  - [ ] Create call initiation
  - [ ] Add status tracking
  - [ ] Implement termination
- [ ] Build call billing system
  - [ ] Add rate calculation
  - [ ] Create credit deduction
  - [ ] Implement warnings
- [ ] Add call events tracking
  - [ ] Create detailed event logging
  - [ ] Store quality metrics
  - [ ] Implement analysis

## Payment Integration

### Stripe Setup
- [ ] Configure Stripe API
  - [ ] Add API keys
  - [ ] Setup webhook endpoint
  - [ ] Configure products/prices
- [ ] Implement Checkout flow
  - [ ] Create session generation
  - [ ] Add success/cancel handling
  - [ ] Implement webhook processing
- [ ] Build credit packages
  - [ ] Create three-tier system
  - [ ] Add database models
  - [ ] Implement selection UI

### Transaction Management
- [ ] Create transaction service
  - [ ] Implement credit addition
  - [ ] Add credit deduction
  - [ ] Create history tracking
- [ ] Build reporting functionality
  - [ ] Add transaction listing
  - [ ] Create filters/sorting
  - [ ] Implement export

## Testing

### Unit Tests
- [ ] Write model tests
  - [ ] Test User model
  - [ ] Test Call model
  - [ ] Test CreditTransaction model
  - [ ] Test CallRate model
- [ ] Create service tests
  - [ ] Test CallService
  - [ ] Test StripeCheckoutService
  - [ ] Test CreditTransactionService
- [ ] Implement controller tests
  - [ ] Test Calls controller
  - [ ] Test Credits controller
  - [ ] Test WebRTC controller

### Integration Tests
- [ ] Create authentication flow tests
  - [ ] Test Google OAuth
  - [ ] Test session management
  - [ ] Test permissions
- [ ] Implement call flow tests
  - [ ] Test call initiation
  - [ ] Test call progress
  - [ ] Test call completion
- [ ] Build payment flow tests
  - [ ] Test credit purchase
  - [ ] Test webhook processing
  - [ ] Test balance updates

### Frontend Tests
- [ ] Write Stimulus controller tests
  - [ ] Test dialer controller
  - [x] Test call controller
  - [ ] Test payment controller
- [ ] Implement UI component tests
  - [ ] Test keypad
  - [x] Test call history
  - [x] Test active call screen
- [ ] Create system tests
  - [ ] Test complete user flows
  - [ ] Test responsive design
  - [ ] Test error scenarios

## Deployment

### Hetzner Configuration
- [ ] Setup Hetzner Cloud servers
  - [ ] Provision app servers
  - [ ] Configure database server
  - [ ] Setup WebRTC media servers
- [ ] Configure networking
  - [ ] Setup private networks
  - [ ] Configure firewalls
  - [ ] Optimize routing

### Hatchbox Setup
- [ ] Create Hatchbox app
  - [ ] Connect GitHub repository
  - [ ] Configure Ruby/Rails versions
  - [ ] Setup environment variables
- [ ] Configure deployment
  - [ ] Setup database migrations
  - [ ] Configure Sidekiq
  - [ ] Add SSL certificates

### Monitoring & Maintenance
- [ ] Implement monitoring
  - [ ] Setup server monitoring
  - [ ] Add application metrics
  - [ ] Configure alerts
- [ ] Create backup strategy
  - [ ] Configure database backups
  - [ ] Setup log archiving
  - [ ] Document recovery procedures

## Post-Launch

### Analytics & Reporting
- [ ] Implement basic analytics
  - [ ] Track call volumes
  - [ ] Monitor revenue
  - [ ] Analyze user behavior
- [ ] Create admin dashboard
  - [ ] Add real-time stats
  - [ ] Implement reporting
  - [ ] Create filtering tools

### Documentation
- [ ] Create technical documentation
  - [ ] Document architecture
  - [ ] Add API documentation
  - [ ] Create developer guide
- [ ] Write operational procedures
  - [ ] Add monitoring guide
  - [ ] Create incident response
  - [ ] Document maintenance tasks

### Future Enhancements
- [ ] Plan additional features
  - [ ] Call recording functionality
  - [ ] SMS/messaging support
  - [ ] Virtual number allocation
  - [ ] Advanced analytics 