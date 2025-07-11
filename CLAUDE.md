# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Main Application Commands
- `npm run cto` - Start the CTO orchestrator agent (console interface)
- `npm run cto-dev` - Start CTO agent with debugging enabled
- `npm run cto-web` - Start web-based CTO agent interface
- `npm run cto-web-dev` - Start web CTO agent with debugging

### Running Individual Services
- `node gateways/bricks/bricksRegister.js` - Process Bricks account registrations
- `node gateways/rento/rentoRegister.js` - Process Rento account registrations
- `node identity/extractIdentities.js` - Extract passport identities using Mindee OCR
- `node utils/excelToCsv.js` - Convert Excel files to CSV format

### Testing
- `npm test` - Currently returns error (no tests configured)

## Architecture Overview

This is a multi-agent automation system for business account creation and management across various platforms. The system uses Puppeteer for browser automation and Supabase for data persistence.

### Core Components

1. **CTO Dashboard** (`cto-dashboard/`):
   - Strategic business intelligence agent powered by Claude
   - Conversation-based interface for orchestrating automation ecosystem
   - Web and console interfaces available
   - Analyzes business metrics and provides technical roadmaps
   - Note: CTO dashboard ne nous intéresse pas (not of interest to us)

2. **Gateway System** (`gateways/`):
   - Centralized registration system for multiple platforms
   - `gatewayRegister.js` - Main orchestration logic
   - `workflows/` - Platform-specific Puppeteer workflows
   - `services/` - Shared business logic (email, navigation, passport data)

3. **Identity Management** (`identity/`):
   - Passport and identity document processing
   - OCR extraction using Mindee API
   - Identity validation and data preparation

4. **Utilities** (`utils/`):
   - Browser automation utilities (Puppeteer sessions, key input)
   - Email OTP retrieval and processing
   - Supabase database operations
   - Proxy and session management

### Key Workflows

**Account Registration Flow:**
1. Accounts are stored in Supabase with service type (`bricks`, `rento`, etc.)
2. `gatewayRegister.js` processes accounts by service using specific workflows
3. Workflows handle platform-specific Puppeteer automation
4. Results are stored back to Supabase with status updates

**Identity Processing:**
1. Passport images are processed through Mindee OCR
2. Identity data is extracted and validated
3. Prepared data is used for account creation

### Database Schema (Supabase)
- `accounts` table with fields: order_id, source, status, email, comment, service
- Account filtering by service type for targeted processing

### Environment Variables Required
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
SUPABASE_URL=https://...
SUPABASE_KEY=...
MINDEE_API_KEY=...
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### Browser Configuration
- Uses proxied Chrome instances with anti-detection measures
- Session management for persistent browser states
- Proxy configuration for geographic routing (France-based)

## Development Notes

- The system processes 10k+ prospects monthly across multiple advertising channels
- Built for DigitalOcean deployment with containerized Chrome
- Uses ES6 modules (`"type": "module"` in package.json)
- No formal testing framework configured
- Screenshots are automatically captured for debugging and verification
- The CTO agent provides strategic guidance for scaling to 100k+ accounts/day

## File Structure Patterns

- `/gateways/[service]/` - Service-specific entry points
- `/workflows/[service]Workflow.js` - Platform automation logic
- `/utils/[category]/` - Shared utilities by function
- `/assets/` - Static files (passport images, IDs)
- `/screenshots/` - Automated capture storage