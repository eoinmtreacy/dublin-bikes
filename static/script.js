console.log("fire");

var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.349805, lng: -6.26031},
        zoom: 13
    });
    fetchStations(); 
}
function fetchStations() {
    fetch('/stations')
        .then(response => response.json())
        .then(data => {
            data.forEach(station => {
                const marker = new google.maps.Marker({
                    position: { lat: station.latitude, lng: station.longitude },
                    map: map,
                });

                const infoWindowContent = `
                    <div>
                        <h3>${station.name}</h3>
                        <p>ID: ${station.id}</p>
                        <p>Number: ${station.number}</p>
                        <p>Address: ${station.address}</p>
                    </div>
                `;
                console.log("InfoWindow content:", infoWindowContent);
                const infoWindow = new google.maps.InfoWindow({
                    content: infoWindowContent
                });

                marker.addListener('mouseover', () => {
                    infoWindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: false,
                    });
                });

                marker.addListener('mouseout', () => {
                    infoWindow.close();
                });
            });
        })
        .catch(error => console.error('Error fetching stations:', error));
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
});
    