function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.349805, lng: -6.26031},
        zoom: 13
    });
};

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
