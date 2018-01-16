function include(file)
{
  var script  = document.createElement('script');
  script.src  = file;  script.type = 'text/javascript';  script.defer = true;
  document.getElementsByTagName('head').item(0).appendChild(script);
}

include("front-js/jquery.jsontotable.js");

//Modify with the url of the API
var api = "https://ilbenr8ro4.execute-api.us-east-1.amazonaws.com";

console.log("loading");
$(document).ready ( function () {
    $("#trigger").click( function(){
        performRequest(api+"/Prod/getinfo",JSON.stringify({ "bucket": "serverless-ops-frontend-igngar","key": "someguy.jpg"}) );
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
                console.log(responseData);
                $.jsontotable(responseData, { id: '#jsontotable', header: false });
            },
            error: function (responseData, textStatus, errorThrown) {
                console.log('POST failed.');
            }
        });
    }
    
});