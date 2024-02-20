document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      menu.classList.toggle('hidden');
    });
  }

  const weatherToggle = document.getElementById("weatherToggle");
  const weatherMenu = document.getElementById("weatherMenu");

  if (weatherToggle) {
    weatherToggle.addEventListener("click", () => {
      if (weatherMenu.classList.contains('hidden')) {
        weatherMenu.classList.remove('hidden');
        weatherMenu.classList.remove('right-[-100%]');
        weatherMenu.classList.add('right-0');
      } else {
        weatherMenu.classList.add('hidden');
        weatherMenu.classList.remove('right-0');
        weatherMenu.classList.add('right-[-100%]');
      }
    });
  }
});

function updateLiveTimer() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  document.getElementById('liveTimer').textContent = timeString;
}

setInterval(updateLiveTimer, 1000); 

function initMap() {
  var location = {lat: 53.306816, lng: -6.222995};
  var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: location
  });
}
