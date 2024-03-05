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
            console.log(data);
            data['data'].forEach(station => {
                const marker = new google.maps.Marker({
                    position: { lat: station.position_lat, lng: station.position_lng },
                    map: map,
                });

                const infoWindowContent = `
                    <div>
                        <h3>${station.name}</h3>
                        <p>ID: ${station.number}</p>
                        <p>Number: ${station.number}</p>
                        <p>Address: ${station.address}</p>
                    </div>
                `;
                // console.log("InfoWindow content:", infoWindowContent);
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

function submitForm() {
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
        document.getElementById("result").innerText = JSON.stringify(data);
    })
    .catch(error => console.error('Error:', error));
}

    