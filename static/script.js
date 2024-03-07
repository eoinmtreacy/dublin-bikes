var map;
var heatmap;
var markers =[]

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
    console.log(realTime);
    fetchStations(realTime); 
    map.addListener('zoom_changed', toggleHeatmapAndMarkers);
}
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
});

async function populateDropdownOptions() {
    // fetch dublin.json
    const options = await fetchDropdownOptions()

    // parse json
    const stations = options['stations']
    const numbers = stations.map(station => station['number'])
    const names = stations.map(station => station['name'])

    // Select dropdowns by their IDs
    const dropdown1 = document.getElementById('dropdown1');
    const dropdown2 = document.getElementById('dropdown2');
    const dropdown3 = document.getElementById('dropdown3');

    // Populate options for each dropdown
    names.forEach(name => {
        dropdown1.innerHTML += `<option value="${name.toLowerCase().replace(/\s+/g, '')}">${name}</option>`;
    });

    for (let i = 0; i < 24; i++) {
        dropdown2.innerHTML += `<option value="${i}">${i}</option>`;
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    days.forEach(day => {
        dropdown3.innerHTML += `<option value="${day.toLowerCase()}">${day}</option>`;
    })
}

async function fetchDropdownOptions() {
    const options = await fetch('static/dublin.json')
        .then((response) => response.json())

    return options
}

function submitForm() {
    // dayOptions in strange order because that's how the model
    // reads the booleans
    const dayOptions = {
        "friday": 0,
        "monday": 0,
        "saturday": 0,
        "sunday": 0,
        "thursday": 0,
        "tuesday": 0,
        "wednesday": 0
    }

    const station = document.getElementById("dropdown1").value;
    const hour = document.getElementById("dropdown2").value;
    const day = document.getElementById("dropdown3").value;

    // change selected day to 1 (True)
    dayOptions[day] = 1

    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dropdown1: station,
            dropdown2: hour,
            dropdown3: Object.values(dayOptions)
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").innerText = JSON.stringify(data);
    })
    .catch(error => console.error('Error:', error));
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