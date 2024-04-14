let STATIONS
let origin, depart, arrive, destination
let firstLeg, secondLeg, thirdLeg
let map;

const STATUS_QUEUE = []

let currentStyle = "light"; // Default mode is Light Mode
let darkMapStyle;
let lightMapStyle;

const days_letters = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

document.addEventListener('DOMContentLoaded', async () => {
    lightMapStyle = await fetchStatic("static/light.json"); 
    darkMapStyle = await fetchStatic("static/dark.json");
    map = await initMap(lightMapStyle) // initalise the map with Light Mode style
    const realTime = await fetchRealTime()
    STATIONS = await fetchStations(realTime) // STATIONS created from fetch
    STATIONS = await createMarkers(STATIONS) // marker attributes added to stations
    fetchRealTimeWeather()
    setClock()
    displayMessages()
});


async function fetchStatic(path) {
    const response = await fetch(path);
    const data = await response.json();
    return data;
}

async function fetchMapStyles() {
    darkMapStyle = await fetchStatic("static/dark.json");
    lightMapStyle = await fetchStatic("static/light.json");
}

function toggleMapStyle() {
    const viewModeDiv = document.querySelector(".view-mode"); // The toggle button for changing between light and dark mode  -Reference: https://www.w3schools.com/jsref/met_document_queryselector.asp
    const icon = viewModeDiv.querySelector("ion-icon"); // The icon of the toggle button
    const bodyElement = document.body; // The body element of the HTML document
    const headerElement = document.querySelector("header"); // The header element of the HTML document
    const weatherInfoTextElements = document.querySelectorAll(".weather-info span:not(#weather-icon)"); // The weather information text elements (do not want to impact weather icon)
    const menuIcon = document.getElementById("menuToggle"); // The menu icon (hamburger icon)
    const journeyPlannerContainer = document.getElementById("journey-planner"); // The journey planner container
    const routeInfoContainer = document.getElementById("route-info"); // The route information container




    if (currentStyle === "light") {
        map.setOptions({styles: darkMapStyle});
        currentStyle = "dark";
        icon.setAttribute("name", "sunny-outline"); //Reference: https://www.w3schools.com/jsref/met_element_setattribute.asp
        icon.classList.remove("text-black"); //Reference: https://www.w3schools.com/jsref/prop_element_classlist.asp
        icon.classList.add("text-white");

        // Switch to dark mode styles
        bodyElement.className = "bg-gray-700 text-gray-50";
        headerElement.classList.remove("bg-gray-300");
        headerElement.classList.add("bg-gray-900");
        weatherInfoTextElements.forEach(element => {
            element.classList.add("text-white");
        });
        menuIcon.classList.remove("text-black");
        menuIcon.classList.add("text-white");
        journeyPlannerContainer.classList.remove("bg-gray-200");
        journeyPlannerContainer.classList.add("bg-gray-900");
        routeInfoContainer.classList.remove("bg-gray-200");
        routeInfoContainer.classList.add("bg-gray-900");
        

        
    } else {
        //Switch to light mode styles (default)
        map.setOptions({styles: lightMapStyle});
        currentStyle = "light";
        icon.setAttribute("name", "moon-outline");
        icon.classList.remove("text-white");
        icon.classList.add("text-black");

        bodyElement.className = "bg-gray-100 text-gray-800";
        headerElement.classList.remove("bg-gray-900");
        headerElement.classList.add("bg-gray-300");
        
        weatherInfoTextElements.forEach(element => {
            element.classList.remove("text-white"); 
        });
        menuIcon.classList.remove("text-white");
        menuIcon.classList.add("text-black");
        journeyPlannerContainer.classList.remove("bg-gray-900");
        journeyPlannerContainer.classList.add("bg-gray-200");
        routeInfoContainer.classList.remove("bg-gray-900");
        routeInfoContainer.classList.add("bg-gray-200");

    }
}

async function fetchRealTime() {
    return await fetch('/realtime').then(response => response.json())
}

async function fetchStations(realTime) {
    STATIONS = await fetch('/stations').then(response => response.json())
    STATIONS.map(station => station['available_bikes'] = realTime[station.number]['available_bikes'])
    return STATIONS
}

async function createMarkers(stations) {
    // createMarkers now takes the stations array
    // and creates a marker object as an attribute
    // of each station, linking them together
    let currentInfoWindow = null; // Variable to store the currently open info window

    stations.forEach((station, index) => {
        const contentString = `
            <div style='color: black;'>
                <strong>${station.name}</strong>
                <p>Station Number: ${station.number}</p>
                <p>Credit Card: ${station.banking === 1 ? 'Available' : 'Not Available'}</p> 
                <p>Available Bikes: ${station.available_bikes}</p>
                <p>Overall Capacity: ${station.bike_stands}</p>
                <canvas id="chart-day-${index}" width="400" height="200"></canvas>
                <canvas id="chart-hour-${index}" width="400" height="200" style="margin-top: 20px;"></canvas>
            </div>
        `;

        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(station.position_lat, station.position_lng),
            map: map,
        });

        const infoWindow = new google.maps.InfoWindow({
            content: contentString
        });

        marker.addListener('click', async () => {
            // Close the current info window if it exists
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }

            const recent_avail = await fetch('/recent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    station_number: station.number
                })
            })
                .then(response => response.json())
                .then(data => {
                    return data
                })
                .catch(error => console.error('Error:', error));

            const last_week = await fetch('/lastweek', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    station_number: station.number
                })
            })
                .then(response => response.json())
                .then(data => {
                    return data
                })
                .catch(error => console.error('Error:', error));

            // Second chart: Bike availability by hour
            const promiseAvail = [];
                var day = new Date().getDay(); // Ensure that the day is set to today
                let currentHour = new Date().getHours(); // Get the current hour
                
                for (let i = 0; i <= 12; i++) { // changing from less than 12 to less than / equal to 12 - Was only predicting 11 hours
                    let predictHour = (currentHour + i) % 24; // Adjust for 24-hour clock
                    if (currentHour + i >= 24) { //If the hour is in the next day 
                        day = (day + 1) % 7; // ensure the day is set to tomorrow and Adjust for 7-day week
                    }
                    var promise = getPrediction(station.number, day, predictHour);
                    // var formattedPrediction = `${predictHour}:${prediction.availability}`;
                    promiseAvail.push(promise);
                }

            const predicted_avail = await Promise.all(promiseAvail)

            // var predicted_avail = getHourlyPrediction(station.number);

            // Open the info window for the clicked marker
            infoWindow.open({
                anchor: marker,
                map,
                shouldFocus: false,
            });

            // Set the current info window to the opened info window
            currentInfoWindow = infoWindow;

            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                // First chart: Bike availability by day
                let ctxDay = document.getElementById(`chart-day-${index}`).getContext('2d');
                new Chart(ctxDay, {
                    type: 'bar',
                    data: {
                        labels: last_week.map(l => l[0].slice(0,3)),
                        datasets: [{
                            label: 'Bike Availability',
                            data: last_week.map(l => Math.round(l[1])), // Round the availibility to nearest whole number
                            backgroundColor: ['rgba(255,99,132,0.2)','rgba(255,159,64,0.2)','rgba(255,205,86,0.2)','rgba(75,192,192,0.2)','rgba(54,162,235,0.2)','rgba(153,102,255,0.2)','rgba(205,127,50,0.2)'], //These colours came from the Chart.js docs
                            borderColor: ['rgb(255,99,132)','rgb(255,159,64)','rgb(255,205,86)','rgb(75,192,192)','rgb(54,162,235)','rgb(153,102,255)','rgb(205,127,50)'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: { ticks: { stepSize: 5, autoSkip: false }, beginAtZero: true, title: { display: true, text: 'Number of Bikes Available' } },
                            x: { ticks: { autoSkip: false }, title: { display: true, text: 'Day of the Week' } }
                        },
                        plugins: { legend: { display: true, position: 'top' }, tooltip: { enabled: true, mode: 'index', intersect: false } },
                        animation: { duration: 1000, easing: 'easeOutBounce' }
                    }
                });
                
                // Second chart, hourly availability
                const backgroundColours = Array(24).fill('rgba(54, 162, 235, 0.2)');
                backgroundColours[currentHour] = 'rgba(54, 162, 235, 0.6)'; // Current Hour appears darker
                let ctxHour = document.getElementById(`chart-hour-${index}`).getContext('2d');
                new Chart(ctxHour, {
                    type: 'bar',
                    data: {
                        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                        datasets: [{
                            label: 'Bike Availability per Hour',
                            data: recent_avail.map(r => Math.round(r[1])).concat(predicted_avail.map(p => Math.round(p['availability'] * station.bike_stands))), // Round the availibility to nearest whole number
                            backgroundColor: backgroundColours,
                            borderColor: 'rgb(54, 162, 235)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: { beginAtZero: true, title: { display: true, text: 'Number of Bikes Available' } },
                            x: {
                                max: 25, min: 0,
                                ticks: {
                                    autoSkip: false,
                                    callback: function (value, index, values) {
                                        if (index % 2 === 0) { return `${value}:00`; } else { return ''; }
                                    }
                                },
                                beginAtZero: true,
                                title: { display: true, text: 'Hour of the Day' }
                            }
                        },
                        plugins: { legend: { display: true, position: 'top' }, tooltip: { enabled: true, mode: 'index', intersect: false } },
                        animation: { duration: 1000, easing: 'easeOutBounce' }
                    }
                });
                
            });
        });

        station['marker'] = marker
    });

    markers = stations.map(station => station.marker)

    new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
    return stations
}

// changed this to async because it wouldn't work otherwise lol
async function initMap(mapChoice) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 53.349805, lng: -6.26031 },
        zoom: 13,
        styles: mapChoice
    });

    var noPoi = [
        {
            featureType: "poi",
            stylers: [
              { visibility: "off" }
            ]   
          }
        ];
        
    map.setOptions({styles: noPoi});

    // AUTOCOMPLETE PARAMS
    const autocompleteOptions = {
        componentRestrictions: { country: 'ie' }, // Restrict to Ireland
        types: ['geocode'], // This restricts search to geographical location types.
    };

    let startInput = document.getElementById('startInput');
    let endInput = document.getElementById('endInput');

    let startAutocomplete = new google.maps.places.Autocomplete(startInput, autocompleteOptions);
    let endAutocomplete = new google.maps.places.Autocomplete(endInput, autocompleteOptions);

    let countyDublinBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(53.2987, -6.3871), // Southwest coordinates
        new google.maps.LatLng(53.4116, -6.1298)  // Northeast coordinates
    );

    startAutocomplete.setBounds(countyDublinBounds);
    endAutocomplete.setBounds(countyDublinBounds);

    // SEARCH EVENT LISTENERS
    startAutocomplete.addListener('place_changed', () => {
        origin = startAutocomplete.getPlace().geometry.location
        depart = findClosestStation(origin)
    })

    endAutocomplete.addListener('place_changed', () => {
        destination = endAutocomplete.getPlace().geometry.location
        arrive = findClosestStation(destination)
    })

    setupNavbarToggle();
    return map
}

// DIRECTION SERVICES
async function calculateAndDisplayRoute(origin, depart, arrive, destination) {
    const directionsService = new google.maps.DirectionsService();

    firstLeg = new google.maps.DirectionsRenderer(
        {
            map:map,
            polylineOptions :{
                strokeColor: "yellow"
            }
        }
    )
    secondLeg = new google.maps.DirectionsRenderer(
        {
            map: map,
            polylineOptions:{
                strokeColor:'RED'
            }
        }
    )
    thirdLeg = new google.maps.DirectionsRenderer({
        map:map,
        polylineOptions:{
            strokeColor:"blue"
        }
    })

        // Set maps for each renderer
    firstLeg.setMap(map);
    secondLeg.setMap(map);
    thirdLeg.setMap(map);

    directionsService.route({
        origin: origin,
        destination: depart.marker.position,
        travelMode: 'WALKING'
    }, function (response, status) {
        if (status === 'OK') {
            firstLeg.setDirections(response);
            // Display distance and duration
            const route = response.routes[0].legs[0];
            document.getElementById("first-leg-info").innerHTML = `Walk to bike station: ${route.distance.text}, time ${route.duration.text}.`;//Changed from alert window to display in JP
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    })

    directionsService.route({
        origin: depart.marker.position,
        destination: arrive.marker.position,
        travelMode: 'BICYCLING'
    }, function (response, status) {
        if (status === 'OK') {
            secondLeg.setDirections(response);
            // Display distance and duration
            const route = response.routes[0].legs[0];
            document.getElementById("second-leg-info").innerHTML = `Bike to destination station: ${route.distance.text}, time ${route.duration.text}.`;
            // again changed to display journey info in JP rather than an alert 
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    })

    directionsService.route({
        origin: arrive.marker.position,
        destination: destination,
        travelMode: 'WALKING'
    }, function (response, status) {
        if (status === 'OK') {
            thirdLeg.setDirections(response);
            // Display distance and duration
            const route = response.routes[0].legs[0];
            document.getElementById("third-leg-info").innerHTML = `Walk to final destination: ${route.distance.text}, time ${route.duration.text}.`;
            //again changed as discussed above.
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    })
}

    // Function to handle the confirm button click // Implemented 
async function hideOtherMarkers() {
        // Adjust the visibility of markers
        STATIONS.map(station => station.marker.setVisible(false))

        // Show only the relevant markers
        if (depart && depart.marker) depart.marker.setVisible(true);
        if (arrive && arrive.marker) arrive.marker.setVisible(true);
}
    
function setupNavbarToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const navbar = document.getElementById('navbar');

    // Ensure the navbar is not hidden on page load
    navbar.classList.remove('hidden');

    menuToggle.addEventListener('click', function () {
        // Toggle the 'hidden' class on click
        navbar.classList.toggle('hidden');
    });
}

// UTILITY FUNCTIONS
function findClosestStation(location) {
    // by returning closest station and not closest marker
    // we can pass the station number to the prediction function
    // and just access the station's.marker attributes
    // when we need it 
    let closestStation = null;
    let closestDistance = Number.MAX_VALUE;

    STATIONS.forEach(station => {
        let marker = station.marker
        let distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(marker.position.lat(), marker.position.lng()), location);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestStation = station;
        }
    });
    return closestStation;
}

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
        forEach(function (option) {
            if (option.value === value) {
                text = option.text;
            }
        });
    return text; // Return the text of the option
}

// Function to create the directions URL and open it in a new tab, changed dropdowns to no longer populate with the time/day and predictions
function getDirections() {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${arrive.position_lat},${arrive.position_lng}&destination=${depart.position_lat},${depart.position_lng}&travelmode=bicycling`; // Create the directions URL with the origin and destination coordinates and the travel mode set to bicycling: https://developers.google.com/maps/documentation/urls/get-started#directions-action
    const directionsButton = document.getElementById('directionsButton');
    directionsButton.style.display = 'block'; // Display the directions button
    directionsButton.onclick = () => window.open(directionsUrl, '_blank'); // Open the directions URL in a new tab when the button is clicked https://stackoverflow.com/questions/6303964/javascript-open-a-given-url-in-a-new-tab-by-clicking-a-button
}

async function submitForm() {
    // find the value of the radio buttons, 0 == today, 1 == tomorrow etc. 
    const day = Array.from(document.getElementsByName("date")).find(date => date.checked).value % 7
    // get the hours from the clock
    const hour = document.getElementById('timeInput').value.split(':')[0]

    // Call the fetchWeatherForecast function to display the weather forecast
    await fetchWeatherForecast(days_letters[day], hour)
    getDirections(); // Call the getDirections function to display the directions button
    await calculateAndDisplayRoute(origin, depart, arrive, destination);
    await hideOtherMarkers()


    
    const availability = await Promise.all([
        getPrediction(depart.number, day, hour),
        getPrediction(arrive.number, day, hour)
    ])

    document.getElementById("depart-avail").innerHTML= `<b>Depart Station Bikes:</b>   ${Math.round(depart.bike_stands * availability[0].availability)}`
    document.getElementById("arrive-avail").innerHTML = `<b>Arrive Station Parking:</b>   ${Math.round(arrive.bike_stands - arrive.bike_stands * availability[1].availability)}`
}

async function getPrediction(station, day, hour) {

    const forecast = await fetch('/api/WeatherForecast', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hour: hour, day: days_letters[day]})
    })
        .then(response => response.json())
        .then(data => {
            return data
        })
        .catch(error => console.error('Error fetching weather:', error));


    const prediction = await fetch(`/predict/${station}?day=${day}&hour=${hour}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            station: station,
            params: [day,
                hour,
                forecast.precip_mm,
                forecast.temp_c,
                forecast.humidity
            ]
        })
    })
        .then(response => response.json())
        .then(data => {
            return data.data
        })
        .catch(error => console.error('Error:', error));

        return prediction
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
async function fetchWeatherForecast(day, hour) {
    try {
        const response = await fetch('/api/WeatherForecast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hour: hour, day: day})
        });

        const data = await response.json();

        document.getElementById('weather-description').innerText = 'Predicted Weather: ' + data.condition;
        let iconImg = '<img src="https:' + data.condition_icon + '" alt="Weather Icon">';
        document.getElementById('weather-icon').innerHTML = iconImg;
        document.getElementById('weather-temperature').innerText = 'Temperature: ' + data.temp_c + '°C';
        document.getElementById('weather-humidity').innerText = 'Humidity: ' + data.humidity + '%';
        document.getElementById('weather-precipitation').innerText = 'Precipitation: ' + data.precip_mm + 'mm';
        
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

function setClock() {
    // sets clock to current time
    // Create a new Date object
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Format time with leading zeros
    let formattedTime = (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;

    // Set the value of the time input
    document.getElementById("timeInput").value = formattedTime;
}

document.getElementById('resetButton').addEventListener('click', function () {
    // Reset text inputs
    document.getElementById('startInput').value = '';
    document.getElementById('endInput').value = '';
    document.getElementById('depart-avail').innerHTML = '';
    document.getElementById('arrive-avail').innerHTML = '';

    setClock()

    origin = null;
    depart = null;
    arrive = null;
    destination = null;
    firstLeg.setMap(null)
    secondLeg.setMap(null)
    thirdLeg.setMap(null)
    map.setZoom(13)

    //reset the markers
    STATIONS.map(station => station.marker.setVisible(true))

    document.getElementById('directionsButton').style.display = 'none';

});

// status message and error handling display

function addToQueue(message) {
    STATUS_QUEUE.push(message);
  }
  
async function displayMessages() {
    if (STATUS_QUEUE.length > 0) {
        showMessage(STATUS_QUEUE.shift())
    }

    setTimeout(displayMessages, 1000)
}

// Function to display a message
function showMessage(message) {
    const statusElement = document.getElementById('status-bar');
    statusElement.innerText = message;
}
  