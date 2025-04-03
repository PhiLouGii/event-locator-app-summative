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

### Location Services
- Find events based on proximity
- Geospatial search using PostGIS

## 🛠️ Technologies Used
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with POSTGIS
- **Authentication:** JWT, Passport.js, bcrypt
- **Internationalisation:** i18next
- **Queue System:** Redis Pub/Sub
- **Testing:** Jest
- **Real-Time:** Websocket

## 🔽 Installation
1. Clone the repository: 
```bash
git clone https://github.com/your_username/event-locator-app-summative.git
```
2. Install the dependencies:
```bash
cd event-locator-app-summative
npm install
```
3. Set up the database:
- Install PostgreSQL and PostGIS
- Set up the database with the provided schema
- Create a ```.env``` file and configure your environment variables (e.g., database credentials, Redis settings)
4. Start the application: 
```bash
npm start
```

## 📲 Usage
After setting up the application:
1. Register as a new user or log in with your credentials.
2. Set your location and preferences for event categories
3. Use the search feature to discover events near you
4. Create, update, or delete events if you are an admin
5. Enjoy multilingual support by selecting your preferred language.

## 🧪 Testing
Unit tests for core functionalities are located in the ```tests``` directory
To run tests:
```bash
npm test
```

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
- **Multi Language Implementation:** I faced some challenges while implementing multiple languages, but I eventually discovered that the issue was caused by duplicated files, which I then resolved.
- **Google Maps API:** Another challenge I faced was integrating the Google Maps API into the app.
- **Notification Feature:** I encountered some issues with displaying the notification feature, but I resolved it by opening the app in a different browser, which allowed the notification popups to appear as expected.
- **Testing:** Initially, setting up testing was challenging due to numerous dependencies. However, once all the necessary dependencies were installed, the process became more manageable.

## 🫱🏻‍🫲🏽 Contributing 
Feel free to fork this repository, make improvements, and submit pull requests. Please follow the coding standards and ensure that all new features are well-tested.

## 🎬 Video Presentation
A video presentation showcasing the project, explaining its features, and demonstrating the key functionalities is available: 

Author: P. L. Giibwa
