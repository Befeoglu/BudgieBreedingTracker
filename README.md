# BudgieBreedingTracker

Professional budgerigar breeding tracking system

## Features

- User authentication and profile management
- Bird management with detailed information
- Chick tracking and weight monitoring
- Pedigree visualization 
- Statistics and analytics
- Todo management
- Calendar events
- Multi-language support (English and Turkish)
- Dark/light theme

## Code Cleanup History

### Incubation Tracking Module Removal (July 2024)

The following components and features were removed to simplify the application:

- Removed entire incubation tracking module
- Dropped `clutches` and `eggs` database tables
- Removed related notification types and functions
- Refactored dashboard components to show bird statistics instead
- Updated backup service to no longer save incubation-related data
- Cleaned up translation files
- Improved performance with React hooks (useCallback, useMemo)
- Enhanced type safety with better interface definitions

## Development

```
npm install
npm run dev
```

## Build

```
npm run build
```

## License

Copyright © 2024 BudgieBreedingTracker