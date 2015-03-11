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
  $scope.tweets = {}; // list of JSON tweet objects
  $scope.saved = false; // saved file

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
  socket.on('saved', function() {
    $scope.saved = true;
  });

  // close saved dialog
  $('.save-close').on('click', function() {
    $scope.saved = false;
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
      console.log(q, tweet.id);

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

      // update tweets list and display
      updateScope(q);
    });
  }

}]);