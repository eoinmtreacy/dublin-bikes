var map;
var heatmap;
var markers =[]
const stationsIds = {}
let stationsData;

// changed this to async because it wouldn't work otherwise lol
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.349805, lng: -6.26031},
        zoom: 13
    });


    console.log('Calling fetchStations'); // Diagnostic log before the call
    stationsData = await fetchStations();
    console.log('fetchStations called', stationsData); // Diagnostic log to confirm it's called and log data
    console.log('Called fetchStations'); // Diagnostic log before the call

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

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
      });

      function calculateAndDisplayRoute(marker) {  
        var request = {
          origin: document.getElementById('searchInput').value,
          destination: {lat: marker.position.lat(), lng: marker.position.lng()}, // Replace with the selected marker's coordinates
          travelMode: 'WALKING'
        };
  
        directionsService.route(request, function(response, status) {
          if (status === 'OK') {
            directionsRenderer.setDirections(response);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
      }

    // need to fetchRealTime before stations
    // so we can populate markers with the 
    // realtime info as we create them
    // map.addListener('zoom_changed', toggleHeatmapAndMarkers);
}
async function fetchStations() {
    let currentInfoWindow = null; // Variable to store the currently open info window

    const response = await fetch('static/stations.json');
    const data = await response.json(); 
    const stations = data.data; 
    const markers = []; /

    console.log(stations);

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
                var ctxDay = document.getElementById(`chart-day-${index}`).getContext('2d');
                new Chart(ctxDay, {
                    type: 'bar',
                    data: {
                        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                        datasets: [{
                            label: 'Bike Availability',
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
                var ctxHour = document.getElementById(`chart-hour-${index}`).getContext('2d');
                new Chart(ctxHour, {
                    type: 'bar',
                    data: {
                        labels: Array.from({length: 24}, (_, i) => `${i}:00`), // 0 to 23 hours
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
                                    callback: function(value, index, values) {
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
        markers.push(marker);
    }); 

    new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });

    return stations; 
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

async function submitForm() {
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

    const forecast = await fetch('/api/WeatherForecast', {
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
        document.getElementById('weather-temperature').innerText = 'Temperature: ' + data.temp_c + '°C';
        document.getElementById('weather-humidity').innerText = 'Humidity: ' + data.humidity + '%';
        document.getElementById('weather-precipitation').innerText = 'Precipitation: ' + data.precip_mm + 'mm';
        return data
    })
    .catch(error => console.error('Error fetching weather:', error));

    const prediction = await fetch('/predict', {
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
            arriveDay: Object.values(arriveOptions),
            rain: forecast.precip_mm,
            temp: forecast.temp_c,
            hum: forecast.humidity
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").innerText = JSON.stringify(data);
        return data
    })
    .catch(error => console.error('Error:', error));

    return prediction
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
                console.log(data);
        document.getElementById('weather-description').innerText = 'Current Weather: ' + data.condition;
        let iconImg = '<img src="https:' + data.condition_icon + '" alt="Weather Icon">';
        document.getElementById('weather-icon').innerHTML = iconImg;
        document.getElementById('weather-temperature').innerText = 'Temperature: ' + data.temp_c;
        document.getElementById('weather-humidity').innerText = 'Humidity: ' + data.humidity;
        document.getElementById('weather-precipitation').innerText = 'Precipitation: ' + data.precip_mm;
            })
            .catch(error => console.error('Error fetching weather:', error));
        }
