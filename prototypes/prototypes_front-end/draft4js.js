var map;

function initMap() {
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
    const toggleIcon = document.getElementById('menuToggle');
    const navbar = document.getElementById('navbar');

    navbar.classList.add('-translate-x-full');

    toggleIcon.addEventListener('mouseenter', function() {
        navbar.classList.remove('-translate-x-full');
    });

   
    navbar.addEventListener('mouseleave', function() {
        navbar.classList.add('-translate-x-full');
    });
});

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
console.log(cluster.getStations());
console.log("Free spaces in cluster are: " + cluster.getFree());
console.log("Free parking spaces in cluster are: " + cluster.getParking());

stations.forEach((station) => console.log(station, "Free parking: ", station.getParking()))