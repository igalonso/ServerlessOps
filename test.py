s = open("frontend/js/assets.js").read()
s = s.replace("var IdentityPoolId = '<COGNITOIDENTITYPOOLID>';", "var IdentityPoolId = 'eu-west-1:6bf5da4f-2d7e-47dc-8b16-d36b4073b3dd';")
f = open("frontend/js/assets.js", 'w')
f.write(s)
f.close()