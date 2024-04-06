let STATIONS
let origin, depart, arrive, destination

document.addEventListener('DOMContentLoaded', async () => {
    const map = await initMap()
    const realTime = await fetchRealTime()
    STATIONS = await fetchStations(realTime) // STATIONS created from fetch
    STATIONS = await createMarkers(STATIONS) // marker attributes added to stations
    fetchRealTimeWeather()
});

async function fetchRealTime() {
    const request = await fetch('/realtime')
        .then((response) => response.json())
    return request
}

async function fetchStations() {
    const response = await fetch('/stations');
    const data = await response.json();
    const stations = data.data;
    return stations
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

        marker.addListener('click', () => {
            // Close the current info window if it exists
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }

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
                        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                        datasets: [{
                            label: 'Bike Availability',
                            // get time
                            // pull from /realtime-ish for 1 station, for 
                            // average availabliltiy group by datatime (the hour)
                            // call /predict for every time from now until midnight
                            // format from /predict 
                            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * (15 - 3 + 1)) + 3),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(255, 159, 64, 0.2)',
                                'rgba(255, 205, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(201, 203, 207, 0.2)'
                            ],
                            borderColor: [
                                'rgb(255, 99, 132)',
                                'rgb(255, 159, 64)',
                                'rgb(255, 205, 86)',
                                'rgb(75, 192, 192)',
                                'rgb(54, 162, 235)',
                                'rgb(153, 102, 255)',
                                'rgb(201, 203, 207)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                ticks: {
                                    stepSize: 5,
                                    autoSkip: false
                                },
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Bikes Available'
                                }
                            },
                            x: {
                                ticks: {
                                    autoSkip: false
                                },
                                title: {
                                    display: true,
                                    text: 'Day of the Week'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                            },
                            tooltip: {
                                enabled: true,
                                mode: 'index',
                                intersect: false,
                            }
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeOutBounce'
                        }
                    }
                });

                // Second chart: Bike availability by hour
                let ctxHour = document.getElementById(`chart-hour-${index}`).getContext('2d');
                new Chart(ctxHour, {
                    type: 'bar',
                    data: {
                        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), // 0 to 23 hours
                        datasets: [{
                            label: 'Bike Availability per Hour',
                            data: Array.from({ length: 24 }, () => Math.floor(Math.random() * (15 - 3 + 1)) + 3),
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgb(54, 162, 235)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Bikes Available'
                                }
                            },
                            x: {
                                max: 25,
                                min: 0,
                                ticks: {
                                    autoSkip: false,
                                    callback: function (value, index, values) {
                                        // Display label for every second hour and format it
                                        if (index % 2 === 0) {
                                            return `${value}:00`;
                                        } else {
                                            return '';
                                        }
                                    }
                                },
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Hour of the Day'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                            },
                            tooltip: {
                                enabled: true,
                                mode: 'index',
                                intersect: false,
                            }
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeOutBounce'
                        }
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
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 53.349805, lng: -6.26031 },
        zoom: 13
    });

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

    // PLACEHOLDERS FOR START AND END VALUES
    let lastSelectedStartPlace = null;
    let lastSelectedEndPlace = null;

    // SEARCH EVENT LISTENERS
    startAutocomplete.addListener('place_changed', () => {
        origin = startAutocomplete.getPlace().geometry.location
        depart = findClosestStation(origin)
        console.log(origin, depart);
    })

    endAutocomplete.addListener('place_changed', () => {
        destination = endAutocomplete.getPlace().geometry.location
        arrive = findClosestStation(destination)
        console.log(arrive, destination);
    })

    // DIRECTION SERVICES
    function calculateAndDisplayRoute(travelMode, origin, destination, depart, arrive) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        directionsService.route({
            origin: origin,
            destination: destination,
            travelMode: travelMode
        }, function (response, status) {
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

    // Function to handle the confirm button click
    document.getElementById('confirmButton').addEventListener('click', function () {
        let startPlace = startSearchBox.getPlaces();
        let endPlace = endSearchBox.getPlaces();

        if (!startPlace || startPlace.length == 0 || !endPlace || endPlace.length == 0) {
            alert('Please select both a start and an end location.');
        }
        else {
            calculateAndDisplayRoute(startPlace[0].geometry.location, endPlace[0].geometry.location);
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
    getDirections(); // Call the getDirections function to display the directions button
    const days_letters = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let days = [0,0,0,0,0,0,0]
    days[new Date().getDay()] = 1

    const forecast = await fetch('/api/WeatherForecast', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hour: new Date().getUTCHours(), day: days_letters[new Date().getDay()]})
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('weather-description').innerText = 'Predicted Weather: ' + data.condition;
            let iconImg = '<img src="https:' + data.condition_icon + '" alt="Weather Icon">';
            document.getElementById('weather-icon').innerHTML = iconImg;
            document.getElementById('weather-temperature').innerText = 'Temperature: ' + data.temp_c + '°C';
            document.getElementById('weather-humidity').innerText = 'Humidity: ' + data.humidity + '%';
            document.getElementById('weather-precipitation').innerText = 'Precipitation: ' + data.precip_mm + 'mm';
            return data
        })
        .catch(error => console.error('Error fetching weather:', error));

    // TODO get today and pass it to the model in the correct format

    const prediction = await fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            depart: depart.number,
            departTime: new Date().getUTCHours(),
            departDay: days,
            arrive: arrive.number,
            arriveTime: new Date().getUTCHours(),
            arriveDay: days,
            rain: forecast.precip_mm,
            temp: forecast.temp_c,
            hum: forecast.humidity
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            return data
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

    document.getElementById('directionsButton').style.display = 'none';
});
