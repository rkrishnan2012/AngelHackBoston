Events = new Meteor.Collection("Events");

Template.mapsPage.onRendered(function() {
    var map_style = [{
        "stylers": [{
            "saturation": -100
        }]
    }, {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#0099dd"
        }]
    }, {
        "elementType": "labels",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "poi.park",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#aadd55"
        }]
    }, {
        "featureType": "road.highway",
        "elementType": "labels",
        "stylers": [{
            "visibility": "on"
        }]
    }, {
        "featureType": "road.arterial",
        "elementType": "labels.text",
        "stylers": [{
            "visibility": "on"
        }]
    }, {
        "featureType": "road.local",
        "elementType": "labels.text",
        "stylers": [{
            "visibility": "on"
        }]
    }, {}];
    var mapOptions = {
        center: {
            lat: 35.7748760,
            lng: -78.9514510
        },
        styles: map_style,
        zoom: 3
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    console.log("Map is loaded!");

    Meteor.subscribe('Events', {
        onReady: function() {
            console.log("DONE");
            plotEvent('Volcano');
            plotEvent('Earthquake', 10);
            plotEvent('Tsunami');
            plotEvent('Biological');
        },
        onStop: function(e) {
            console.log(e);
        }
    });




    //getLocation();
    /*var latlng = new google.maps.LatLng(loc.lat, loc.lon);
     new google.maps.Marker({
        position: latlng,
        map: map,
        icon: 'earthquake.gif'
     });*/
});


function plotEvent(name, limit) {
    var events = Events.find().fetch();
    if (!limit) {
        limit = 9999999;
    }

    for (var i = 0; i < Math.min(limit, events.length); i++) {
        var lat;
        var lon;
        var country;
        for (var j = 0; j < events[i].data.length; j++) {
            if (events[i].data[j].name.indexOf(name) >= 0) {
                for (var k = 0; k < events[i].data.length; k++) {
                    if (events[i].data[k].type.indexOf('Country') >= 0) {
                        country = events[i].data[k].name;
                    } else if (events[i].data[k].type.indexOf('Eventtype') >= 0) {
                        description = events[i].data[k].name;
                    } else if (events[i].data[k].type.indexOf('Coordinate:') >= 0) {
                        var coord = events[i].data[k].name;
                        lat = coord.split(',')[0];
                        lon = coord.split(',')[1];
                        if (lat.indexOf("N") == -1 && lat.indexOf("S") == -1 && lat.indexOf("E") == -1 && lat.indexOf("W") == -1) {
                            lat = convertDMSToDD(lat.split(' ')[0].replace('°', ''),
                                lat.split(' ')[1].split('.')[0],
                                lat.split(' ')[1].split('.')[1],
                                "");
                            lon = convertDMSToDD(lon.split(' ')[1].replace('°', ''),
                                lon.split(' ')[2].split('.')[0],
                                lon.split(' ')[2].split('.')[1],
                                "");
                            var temp = lat;
                            lat = lon;
                            lon = temp;
                        } else {
                            lat = convertDMSToDD(lat.split(' ')[5].replace('°', ''),
                                lat.split(' ')[6].split('.')[0],
                                lat.split(' ')[6].split('.')[1],
                                lat.split(' ')[4]);

                            lon = convertDMSToDD(lon.split(' ')[2].replace('°', ''),
                                lon.split(' ')[3].split('.')[0],
                                lon.split(' ')[3].split('.')[1],
                                lon.split(' ')[1]);

                        }
                    }
                }

                addMarker({
                    lat: lat,
                    lon: lon,
                    name: name,
                    description: description,
                    text: name + " in " + country
                });
            }
        }
    }
}

function addMarker(item) {
    var latlng = new google.maps.LatLng(item.lat, item.lon);
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        icon: item.name + '.png'
    });

    var contentString = '<div id="player"></div>';

    infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    var lastOpen = infowindow;

    google.maps.event.addListener(marker, 'click', function(eve) {
        $(".name").hide("fast", function() {
            $(".name").text(item.description);
            $(".name").show("fast");
        });
        lastOpen.close();
        lastOpen = infowindow;
        infowindow.open(map, marker);
        Meteor.call("findVideos", item.description, function(err, result) {
            // 2. This code loads the IFrame Player API code asynchronously.
            var tag = document.createElement('script');

            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // 3. This function creates an <iframe> (and YouTube player)
            //    after the API code downloads.
            var player;

            function onYouTubeIframeAPIReady() {
                player = new YT.Player('player', {
                    height: '390',
                    width: '640',
                    videoId: 'M7lc1UVf-VE',
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                    }
                });
            }

            // 4. The API will call this function when the video player is ready.
            function onPlayerReady(event) {
                event.target.playVideo();
            }

            // 5. The API calls this function when the player's state changes.
            //    The function indicates that when playing a video (state=1),
            //    the player should play for six seconds and then stop.
            var done = false;

            function onPlayerStateChange(event) {
                if (event.data == YT.PlayerState.PLAYING && !done) {
                    setTimeout(stopVideo, 6000);
                    done = true;
                }
            }

            function stopVideo() {
                player.stopVideo();
            }''
        })
    });
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / (60 * 60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}