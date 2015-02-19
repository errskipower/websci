$(document).ready(function() {
  
  // get weather information
  getCoords();
  
  // get coordinates of user's location
  function getCoords() {
    // check if browser has geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( function(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        getWeather(lat, lon);
      },
      function (error) { 
        // display error if geolocation disabled
        if (error.code == error.PERMISSION_DENIED)
          $('#error').html('Geolocation is not supported by this browser.');
      });
    } else {
      // display error if geolocation disabled
      console.log('error');
      $('#error').html('Geolocation is not supported by this browser.');
    }
  }
  
  // use Forecast.io weather api to get weather data
  function getWeather(lat, lon) {
    var apiKey = '7d25c3e744d47874007a7b9b6c9e4152';
    var url = 'https://api.forecast.io/forecast/' + apiKey + '/' + lat + ',' + lon;
    
    // call api using ajax
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'jsonp',
      error: function(jqXHR, Status, ErrorThrown) {
        var htmlString =  'An error has occured when finding your weather :( <br>' + ErrorThrown;
        $('#error').html(htmlString);
      },
      success: function(data) {
        displayWeather(data);
      }
    });
  }
  
  // display weather information in browser
  function displayWeather(data) {
    // get and display location name
    getLocationName(data.latitude, data.longitude);
    
    // display weather icon, temperature, and "feels like"
    $('#weather-pic').html('<img src="icons/' + data.currently.icon + '-icon.png">');
    $('#degrees').html((data.currently.temperature).toFixed(1) + ' &deg;F');
    $('#feels-like').html('Feels like ' + (data.currently.apparentTemperature).toFixed(1) + ' &deg;F');
    
    // display weather description
    $('#description').html(data.currently.summary);
    
    // display prepitation info
    var precip = data.currently.precipProbability;
    if (precip > 0) { // only show precipitation type if it's > 0
      $('#precip').html((precip * 100).toFixed(2) + '% chance of ' + data.currently.precipType);
    } else {
      $('#precip').html('0% chance of precipitation');
    }
    
    // display wind and humidity
    $('#wind').html('Wind: ' + data.currently.windSpeed + 'mph');
    $('#humidity').html('Humidity: ' + (data.currently.humidity * 100) + '%');
  }
  
  // get and display location name using Google's Geocode API
  // forecast.io does not retrieve location name information
  function getLocationName(lat, lon) {
    var latlng = new google.maps.LatLng(lat, lon);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({location:latlng},function(result){
      // index in address array
      var cityIndex = 2;
      var stateIndex = 4;
      
      var city = result[0].address_components[cityIndex].long_name;
      var state = result[0].address_components[stateIndex].short_name;
      
      // sometimes city and state are at different indexes depending on what info google can retrieve
      if (state.length > 2) {
        city = result[0].address_components[cityIndex + 1].long_name;
        state = result[0].address_components[stateIndex + 1].short_name;
      }
      
      // display city and state
      $('#city').html(city + ', ' + state);
    });
  }
  
  // refresh weather information without refreshing browser
  $('#refresh').on('click', function() {
    $('#weather-box').animate({opacity: 0}, 300);
    getCoords();
    $('#weather-box').animate({opacity: 1}, 2000);
  });
  
  
});