var albumBucketName = $(location).attr('pathname').split('/')[1];
var bucketRegion = 'eu-west-1';
var cognito = '';

var image = "img/uploads/someguy.jpg";
console.log("loading");


$(document).ready ( function () {
    $("#endpoint").val(sessionStorage.getItem("endpoint"));
    $("#cognito").val(sessionStorage.getItem("cognito"));
    
    $("#trigger").click( function(){
        api = $("#endpoint").val();
        cognito = $("#cognito").val();
        AWS.config.update({
            region: bucketRegion,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: cognito
            })
        });
        sessionStorage.setItem("endpoint", api);
        sessionStorage.setItem("cognito",cognito);
        performRequest(api+"/getinfo",JSON.stringify({ "bucket": albumBucketName,"key": image}) );
    });

    $("#upload").click(function(){
        var file = $("#image-to-upload")[0].files[0]
        $("#td-celebrities").hide();
        $("#td-labels").hide();
        $("#td-text").hide();
        $(".content").hide();
        var params = {
            Body: file, 
            Bucket: albumBucketName, 
            Key: "img/uploads/"+file.name
           };
        cognito = $("#cognito").val();
        AWS.config.update({
            region: bucketRegion,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: cognito
            })
        });
        var s3 = new AWS.S3();
        s3.putObject(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else{
                console.log(data);
                $('#image-to-recog').attr("src", "https://s3-eu-west-1.amazonaws.com/"+albumBucketName+"/img/uploads/"+file.name);
                console.log($('#image-to-recog'));
            }            // successful response
        });
        image = "img/uploads/"+file.name;
        

    });

    function performRequest(urlPost,payload){
        console.log("Posting to backend");
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
                $("#td-labels").show();
                $(".content").show();
                var counter = 0;
                if(responseData.hasOwnProperty("Labels")){
                    console.log("Labels printing");
                    var row = "";
                    for(var i=0;i<responseData["Labels"].length;i++){
                        row = row + "<tr><td class='content' style='padding: 5px;'>"+ responseData["Labels"][i]["Name"]+"</td></tr>";
                    }
                    $('#table-results > tbody:last-child').append(row);
                    counter++;
                }
                if(responseData.hasOwnProperty("CelebrityFaces")){
                    var iter = 0;
                    console.log("CelebrityFaces printing");
                    var counterRow= 0;
                    $("#td-celebrities").show();
                    $('#table-results').find("tr").each(function(){
                        if (counterRow != 0){
                            var trow = $(this);
                            if(iter < responseData["CelebrityFaces"].length){
                                trow.append("<td class='content' style='padding: 5px;'>"+ responseData["CelebrityFaces"][iter]["Name"]+"</td>");
                            }
                            else{
                                trow.append("<td></td>");
                            }
                            iter +=1;
                        }
                        counterRow += 1;
                    });
                    counter++;
                }
                if(responseData.hasOwnProperty("TextDetections")){
                    var iter = 0;
                    console.log("TextDetections printing");
                    var counterRow= 0;
                    $("#td-text").show();
                    $('#table-results').find("tr").each(function(){
                        if (counterRow != 0){
                            var trow = $(this);
                            if(iter < responseData["TextDetections"].TextDetections.length){
                                console.log(iter);
                                trow.append("<td class='content' style='padding: 5px;'>"+ responseData["TextDetections"].TextDetections[iter]["DetectedText"]+"</td>");
                            }
                            else{
                                trow.append("<td></td>");
                            }
                            iter +=1;
                        }
                        counterRow += 1;
                    });
                    counter++;
                }
            },
            error: function (responseData, textStatus, errorThrown) {
                console.log('POST failed.');
            }
        });
    }
    
});