# Travel Map Tracker

Travel Map Tracker is a web application that allows users to create a personalized map of their travels. Users can add countries, regions, and cities they've visited, view statistics about their travels, and visualize their journey on an interactive map.

## Features

- Interactive world map
- Add visited locations (countries, regions, cities)
- Highlight visited countries on the map
- View statistics of visited locations
- Remove visited locations
- Mobile-responsive design

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask)
- Database: PostgreSQL
- Mapping: Leaflet.js
- Geocoding: OpenStreetMap Nominatim API

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/travel-map-tracker.git
   cd travel-map-tracker
   ```

2. Set up a virtual environment and install dependencies:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

3. Set up environment variables for your PostgreSQL database:
   ```
   export PGHOST=your_host
   export PGDATABASE=your_database
   export PGUSER=your_user
   export PGPASSWORD=your_password
   export PGPORT=your_port
   ```

4. Initialize the database:
   ```
   python main.py
   ```

5. Run the application:
   ```
   flask run
   ```

6. Open a web browser and navigate to `http://localhost:5000`

## Future Ideas

1. User authentication: Allow multiple users to have their own travel maps.
2. Travel planning: Add functionality to plan future trips and mark destinations of interest.
3. Travel journal: Integrate a feature to add notes, photos, and memories to each visited location.
4. Travel statistics: Provide more detailed statistics, such as total distance traveled, continents visited, etc.
5. Social features: Allow users to share their maps and connect with other travelers.
6. Travel challenges: Implement gamification elements like achievements for visiting certain locations or reaching milestones.
7. Integration with travel APIs: Automatically suggest nearby attractions or provide information about visited places.
8. Custom map styles: Allow users to customize the appearance of their map.
9. Offline mode: Implement functionality to use the app without an internet connection.
10. Data visualization: Create charts and graphs to visualize travel patterns over time.
11. Export/Import: Allow users to export their travel data and import it into other applications.
12. Travel recommendations: Use machine learning to suggest new destinations based on the user's travel history.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.