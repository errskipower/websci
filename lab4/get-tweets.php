<?php
  header('Content-Type: application/json');

  ini_set('display_errors', 1);
  require_once('twitter-api-php-master/TwitterAPIExchange.php');

  /** Set access tokens here - see: https://dev.twitter.com/apps/ **/
  $settings = array(
    'oauth_access_token' => "18505566-3jVZbgyCFm3u1uXiYtkSsoeZGWegjQRcvsBvDCJwB",
    'oauth_access_token_secret' => "Lw6uKY2Y3o4nkr3ZmLD6dcu2cOa1pmVcO42hYguJFVnya",
    'consumer_key' => "y2pU70l71RvmqwyG3VlXXK62u",
    'consumer_secret' => "usldM5xCrIXMjbStaUFEXVJPT7lPMVOPvlbZfB2eEEqXzZ7qlA"
  );

  /** Perform a GET request and echo the response **/
  /** Note: Set the GET field BEFORE calling buildOauth(); **/

  $url = 'https://api.twitter.com/1.1/search/tweets.json';
  $getfield = '?' . $_SERVER['QUERY_STRING'];
  $requestMethod = 'GET';
  $twitter = new TwitterAPIExchange($settings);

  $api_response = $twitter ->setGetfield($getfield)
    ->buildOauth($url, $requestMethod)
    ->performRequest();

  echo $api_response;
?>