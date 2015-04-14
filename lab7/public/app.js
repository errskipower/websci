// create angular app module and set up socket
tweetsApp = angular.module('tweetsApp', ['ngMaterial', 'btford.socket-io'])
  .factory('socket', function(socketFactory) {
    return socketFactory({
      ioSocket: io.connect('http://localhost:3000')
    });
  });

// controller for app
tweetsApp.controller('tweetsController', ['$scope', 'socket', function($scope, socket) {
  
  $scope.showWait = false; // show waiting spinner
  $scope.tweetCount = 20; // # of tweets to save to file
  $scope.tweets = {}; // list of JSON tweet objects (5 at a time)
  $scope.allTweetsCount = []; // list of JSON tweet objects (size is # of tweetCount)
  $scope.saved = false; // saved JSON file
  $scope.isJsonToConvert = false; // is there a json file saved that we can convert?
  $scope.jsonFileToConvert = ''; // name of json file to convert
  $scope.csvFileName = ''; // name of new csv file
  $scope.csvSaved = false; // saved CSV file
  $scope.canBuildDB = false; // are there tweets available to build DB?
  $scope.canReadDB = false; // are there tweets in db and have i not read from it yet?
  $scope.isDBSaved = false; // has the DB been build and are there tweets in it?
  $scope.isDBRead = false; // has the DB read from?
  $scope.dbTweets = {}; // list of JSON tweet objects read from the DB
  $scope.isJsonDBSaved = false // saved JSON file from db

  var old_query = ''; // old query

  // on new query submitted
  $scope.newQuery = function(count, q) {
    $scope.saved = false; // reset saved file to false
    $scope.tweetCount = count; // set new # of tweets to save
    $scope.showWait = true; // show waiting spinner

    // if new query is different than previous query, remove old query info
    if (old_query !== '') {
      socket.emit('remove', old_query);
    }

    // pull tweets
    getTweets(count, q);
    old_query = q;
  }

  // on new query submit
  $scope.submit = function($event) {
    if ($event.which !== 13) return;
    if ($scope.tweetCount) {
      $scope.newQuery($scope.tweetCount, $scope.query)
    }
  }

  // on file saved
  socket.on('saved', function(fileName) {
    $scope.saved = true;
    $scope.isJsonToConvert = true;
    $scope.jsonFileToConvert = fileName;
    $scope.canBuildDB = true;
  });

  // close saved dialog
  $('.save-close').on('click', function() {
    $(this).parent().parent('.save').hide();
    $scope.saved = false;
    $scope.csvSaved = false;
  });

  // on save CSV file
  $scope.saveCSV = function() {
    socket.emit('save_csv', $scope.jsonFileToConvert, $scope.csvFileName);
  }

  // on CSV file saved
  socket.on('saved_csv', function(fileName) {
    $scope.csvSaved = true;
  });

  // build mongoDB of tweets
  $scope.buildDB = function() {
    $scope.canBuildDB = false;
    socket.emit('build_db', $scope.allTweetsCount);
  }

  // on tweets saved to DB
  socket.on('saved_db', function() {
    $scope.isDBSaved = true;
    $scope.canReadDB = true;
  });

  // read from DB
  $scope.readDB = function() {
    $scope.canReadDB = false;
    socket.emit('read_db');
  }

  // on tweets read from DB
  socket.on('db_read', function(tweets) {
    $scope.isDBRead = true;
    $scope.dbTweets = tweets;
    $('#query_tweets').css({
      'width': '380px',
      'display': 'inline-block',
      'margin-right': '10px'
    });
  });

  // build mongoDB of tweets
  $scope.jsonDB = function() {
    $scope.isDBSaved = false;
    socket.emit('json_db', $scope.jsonFileName);
  }

  socket.on('saved_json', function() {
    $scope.isJsonDBSaved = true;
  });

  /**************************************
  /////////// Private Methods ///////////
  **************************************/

  // update tweets list when new tweet comes in
  function updateScope(q) {
    $scope.tweets = $scope['tweets_' + q];
  }

  // pull tweets about query
  function getTweets(count, q) {
    // tell server to get tweets about q
    socket.emit('q', q);

    // tweets list of specific query
    $scope['tweets_' + q] = [];

    // total count of tweets pulled so far
    var totalCount = 0;

    // when new tweet comes in
    socket.on('tweet_' + q, function(tweet) {
      totalCount++;
      // console.log(q, tweet.id);

      // save file if count # of tweets have come in
      if (totalCount == count) {
        socket.emit('save_file', count, q);
      }

      // hide waiting spinner
      $scope.showWait = false;

      // only display 5 tweets at a time
      if ($scope['tweets_' + q].length == 5) {
        $scope['tweets_' + q].shift();
      }
      $scope['tweets_' + q] = $scope['tweets_' + q].concat(tweet);

      if ($scope.allTweetsCount.length < $scope.tweetCount) {
        $scope.allTweetsCount.push(tweet);
      }

      // update tweets list and display
      updateScope(q);
    });
  }

}]);