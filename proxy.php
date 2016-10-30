<?php

$client_id = '<YOUR CLIENT ID>';
$client_secret = '<YOUR CLIENT SECRET>';

$result = '{"error":"Invalid credentials!"}';
 
if (isset($_GET['url'])) {
  $props = ['callback', 'token', 'url', 'method'];
 
  foreach ($props as $prop) {
    $$prop = '';
    if (isset($_GET[$prop])) {
      $$prop = $_GET[$prop];
      unset($_GET[$prop]);
    }
  }
 
  $method = !$method ? 'GET' : $method;

  $fields = $_GET;

  if (isset($fields['grant_type'])) {
    $fields['client_id'] = $client_id;
    $fields['client_secret'] = $client_secret;
  }

  if ($method === 'GET') {
    $url .= '?' . http_build_query($fields);
  }

  // url-ify the data for the POST
  foreach($fields as $key=>$value) { $fields_string .= $key.'='.$value.'&'; }
  rtrim($fields_string, '&');

  // open connection
  $ch = curl_init();

  // set the url, number of POST vars, POST data
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  if ($token) {
    $authorization = "Authorization: Bearer {$token}";
    curl_setopt($ch, CURLOPT_HTTPHEADER, [$authorization]);
  }

  if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, count($fields));
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields_string);
  }

  // execute post
  $result = curl_exec($ch);

  // close connection
  curl_close($ch);
}

// jsonp
if ($callback) {
  $result = $callback . '(' . $result . ')';
}

header('content-type: application/json');
die($result);