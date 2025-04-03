# Event Locator App
An interactive platform that enables multiple users to explore and discover events tailored to their location and interests, leveraging Node.js, Express, PostgreSQL, and Redis for seamless performance.

## 🌟Features

### User Management
- Secure authentication with JWT-based user registration and login.
- User profiles with location preferences.
- Category-based event preferences for personalized recommendations.
- Multi-language support for enhanced accessibility.

### Event Management
- Full CRUD functionality for creating, viewing, updating, and deleting events.
- Geospatial search to find events based on proximity.
- Category-based filtering to refine event discovery.
- Event ratings and reviews to improve recommendations.
- Favorites system for saving and managing preferred events.

## 📑 API Documentation
### Authentication
- ```POST /api/auth/login```: Login and then get a JWT token
- ```POST /api/auth/register```: A new user registers into the app

### Users
- ```GET /api/users/profile```: Retrieves the profile details of the currently logged-in user.
- ```PUT /api/users/profile```: Updates the user's profile information.
- ```GET /api/users/preferences```: Retrieves the user's preferred event categories
- ```PUT /api/users/preferences```: Modifies the user's category preferences
- ```GET /api/users/favourites```: Retrieves a list of events the user has marked as favourites

### Events
- ```POST /api/events```: Adds a new event to the system.
- ```GET /api/events```: Retrieves a list of all available events
- ```GET /api/events/:id```: Fetches detailed information about a specific event.
- ```DELETE /api/events/:id```: Removes an event from the system
- ```PUT /api/events/:id```: Updates the details of an existing event
- ```GET /api/events/category/:id```: Retrieves events that belong to a particular category
- ```GET /api/events/search/location```: Finds events based on a specified location.
- ```POST /api/events/:id/favourite```: Marks an event as a favourite.
- ```POST /api/events/:id/reviews```: Submits a review for a specific event.

## ‼️ Challenges & Solutions
- **Real Time Updates:** Implementing Real time features using Websocket was a bit challenging, however, I was able to get through.
- **Multi Language Implementation:** I had some challenges trying to implement multi languages but then I realised I had duplicated files
- **Google Maps API:** Another feature I had troubles with was adding the Google Maps API integration within the app
