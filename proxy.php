<?php
// The Megaplay URL you want to proxy
$target = "https://megaplay.buzz/stream/s-2/143128/sub";

// Create a stream context with spoofed headers
$options = [
    "http" => [
        "header" => [
            "Referer: https://hianimes.lv/",
            "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36"
        ]
    ]
];

$context = stream_context_create($options);

// Get the content from Megaplay
$response = file_get_contents($target, false, $context);

// If there’s an error
if ($response === false) {
    http_response_code(500);
    echo "Error: Unable to fetch stream.";
    exit;
}

// Pass content to browser
header("Content-Type: text/html; charset=UTF-8");
echo $response;
?>
