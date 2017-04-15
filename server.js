var express = require("express");
var app = express();
var mongo = require("mongodb").MongoClient;
var socket = require("socket.io");

var mongoPass = process.argv[2];
var mongoUser = "sam";


var server = app.listen(process.env.PORT);
var io= socket(server);

app.get("/", function(req, res){
     console.log();
     app.use(express.static(__dirname + "/public"));
     res.sendFile(__dirname + "/public/index.html");
});

app.get("/teachme", function(req, res){
     
     app.use(express.static(__dirname + "/public"));
     res.sendFile(__dirname + "/public/teachme.html");
});

io.sockets.on("connection", newConnection);

var id;
function newConnection(socket){
     
     socket.on("teach", teachMe);
     socket.on("test", testMe);
     
     
     function testMe(data){
     
     var avgs = [];
     var i = 0;
     
     findAvgs();
     
     function findAvgs(){
          mongo.connect("mongodb://"+mongoUser+":"+mongoPass+"@ds161400.mlab.com:61400/charrecog", function(err, db){
               if(err) throw err;
               var collection = db.collection("averages");
               collection.find({
                    "num": i
               }).toArray(function(err, docs){
                    if(err) throw err;
                    avgs.push(docs[0]);
                    i++;
                    
                    if(i<10){
                         findAvgs();
                    }
                    
                    if(i==10){
                         closest(avgs, data, function(x){
                              socket.emit("closest", x);
                         });
                    }
               });
          });
     }
}
};

function closest(avgs, data, callback){
     var coll = [];
     for(var h=0; h<avgs.length; h++){ //for each number from 0 to 9
          var test = avgs[h].pix;
          var total = 0;
          for(var p=0; p<data.length; p++){ //for each pixel
               var dist = test[p] - data[p];
               dist = dist * dist;
               total+=dist;
          }
          var howFar = Math.sqrt(total);
          coll.push(howFar);
     }
     smallest(coll, callback);
}

function smallest(arr, callback){
     var s = {
          num: 0,
          dist: 999999999999999999
     }
     
     arr.forEach(function(e, i){
          if(e<s.dist){
               s.dist = e;
               s.num = i;
          }
     });
     console.log(s.num);
     callback(s.num);
}

function teachMe(data){
     mongo.connect("mongodb://"+mongoUser+":"+mongoPass+"@ds161400.mlab.com:61400/charrecog", function(err, db){
        if(err) throw err;
        var collection = db.collection("characters");
        collection.insert(data, function(err, data){
                if(err) throw err;
                db.close();
        });
        var num = data.num;
          findTheAverage(num);
     });
}

function findTheAverage(n){
          var s = String(n);
          mongo.connect("mongodb://"+mongoUser+":"+mongoPass+"@ds161400.mlab.com:61400/charrecog", function(err, db){
               if(err) throw err;
               var collection = db.collection("characters");
               collection.find({
                    "num": s
               },{
                    "pix": 1
               }).toArray(function(err, docs){
                    if(err) throw err;
                    averageOut(docs, n);
               })
          })
}

function averageOut(d, n){
     
     var l = d[0].pix.length;
     var thisAvg = [];
     
     for(var i=0; i<l; i++){ // each pixel
          var pixSum = 0;
          for(var j=0; j<d.length; j++){ //that pixel on each doc
               pixSum += d[j].pix[i];
          }
          
          var pixAvg = pixSum / d.length;
          thisAvg.push(pixAvg);
     }
     
     var q = parseInt(n);
     
     mongo.connect("mongodb://"+mongoUser+":"+mongoPass+"@ds161400.mlab.com:61400/charrecog", function(err, db){
        if(err) throw err;
        var collection = db.collection("averages");
        collection.update({
             "num": q
        },{
             $set:{
                  "pix": thisAvg
             }
        }, function(err){
             if(err) throw err;
             console.log("Updated")
        });
     });
}