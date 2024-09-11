import { highlightCountry, removeHighlight } from './highlightCountry.js';

let map;
let visitedLocations = [];

function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add this line to enable click events on the map
    map.on('click', onMapClick);

    loadVisitedLocations();
}

function onMapClick(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    showLocationTypeDialog(lat, lon);
}

function showLocationTypeDialog(lat, lon) {
    const locationTypes = ['Country', 'Region', 'City'];
    
    const dialog = document.createElement('div');
    dialog.className = 'location-type-dialog';
    dialog.innerHTML = `
        <h3>Select location type:</h3>
        <ul>
            ${locationTypes.map(type => `<li data-type="${type.toLowerCase()}">${type}</li>`).join('')}
        </ul>
    `;
    
    dialog.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const selectedType = item.getAttribute('data-type');
            document.body.removeChild(dialog);
            reverseGeocode(lat, lon, selectedType);
        });
    });
    
    document.body.appendChild(dialog);
}

function reverseGeocode(lat, lon, selectedType) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            showLocationOptions(data, lat, lon);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to get location information. Please try again.');
        });
}

function showLocationOptions(data, lat, lon) {
    console.log('Reverse geocoding data:', data);
    const options = [
        { type: 'country', name: data.address.country },
        { type: 'region', name: data.address.state },
        { type: 'city', name: data.address.city || data.address.town || data.address.village }
    ].filter(option => option.name);

    const dialog = document.createElement('div');
    dialog.className = 'location-type-dialog';
    dialog.innerHTML = `
        <h3>Select location to add:</h3>
        <ul>
            ${options.map(option => `<li data-type="${option.type}" data-name="${option.name}">${option.name} (${option.type})</li>`).join('')}
        </ul>
        <label for="visit-date">Visit Date:</label>
        <input type="date" id="visit-date" name="visit-date" required>
    `;
    
    dialog.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const selectedType = item.getAttribute('data-type');
            const selectedName = item.getAttribute('data-name');
            const visitDate = dialog.querySelector('#visit-date').value;
            document.body.removeChild(dialog);
            addLocation(selectedName, lat, lon, selectedType, visitDate);
        });
    });
    
    document.body.appendChild(dialog);
}

function determineLocationType(data) {
    const addressType = data.address.city ? 'city' :
                        data.address.state ? 'region' :
                        data.address.country ? 'country' : 'unknown';
    return addressType;
}

function addLocation(name, lat, lon, type, visitDate) {
    console.log('Adding location:', { name, lat, lon, type, visitDate });
    // If visitDate is empty, use today's date
    if (!visitDate) {
        visitDate = new Date().toISOString().split('T')[0];
    }
    // Ensure type is singular and lowercase
    type = type.replace(/s$/, '').toLowerCase();
    fetch('/api/locations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, lat, lon, type, visitDate }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Location added:', data);
        visitedLocations.push(data);
        updateMap();
        updateLocationList();
        if (type === 'country') {
            highlightCountry(map, name);
        }
    })
    .catch(error => {
        console.error('Error adding location:', error);
        alert('Failed to add location. Please try again.');
    });
}

function loadVisitedLocations() {
    fetch('/api/locations')
        .then(response => response.json())
        .then(data => {
            visitedLocations = data.map(location => ({
                ...location,
                type: location.type.replace(/s$/, '') // Ensure type is singular
            }));
            updateMap();
            updateLocationList();
        });
}

function updateMap() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    visitedLocations.forEach(location => {
        let marker;
        if (location.type === 'country') {
            marker = createCountryMarker(location);
        } else if (location.type === 'region') {
            marker = createRegionMarker(location);
        } else if (location.type === 'city') {
            marker = createCityMarker(location);
        }

        if (marker) {
            marker.addTo(map).bindPopup(`${location.name} (${location.type})`);
        }

        if (location.type === 'country') {
            highlightCountry(map, location.name);
        }
    });
}

function createCountryMarker(location) {
    const flagEmoji = getFlagEmoji(location.name);
    const icon = L.divIcon({
        html: flagEmoji ? flagEmoji : '✓',
        className: 'country-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    return L.marker([location.lat, location.lon], { icon: icon });
}

function createRegionMarker(location) {
    const color = getColorByDate(location.visitDate);
    return L.circleMarker([location.lat, location.lon], {
        radius: 6,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    });
}

function createCityMarker(location) {
    const color = getColorByDate(location.visitDate);
    return L.circleMarker([location.lat, location.lon], {
        radius: 4,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    });
}

function getColorByDate(visitDate) {
    const now = new Date();
    const visit = new Date(visitDate);
    const daysSinceVisit = (now - visit) / (1000 * 60 * 60 * 24);

    if (daysSinceVisit < 30) return '#ff0000'; // Red for visits within the last month
    if (daysSinceVisit < 180) return '#ff9900'; // Orange for visits within the last 6 months
    if (daysSinceVisit < 365) return '#ffff00'; // Yellow for visits within the last year
    return '#00ff00'; // Green for visits older than a year
}

function getFlagEmoji(countryName) {
    const flagEmojis = {
        'United States': '🇺🇸',
        'Canada': '🇨🇦',
        'United Kingdom': '🇬🇧',
        'France': '🇫🇷',
        'Germany': '🇩🇪',
        'Italy': '🇮🇹',
        'Spain': '🇪🇸',
        'Japan': '🇯🇵',
        'Australia': '🇦🇺',
        // Add more countries and their flag emojis as needed
    };
    return flagEmojis[countryName] || null;
}

function updateLocationList() {
    const locationList = document.getElementById('locations');
    locationList.innerHTML = '';
    visitedLocations.forEach(location => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="location-info">
                <div class="location-name">${location.name}</div>
                <div class="location-type">${location.type}</div>
                <div class="location-date">Visited: ${new Date(location.visitDate).toLocaleDateString()}</div>
            </div>
            <button class="remove-btn" data-id="${location.id}"><i class="fas fa-trash-alt"></i></button>
        `;
        li.querySelector('.remove-btn').addEventListener('click', () => removeLocation(location.id));
        locationList.appendChild(li);
    });
    updateLocationStats();
}

function updateLocationStats() {
    const stats = {
        countries: new Set(),
        regions: new Set(),
        cities: new Set()
    };

    visitedLocations.forEach(location => {
        switch (location.type.toLowerCase()) {
            case 'country':
                stats.countries.add(location.name);
                break;
            case 'region':
                stats.regions.add(location.name);
                break;
            case 'city':
                stats.cities.add(location.name);
                break;
            default:
                console.warn(`Unknown location type: ${location.type}`);
        }
    });

    const statsContainer = document.getElementById('location-stats');
    statsContainer.innerHTML = `
        <div class="stat">
            <div class="stat-value">${stats.countries.size}</div>
            <div>Countries</div>
        </div>
        <div class="stat">
            <div class="stat-value">${stats.regions.size}</div>
            <div>Regions</div>
        </div>
        <div class="stat">
            <div class="stat-value">${stats.cities.size}</div>
            <div>Cities</div>
        </div>
    `;
}

function removeLocation(id) {
    fetch(`/api/locations/${id}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            const removedLocation = visitedLocations.find(location => location.id === id);
            visitedLocations = visitedLocations.filter(location => location.id !== id);
            if (removedLocation && removedLocation.type === 'country') {
                removeHighlight(map, removedLocation.name);
            }
            updateMap();
            updateLocationList();
        } else {
            console.error('Failed to remove location');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.addEventListener('DOMContentLoaded', initMap);
