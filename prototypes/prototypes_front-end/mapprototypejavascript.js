function initMap() {
    var location = {lat: 53.306816, lng: -6.222995};
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: location
    });
}
