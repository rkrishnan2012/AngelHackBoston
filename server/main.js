Events = new Meteor.Collection("Events");

Meteor.methods({
    findVideos: function(description) {
        Future = Npm.require('fibers/future');
        var fut = new Future();
        search_youtube(description, function(err, result) {
            console.log(result);
            fut['return'](result);
        })
        return fut.wait();
    },
    callFriend: function(number){
        HTTP.call("POST", "http://52.10.249.140/api/call", {
            data: {
                "message": 'Hello World!',
                "recipients": [number.toString()],
                "dateToSendOn": "06/06/2015 12:00:00 EST",
                "AccountID": "123456"
            }
        },
        function(error, result) {
            if (!error) {
                console.log(result.data.id);
                Fiber = Npm.require('fibers');
                Fiber(function() {
                    console.log(Meteor.http.call("GET", "http://52.10.249.140/api/call/" + result.data.id).data.documents[0]);
                }).run();
            }
        });
    }
})


// Search Youtube -- callback is called on each found item
function search_youtube(query, callback) {
    var google = Meteor.npmRequire('googleapis');
    google.options({
        auth: 'AIzaSyA8YufTMteSuF5zH5EAfYvziN6t03y3vZA'
    });
    var youtube = google.youtube('v3');

    youtube.search.list({
            part: 'snippet',
            type: 'video',
            q: query,
            maxResults: 1,
            order: 'date',
            safeSearch: 'moderate',
            videoEmbeddable: true
        },
        function(err, res) {
            if (err) {
                return callback(err);
            }
            res.items.forEach(function(result) {
                var video = {
                    id: result.id.videoId,
                    urlShort: 'http://youtu.be/' + result.id.videoId,
                    urlLong: 'http://www.youtube.com/watch?v=' + result.id.videoId,
                    published: result.snippet.publishedAt,
                    title: result.snippet.title || '',
                    description: result.snippet.description || '',
                    images: result.snippet.thumbnails,
                    channelTitle: result.snippet.channelTitle,
                    channelId: result.snippet.channelId,
                    live: result.snippet.liveBroadcastContent || ''
                };

                youtube.videos.list({
                        part: 'contentDetails',
                        id: video.id
                    },
                    function(err2, data) {
                        if (err2) {
                            return callback(err2);
                        }
                        if (data.items.length >= 1) {
                            data.items[0].contentDetails.duration.replace(/PT(\d+)M(\d+)S/, function(t, m, s) {
                                video.duration = (parseInt(m) * 60) + parseInt(s);
                            });
                            video.definition = data.items[0].contentDetails.definition;
                            callback(null, video);
                        }
                    }
                );
            });
        }
    );
}

Meteor.publish('Events', function publishFunction() {
    return Events.find();
});

Meteor.startup(function() {

    


    Events.remove({

	});

	var fun = Meteor.bindEnvironment(function() {
        Future = Npm.require('fibers/future');

        request = Meteor.npmRequire('request');

        Fiber = Npm.require('fibers');

        fiber = Fiber.current;
        
        request('http://hisz.rsoe.hu/alertmap/index2.php', function(error, response, html) {
            if (!error && response.statusCode == 200) {
                ch = cheerio.load(html);
                ch('a[href*=event_summary]').each(function(i, element) {
                    if (ch(this).attr('href').indexOf("site/index.php?") >= 0) {
                        getMoreDetails(ch(this).attr('href'));
                    }
                });

                ch('a[href*=seism_index]').each(function(i, element) {
                    if (ch(this).attr('href').indexOf("site/index.php?") >= 0) {
                        getMoreDetailsCustom(ch(this).attr('href'), "Earthquake");
                    }
                });

                ch('a[href*=tsunami_index]').each(function(i, element) {
                    if (ch(this).attr('href').indexOf("site/index.php?") >= 0) {
                        getMoreDetailsCustom(ch(this).attr('href'), "Tsunami");
                    }
                });

                console.log("Done. Hi-Five.");
            }
        });
    });

    fun();
});

function getMoreDetailsCustom(url, name) {
    var newUrl = "http://hisz.rsoe.hu/alertmap/" + url;
    request(newUrl, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            ch = cheerio.load(html);
            var eventProperties = [];
            var a = 0;

            ch("td.style1").each(function(i, element) {
                if (trim(ch(this).text()) !== "") {
                    eventProperties[trim(ch(this).text())] = (ch(this).next().text());
                }
            });

            eventProperties["Eventtype:"] = name;

            console.log(eventProperties["EDISNumber:"]);

            var output = [],
                item;

            for (var type in eventProperties) {
                if (eventProperties.hasOwnProperty(type)) {
                    item = {};
                    item.type = type;
                    item.name = eventProperties[type];
                    output.push(item);
                }
            }

            Fiber(function() {
                Events.upsert({
                    'edis': eventProperties["EDISNumber:"]
                }, {
                    edis: eventProperties["EDISNumber:"],
                    data: output
                });
            }).run();
        }
    });
}

function getMoreDetails(url) {
    var newUrl = "http://hisz.rsoe.hu/alertmap/" + url;
    request(newUrl, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            ch = cheerio.load(html);
            var eventProperties = [];
            var a = 0;

            ch("td.style1").each(function(i, element) {
                if (trim(ch(this).text()) !== "") {
                    eventProperties[trim(ch(this).text())] = (ch(this).next().text());
                }
            });

            console.log(eventProperties["EDISNumber:"]);

            var output = [],
                item;

            for (var type in eventProperties) {
                if (eventProperties.hasOwnProperty(type)) {
                    item = {};
                    item.type = type;
                    item.name = eventProperties[type];
                    output.push(item);
                }
            }

            Fiber(function() {
                Events.upsert({
                    'edis': eventProperties["EDISNumber:"]
                }, {
                    edis: eventProperties["EDISNumber:"],
                    data: output
                });
            }).run();
        }
    });
}

function trim(str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '').replace(" ", "");
}