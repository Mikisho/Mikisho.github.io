// Globlal variables
var map,
  infowindow,
  bounds,
  markers = [];

// MODEL
var locations = [
  {
    title: "Busch Gardens",
    location: { lat: 28.03, lng: -82.42 },
    address: "10165N McKinley Drive",
    city: "Tampa, FL 33612",
    url: "https://www.buschgardens.com",
  },
  {
    title: "Florida Aquarium",
    location: { lat: 27.93, lng: -82.44 },
    address: "701 Channelsside Dr",
    city: "Tampa, FL 33602",
    url: "https://www.flaquarium.org",
  },
  {
    title: "Big Cat Rescue",
    location: { lat: 28.06, lng: -82.57 },
    address: "12802 Easy St",
    city: "Tampa, FL 33625",
    url: "https://www.bigcatrescue.org"
  },
  {
    title: "SS American Victory",
    location: { lat: 27.94, lng: -82.44 },
    address: "705 Channelside Dr",
    city: "Tampa, FL 33602",
    url: "https://www.americanvictory.org"
  },
  {
    title: "Henry B. Plant Museum",
    location: { lat: 27.94, lng: -82.46 },
    address: "8401 W Kennedy Blvd",
    city: "Tampa, FL 33606",
    url: "https://www.plantmuseum.com"
  },
  {
    title: "Ybor City Museum State Park",
    location: { lat: 27.96, lng: -82.43 },
    address: "2009 Angel Oliva Senior St",
    city: "Tampa, FL 33605",
    url: "https://www.ybormuseum.org/garden"
  },
  {
    title: "Tampa History Cruise",
    location: { lat: 27.94, lng: -82.46 },
    address: "401 W Kennedy Blvd",
    city: "Tampa, FL 33606",
    url: "https://http://www.plantmuseum.com/"
  }
];

$(function () {
  resize();
  $(window).resize(resize);
});

function resize() {
  $document = $(document);
  if ($document.width() > 576) {
    $('#map').css('height', $document.height() - 56);
    $('#sidebar').css('height', $document.height() - 56);
  } else {
    $('#map').css('height', 800);
    $('#sidebar').css('height', '');
  }
}

// GOOGLE MAPS VIEW MODEL 
function initMap() {
  // Constructor creates a new map 
  map = new google.maps.Map(document.getElementById('map'), {

    center: { lat: 27.964157, lng: -82.452606 },
    zoom: 18
  });

  // instantiate infowindow and bounds variables
  infowindow = new google.maps.InfoWindow();
  bounds = new google.maps.LatLngBounds();

  createMarkers(locations, infowindow);

  ko.applyBindings(new ViewModel());
}

// create map markers from array of locations

function createMarkers(locations, infowindow) {

  // Create the listener function
  var markerClickListener = function (marker, infowindow) {
    return function () {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setAnimation(null);
      }
      marker.setAnimation(google.maps.Animation.BOUNCE);
      getVenueDetails(marker.position, marker.city, marker.title, function (windowContent) {
        infowindow.setContent(windowContent);
        infowindow.open(map, marker);
      });
    };
  };


  // create an array of markers from Model data
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    // Create a marker per location
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      address: locations[i].address,
      city: locations[i].city,
      url: locations[i].url,
      animation: google.maps.Animation.DROP
    });

    // Push the marker.
    markers.push(marker);

    //Pass The function declared above
    google.maps.event.addListener(marker, 'click', markerClickListener(marker, infowindow));

    bounds.extend(position);

  }
  // Extend the boundaries of the map for each marker
  map.fitBounds(bounds);
}

// Set infowindow content and open infowindow
function openInfoWindow(index, location, event) {
  var marker = getMarker(location);
  new google.maps.event.trigger(marker, 'click');
}

// AJAX request
var baseUrl = 'https://api.foursquare.com/v2/venues/search?',
  clientId = 'KSPYIN0S5WIKU0R5ERQ3ZHGON2YGN2PBOC4ENNNVCHB4QAIR',
  clientSecret = 'GUS3Z3412QDEA4PCNPNDN1XPDO2Q0KIS1ZEP0FRMLEZMYMIZ';

function getVenueDetails(location, city, title, infowindowCallback) {
  foursquareUrl = baseUrl + 'v=20170801&ll=' + location.lat() + ',' + location.lng() + '&near=' + city + '&query=' + title + '&client_id=' + clientId + '&client_secret=' + clientSecret;

  $.get(foursquareUrl, function (locations) {
    var currentVenue = locations.response.venues[0];
    var placeName = currentVenue.name;
    var placeAddress = currentVenue.location.formattedAddress;
    var placePhonenos = (currentVenue.contact.formattedPhone === undefined) ? 'None' :
      currentVenue.contact.phone;
    var url = currentVenue.url || 'Not Available';
    windowContent = "<div id = 'iw_container'><p><strong>Name: </strong>" + placeName +
      "</p>" + "<p><strong>Address: </strong> " + placeAddress + "</p>" +
      "<p><strong>Phone:</strong>" + placePhonenos + "</p></div>" +
      "<p><strong>Url: </strong>" + url + "</p>";
    infowindowCallback(windowContent);
  })
    .fail(function () {
      infowindowCallback('Fail to connect to Forsquare');
    });
}


function getMarker(location) {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].title == location.title) {
      return markers[i];
    }
  }
}

// The View Model
function ViewModel() {
  var self = this;
  self.showSidebar = true;
  self.showSidebar$ = ko.observable(self.showSidebar);

  self.toggleSidebar = function () {
    self.showSidebar = !self.showSidebar;
    self.showSidebar$(self.showSidebar);
  };

  self.locations = ko.observableArray(locations);
  self.filteredLocations = ko.observableArray(locations);

  self.currentFilter = ko.observable("");

  self.hideShowMarker = function (location, show) {
    var marker = getMarker(location);
    marker.setVisible(show);
  };

  self.filteredLocations = ko.computed(function () {
    var search = self.currentFilter().toLowerCase();
    return ko.utils.arrayFilter(self.locations(), function (pin) {
      var show = pin.title.toLowerCase().indexOf(search) >= 0;
      self.hideShowMarker(pin, show);
      return show;
    });
  });



}