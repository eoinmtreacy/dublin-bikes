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
        const sum = this.stations.reduce((acc, station) => acc + station.getFree(), 0);
        return sum;
    }
  }

const stations = [
    new Station(1,2,3,4,5),
    new Station(1,2,3,4,5),
    new Station(1,2,3,4,5),
    new Station(1,2,3,4,5),
    new Station(1,2,3,4,5),
]

const cluster = new Cluster(stations)
console.log(cluster.getFree())