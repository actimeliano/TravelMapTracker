let countryLayers = new Map();
const colors = ['#ff7800', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
let colorIndex = 0;

function highlightCountry(map, countryName) {
    // If the country is already highlighted, don't add it again
    if (countryLayers.has(countryName)) {
        return;
    }

    fetch('/static/data/countries.geojson')
        .then(response => response.json())
        .then(data => {
            console.log('GeoJSON data:', data);
            if (!data || !data.features) {
                console.error('Invalid GeoJSON data structure');
                return;
            }
            
            try {
                const newLayer = L.geoJSON(data, {
                    style: function(feature) {
                        if (!feature || !feature.properties || !feature.properties.ADMIN) {
                            console.error('Invalid feature structure:', feature);
                            return {};
                        }
                        const featureName = feature.properties.ADMIN.toLowerCase();
                        const searchName = countryName.toLowerCase();
                        const isMatch = featureName === searchName || 
                                        featureName.includes(searchName) || 
                                        searchName.includes(featureName);
                        return {
                            fillColor: isMatch ? colors[colorIndex % colors.length] : 'transparent',
                            weight: 2,
                            opacity: 1,
                            color: 'white',
                            fillOpacity: 0.7
                        };
                    },
                    filter: function(feature) {
                        if (!feature || !feature.properties || !feature.properties.ADMIN) {
                            console.error('Invalid feature structure:', feature);
                            return false;
                        }
                        const featureName = feature.properties.ADMIN.toLowerCase();
                        const searchName = countryName.toLowerCase();
                        return featureName === searchName || 
                               featureName.includes(searchName) || 
                               searchName.includes(featureName);
                    }
                }).addTo(map);
                
                if (newLayer.getBounds().isValid()) {
                    map.fitBounds(newLayer.getBounds());
                } else {
                    console.error('Unable to find bounds for:', countryName);
                }

                // Store the new layer and increment color index
                countryLayers.set(countryName, newLayer);
                colorIndex++;
            } catch (error) {
                console.error('Error processing GeoJSON:', error);
            }
        })
        .catch(error => {
            console.error('Error loading or parsing GeoJSON:', error);
        });
}

function removeHighlight(map, countryName) {
    const layer = countryLayers.get(countryName);
    if (layer) {
        map.removeLayer(layer);
        countryLayers.delete(countryName);
    }
}

export { highlightCountry, removeHighlight };