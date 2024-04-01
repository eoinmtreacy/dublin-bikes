var map;
var heatmap;
var markers =[]
const stationsIds = {}

// changed this to async because it wouldn't work otherwise lol
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.349805, lng: -6.26031},
        zoom: 13
    });

    // need to fetchRealTime before stations
    // so we can populate markers with the 
    // realtime info as we create them
    const realTime = await fetchRealTime()
    fetchStations(realTime); 
    map.addListener('zoom_changed', toggleHeatmapAndMarkers);
}
var stationsData = [] // Define stationsData outside of the function so it can be accessed globally
function fetchStations(realTime) {
    fetch('/stations')
    .then(response => response.json())
    .then(data => {
        // the realTime[station.number] wrapping just means instead
        // of pulling the station number to populate the map
        // it checks the station number against the realtime
        // and returns the number of available bikes instead
        var heatmapData = data['data'].map(station => ({
            location: new google.maps.LatLng(station.position_lat, station.position_lng),
            weight: realTime[station.number] 
        }));

        if (heatmap) {
            heatmap.setData(heatmapData);
        } else {
            heatmap = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: map,
            });
        }

        markers.forEach(marker => marker.setMap(null));
        stationsData = data['data'] // Assign the data to the global variable

        data['data'].forEach(station => {
            
            let markerColor;
            if (realTime[station.number] === 0) {
                markerColor = 'red'; 
            } else if (realTime[station.number] > 0 && realTime[station.number] <= 5) { 
                markerColor = 'yellow';
            } else {
                markerColor = 'green'; 
            }

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(station.position_lat, station.position_lng),
                map: null, 
                title: `${station.name} - Bikes available: ${realTime[station.number]}`,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7, 
                    fillColor: markerColor,
                    fillOpacity: 0.8,
                    strokeWeight: 1
                }
            });

            var infoWindow = new google.maps.InfoWindow({
                content: `<div><strong>${station.name}</strong><p>Station Number: ${station.number}</p></div>`
            });

            marker.addListener('mouseover', function() {
                infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', function() {
                infoWindow.close();
            });

            markers.push(marker);
        });

        let markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

        toggleHeatmapAndMarkers();
    })
    .catch(error => console.error('Error fetching stations:', error));

}

function toggleHeatmapAndMarkers() {
    var zoom = map.getZoom();
    if (zoom < 14) { 
        markers.forEach(marker => marker.setMap(null)); 
        heatmap.setMap(map); 
    } else {
        markers.forEach(marker => marker.setMap(map)); 
        heatmap.setMap(null); 
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navbar = document.getElementById('navbar');

    navbar.style.transform = 'translateX(-100%)';

    menuToggle.addEventListener('mouseenter', function() {
        navbar.style.transform = 'translateX(0)';
    });

    navbar.addEventListener('mouseleave', function() {
        navbar.style.transform = 'translateX(-100%)';
    });

    populateDropdownOptions()
    fetchRealTime()
    fetchRealTimeWeather()
});

async function populateDropdownOptions() {
    // fetch dublin.json
    const options = await fetchDropdownOptions()
    const days = sortedWeekdays()

    // parse json
    const stations = options['data']
    const numbers = stations.map(station => station['number'])
    const names = stations.map(station => station['name'])

    // Select dropdowns by their IDs
    const depart = document.getElementById('depart');
    const departTime = document.getElementById('departTime');
    const departDay = document.getElementById('departDay');
    const arrive = document.getElementById('arrive');
    const arriveTime = document.getElementById('arriveTime');
    const arriveDay = document.getElementById('arriveDay');

    // Populate options for each dropdown
    names.forEach(name => {
        depart.innerHTML += `<option value="${name.toLowerCase().replace(/\s+/g, '')}">${name}</option>`;
        arrive.innerHTML += `<option value="${name.toLowerCase().replace(/\s+/g, '')}">${name}</option>`;
    });

    for (let i = 0; i < 24; i++) {
        departTime.innerHTML += `<option value="${i}">${i}</option>`;
        arriveTime.innerHTML += `<option value="${i}">${i}</option>`;
    }


    days.forEach(day => {
        departDay.innerHTML += `<option value="${day}">${day}</option>`;
        arriveDay.innerHTML += `<option value="${day}">${day}</option>`;
    })

    for (let i = 0; i < numbers.length; i++) {
        stationsIds[names[i].toLowerCase().replace(/\s+/g, '')] = numbers[i]
    }

    console.log(stationsIds);
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

console.log(sortedWeekdays());

async function fetchDropdownOptions() {
    const options = await fetch('static/stations.json')
        .then((response) => response.json())

    return options
}

// Function to get the coordinates of a station by its name
function getStationCoordinates(stationName, stationsData) {
    const station = stationsData.find(station => station.name === stationName); // Find station data in json by name: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    if (station) {
        console.log("Station Found:", station);
        return `${station.position_lat},${station.position_lng}`; // Return the coordinates as a string in the format required by Google Maps API
    }
    else
        console.error("Station not found", stationName);
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
// Function to create the directions URL and open it in a new tab
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
    const dayOptions = {}
    const days = sortedWeekdays()
    days.forEach(day => {
        dayOptions[day] = 0
    })

    const depart = document.getElementById("depart").value;
    const departTime = document.getElementById("departTime").value;
    const departDay = document.getElementById("departDay").value;
    const arrive = document.getElementById("arrive").value;
    const arriveTime = document.getElementById("arriveTime").value;
    const arriveDay = document.getElementById("arriveDay").value;

    getDirections(); // Call the getDirections function to display the directions button

    // change selected day to 1 (True)
    const departOptions = dayOptions
    const arriveOptions = dayOptions

    departOptions[departDay] = 1
    arriveOptions[arriveDay] = 1

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
    // first route the app calls after '/' is /realtime
    // it means we will have realtime data to 
    // populate the markers with

    // create object that we will eventually return
    const realTime = {}
    const request = await fetch('/realtime')
        .then((response) => response.json())
            .then((data) => {
                data.forEach(station => {
                    // populate the object with
                    // KEY station number: VALUE available bikes
                    realTime[station[0]] = station[1]
                })
            })

    return realTime
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
