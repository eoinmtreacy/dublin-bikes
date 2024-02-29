var map;

function initMap() {
    // worth checking out the flask_google maps project 

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.349805, lng: -6.26031},
        zoom: 13
    });

    cluster.getStations().forEach((station) => {
        const marker = new google.maps.Marker({
            position: { lat: station.getLat(), lng: station.getLong() },
            map: map,
            title: `Station ID: ${station.getId()}`
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<div><h3>Station ${station.getId()}</h3><p>Free spaces: ${station.getFree()}</p><p>Parking spaces: ${station.getParking()}</p></div>`
        });

        marker.addListener('mouseover', function() {
            infoWindow.open(map, marker);
        });

        marker.addListener('mouseout', function() {
            infoWindow.close();
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // is this event listener for the nav bounds?
    
    const toggleIcon = document.getElementById('menuToggle');
    const navbar = document.getElementById('navbar');

    navbar.classList.add('-translate-x-full');

    toggleIcon.addEventListener('mouseenter', function() {
        navbar.classList.remove('-translate-x-full');
    });

   
    navbar.addEventListener('mouseleave', function() {
        navbar.classList.add('-translate-x-full');
    });

    populateDropdownOptions()
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

function submitForm(event) {
    const station = document.getElementById("dropdown1").value;
    const hour = document.getElementById("dropdown2").value;
    const day = document.getElementById("dropdown3").value;

    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dropdown1: station,
            dropdown2: hour,
            dropdown3: day
        })
    })
    .then(response => response.json())
    .then(data => {
        // document.getElementById("result").innerText = JSON.stringify(data);
        console.log(JSON.stringify(data))
    })
    .catch(error => console.error('Error:', error));
}

class Station {
    constructor(id, lat, long, free, parking) {
        this.id = id
        this.lat = lat
        this.long = long
        this.free = free
        this.parking = parking
    }
  
    getId() {
        return this.id
    }

    getLat() {
        return this.lat
    }

    getLong() {
        return this.long
    }

    getFree() {
        return this.free
    }

    setFree(value) {
        this.free = value
    }

    getParking() {
        return this.parking
    }

    setParking(value) {
        this.free = value
    }
  }


class Cluster {
    constructor(stations) {
        // constructor accept an array of Station objects
        this.stations = stations
    }

    getStations() {
        return this.stations
    }

    getFree() {
        return this.stations.reduce((acc, station) => acc + station.getFree(), 0)
    }

    getParking() {
        return this.stations.reduce((acc, station) => acc + station.getParking(), 0)
    }
}

// if you run this file you'll see how a Station and a Cluster are constructed and 

const stations = [
    new Station(1, 53.344250, -6.262410, 4, 5),
    new Station(420, 49.142220, -0.344840, 4, 5),
    new Station(69, 53.301450, -6.234680, 4, 5),
    new Station(123, 53.400879, -6.337320, 4, 5),
    new Station(0, 53.360710, -6.251209, 4, 5),
]

const cluster = new Cluster(stations)