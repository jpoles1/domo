Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}
var commandReady = 0;
var ready_time = 15; //In seconds
var keyword_active = 1;
var ready_timer;
$(function(){
  if (annyang) {
    var socket = io(location.origin);
    var beep_hi = new Audio('res/sound/beep_hi.wav');
    var beep_lo = new Audio('res/sound/beep_lo.wav');
    function allowRecognition(ready_time){
      commandReady = 1;
      clearTimeout(ready_timer);
      if(ready_time!=-1){
        ready_timer = setTimeout(function(){
          endRecognition()
        }, ready_time*1000);
      }
      beep_hi.play();
    }
    function displayMsg(msg){
      $("#notify").html(msg);
      $("#loglist").prepend("<li class='log-item'>"+msg+"<div class='log_time'>"+moment().format("HH:MM")+"</div></li>")
    }
    function endRecognition(){
      if(commandReady != 0){
        beep_lo.play();
      }
      commandReady = 0;
      $("#notify").html("");
    }
    function stopListening(){
      beep_lo.play();
      setTimeout(function(){beep_lo.play();}, 100);
      endRecognition()
      SpeechKITT.abortRecognition()
      displayMsg("Stopping Listening")
    }
    socket.on("stop_listen", function(){
      stopListening()
    })
    socket.on("start_listen", function(){
      SpeechKITT.startRecognition()
    })
    socket.on("ready", function(){
      SpeechKITT.abortRecognition();
      SpeechKITT.startRecognition();
      if(keyword_active){
        $("#notify").html("Listening for Commands!");
        allowRecognition(ready_time)
      }
      else{
        allowRecognition(-1)
        setTimeout(function(){
          $("#notify").html("");
        }, 5000)
      }
    })
    socket.on("unready", function(){
      endRecognition()
    })
    socket.on("msg", displayMsg)
    // Let's define our first command. First the text we expect, and then the function it should call
    var commands = {
      'hey *name': function(name) {
        name = name.toLowerCase();
        name = domoValidate.checkName(name)
        if(["RRAD", "Domo"].contains(name)){
          displayMsg("Heard Keyword: "+name+"!")
          allowRecognition(ready_time);
        }
      },
      '(set) (change) light(s) (to) *tag': function(tag) {
        if(commandReady || !keyword_active){
          var tagwords = domoValidate.checkLEDTag(tag);
          tag = tagwords.join(" ")
          var valid_led_command = (tagwords.length == 1) || (tagwords.length == 2) || (tagwords.length == 3 && (tagwords.contains("on") || tagwords.contains("off") || tagwords.contains("toggle")))
          if(valid_led_command){
            socket.emit("lights", tag)
          }
          else{
            socket.emit("confused");
          }
        }
      },
      '(set) (change) lamp (to) *tag': function(tag) {
        if(commandReady || !keyword_active){
          if(domoValidate.checkLampTag(tag)){
            socket.emit("lamp", tag)
          }
          else{
            $("#notify").html("Did not recognize lamp command!");
            socket.emit("confused");
          }
        }
      },
      '(enter) (activate) (start) :tag mode': function(tag){
        if(commandReady || !keyword_active){
          tag = tag.toLowerCase();
          if(["love", "sex", "sexy", "sexytime"].contains(tag)){
            socket.emit("love mode")
          }
          else if(["sleep"].contains(tag)){
            socket.emit("sleep mode")
            var sleeptime = 7; //hrs
            setTimeout(function(){SpeechKITT.startRecognition()}, sleeptime*60*60*1000)
          }
          else if(["party"].contains(tag)){
            socket.emit("party mode")
          }
          else if(["wake", "week", "with"].contains(tag)){
            socket.emit("wake mode")
          }
          else{
            console.log("Could not activate the mode:", tag)
          }
        }
      },
      /*Voice recognition cannot determine zip codes accurately, so this feature has been deactivated.
      "(what's) (what) (is) (the) weather in *location": function(location) {
        handleCommand("/weather", {"loc": location}, "Fetching the weather in"+location, 8)
      },*/
      "(what's) (what) (is) (on) (my) schedule (for) (on) :time": function(time) {
        if(commandReady || !keyword_active){
          socket.emit("cal", time);
          commandReady = 0;
        }
      },
      "(what's) (what) (is) (on) :time schedule": function(time) {
        if(commandReady || !keyword_active){
          time = time.split("'")[0]
          socket.emit("cal", time);
          commandReady = 0;
        }
      },
      "(what's) (what) (is) (on) (my) (today's) schedule (for) (today)": function() {
        if(commandReady || !keyword_active){
          socket.emit("cal", "today");
          commandReady = 0;
        }
      },
      "(what's) (what) (is) (the) weather": function(){
        if(commandReady || !keyword_active){
          socket.emit("weather", "today");
          commandReady = 0;
        }
      },
      "(what's) (what) (is) (the) weather (on) :day": function(day) {
        if(day == "in"){day="today"}
        if(commandReady || !keyword_active){
          socket.emit("weather", day);
          commandReady = 0;
        }
      },
      "(what's) (what) (is) (on) (my) todo list": function() {
        if(commandReady || !keyword_active){
          socket.emit("todo");
          commandReady = 0;
        }
      },
      "(what's) (what) (is) (the) time (is it)": function(){
        if(commandReady || !keyword_active){
          socket.emit("time");
          commandReady = 0;
        }
      },
      "(what's) (what is) (the) (today's) date": function(){
        if(commandReady || !keyword_active){
          socket.emit("date");
          commandReady = 0;
        }
      },
      '(stop) (end) (cancel)': function(){
        displayMsg("Ending Command Recognition")
        endRecognition()
      },
      'thank(s) (you)': function(){
        if(commandReady || !keyword_active){
          socket.emit("thanks");
        }
      },
      'all off': function(){
        socket.emit("all off")
      },
      'all on': function(){
        socket.emit("all on")
      },
      '(off) (kill)': function(){
        stopListening()
      },
      '(shut up) (shutup)': function(){
        socket.emit("shutup")
      },
      'disable keyword': function(name) {
        if(commandReady || !keyword_active){
          keyword_active = 0;
        }
        displayMsg("Keyword Disabled")
      },
      'enable keyword': function(name) {
        if(commandReady || !keyword_active){
          keyword_active = 1;
        }
        displayMsg("Keyword Enabled")
      },
      'kill music': function(){
        socket.emit("kill music")
      }
    };
    annyang.debug();

    // Add our commands to annyang
    annyang.addCommands(commands);

    // Start listening. You can call this here, or attach this call to an event, button, etc.
    SpeechKITT.annyang();

    // Define a stylesheet for KITT to use
    SpeechKITT.setStylesheet('//cdnjs.cloudflare.com/ajax/libs/SpeechKITT/0.3.0/themes/flat.css');

    SpeechKITT.startRecognition();

    // Render KITT's interface
    SpeechKITT.vroom();
    prevScrollPos = 0;
    $(window).keypress(function (e) {
      console.log(e.keyCode)
      if (e.keyCode === 0 || e.keyCode === 32) {
        e.preventDefault()
        console.log('Space pressed')
        SpeechKITT.toggleRecognition();
        if(SpeechKITT.isListening()){
          $("#notify").html("Starting Listening!");
          allowRecognition(ready_time);
        }
        else{
          $("#notify").html("");
        }
      }
    })
  }
  else{
    alert("Cannot perform speech recognition! :(")
  }
});
