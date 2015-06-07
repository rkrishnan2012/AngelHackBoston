Events = new Meteor.Collection("Events");

Template.mapsPage.helpers({
    twitterReady: function() {
        return Session.get("twitterReady");
    },
    num: function() {
        return Events.find().count()
    },
    angelHack: function() {
        return Session.get("angelHack");
    },
    disaster: function(){
        return Session.get("item").description;
    },
    county: function(){
        return Session.get("item").county;
    },
    area: function(){
        return Session.get("item").area;
    }
});

Template.mapsPage.events = {
    'click .helpSomeone': function(){
        $('#helpSomeoneModal').modal('show');
    },
    'click .btnCall': function(){
        Meteor.call("callFriend", $(".modal-body input").val());
        $(".modal-body input").val("");
    },
    'click .liveStream': function(){
        startChat(Session.get("item"));
    },
    'click .donateMoney': function(){
        $('#donateMoneyModal').modal('show');
    }
}

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
            plotEvent('Forest');
            plotEvent('Heat');
        },
        onStop: function(e) {
            console.log(e);
        }
    });




    //getLocation();
    var latlng = new google.maps.LatLng(42.358329, -71.05370420000001);
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        icon: 'AngelHack.png'
    });

    google.maps.event.addListener(marker, 'click', function(eve) {
        Session.set("twitterReady", true);
        Session.set("angelHack", true);
        $(".name").text("Angel Hack Boston!")
    });


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
        var county;
        var area;
        var date;
        for (var j = 0; j < events[i].data.length; j++) {
            if (events[i].data[j].name.indexOf(name) >= 0) {
                for (var k = 0; k < events[i].data.length; k++) {
                    if (events[i].data[k].type.indexOf('Country') >= 0) {
                        country = events[i].data[k].name;
                    } else if (events[i].data[k].type.indexOf('Eventtype') >= 0) {
                        description = events[i].data[k].name;
                    } else if (events[i].data[k].type.indexOf('Area') >= 0) {
                        area = events[i].data[k].name;
                    } else if (events[i].data[k].type.indexOf('Date') >= 0) {
                        date = events[i].data[k].name;
                    } else if (events[i].data[k].type.indexOf('County') >= 0) {
                        county = events[i].data[k].name;
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
                    data: events[i].data,
                    county: county,
                    area: area,
                    date: date,
                    description: description,
                    country: country,
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

    

    lastOpen = null;

    google.maps.event.addListener(marker, 'click', function(eve) {
        Session.set("twitterReady", true);
        Session.set("angelHack", false);
        lastMarker = marker;
        console.log("not angel!!!");
        console.log(item.description);
        $(".name").hide("fast", function() {
        });
        Session.set("item", item);
        $(".name").text(item.description);
        $(".date").text(item.date);
        $(".area").text(item.area);
        $(".county").text(item.county);
        console.log(item.data);
        $(".name").show("fast");
        $(".sidebar iframe").show("slow");
    });
}

function startChat(item) {
    var marker = lastMarker;
    if (lastOpen) {
        lastOpen.close();
    }

    var contentString = '<h2>Live from ' + item.country + '</h2><video id="remoteVideo"></video><video id="localVideo"></video><div class="btn btn-danger endCall">End Call</div>';
    infowindow = new google.maps.InfoWindow({
        content: contentString,
    });

    // App ID from the Respoke Dashboard for your App
    var appId = "4d8d8950-f908-4438-b131-205ae950bed5";

    // The unique username identifying the user
    var endpointId = "rohitkrishnan101@gmail.com";

    // Create an instance of the Respoke client using your App ID
    var client = respoke.createClient({
        appId: appId,
        developmentMode: true
    });



    // "connect" event fired after successful connection to Respoke
    client.listen("connect", function(e) {
        console.log("Connected to Respoke!", e);

        client.join({
            id: "Anderson7301@icloud.com",

            onSuccess: function(group) {
                group.listen("join", function(e) {
                    var endpoint = e.connection.getEndpoint();
                    console.log("Join group!!!");
                });

                group.listen("leave", function(e) {
                    var endpoint = e.connection.getEndpoint();
                });

                group.getMembers({
                    onSuccess: function(connections) {
                        console.log("got members!!!");
                        connections.forEach(function(connection) {
                            var endpoint = connection.getEndpoint();
                            var call = endpoint.startVideoCall({
                                videoLocalElement: document.getElementById("localVideo"),
                                videoRemoteElement: document.getElementById("remoteVideo")
                            });

                            client.setPresence({
                                presence: "available"
                            });

                            client.listen("message", function(e) {
                                var message = e.message.message;
                                console.log("Message!:" + message);
                            });
                            $("#remoteVideo").hide();
                            console.log("Member found!");

                            client.listen("call", function() {
                                $("#localVideo").hide("slow", function() {
                                    $("#remoteVideo").show("slow");
                                });
                            })


                            // Reference to the DIV that wraps the bottom of infowindow
                            var iwOuter = $('.gm-style-iw');

                            /* Since this div is in a position prior to .gm-div style-iw.
                             * We use jQuery and create a iwBackground variable,
                             * and took advantage of the existing reference .gm-style-iw for the previous div with .prev().
                             */
                            var iwBackground = iwOuter.prev();

                            // Removes background shadow DIV
                            iwBackground.children(':nth-child(2)').css({
                                'display': 'none'
                            });

                            // Removes white background DIV
                            iwBackground.children(':nth-child(4)').css({
                                'display': 'none'
                            });

                            // Moves the infowindow 115px to the right.
                            iwOuter.parent().parent().css({
                                left: '115px'
                            });

                            // Moves the shadow of the arrow 76px to the left margin.
                            iwBackground.children(':nth-child(1)').attr('style', function(i, s) {
                                return s + 'left: 76px !important; '
                            });

                            // Moves the arrow 76px to the left margin.
                            iwBackground.children(':nth-child(3)').attr('style', function(i, s) {
                                return s + 'left: 76px !important;'
                            });

                            // Changes the desired tail shadow color.
                            iwBackground.children(':nth-child(3)').find('div').children().css({
                                'box-shadow': 'rgba(0, 0, 0, 0.6) 0px 1px 6px',
                                'z-index': '1'
                            });

                            // Reference to the div that groups the close button elements.
                            var iwCloseBtn = iwOuter.next();

                            // Apply the desired effect to the close button
                            iwCloseBtn.css({
                                opacity: '0',
                                right: '38px',
                                top: '3px',
                                border: '7px solid #48b5e9',
                                'border-radius': '13px',
                                'box-shadow': '0 0 5px #3990B9'
                            });

                            // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
                            if ($('.iw-content').height() < 140) {
                                $('.iw-bottom-gradient').css({
                                    display: 'none'
                                });
                            }

                            $(".endCall").click(function() {
                                call.hangup();
                                infowindow.close();
                            });

                            // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
                            iwCloseBtn.mouseout(function() {
                                $(this).css({
                                    opacity: '1'
                                });
                            });
                        });
                    }
                });
            }
        });



    });

    client.listen("call", function(e) {
        var call = e.call;
        console.log(call);
        console.log("GOT A CALL!!!!");
    });

    console.log("COnnecting to respoke.");
    // Execute some signin event, then connect to Respoke with
    client.connect({
        endpointId: endpointId
    });


    lastOpen = infowindow;
    infowindow.open(map, marker);
    ''
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / (60 * 60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}