Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}
module.exports = function(app, domoActuate, domoValidate){
  app.get("/", function(req, res){
    res.render("mic.hbs", {})
  })
  app.get("/voice", function(req, res){
    heard_command = req.query.command.toLowerCase().split(" ");
    console.log(heard_command);
    if(heard_command.contains("weather") || heard_command.contains("whether")){
      getWeather(res, "77005");
    }
  });
  var confused = function(res){
    var phrase_list = ["Sorry, I don't understand", "I'm a bit confused", "Pardon? I didn't catch that."]
    var phrase = phrase_list[Math.floor(Math.random() * phrase_list.length)]
    domoActuate.speak(phrase);
    res.send(phrase);
  }
  app.get("/confused", function(req, res){
    confused(res);
  });
  app.get("/sexytime", function(req,res){
    domoActuate.speak("Activating Love Mode... ... Have fun!");
    setTimeout(function(){
      var options = {
        args: ["fade"]
      };
      domoActuate.runPyCommand("plugins/ardlights.py", options);
    }, 3*1000)
    setTimeout(function(){
      domoActuate.runSysCommand("mplayer -shuffle", __dirname+"/../res/music/*.mp3")
    }, 6*1000)
    res.send("LOVE MODE&trade; ACTIVATE");
  })
  app.get("/party", function(req,res){
    domoActuate.speak("Activating Party Mode... ... Have fun!");
    setTimeout(function(){
      var options = {
        args: ["jump", "fast"]
      };
      domoActuate.runPyCommand("plugins/ardlights.py", options);
    }, 3*1000)
    res.send("Party Mode&trade; ACTIVATE");
  })
  app.get("/sleep", function(req,res){
    res.send("Good night. Entering sleep mode.");
    domoActuate.speak("Good night. Entering sleep mode.");
    setTimeout(function(){
      var options = {
        args: ["off"]
      };
      domoActuate.speak("Turning lights off.")
      domoActuate.runPyCommand("plugins/ardlights.py", options);
    }, 3*1000)
  });
  app.get("/wake", function(req,res){
    res.send("Good Morning. Starting wake mode!");
    domoActuate.speak("Good Morning. Starting wake mode!");
    setTimeout(function(){
      var options = {
        args: ["on", "green", "bright"]
      };
      domoActuate.speak("Turning lights on. Setting to bright green.")
      domoActuate.runPyCommand("plugins/ardlights.py", options);
    }, 3*1000)
  });
  app.get("/weather", function(req, res){
    try{
      var loc = req.query.loc;
      getWeather(res, loc)
    }
    catch(e){
      getWeather(res, zipcode)
    }
  });
  app.get("/lights", function(req,res){
    command = req.query.command.toLowerCase();
    var command_list = domoValidate.checkLEDTag(command);
    if(command_list.length>0){
      var options = {
        args: command_list
      };
      domoActuate.speak("Setting lights to "+command)
      domoActuate.runPyCommand("plugins/ardlights.py", options);
      res.send("Sent LED command: "+ command)
    }
    else{
      //res.send("Invalid command")
      confused(res)
    }
  });
  app.get("/lamp", function(req,res){
    command = req.query.command.toLowerCase();
    console.log(command)
    if(domoValidate.checkLampTag(command)){
      var options = {
        args: [command]
      };
      domoActuate.speak("Setting lamp to "+command)
      domoActuate.runPyCommand("plugins/ardlights.py", options);
      res.send("Sent Lamp command: "+ command)
    }
    else{
      confused(res)
    }
  });
}