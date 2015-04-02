// required dependencies
var express  = require('express'),
    app      = express(),
    twitter  = require('twit'),
    path     = require('path'),
    server   = require('http').Server(app),
    fs       = require('fs'),
    io       = require('socket.io')(server),
    json2csv = require('json2csv');

// connect on port 3000, use public directory for app
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// create twit object
var twitterClient = new twitter({
  consumer_key: 'z4mcGgfuEULmwrVGi4gbw',
  consumer_secret: 'XhJvjUlO4Km9Xl1TfHZokp5f7y2vLHzYEUT5meel8',
  access_token: '18505566-8zewPf64oZnXM4dSFSwRhk4en85BRJbPwXzNiAr3G',
  access_token_secret: 'gHTjBlu1bEeD5V1SxtzjDKz01i3iprI7JkPSZTLsPKHka'
});

var queries = []; // hold all queries
var tweetJSON= []; // hold all tweets

// on socket connection
io.on('connection', function(socket) {
  queries[socket.id] = {}; // queries by user
  tweetJSON[socket.id] = {}; // tweets by user

  // on submit query
  socket.on('q', function(q) {

    // if current query does not exist
    if (!queries[socket.id][q]) {
      tweetJSON[socket.id][q] = new Array();
      console.log('>> NEW Search: ' + q);

      // create twitter stream of statuses that have query
      var stream = twitterClient.stream('statuses/filter', {track: q});

      // when tweet comes it, send it to angular controller
      stream.on('tweet', function(tweet) {
        tweetJSON[socket.id][q].push(tweet);
        socket.emit('tweet_' + q, tweet);
      });

      // tweet limit for user
      stream.on('limit', function(limitMessage) {
        console.log('LIMIT for user (' + socket.id + ') on query (' + q + ') has been reached');
      });

      // twitter warning
      stream.on('warning', function(warning) {
        console.log('WARNING', warning);
      });

      // twitter disconnect
      stream.on('disconnect', function(disconnectMessage) {
        console.log('DISCONNECT', disconnectMessage)
      });

      queries[socket.id][q] = stream;
    }
  });
  
  // on new query, remove old queries/tweets
  socket.on('remove', function(q) {
    queries[socket.id][q].stop();
    delete queries[socket.id][q];
    delete tweetJSON[socket.id][q];
    console.log('>> REMOVED Search: ' + q);
  });

  // on socket (user) disconnect, remove user info
  socket.on('disconnect', function() {
    for (var i in queries[socket.id]) {
      queries[socket.id][i].stop();
      delete queries[socket.id][i];
    }
    delete queries[socket.id];
    console.log('>> REMOVED all searches from ' + socket.id);
  });

  // save JSON file of tweets
  socket.on('save_file', function(numTweets, q) {
    // create JSON data string
    var data = '[';
    for (t in tweetJSON[socket.id][q]) {
      if (t == numTweets - 1) {
        data += JSON.stringify(tweetJSON[socket.id][q][t]); 
        break;
      }
      data += JSON.stringify(tweetJSON[socket.id][q][t]) + ','; 
    }
    data += ']';

    // write data to file using convention: [timestamp]_[query]_tweets.json
    var f = __dirname + '/json_files/' + Date.now().toString() + '_' + q +'_tweets.json';
    fs.writeFile(f, data, 'utf-8', function(err) {
      if (err) throw err;
      console.log('>> SAVED JSON to file');
      socket.emit('saved', f);
    });
  });

  // save CSV file
  socket.on('save_csv', function(jsonFile, csvFile) {
    // read in json file
    var jsonObj = require(jsonFile); 

    // convert to csv
    json2csv( 
      {
        data: jsonObj,
        fields: ["created_at","id","text","user_id","user_name","user_screen_name","user_location","user_followers_count","user_friends_count","user_created_at","user_time_zone","user_profile_background_color","user_profile_image_url","geo","coordinates","place"]
      },
      function(err, csv) {
        if (err) throw err;
        // save csv file
        fs.writeFile(csvFile + '.csv', csv, function(err) {
          if (err) throw err;
          console.log('>> SAVED CSV file');
          socket.emit('saved_csv', csvFile + '.csv');
        });
      }
    );
  });
});

// start server on port
server.listen(app.get('port'), function() {
  console.log('Server up on port ' + app.get('port'));
});
