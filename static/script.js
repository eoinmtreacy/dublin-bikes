let STATIONS
let origin, depart, arrive, destination
let map;
var currentStyle = "light"; // Default mode is Light Mode
let darkMapStyle;
let lightMapStyle;

const days_letters = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

document.addEventListener('DOMContentLoaded', async () => {
    lightMapStyle = await fetchStatic("static/light.json"); 
    darkMapStyle = await fetchStatic("static/dark.json");
    const map = await initMap(lightMapStyle) // initalise the map with Light Mode style
    const realTime = await fetchRealTime()
    STATIONS = await fetchStations(realTime) // STATIONS created from fetch
    STATIONS = await createMarkers(STATIONS) // marker attributes added to stations
    fetchRealTimeWeather()
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

async function fetchStations() {
    return await fetch('/stations').then(response => response.json())
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
                <p>Credit Card: ${station.banking ? 'Available' : 'Not Available'}</p>
                <p>Available Bikes: ${station.available_bikes}</p>
                <p>Available Stands: ${station.available_bike_stands}</p>
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
                    console.log(data);
                    return data
                })
                .catch(error => console.error('Error:', error));

            // Second chart: Bike availability by hour
            const promiseAvail = [];
                var day = new Date().getDay(); // Ensure that the day is set to today
                let currentHour = new Date().getHours(); // Get the current hour
                
                for (let i = 0; i < 12; i++) {
                    let predictHour = (currentHour + i) % 24; // Adjust for 24-hour clock
                    if (currentHour + i >= 24) { //If the hour is in the next day 
                        day = (day + 1) % 7; // ensure the day is set to tomorrow and Adjust for 7-day week
                    }
                    var promise = getPrediction(station.number, day, predictHour);
                    // var formattedPrediction = `${predictHour}:${prediction.availability}`;
                    promiseAvail.push(promise);
                }

            const predicted_avail = await Promise.all(promiseAvail)
            console.log(recent_avail.map(r => r[1]).concat(predicted_avail.map(p => p['availability'] * station.bike_stands)));

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
                            data: last_week.map(l => l[1]),
                            backgroundColor: ['rgba(255,99,132,0.2)','rgba(255,159,64,0.2)','rgba(255,205,86,0.2)','rgba(75,192,192,0.2)','rgba(54,162,235,0.2)','rgba(153,102,255,0.2)','rgba(201,203,207,0.2)'],
                            borderColor: ['rgb(255,99,132)','rgb(255,159,64)','rgb(255,205,86)','rgb(75,192,192)','rgb(54,162,235)','rgb(153,102,255)','rgb(201,203,207)'],
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
                let ctxHour = document.getElementById(`chart-hour-${index}`).getContext('2d');
                new Chart(ctxHour, {
                    type: 'bar',
                    data: {
                        labels: Array.from({length: 24}, (_, i) => i),
                        datasets: [{
                            label: 'Bike Availability per Hour',
                            data: recent_avail.map(r => r[1]).concat(predicted_avail.map(p => p['availability'] * station.bike_stands)),
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
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
        console.log(origin, depart.marker.position);
    })

    endAutocomplete.addListener('place_changed', () => {
        destination = endAutocomplete.getPlace().geometry.location
        arrive = findClosestStation(destination)
        console.log(arrive, destination);
    })

    setupNavbarToggle();

}

// DIRECTION SERVICES
async function calculateAndDisplayRoute(origin, depart, arrive, destination) {
    const directionsService = new google.maps.DirectionsService();

    let firstLeg = new google.maps.DirectionsRenderer(
        {
            map:map,
            polylineOptions :{
                strokeColor: "yellow"
            }
        }
    )
    let secondLeg = new google.maps.DirectionsRenderer(
        {
            map: map,
            polylineOptions:{
                strokeColor:'RED'
            }
        }
    )
    let thirdLeg = new google.maps.DirectionsRenderer({
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
            console.log(response);
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
            console.log(response);
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
            console.log(response);
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
async function handleConfirmButtonClick() {
    try {
        if (!origin || !destination) {
            alert('Please select both a start and an end location.');
            return;
        }

        // Perform the route calculation
        await calculateAndDisplayRoute(origin, depart, arrive, destination);

        // Adjust the visibility of markers
        STATIONS.forEach(station => {
            if (station.marker) {
                // Hide all markers initially
                station.marker.setVisible(false);
            }
        });

        // Show only the relevant markers
        if (depart && depart.marker) depart.marker.setVisible(true);
        if (arrive && arrive.marker) arrive.marker.setVisible(true);

    } catch (error) {
        console.error('Error in handleConfirmButtonClick:', error);
    }
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

        // if (status === 'OK') {
        //     const route = response.routes[0].legs[0];
        //     document.getElementById('journeyDistance').textContent = `Distance: ${route.distance.text}`;
        //     document.getElementById('journeyTime').textContent = `Time: ${route.duration.text}`;
        // } else {
        //     console.error('Directions request failed due to ' + status);
        //     // update the HTML to indicate the error or that no data could be fetched
        //     document.getElementById('journeyDistance').textContent = 'Distance: unavailable due to error';
        //     document.getElementById('journeyTime').textContent = 'Time: unavailable due to error';
        // }


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
    // As the db is not pulling from my end, I had to use submitForm to test my code 
    // console.log('submitting form');
    // console.log('day:', days_letters[new Date().getDay()], 'hour:', String(new Date().getHours()));
    // console.log("Predicitons runnung")
    // let predicted = [];

    // for (let i = 0; i < 12; i++) {
    //     console.log('i:', i)

    //     var day = new Date().getDay(); // Ensure that the day is set to today
    //     let currentHour = new Date().getHours(); // Get the current hour
    //     let predictHour = (currentHour + i) % 24; // Adjust for 24-hour clock
    //     console.log('day:', day)
    //     console.log('currentHour:', currentHour)
    //     console.log('predictHour:', predictHour)
    //     if (currentHour + i >= 24) { //If the hour is in the next day 
    //         day = (day + 1) % 7; // ensure the day is set to tomorrow and Adjust for 7-day week
    //     }
    //     var prediction = await getPrediction(2, day, predictHour);
    //     console.log('prediction:', prediction)
    //     var formattedPrediction = `${predictHour}:${prediction.availability}`;
    //     predicted.push(formattedPrediction);
    // }
    // console.log(predicted);
    await fetchWeatherForecast(days_letters[new Date().getDay()],new Date().getHours()); // Call the fetchWeatherForecast function to display the weather forecast
    getDirections(); // Call the getDirections function to display the directions button
    const availability = await Promise.all([
        getPrediction(depart.number, new Date().getDay(),new Date().getHours()),
        getPrediction(arrive.number, new Date().getDay(),new Date().getHours())
    ])

    availability.map(a => console.log(a))
}



async function getPrediction(station, day, hour) {
    // changes HTML elements as a side effect
    

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

    // TODO get today and pass it to the model in the correct format

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

document.getElementById('resetButton').addEventListener('click', function () {
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
        directionsRenderer.setDirections({ routes: [] });
    }

    [firstLeg, secondLeg, thirdLeg].forEach(leg => {
        if (leg) leg.setDirections({ routes: [] });
    });

    //reset the markers
    STATIONS.forEach(station => {
        if (station.marker) {
            station.marker.setVisible(true);
        }
    });

    document.getElementById('directionsButton').style.display = 'none';

    
    
});
