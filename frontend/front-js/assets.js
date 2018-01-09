console.log("loading");

$(document).ready ( function () {
    $("#trigger").click( function(){
        performRequest("https://klyj1f4rcj.execute-api.us-east-1.amazonaws.com/Prod/getinfo",JSON.stringify({ "bucket": "testing-igngar","key": "someguy.jpg"}) );
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
                $('#place-holder').append("<table>");
                /*for (var i=0;i<responseData.length;i++){
                    console.log(responseData[i]["Name"]);
                    $('#place-holder').append("<tr>");
                    $('#place-holder').append("<td>"+responseData[i]+"</td>");
                    $('#place-holder').append("<td>"+responseData[i]+"</td>");
                    $('#place-holder').append("</tr>");
                }*/
                //$('#place-holder').append(responseData["CelebrityFaces"]);
                $('#place-holder').append("</table>");
            },
            error: function (responseData, textStatus, errorThrown) {
                console.log('POST failed.');
            }
        });
    }
});