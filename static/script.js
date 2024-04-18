var STATIONS = [];
let origin, depart, arrive, destination
let firstLeg, secondLeg, thirdLeg
let map;
const root = document.documentElement;
let markerClusterer;

const STATUS_QUEUE = []

let currentStyle = "light"; // Default mode is Light Mode
let darkMapStyle;
let lightMapStyle;
let RTDATA;
let defaultChartColor = '#000';
var gridColor = 'rgba(0,0,0,0.1)';
var chartColor = '#666';
var dayChart;
var hourChart;
// Needs to be explitictly initialised for the getStationAvailability function
const bikes = 'bikes';
const stands = 'stands';

const days_letters = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

document.addEventListener('DOMContentLoaded', async () => {
    displayMessages()
    addToQueue("Ready!")
    lightMapStyle = await fetchStatic("static/light.json"); 
    darkMapStyle = await fetchStatic("static/dark.json");
    const map = await initMap(lightMapStyle) // initalise the map with Light Mode style
    mapSetup()
    fetchRealTimeWeather()
    setClock()
});

async function mapSetup() {
    const realTime = await fetchRealTime()
    RTDATA = realTime
    // console.log('Real Time Data:', realTime); 
    STATIONS = await fetchStations() // STATIONS created from fetch
    // console.log('Stations:', STATIONS);
    STATIONS = await createMarkers(STATIONS) // marker attributes added to stations
}

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
    const navBar = document.getElementById("navbar"); // The journey planner container
    const bicycleIcon = document.getElementById("bicycle-icon"); // The bicycle icon
    const navBar2 = document.getElementById("navbar2"); // The journey planner container
    
    const refreshButton = document.getElementById("resetButton"); // The refresh button
    
    const markerPopup = document.getElementById('marker-popup');



    



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
        menuIcon.classList.remove("text-grey-800");
        menuIcon.classList.add("text-gray-50");
        navBar.classList.remove("bg-slate-100");
        navBar.classList.add("bg-gray-700");
        navBar2.classList.remove("bg-white");
        navBar2.classList.add("bg-gray-800");
        bicycleIcon.classList.remove("text-grey-800");
        bicycleIcon.classList.add("text-gray-50");
        document.getElementById('startInput').style.setProperty('background-color', 'rgb(226 232 240)', 'important');
        document.getElementById('endInput').style.setProperty('background-color', 'rgb(226 232 240)', 'important');
        document.getElementById('timeInput').style.setProperty('background-color', 'rgb(226 232 240)', 'important');
        document.getElementById('startInput').style.setProperty('color', 'rgb(71, 85, 105)', 'important');
        document.getElementById('endInput').style.setProperty('color', 'rgb(71, 85, 105)', 'important');
        document.getElementById('timeInput').style.setProperty('color', 'rgb(71, 85, 105)', 'important');
        refreshButton.classList.remove("bg-gray-300",  "hover:bg-gray-400");
        refreshButton.classList.add("bg-gray-400", "hover:bg-gray-500");
        root.style.setProperty('--background-color', 'rgb(30 41 59)');
        root.style.setProperty('--color', 'rgba(249, 250, 251, 1)');
        root.style.setProperty('--grid-color', 'rgba(241, 245, 249, 0.2)');
        // console.log("dark mode BG:", root.style.getPropertyValue('--background-color'));
        gridColor = 'rgba(241, 245, 249, 0.2)';
        chartColor = 'rgba(249, 250, 251, 1)';
        if (markerPopup) {
            dayChart.options.scales.x.grid.color = gridColor; 
            dayChart.options.scales.y.grid.color = gridColor; 
            dayChart.options.color = chartColor;
            dayChart.options.scales.y.ticks.color = chartColor; 
            dayChart.options.scales.x.ticks.color = chartColor; 
            dayChart.options.scales.x.title.color = chartColor; 
            dayChart.options.scales.y.title.color = chartColor; 
            hourChart.options.scales.x.grid.color = gridColor;
            hourChart.options.scales.y.grid.color = gridColor; 
            hourChart.options.scales.y.ticks.color = chartColor;
            hourChart.options.scales.x.ticks.color = chartColor;
            hourChart.options.color = chartColor; 
            hourChart.options.scales.x.title.color = chartColor;
            hourChart.options.scales.y.title.color = chartColor; 
            hourChart.options.color = chartColor; 
            markerPopup.style.color = chartColor;
    
            // Update the chart to reflect the changes
            dayChart.update();
            hourChart.update();
        

        // Log the updated grid color to the console
        // console.log("Dark mode grid:", getComputedStyle(root).getPropertyValue('--grid-color'));
        // console.log("Dark mode chart:", getComputedStyle(root).getPropertyValue('--color'));
        // console.log("Defaults:", Chart.defaults.borderColor, Chart.defaults.color)
        }
        

        




        

        
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
        menuIcon.classList.remove("text-gray-50");
        menuIcon.classList.add("text-grey-800");
        navBar.classList.remove("bg-gray-700");
        navBar.classList.add("bg-slate-100");
        navBar2.classList.remove("bg-gray-800");
        navBar2.classList.add("bg-white");
        bicycleIcon.classList.remove("text-gray-50");
        bicycleIcon.classList.add("text-grey-800");
        document.getElementById('startInput').style.setProperty('background-color', '', 'important');
        document.getElementById('endInput').style.setProperty('background-color', '', 'important');
        document.getElementById('timeInput').style.setProperty('background-color', '', 'important');
        document.getElementById('startInput').style.setProperty('color', '', 'important');
        document.getElementById('startInput').style.setProperty('color', '', 'important');
        document.getElementById('timeInput').style.setProperty('color', '', 'important');

        refreshButton.classList.remove("bg-gray-400", "hover:bg-gray-500");
        refreshButton.classList.add("bg-gray-300", "hover:bg-gray-400");

        root.style.setProperty('--background-color', '#FFFFFF');
        root.style.setProperty('--color', '#666');
        root.style.setProperty('--grid-color', 'rgba(0,0,0,0.1)');
        gridColor = 'rgba(0,0,0,0.1)';
        chartColor = '#666';
        if (markerPopup) {
            dayChart.options.scales.x.grid.color = gridColor; 
            dayChart.options.scales.y.grid.color = gridColor; 
            dayChart.options.color = chartColor;
            dayChart.options.scales.y.ticks.color = chartColor; 
            dayChart.options.scales.x.ticks.color = chartColor; 
            dayChart.options.scales.x.title.color = chartColor; 
            dayChart.options.scales.y.title.color = chartColor; 
            hourChart.options.scales.x.grid.color = gridColor;
            hourChart.options.scales.y.grid.color = gridColor; 
            hourChart.options.scales.y.ticks.color = chartColor;
            hourChart.options.scales.x.ticks.color = chartColor;
            hourChart.options.color = chartColor; 
            hourChart.options.scales.x.title.color = chartColor;
            hourChart.options.scales.y.title.color = chartColor; 
            hourChart.options.color = chartColor; 
            markerPopup.style.color = chartColor;
    
            // Update the chart to reflect the changes
            dayChart.update();
            hourChart.update();
            
    
            // Log the updated grid color to the console
            // console.log("Light mode grid:", getComputedStyle(root).getPropertyValue('--grid-color'));
            // console.log("Light mode chart:", getComputedStyle(root).getPropertyValue('--color'));
            // console.log("Defaults:", Chart.defaults.borderColor, Chart.defaults.color)
            }


        // Log the updated grid color to the console
       

    }
}

// Need to implement Error Handling again
async function fetchRealTime() {
    return await fetch('/realtime').then(response => response.json())
}


async function fetchStations() {
    return await fetch('/stations').then(response => response.json())
}
function getStationAvailability(dataSelect, stationNumber, realTimeData, stations) {
    const station = stations[stationNumber];
    if (station) {
        const stationData = realTimeData.find(data => data[0] === stationNumber);
        if (stationData) {
        if (dataSelect === 'stands') {
          return stationData[2]; // Index 2 represents available stands
        } else if (dataSelect === 'bikes') {
          return stationData[1]; // Index 1 represents available bikes
        } else {
            return "Invalid data selected specified";
        }
      } else {
        return "Data not available for the station";
      }
    } else {
      return "Station not found";
    }
  }

// Raises an error in JS console when currentInfoWindow is not defined - this is fine
function closeInfoWindow() {
    if (currentInfoWindow) {
        if (dayChart && hourChart) {
            dayChart.destroy();
            hourChart.destroy();
        }
        currentInfoWindow.close();
    }
}

async function createMarkers(stations) {
    // createMarkers now takes the stations array
    // and creates a marker object as an attribute
    // of each station, linking them together
    // console.log('Creating markers:', stations);
    let currentInfoWindow = null; // Variable to store the currently open info window
    
    stations.forEach((station, index) => {
        const availableBikes = getStationAvailability(bikes, station.number, RTDATA, STATIONS);
        const availableStands = getStationAvailability(stands, station.number, RTDATA, STATIONS);
        const contentString = `
        <div style='color: black;' id='marker-popup'>
            <strong>${station.name}</strong>
            <p><strong>Station Number:</strong> ${station.number}</p>
            <p><strong>Credit Card:</strong> ${station.banking === 1 ? 'Available' : 'Not Available'}</p>
            <p><strong>Available Bikes:</strong> ${availableBikes}</p>
            <p><strong>Available Stands:</strong> ${availableStands}</p>
            <p><strong>Overall Capacity:</strong> ${station.bike_stands}</p>
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
                if (dayChart && hourChart) {
                    dayChart.destroy();
                    hourChart.destroy();}
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
                    // console.log('last week:', data);
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
            // predicted_avail.forEach((array, index) => {
            //     array['Hour'] = currentHour + index;
            // });
            // console.log("predicts:", predicted_avail);

            // console.log(recent_avail.map(r => r[1]).concat(predicted_avail.map(p => p['availability'] * station.bike_stands)));

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
                var ctxDay = document.getElementById(`chart-day-${index}`).getContext('2d');
                var sorted_last_week = Array(7);
                // Loop through the last_week array to arange current day in middle
                for (let i = 0; i < last_week.length; i++) {
                    sorted_last_week[(i + 3) % 7] = last_week[i];
                }
                
                let dayBgColours = [];
                let dayBorderColours = [];
                let dayData = sorted_last_week.map(l => Math.round(l[1]));  // Round the availibility to nearest whole number

                for (let i = 0; i < dayData.length; i++) {
                    let ratio = dayData[i] / station.bike_stands;

                    if (ratio < 0.25) {
                        dayBgColours.push('rgba(255,0,0,0.2)');
                        dayBorderColours.push('rgba(255,0,0');
                    } else if (ratio < 0.5) {
                        dayBgColours.push('rgba(255,140,0,0.2)');
                        dayBorderColours.push('rgba(255,140,0');
                    } else {
                        dayBgColours.push('rgba(50,205,0,0.2)');
                        dayBorderColours.push('rgba(50,205,0');
                    }
                    
                }
                dayBgColours[3] = dayBgColours[3].replace('0.2', '0.6');
                dayChart = new Chart(ctxDay, {
                    type: 'bar',
                    data: {
                        labels: sorted_last_week.map(l => l[0].slice(0,3)),
                        datasets: [{
                            label: 'Bike Availability per Day',
                            data: dayData,
                            backgroundColor: dayBgColours,
                            borderColor: dayBorderColours,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        color: getComputedStyle(root).getPropertyValue('--color'),
                        scales: {
                            y: { ticks: { stepSize: 5, autoSkip: false, color: getComputedStyle(root).getPropertyValue('--color') }, beginAtZero: true, max: Math.ceil(station.bike_stands / 10) * 10, title: { display: true, text: 'Number of Bikes Available' ,color: getComputedStyle(root).getPropertyValue('--color')}, grid: { color: getComputedStyle(root).getPropertyValue('--grid-color')}},
                            x: { ticks: { autoSkip: false, color: getComputedStyle(root).getPropertyValue('--color') }, title: { display: true, text: 'Day of the Week', color: getComputedStyle(root).getPropertyValue('--color') }, grid: { color: getComputedStyle(root).getPropertyValue('--grid-color') }},
                        },
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        plugins: { legend: {
                            labels: {
                                boxWidth: 0, // Set the box width to 0 to effectively hide the colored box
                                usePointStyle: false, // Ensure standard box style isn't used
                            }
                        }, tooltip: { enabled: true, mode: 'index', intersect: false } },
                        animation: { duration: 1000, easing: 'easeOutBounce' }
                    }
                });
                var chartCanvasId = dayChart.id;
                // console.log('Chart ID:', chartCanvasId);
                // Second chart, hourly availability
                var ctxHour = document.getElementById(`chart-hour-${index}`).getContext('2d');
                let hourBgColours = [];
                let hourBorderColours = [];
                var hourData = recent_avail.map(r => Math.round(r[1])).concat(predicted_avail.map(p => Math.round(p['availability'] * station.bike_stands)));
                console.log(hourData); // Round the availibility to nearest whole number
                hourData[12] = availableBikes;
                
                const shiftAmount = (12 - currentHour + 24) % 24;
                // Create labels variable with old index numbers
                // const hourLabels = hourData.map((_, index) => {
                //     const hour = (index - shiftAmount + 24) % 24;
                //     return hour.toString().padStart(2, '0') + ':00';
                // });
                const now = new Date().getHours()
                const hourLabels = recent_avail.map(r => r[0]).concat(Array.from({length: 12}, (_, idx) => (now + idx) % 24))
                console.log(hourLabels);
                // console.log("labels:", hourLabels);
                // console.log("hourData:", hourData);




                for (let i = 0; i < hourData.length; i++) {
                    let ratio = hourData[i] / station.bike_stands;

                    if (ratio < 0.25) {
                        hourBgColours.push('rgba(255,0,0,0.2)');
                        hourBorderColours.push('rgba(255,0,0');
                    } else if (ratio < 0.5) {
                        hourBgColours.push('rgba(255,140,0,0.2)');
                        hourBorderColours.push('rgba(255,140,0');
                    } else {
                        hourBgColours.push('rgba(50,205,0,0.2)');
                        hourBorderColours.push('rgba(50,205,0');
                    }
                }
                hourBgColours[12] = hourBgColours[12].replace('0.2', '0.6');
                hourChart = new Chart(ctxHour, {
                    type: 'bar',
                    data: {
                        labels: hourLabels,
                        datasets: [{
                            label: 'Bike Availability per Hour',
                            data: hourData,
                            backgroundColor: hourBgColours,
                            borderColor: hourBorderColours,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        color: getComputedStyle(root).getPropertyValue('--color'),
                        scales: {
                            y: { ticks: { color: getComputedStyle(root).getPropertyValue('--color')}, beginAtZero: true, max: Math.ceil(station.bike_stands / 10) * 10, title: { display: true, text: 'Number of Bikes Available', color: getComputedStyle(root).getPropertyValue('--color') } , grid: { color: getComputedStyle(root).getPropertyValue('--grid-color'),
                        },},
                            x: {
                                ticks: {
                                    color: getComputedStyle(root).getPropertyValue('--color'),
                                    autoSkip: false,
                                    callback: function(value, index, values) {
                                        // Using the hourLabels array directly to map index to the correct time label
                                        if (index % 2 === 0) {
                                            return hourLabels[index];
                                        } else {
                                            return '';}}
                                },
                                beginAtZero: false,
                                title: { display: true, text: 'Hour of the Day', color: getComputedStyle(root).getPropertyValue('--color') },
                                grid: { color: getComputedStyle(root).getPropertyValue('--grid-color') },
                            }
                        },
                        plugins: { legend: {
                            labels: {
                                boxWidth: 0, // Set the box width to 0 to effectively hide the colored box
                                usePointStyle: false, // Ensure standard box style isn't used
                            }
                        }, tooltip: { enabled: true, mode: 'index', intersect: false } },
                        animation: { duration: 1000, easing: 'easeOutBounce' }
                    }
                });
                
            });
        });

        station['marker'] = marker
    });

    markers = stations.map(station => station.marker)

    markerClusterer = new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
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
        // console.log(origin, depart.marker.position);
    })

    endAutocomplete.addListener('place_changed', () => {
        destination = endAutocomplete.getPlace().geometry.location
        arrive = findClosestStation(destination)
        // console.log(arrive, destination);
    })

    setupNavbarToggle();

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
            document.getElementById("first-leg-info").innerHTML = `  ${route.distance.text} in ${route.duration.text}.`;//Changed from alert window to display in JP
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
            document.getElementById("second-leg-info").innerHTML = ` ${route.distance.text} in  ${route.duration.text}.`;
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
            document.getElementById("third-leg-info").innerHTML = ` ${route.distance.text} in ${route.duration.text}.`;
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
    document.getElementById("routeDetailsSection").classList.remove("hidden");
    document.getElementById("depart-avail").innerHTML= `<b>Depart Station Bikes:&nbsp;</b>   ${Math.round(depart.bike_stands * availability[0].availability)}`
    document.getElementById("arrive-avail").innerHTML = `<b>Arrive Station Parking:&nbsp; </b>   ${Math.round(arrive.bike_stands - arrive.bike_stands * availability[1].availability)}`
    setTimeout(scrollJourneyPlanner, 100);
    markerClusterer.clearMarkers();
    closeInfoWindow();
    
}

function scrollJourneyPlanner(direction) {
    const journeyPlanner = document.getElementById('navbar');
    if (direction === 'up') {
        journeyPlanner.scrollTop = 0; // Scroll to the top
    } else {
        journeyPlanner.scrollTop = journeyPlanner.scrollHeight; // Scroll to the bottom
    }
    // console.log('scrolling');
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

    // console.log(forecast);


    const prediction = await fetch(`/predict/${station}?day=${day}&hour=${hour}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            station: station,
            params: {
                'day': day,
                'hour': hour,
                'rain': forecast.precip_mm,
                'temp': forecast.temp_c,
                'hum': forecast.humidity
            }
        })
    })
        .then(response => response.json())
        .then(data => {
            return data.data
        })
        .catch(error => console.error('Error:', error));

        if (prediction.error) {
            addToQueue(prediction.error)
        }

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
    document.getElementById("first-leg-info").innerHTML = 'Walk';
    document.getElementById("second-leg-info").innerHTML = 'Ride';
    document.getElementById("third-leg-info").innerHTML = 'Walk';
    document.getElementById("routeDetailsSection").classList.add("hidden");
    scrollJourneyPlanner('up');

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
    mapSetup()

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

function showMessage(message) {
    const statusElement = document.getElementById('status-bar');
    statusElement.innerText = message;
}
  
