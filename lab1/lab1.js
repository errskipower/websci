// replace images not found with default image
function imgError(img) {
  img.error = '';
  img.src = 'default_prof_pic.jpg';
  return true;
}

$(document).ready(function() {
  // set to global so it can be cleared 
  var interval = null;
  
 // build twitter api url
  var count = 100; // number of tweets to return
  var query = 'web%20development'; // query to search for
  var resultType = 'recent'; // mixed = popular and realtime; recent = most recent; popular = most popular
  
  // use ajax to call get-tweets.php, which calls the twitter api
  function ajaxTweets(count, query, resultType) {
    // make api url
    var url = 'get-tweets.php?q=' + query + '&result_type=' + resultType + '&count=' + count;
    
    // get tweets
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      error: function(jqXHR, Status, ErrorThrown) {
        var htmlString =  '<li>' +
                            '<span class="error">An error has occured when fetching tweets :(</span>' + 
                            '<span class="error-msg">' + ErrorThrown + '</span>' + 
                          '</li>';
        $('#tweet-list').html(htmlString);
      },
      success: function(data) {
        displayTweets(data);
      }
    });
  }
  
  // on ajax success, show tweets from data
  function displayTweets(data) {
    // remove please wait text
    $('#tweet-list').html('');
    
    // loop through all tweets
    var tweets = data.statuses;
    for (var i = 0; i < tweets.length; i++) {

      // tweet details
      var tweet       = tweets[i];
      var dateCreated = tweet.created_at;
      var text        = tweet.text;
      var screenName  = tweet.user.screen_name;
      var profilePic  = tweet.user.profile_image_url;
      var retweets    = tweet.retweet_count;
      var favorites   = tweet.favorite_count;

      // make html string
      var htmlString =  '<li>' + 
          '<span class="prof-pic"><img src="' + profilePic + '" alt="' + screenName + '" onError="imgError(this);"></span>' +
          '<span class="tweet-info">' +
          '<span class="tweet-user"><a href="http://twitter.com/' + screenName + '">' + screenName + '</a></span>' +
          '<span class="tweet-date">' + dateCreated + '</span>' +
          '<span class="tweet-text">' + text + '</span>' +
          '<span class="tweet-retweet">' + retweets + '</span>' +
          '<span class="tweet-favorites">' + favorites + '</span>' +
          '</span>' +
          '</li>';

      // append html string to list
      $('#tweet-list').append(htmlString);
    }
    
    fadeTweets();
  }
  
  // set interval and frequency of tweets showing
  function fadeTweets() {
    // only show 5 tweets
    $('#tweet-list li').slice(0, 5).velocity({ opacity: 1 }, { display: "block", delay: 1000, duration: 1000});

    var freqency = 5000; // 3 seconds (made large because of 1000ms duration of animations)
    var numShown = 5; // 5 tweets at a time

    // show 5 new tweets every 3 seconds
    interval = setInterval(function() {
      // hide previous 5 tweets
      $('#tweet-list li').slice(numShown - 5, numShown).velocity({ opacity: 0 }, { display: "none", duration: 1000});

      // if number of tweets shown is the number of total tweets, reset numShown to 5
      if (numShown === count) { 
        numShown = 5;
      }

      // show next 5 tweets
      $('#tweet-list li').slice(numShown, numShown + 5).velocity({ opacity: 1 }, { display: "block", delay: 1000, duration: 1000});
      numShown = numShown + 5;
    }, freqency);
  }
  
  // get tweets
  ajaxTweets(count, query, resultType);
  
  // do not reload page on form submit
  $('#settings-form').submit(function() {
    return false;
  });
  
  // hide settings button and show settings panel when click "settings" button
  $('#show-settings').on('click', function() {
    $(this).velocity({ opacity: 0 }, { display: "none", duration: 200});
    $('#settings').velocity({ opacity: 1 }, { display: "block", delay: 150, duration: 500});
  });
  
  // hide settings panel and show settings button when click "close" button
  $('#settings-close').on('click', function() {
    $('#settings').velocity({ opacity: 0 }, { display: "none", duration: 500});
    $('#show-settings').velocity({ opacity: 1 }, { display: "block", delay: 400, duration: 200});
  });

  // reset tweets with new info when click "update" button
  $('#settings-submit').on('click', function() {
    // get new settings
    count             = $('#settings-count').val(); // use global count to it's set for interval
    var newQuery      = $('#settings-query').val();
    var newResultType = $('#settings-result').val();
    
    // reset tweets
    clearInterval(interval);
    ajaxTweets(count, newQuery, newResultType);
    
    // hide settings panel and show settings button
    $('#settings').velocity({ opacity: 0 }, { display: "none", duration: 500});
    $('#show-settings').velocity({ opacity: 1 }, { display: "block", delay: 400, duration: 200});
  }); 
  
});