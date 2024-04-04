var heatmap;
var markers =[]
const stationsIds = {}

// changed this to async because it wouldn't work otherwise lol
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.349805, lng: -6.26031},
        zoom: 13,
        mapTypeControl : false // Changed this to remove satellite toggle
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    let autocompleteOptions = {
        componentRestrictions: { country: 'ie' }, // Restrict to Ireland
        types: ['geocode'], // This restricts search to geographical location types.
    };
    let input = document.getElementById('searchInput');
    let searchBox = new google.maps.places.SearchBox(input);

    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
          return;
        }
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
          if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
          }
          if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);

        var closestMarker = findClosestMarker(places[0].geometry.location); 
        if (closestMarker) {
          // Do something with the closestMarker, like display directions
          calculateAndDisplayRoute(closestMarker)
        }

        
      });

      function calculateAndDisplayRoute(directionsService, directionsRenderer, travelMode, origin, destination) {
        directionsService.route({
            origin: origin,
            destination: destination,
            travelMode: travelMode
        }, function(response, status) {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
                // Display distance and duration
                const route = response.routes[0].legs[0];
                alert(`Distance: ${route.distance.text}, Duration: ${route.duration.text}`);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }
    
    
   
    
    // two search boxes with IDs 'startInput' and 'endInput', ie start location end location
    let startInput = document.getElementById('startInput');
    let endInput = document.getElementById('endInput');
    // Replace SearchBox with Autocomplete and include the options for restriction
    let startAutocomplete = new google.maps.places.Autocomplete(startInput, autocompleteOptions);
    let endAutocomplete = new google.maps.places.Autocomplete(endInput, autocompleteOptions);
    var countyDublinBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(53.2987, -6.3871), // Southwest coordinates
        new google.maps.LatLng(53.4116, -6.1298)  // Northeast coordinates
    );
    
    // Set bounds for Autocomplete
    startAutocomplete.setBounds(countyDublinBounds);
    endAutocomplete.setBounds(countyDublinBounds);
    startAutocomplete.addListener('place_changed', function() {
        var place = startAutocomplete.getPlace();
        if (place.geometry) {
            lastSelectedStartPlace = place; // Store the last selected place
        }
    });
    
    
    endAutocomplete.addListener('place_changed', function() {
        var place = endAutocomplete.getPlace();
        if (place.geometry) {
            lastSelectedEndPlace = place; // Store the last selected place
        }
    });
    
    let lastSelectedStartPlace = null;
    let lastSelectedEndPlace = null;
    document.getElementById('confirmStartLocation').addEventListener('click', function() {
        if (lastSelectedStartPlace && lastSelectedStartPlace.geometry) {
            var closestMarker = findClosestMarker(lastSelectedStartPlace.geometry.location);
            if (closestMarker) {
                selectDropdownOptionByMarker(document.getElementById('depart'), closestMarker);
    
                // Retrieve the selected travel mode from the radio buttons
                let selectedMode = document.querySelector('input[name="travelMode"]:checked').value;
    
                let origin = lastSelectedStartPlace.geometry.location;
                let destination = closestMarker.position;
                calculateAndDisplayRoute(directionsService, directionsRenderer, selectedMode, origin, destination);
            }
        } else {
            alert('Please select a start location first.');
        }
    });
    
    document.getElementById('confirmEndLocation').addEventListener('click', function() {
        if (lastSelectedEndPlace && lastSelectedEndPlace.geometry) {
            var closestMarker = findClosestMarker(lastSelectedEndPlace.geometry.location);
            if (closestMarker) {
                selectDropdownOptionByMarker(document.getElementById('arrive'), closestMarker);
    
                // Retrieve the selected travel mode from the radio buttons or dropdown
                // This assumes  the same travel mode selection for both start and end locations
                
                let selectedMode = document.querySelector('input[name="endTravelMode"]:checked') ? document.querySelector('input[name="endTravelMode"]:checked').value : document.querySelector('input[name="travelMode"]:checked').value;
    
                let origin = lastSelectedEndPlace.geometry.location; // This now represents the end location's selected place
                let destination = closestMarker.position; // The position of the closest marker to the end location
                
                // Assuming you want to show the route from the end location to the closest station
                // If you're looking to display the complete route from start to finish, including this segment, adjust accordingly
                calculateAndDisplayRoute(directionsService, directionsRenderer, selectedMode, origin, destination);
            }
        } else {
            alert('Please select an end location first.');
        }
    });
    
    
    
    // Function to handle the confirm button click
    document.getElementById('confirmButton').addEventListener('click', function() {
        var startPlace = startSearchBox.getPlaces();
        var endPlace = endSearchBox.getPlaces();
    
        if (!startPlace || startPlace.length == 0 || !endPlace || endPlace.length == 0) {
            alert('Please select both a start and an end location.');
            return;
        }
    
        let selectedMode = 'DRIVING'; 
        if (document.getElementById('modeWalk').checked) selectedMode = 'WALKING';
        if (document.getElementById('modeBike').checked) selectedMode = 'BICYCLING';
    
        calculateAndDisplayRoute(directionsService, directionsRenderer, selectedMode, startPlace[0].geometry.location, endPlace[0].geometry.location);
        if (status === 'OK') {
    const route = response.routes[0].legs[0];
    document.getElementById('journeyDistance').textContent = `Distance: ${route.distance.text}`;
    document.getElementById('journeyTime').textContent = `Time: ${route.duration.text}`;
} else {
    console.error('Directions request failed due to ' + status);
    // update the HTML to indicate the error or that no data could be fetched
    document.getElementById('journeyDistance').textContent = 'Distance: unavailable due to error';
    document.getElementById('journeyTime').textContent = 'Time: unavailable due to error';
}

    });

    // need to fetchRealTime before stations
    // so we can populate markers with the 
    // realtime info as we create them
    const realTime = await fetchRealTime()
    fetchStations(realTime); 
    // map.addListener('zoom_changed', toggleHeatmapAndMarkers);
}
function findClosestMarker(location) {
    var closestMarker = null;
    var closestDistance = Number.MAX_VALUE;

    markers.forEach(function(marker) {
      var distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(marker.position.lat(), marker.position.lng()), location);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestMarker = marker;
      }
    });
    return closestMarker;
  }

  function selectDropdownOptionByMarker(dropdown, marker) {
    for (let i = 0; i < dropdown.options.length; i++) {
        if (dropdown.options[i].text === marker.title) { // Assuming marker.title is the station name
            dropdown.selectedIndex = i;
            break;
        }
    }
}


document.getElementById('confirmButton').addEventListener('click', function() {
    //stored the nearest stations' positions from above
    
    if (!startStationPosition || !endStationPosition) {
        alert('Please select both a start and an end location.');
        return;
    }

    let selectedMode = document.querySelector('input[name="travelMode"]:checked').value; // Assuming you have radio buttons for selecting mode
    calculateAndDisplayRoute(directionsService, directionsRenderer, selectedMode, startStationPosition, endStationPosition);
});
var stationsData = [] // Define stationsData outside of the function so it can be accessed globally
function fetchStations(realTime) {
    fetch('/stations')
    .then(response => response.json())
    .then(data => {
        return data['data']
    })

    if (realTime) {
        stations.map(station => station['available_bikes'] = realTime[station.number])
    }

    else {
        stations.map(station => station['available_bikes'] = 6)
    }
    
    stations.forEach(station => {
        
        let markerColor;
        if (station.available_bikes / station.bike_stands < 0.1) {
            markerColor = 'red'; 
        } else if (0.1 < station.available_bikes / station.bike_stands < 0.33) { 
            markerColor = 'yellow';
        } else {
            markerColor = 'green'; 
        }

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(station.position_lat, station.position_lng),
                map: null, 
                title: station.name, // to autoset dropdowns
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7, 
                    fillColor: markerColor,
                    fillOpacity: 0.8,
                    strokeWeight: 1
                }
            });

        var infoWindow = new google.maps.InfoWindow({
            content: `<div style='color: black'><strong>${station.name}</strong><p>Station Number: ${station.number}</p></div>`
        });

        marker.addListener('mouseover', function() {
            infoWindow.open(map, marker);
        });

        marker.addListener('mouseout', function() {
            infoWindow.close();
        });

        markers.push(marker);
    });

    new MarkerClusterer(map,
                    markers,
                    {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

    return stations
}

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navbar = document.getElementById('navbar');

    // This function toggles the navbar's visibility
    function toggleNavbar() {
        const isNavbarHidden = navbar.style.transform === 'translateX(-100%)';
        navbar.style.transform = isNavbarHidden ? 'translateX(0)' : 'translateX(-100%)';
    }

    // Event listener for the bike icon
    menuToggle.addEventListener('click', function() {
        toggleNavbar();
    });

    // Prevent the navbar from hiding when it's clicked
    navbar.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    populateDropdownOptions()
    fetchRealTimeWeather()
});

async function populateDropdownOptions() {
    // fetch dublin.json
    const options = await fetchDropdownOptions()
    

    // parse json
    const stations = options['data']
    const numbers = stations.map(station => station['number'])
    const names = stations.map(station => station['name'])

    // Select dropdowns by their IDs
    const depart = document.getElementById('depart');
    
    const arrive = document.getElementById('arrive');
 

    // Populate options for each dropdown
    names.forEach(name => {
        depart.innerHTML += `<option value="${name.toLowerCase().replace(/\s+/g, '')}">${name}</option>`;
        arrive.innerHTML += `<option value="${name.toLowerCase().replace(/\s+/g, '')}">${name}</option>`;
    });


    for (let i = 0; i < numbers.length; i++) {
        stationsIds[names[i].toLowerCase().replace(/\s+/g, '')] = numbers[i]
    }
}
function sortedWeekdays() { // Allows for the days to be sorted in the dropdown from Today to Next Week (inclusive)
    let today = new Date();
    let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let todayIndex = today.getDay(); // Get today's index (0-6, where 0 is Sunday and 6 is Saturday)
    let sortedWeekdays = ["Today"]; // Start with "Today" as the first element

    // Add the rest of the week days starting from tomorrow
    for (let i = 1; i < 7; i++) {
        let index = (todayIndex + i) % 7; // Calculate index to wrap around the weekdays array
        sortedWeekdays.push(weekdays[index]);
    }

    return sortedWeekdays;
}

async function fetchDropdownOptions() {
    const options = await fetch('static/stations.json')
        .then((response) => response.json())

    return options
}

// Function to get the coordinates of a station by its name
function getStationCoordinates(stationName, stationsData) {
    const station = stationsData.find(station => station.name === stationName); // Find station data in json by name: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    if (station) {
        return `${station.position_lat},${station.position_lng}`; // Return the coordinates as a string in the format required by Google Maps API
    }
    else
        return null; // Return null if station not found
}
function getText(elementID, value) { // Function to get the text of an option by its value rather than its value. https://www.geeksforgeeks.org/how-to-get-the-text-of-option-tag-by-value-using-javascript/
    Object.values(document.getElementById(
        elementID).options).
        forEach(function (option){
        if (option.value === value) {
            text = option.text;
        }
    });
    return text; // Return the text of the option
}
// Function to create the directions URL and open it in a new tab, changed dropdowns to no longer populate with the time/day and predictions
function getDirections() {
    const originStationName = getText("depart", document.getElementById("depart").value);
    const originStationCoordinates = getStationCoordinates(originStationName, stationsData);
    const destinationStationName = getText("arrive", document.getElementById("arrive").value);
    const destinationStationCoordinates = getStationCoordinates(destinationStationName, stationsData);

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originStationCoordinates}&destination=${destinationStationCoordinates}&travelmode=bicycling`; // Create the directions URL with the origin and destination coordinates and the travel mode set to bicycling: https://developers.google.com/maps/documentation/urls/get-started#directions-action
    const directionsButton = document.getElementById('directionsButton');
    directionsButton.style.display = 'block'; // Display the directions button
    directionsButton.onclick = () => window.open(directionsUrl, '_blank'); // Open the directions URL in a new tab when the button is clicked https://stackoverflow.com/questions/6303964/javascript-open-a-given-url-in-a-new-tab-by-clicking-a-button
}

function submitForm() {
    // dayOptions in strange order because that's how the model
    // reads the booleans
    

    const depart = document.getElementById("depart").value;
  
    const arrive = document.getElementById("arrive").value;
   

    getDirections(); // Call the getDirections function to display the directions button

    // change selected day to 1 (True)
    

    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            depart: stationsIds[depart],
            departTime: departTime,
            departDay: Object.values(departOptions),
            arrive: stationsIds[arrive],
            arriveTime: arriveTime,
            arriveDay: Object.values(arriveOptions)
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").innerText = JSON.stringify(data);
    })
    .catch(error => console.error('Error:', error));

        fetch('/api/WeatherForecast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hour: departTime, day: departDay })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('weather-description').innerText = 'Predicted Weather: ' + data.condition;
            let iconImg = '<img src="https:' + data.condition_icon + '" alt="Weather Icon">';
            document.getElementById('weather-icon').innerHTML = iconImg;
            document.getElementById('weather-temperature').innerText = 'Temperature: ' + data.temp_c;
            document.getElementById('weather-humidity').innerText = 'Humidity: ' + data.humidity + '%';
            document.getElementById('weather-precipitation').innerText = 'Precipitation: ' + data.precip_mm + 'mm';
        })
        .catch(error => console.error('Error fetching weather:', error));
    }
    

async function fetchRealTime() {
    const request = await fetch('/realtime')
        .then((response) => response.json())
    return request
}

async function fetchRealTimeWeather() { 
    fetch('/api/CurrentWeather')
            .then(response => response.json())
            .then(data => {
        document.getElementById('weather-description').innerText = 'Current Weather: ' + data.condition;
        let iconImg = '<img src="https:' + data.condition_icon + '" alt="Weather Icon">';
        document.getElementById('weather-icon').innerHTML = iconImg;
        document.getElementById('weather-temperature').innerText = 'Temperature: ' + data.temp_c;
        document.getElementById('weather-humidity').innerText = 'Humidity: ' + data.humidity;
        document.getElementById('weather-precipitation').innerText = 'Precipitation: ' + data.precip_mm;
            })
            .catch(error => console.error('Error fetching weather:', error));
        }

        document.getElementById('resetButton').addEventListener('click', function() {
            // Reset text inputs
            document.getElementById('startInput').value = '';
            document.getElementById('endInput').value = '';
        
            // Reset dropdowns to their first option
            document.getElementById('depart').selectedIndex = 0;
            document.getElementById('arrive').selectedIndex = 0;
            document.getElementById('departTime').selectedIndex = 0;
            document.getElementById('arriveTime').selectedIndex = 0;
            document.getElementById('departDay').selectedIndex = 0;
            document.getElementById('arriveDay').selectedIndex = 0;
        
            // reset the travel mode radio buttons to default (first radio button)
            document.querySelector('input[name="travelMode"][value="DRIVING"]').checked = true;
        
            //  map or directions, y reset them as well
            if (directionsRenderer) {
                directionsRenderer.setDirections({routes: []});
            }
        
            
            document.getElementById('directionsButton').style.display = 'none';
            
            
        });
        
        