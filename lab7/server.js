// required dependencies
var express  = require('express'),
    app      = express(),
    twitter  = require('twit'),
    path     = require('path'),
    server   = require('http').Server(app),
    fs       = require('fs'),
    io       = require('socket.io')(server),
    json2csv = require('json2csv'),
    mongoose = require('mongoose'),
    dbUrl    = 'mongodb://localhost/lab7-tweets-db';

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

// connect to mongoDB
mongoose.connect(dbUrl);
// create tweet schema
var Schema = mongoose.Schema;
var TweetSchema = new Schema({
  created_at: String,
  id: Number,
  text: String,
  user_id: Number,
  user_name: String,
  user_screen_name: String,
  user_location: String,
  user_followers_count: Number,
  user_friends_count: Number,
  user_created_at: String,
  user_time_zone: String,
  user_profile_background_color: String,
  user_profile_image_url: String,
  retweet_count: Number,
  favorite_count: Number,
  geo: String,
  coordinates: String,
  place: String
});
// create tweet model
var Tweet = mongoose.model('Tweet', TweetSchema, 'tweet');

//clear out old data
Tweet.remove({}, function(err) {
  if (err) {
    console.log('>> ERROR deleting old tweet data');
  }
  console.log('>> REMOVED old tweets from DB');
});

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

    //clear out old data
    Tweet.remove({}, function(err) {
      if (err) {
        console.log('>> ERROR deleting old tweet data');
      }
      console.log('>> REMOVED old tweets from DB');
    });
    
    // close mongoose connection to mongoDB
    mongoose.connection.close();
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
      if (err) {
        console.log('>> ERROR saving JSON to file');
        throw err;
      };
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
        if (err) {
          console.log('>> ERROR converting JSON to CSV');
          throw err;
        };
        // save csv file
        fs.writeFile(__dirname + '/csv_files/' + csvFile + '.csv', csv, function(err2) {
          if (err2) {
            console.log('>> ERROR writing data to CSV file');
            throw err2;
          };
          console.log('>> SAVED CSV file');
          socket.emit('saved_csv', csvFile + '.csv');
        });
      }
    );
  });

  // build mongoDB
  socket.on('build_db', function(tweets) {

    // loop through tweets and add to db
    for (var i = 0; i < tweets.length; i++) {
      // parse JSON data
      var jparse = tweets[i];
      // create object of tweet info
      var tweetObject = {
          created_at: jparse.created_at,
          id: jparse.id,
          text: jparse.text,
          user_id: jparse.user.id,
          user_name: jparse.user.name,
          user_screen_name: jparse.user.screen_name,
          user_location: jparse.user.location,
          user_followers_count: jparse.user.followers_count,
          user_friends_count: jparse.user.friends_count,
          user_created_at: jparse.user.created_at,
          user_time_zone: jparse.user.time_zone,
          user_profile_background_color: jparse.user.profile_background_color,
          user_profile_image_url: jparse.user.profile_image_url,
          retweet_count: jparse.retweet_count,
          favorite_count: jparse.favorite_count,
          geo: jparse.geo,
          coordinates: jparse.coordinates,
          place: jparse.place
      };
      // save tweet
      var addTweet = new Tweet(tweetObject);
      addTweet.save(function(err, addTweet) {
        if (err) {
          console.log('>> ERROR saving tweet to DB');
          throw err;
        }
      });
    }

    console.log('>> SAVED ' + tweets.length + ' Tweets to DB');
    socket.emit('saved_db');
    
  });

  // read from mongoDB
  socket.on('read_db', function() {
    console.log('>> READING tweets...');

    // find all tweets in db
    Tweet.find().lean().exec(function(err, foundTweets) {
      console.log('>> FINDING tweets...');
      if (err) {
        console.log('>> ERROR reading tweets from DB');
        throw err;
      }
      console.log('>> READ Tweets from DB');
      socket.emit('db_read', foundTweets);
    });
  });

  // save json from mongoDB
  socket.on('json_db', function(jsonFileName) {

    // find all tweets in db
    Tweet.find().lean().exec(function (err, tweets) {
      console.log('>> FINDING tweets for JSON...');
      if (err) {
        console.log('>> ERROR converting DB tweets to JSON');
        throw err;
      }

      // convert tweets object to json string
      var data = JSON.stringify(tweets);
      
      // write data to file using user specified name
      var f = __dirname + '/json_files/' + jsonFileName + '.json';
      fs.writeFile(f, data, 'utf-8', function(err) {
        if (err) {
          console.log('>> ERROR saving JSON to file');
          throw err;
        }
        console.log('>> SAVED JSON from DB to file');
        socket.emit('saved_json', f);
      });
    });
  });

});

// start server on port
server.listen(app.get('port'), function() {
  console.log('Server up on port ' + app.get('port'));
});
