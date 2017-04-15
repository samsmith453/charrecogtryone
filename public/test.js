var ctx;
var c;
var isDragging = false;
var socket = io.connect(window.location.hostname);

$(document).ready(function(){
     c = document.getElementById("canvas");
     ctx = c.getContext("2d");

     $(c).mousedown(function(){
          isDragging = true;
     });

     $(c).mouseup(function(){
          isDragging = false;
     });

     $(c).mousemove(mouseCord);

     $("#reset").click(clearCanv);
     $("#teach").click(teachMe);
     $("#test").click(function(){
          var cont = ctx.getImageData(0, 0, c.width, c.height);
          testMe(cont);
     });

});

function testMe(cont){
     var data = [];
     for(var i=3; i<cont.data.length; i+=4){
          data.push(cont.data[i]);
     }
     socket.emit("test", data);
}

function mouseCord(e){

     if(isDragging){
          var endAngle = 2*Math.PI;

          ctx.beginPath();
          ctx.arc(e.pageX-c.offsetLeft, e.pageY-c.offsetTop, 5, 0, endAngle);
          ctx.strokeStyle="white";
          ctx.stroke();
          ctx.fillStyle = "white";
          ctx.fill();
     }
}

function clearCanv() {
     ctx.clearRect(0, 0, c.width, c.height);
}

function teachMe(){
     var num = prompt("What number is this?");
     var cont = ctx.getImageData(0, 0, c.width, c.height);
     var data = [];
     for(var i=3; i<cont.data.length; i+=4){
          data.push(cont.data[i]);
     }
     
     var obj = {
          num: num,
          pix: data
     }
     
     socket.emit("teach", obj);
}

socket.on("closest", function(data){
     $("#guess").text(data);
})