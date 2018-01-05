console.log("loading");

$(document).ready ( function () {
    $("#trigger").click( function(){
        performRequest("https://4cqzyk1fe4.execute-api.us-east-1.amazonaws.com/Prod/getinfo",JSON.stringify({ "bucket": "testing-igngar","key": "someguy.jpg"}) );
    });

    function performRequest(urlPost,payload){
        console.log("posting");
        $.ajax({
            type: 'POST',
            url: urlPost,
            crossDomain: true,
            contentType: 'application/json',
            xhrFields: {
                withCredentials: false
            },
            data: payload,
            dataType: 'json',
            success: function(responseData, textStatus, jqXHR) {
                console.log( "Data Loaded: " + responseData );
                $('#caca').html(responseData[0].Urls[0]);
            },
            error: function (responseData, textStatus, errorThrown) {
                console.log('POST failed.');
            }
        });
    }
});