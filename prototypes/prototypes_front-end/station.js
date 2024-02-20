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
        this.free = vale
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
    new Station(1, 2, 3, 4, 5),
    new Station(420, 2, 3, 4, 5),
    new Station(69, 2, 3, 4, 5),
    new Station(123, 2, 3, 4, 5),
    new Station(0, 2, 3, 4, 5),
]

const cluster = new Cluster(stations)
console.log(cluster.getStations());
console.log("Free spaces in cluster are: " + cluster.getFree());
console.log("Free parking spaces in cluster are: " + cluster.getParking());

stations.forEach((station) => console.log(station, "Free parking: ", station.getParking()))