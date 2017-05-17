// Locations used to get data info
var places = [{
        title: 'Gino\'s Fine Italian Food',
        lat: 36.6534953,
        long: -121.6635947
    },
    {
        title: 'Starbucks',
        lat: 36.70009549,
        long: -121.620144
    },
    {
        title: 'Red Lobster',
        lat: 36.71627532,
        long: -121.65454218333333
    },
    {
        title: 'Pizza Factory',
        lat: 36.714358,
        long: -121.62454
    },
    {
        title: 'In-N-Out Burger',
        lat: 36.6799039,
        long: -121.6412926
    }
];

var map;
var infoWindow;

function Location(data) {
    var self = this;
    this.name = data.title;
    this.lat = data.lat;
    this.long = data.long;
    this.visible = ko.observable(true);
    var venue_Id = getVenueID(data.lat, data.lng, data.title);
    //console.log(getVenueID(data.lat, data.lng, data.title));

    // Return venueId of places
    function getVenueID(venue_Id) {
        var venue_Id;
        var data = $.ajax({
            url: 'https://api.foursquare.com/v2/venues/search',
            type: 'GET',
            dataType: 'JSON',
            async: true,
            data: {
                ll: self.lat + "," + self.long,
                client_id: "OOP4UD2NULX4YWM0WNDAKCDDN5AOZSQJYZCERJXNHRCAP3RH",
                client_secret: "DU0S5DBQQD5SIZB1NIYSU3YJ2GOFKJ2WDY4MLT5O3C2TTFLH",
                v: '20150609'
            },

            error: function() {
                alert("An error has occurred");
            },
            success: function(data) {
                $.each(data.response.venues, function(i, item) {

                    if (item.name == self.name) {
                        venue_Id = item.id;

                        // Ajax call to retreive photos
                        var photos = [];
                        var photossUrl = 'https://api.foursquare.com/v2/venues/' + venue_Id + '/photos';
                        $.ajax({
                            url: photossUrl,
                            type: 'GET',
                            dataType: 'JSON',
                            data: {
                                client_id: "OOP4UD2NULX4YWM0WNDAKCDDN5AOZSQJYZCERJXNHRCAP3RH",
                                client_secret: "DU0S5DBQQD5SIZB1NIYSU3YJ2GOFKJ2WDY4MLT5O3C2TTFLH",
                                v: '20150609',
                                limit: 1,
                                sort: 'recent'
                            }
                        }).done(function(data) {
                            $.each(data.response.photos.items, function(i, photo) {
                                photos.push('<div class="photo"><img src=' + photo.prefix + photo.width + photo.suffix + '></div>');
                            });
                            self.photos = '<div class="photos">' + photos.join('') + '</div>';
                        }).fail(function(jqXHR, textStatus) {
                            alert(self.title + ': Photos Error!');
                        });

                        // Ajax call to tretrieve Menu
                        var menus = [];
                        $.ajax({
                            url: 'https://api.foursquare.com/v2/venues/' + venue_Id + '/menu',
                            type: 'GET',
                            dataType: 'JSON',
                            data: {
                                client_id: "OOP4UD2NULX4YWM0WNDAKCDDN5AOZSQJYZCERJXNHRCAP3RH",
                                client_secret: "DU0S5DBQQD5SIZB1NIYSU3YJ2GOFKJ2WDY4MLT5O3C2TTFLH",

                                v: '20150609'
                            },
                            success: function(data) {
                                //alert("AA");
                                //document.body.innerHTML = '<pre>' + JSON.stringify(data, null, 4) + '</pre>';
                                //alert(data.response.menu.menus.items);
                                $.each(data.response.menu.menus.items, function(i, item) {
                                    $.each(item.entries.items, function(i, menu) {
                                        //alert(menu.name);
                                        var name = '<strong>' + menu.name + '</strong>: ';
                                        menus.push('<li>' + name + '</li>');
                                    });
                                    //alert(item.entries.items);
                                });
                                self.menus = '<div class="menus">' + menus.join('') + '</div>';

                            },
                            error: function() {
                                alert(self.title + ': Menu Error!');
                            }
                        })

                    }
                });

            }
        });

        return venue_Id;
    }

    infoWindow = new google.maps.InfoWindow();
    this.marker = new google.maps.Marker({
        position: new google.maps.LatLng(data.lat, data.long),
        map: map,
        title: data.title
    });

    this.isVisible = ko.computed(function() {
        if (this.visible() === true) {
            this.marker.setMap(map);
        } else {
            this.marker.setMap(null);
        }
        return true;
    }, this);

    // Close  infoWindow
    google.maps.event.addListener(this.marker, 'click', function() {
        infoWindow.close();
    });

    this.marker.addListener('click', function() {
        infoWindow.setContent(self.photos + self.menus);
        infoWindow.open(map, this);
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            self.marker.setAnimation(null);
        }, 2100);
    });

    this.bounce = function(place) {
        google.maps.event.trigger(self.marker, 'click');
    };
};

function VM() {
    var self = this;
    this.query = ko.observable("");
    this.placeList = ko.observableArray([]);

    var mapOptions = {
        zoom: 14,
        center: new google.maps.LatLng(36.711971, -121.654240),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    places.forEach(function(locationItem) {
        self.placeList.push(new Location(locationItem));
    });

    this.search = ko.computed(function() {
        var filter = self.query().toLowerCase();
        if (!filter) {
            self.placeList().forEach(function(locationItem) {
                locationItem.visible(true);
            });
            return self.placeList();
        } else {
            return ko.utils.arrayFilter(self.placeList(), function(locationItem) {
                var string = locationItem.name.toLowerCase();
                var result = (string.search(filter) >= 0);
                locationItem.visible(result);
                return result;
            });
        }
    }, self);
}

function init() {
    ko.applyBindings(new VM());
}

function errorHandling() {
    alert("Google Maps has failed to load. Please check your internet connection.");
}