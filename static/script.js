let map;
let heatmap;
let markers =[]
const stationsIds = {}
let stationsData;

// changed this to async because it wouldn't work otherwise lol

async function fetchRealTime() {
    const request = await fetch('/realtime')
        .then((response) => response.json())
    return request
}

async function fetchStations() {
    let currentInfoWindow = null; // Variable to store the currently open info window

    const response = await fetch('static/stations.json');
    const data = await response.json(); // Parsing the JSON to get the object
    const stations = data.data; // Accessing the nested array with station data
    const markers = []; // Array to store the markers required for 

    console.log(stations); // Print to log the array of stations

    stations.forEach((station, index) => {
        // Content for InfoWindow, including a unique canvas for each chart
        // Credit Card is a Project Requirement
        const popupText = `
            <div style='colour: black;'>
                <strong>${station.name}</strong>
                <p>Station Number: ${station.number}</p>
                <p>Credit Card: ${station.banking ? 'Available' : 'Not Available'}</p> 
                <canvas id="chart-day-${index}" width="400" height="200"></canvas>
                <canvas id="chart-hour-${index}" width="400" height="200" style="margin-top: 20px;"></canvas>
            </div>
        `;

        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(station.position_lat, station.position_lng),
            map: map,
        });

        const infoWindow = new google.maps.InfoWindow({
            content: popupText
        });

        marker.addListener('click', () => {
            // Close the current info window if it exists
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }

            // Open the info window for the clicked marker ( Prevent Multiple Windows open at one time)
            infoWindow.open({
                anchor: marker,
                map,
                shouldFocus: false,
            });

            // Set the current info window to the opened info window
            currentInfoWindow = infoWindow;

            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                // First chart: Bike availability by day
                // const chartDay = document.getElementById(`chart-day-${index}`).getContext('2d');
                // const stationDayNumber = station.number ; 
                // setupChartWithDailyAverages(stationDayNumber, chartDay);
                
                // Second chart: Bike availability by hour
                const chartHour = document.getElementById(`chart-hour-${index}`).getContext('2d');
                const stationNumber = station.number ; 
                setupChartWithPredictions(stationNumber, chartHour);
            }); 
        }); 

        markers.push(marker);
    }); 


    new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });

    return stations; 
} 

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
        let places = searchBox.getPlaces();
        if (places.length == 0) {
            return;
        }
        let bounds = new google.maps.LatLngBounds();
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

        let closestMarker = findClosestMarker(places[0].geometry.location); 
        if (closestMarker) {
        calculateAndDisplayRoute(closestMarker)
        }

        function findClosestMarker(location) {
            let closestMarker = null;
            let closestDistance = Number.MAX_VALUE;

            markers.forEach(function(marker) {
                let distance = google.maps.geometry.spherical.computeDistanceBetween(
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
            let request = {
            origin: document.getElementById('searchInput').value,
            destination: {lat: marker.position.lat(), lng: marker.position.lng()},
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


function getText(elementID, value) { // Function to get the text of an option by its text rather than its value. https://www.geeksforgeeks.org/how-to-get-the-text-of-option-tag-by-value-using-javascript/
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
            temperature: forecast.temp_c,
            humidity: forecast.humidity
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
    

async function fetchForecastForNextHours(forecastHour) { // Function to fetch the weather forecast for the next hours used for hourly availability prediction
    try {
        const response = await fetch('/api/WeatherForecast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hour: forecastHour, day: 'Today' }) 
        });

        const data = await response.json();

        const forecast = {
            temperature: data.temp_c,
            humidity: data.humidity,
            precipitation: data.precip_mm
        };

        return forecast;
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

async function fetchForecastAndAvailability(stationNumber) {
    const now = new Date(); // Get the current date and time
    const currentHour = now.getHours() - 1; // -1 Ensures to predict current hour
    console.log('Current hour:', now.getHours());
    let availabilityArray = Array(24).fill(1); // Fill the Array with 1s as a placeholder for availability
    
    // Process predictions for the next 12 hours
    for (let i = 1; i <= 12; i++) {
        const forecastHour = (currentHour + i) % 24; // 24-hour cycle (0-23)
        try {
            const forecast = await fetchForecastForNextHours(forecastHour);
            const prediction = await fetchHourlyAvailability(
                stationNumber,
                forecastHour,
                [1, 0, 0, 0, 0, 0, 0], // Explicitly setting 'day' to 'today'
                forecast.precipitation,
                forecast.temperature,
                forecast.humidity
            );

            availabilityArray[(currentHour + i) % 24] = prediction;
        } catch (error) {
            console.error(`Error fetching data for hour ${forecastHour}:`, error);
        }
        console.log('Availability prediction for hour:', forecastHour, 'Prediction:', availabilityArray[(currentHour + i) % 24]);
    }
    return availabilityArray;
}

const dayArray = { // Array to represent the days of the week as binary boolean values
    'Monday': [1, 0, 0, 0, 0, 0, 0],
    'Tuesday': [0, 1, 0, 0, 0, 0, 0],
    'Wednesday': [0, 0, 1, 0, 0, 0, 0],
    'Thursday': [0, 0, 0, 1, 0, 0, 0],
    'Friday': [0, 0, 0, 0, 1, 0, 0],
    'Saturday': [0, 0, 0, 0, 0, 1, 0],
    'Sunday': [0, 0, 0, 0, 0, 0, 1]
};

async function fetchDailyForecastAndAverages(stationNumber) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const availabilityAverages = []; // Array to store the daily averages
    

    for (const day of days) {
        let dailyTotalAvailability = 0;
        let hours = 0;

        for (let hour = 7; hour <= 21; hour++) { // Only look at availability between 7am and 9pm (inclusive). If using 24 hours the data would be skewed at night
            try {
                const forecast = await fetchForecastForNextHours(hour);
                const availability = await fetchHourlyAvailability(
                    stationNumber,
                    hour,
                    dayArray[day],
                    forecast.precipitation,
                    forecast.temperature,
                    forecast.humidity
                );

                dailyTotalAvailability += availability;
                hours++;
            } catch (error) {
                console.error(`Error fetching data for hour ${hour}:`, error);
            }
        }

        // Calculate the daily average if hours is not 0 to avoid division by zero
        const dailyAverage = hours > 0 ? dailyTotalAvailability / hours : 0;
        availabilityAverages.push(dailyAverage);
    }

    return availabilityAverages;
}


let chartInstance = null; 

async function setupChartWithPredictions(stationNumber, chartHour) {
    try {
        // If there's an existing chart instance, destroy it
        if (chartInstance !== null) {
            chartInstance.destroy();
        }

        const hourPredictions = await fetchForecastAndAvailability(stationNumber);
        console.log('Hourly predictions:', hourPredictions);

        // Get the current hour
        const currentHour = new Date().getHours();

        // Generate labels for the 12 hours before and 12 hours after the current time
        const labels = Array.from({length: 24}, (_, i) => {
            let labelHour = currentHour + i - 12; 
            // Ensure it remains within a 24-hour cycle (0-23)
            if (labelHour < 0) {
                labelHour += 24;
            } else if (labelHour >= 24) {
                labelHour -= 24;
            }
            return `${labelHour}:00`;
        });

        // Reorder hourPredictions to match the new labels order
        const reorderedPredictions = labels.map(label => {
            const hour = parseInt(label.split(':')[0], 10); // Extract the hour number from the label
            return hourPredictions[hour];
        });

        const backgroundColours = Array(24).fill('rgba(54, 162, 235, 0.2)');
        backgroundColours[12] = 'rgba(54, 162, 235, 0.6)'; // Current Hour appears darker


        chartInstance = new Chart(chartHour, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bike Availability per Hour',
                    data: reorderedPredictions, 
                    backgroundColor: backgroundColours,
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error setting up chart with predictions:', error);
    }
}



async function setupChartWithDailyAverages(stationNumber, chartDay) {
    try {
        // If there's an existing chart instance, destroy it
        if (chartInstance !== null) {
            chartInstance.destroy();
        }

        const dailyAverages = await fetchDailyForecastAndAverages(stationNumber);
        console.log('Daily averages:', dailyAverages);

        const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const backgroundColours = labels.map((_, index) => 'rgba(75, 192, 192, 0.2)');
        const borderColour = labels.map((_, index) => 'rgba(75, 192, 192, 1)');

        // Create a new chart instance
        chartInstance = new Chart(chartDay, {
            type: 'bar', 
            data: {
                labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                datasets: [{
                    label: 'Daily Availability Averages',
                    data: dailyAverages,
                    backgroundColor: backgroundColours,
                    borderColor: borderColour,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Average Availability'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Day of the Week'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error setting up chart with daily averages:', error);
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
    fetchRealTimeWeather()
});

async function populateDropdownOptions() {
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




async function fetchHourlyAvailability(stationNumber, hour, day, rain, temperature, humidity) {
    const response = await fetch('/predictHourly', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            station: stationNumber,
            time: hour,
            rain: rain,
            temperature: temperature,
            humidity: humidity
        })
    });
    if (!response.ok) {
        throw new Error('Failed to fetch hourly predictions');
    }
    const data = await response.text(); 
    console.log('Hour:', hour, 'availability response:', data);
    return data;
}



