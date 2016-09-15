////////////////////////////////////////////////////////
// Intro                                              //
////////////////////////////////////////////////////////

var bunyan = require('bunyan');
var log = bunyan.createLogger({
  src: true,
  name: 'life',
  streams: [{
    type: 'rotating-file',
    path: './log',
    count: 100
  }, {
    stream: process.stdout
  }]
});

log.level(bunyan.INFO);

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: true}));

var uuidGen = require('node-uuid');

////////////////////////////////////////////////////////
// Set                                                //
////////////////////////////////////////////////////////

Set.prototype.toString = function() {
  var res = '';
  this.forEach(function(val) {
    log.info(val);
    res = res + val + ', ';
  });
  return '[' + res.slice(0,-2) + ']';
  // return Array.from(this.values()).toString();
};

var verbs = new Set();
var nouns = new Set();

////////////////////////////////////////////////////////
// Fact                                               //
////////////////////////////////////////////////////////

function Fact(subject, verb, uuid) {
  this.verb = verb;
  this.subject = subject;
  this.uuid = uuid || uuidGen.v4();

  if ( !verbs.has(this.verb) ) {
    log.info('added verb ' + this.verb);
    verbs.add(this.verb);
  }

  if ( !nouns.has(this.subject) ) {
    log.info('added noun ' + this.subject);
    nouns.add(this.subject);
  }
};

Fact.prototype.toString = function() {
  return this.subject + ' ' + this.verb + '.';
}

Fact.prototype.toJson = function() {
  return {
    subject: this.subject,
    verb: this.verb,
    uuid: this.uuid
  };
}

Fact.prototype.deleteHtml = function() {
  return '' +
    '<form action="/" method="POST" class="delete-form">\n' +
    '<input type="hidden" name="uuid" value="' + this.uuid + '" />\n' +
    '<input class="delete-button" type="submit" value="X" />\n' +
    '</form>'
}

Fact.prototype.toHtml = function() {
  return '<li>' + this.deleteHtml() + this.toString() + '</li>\n';
}

////////////////////////////////////////////////////////
// Facts                                              //
////////////////////////////////////////////////////////

function Facts(facts) {
  this.facts = facts || [];
}

Facts.prototype.push = function(subject, verb) {
  this.facts.push(new Fact(subject, verb));
};

Facts.prototype.remove = function(uuid) {
  var index = this.facts.findIndex(function(fact, index, facts) {
    return uuid == fact.uuid;
  });

  if ( index >= 0 ) {
    this.facts.splice(index, 1);
  }
}

Facts.prototype.toString = function() {
  return this.facts.join('\n');
}

Facts.prototype.toJson = function() {
  return this.facts.map(function(fact) {
           return fact.toJson();
         });
}

Facts.prototype.toHtml = function() {
  var elems = this.facts.map(function(fact) {
    return fact.toHtml();
  });
  return '<ul>\n' + elems.join('') + '</ul>\n';
}

////////////////////////////////////////////////////////
// persistence                                        //
////////////////////////////////////////////////////////

var storeFile = './store';
var fs = require('fs');

// loads the fact store from storeFile, and passes the
// Facts object to the callback cb.  async.
function loadStore(cb) {
  fs.readFile(storeFile, function(err, data) {
    if ( err ) {
      log.warn(err, 'no fact store in ' + storeFile);
      cb(new Facts());
    }
    else {
      var factList = JSON.parse(data.toString()).map(function(fact) {
        return new Fact(fact.subject, fact.verb)
      });
      var facts = new Facts(factList);
    
      // XX sanity check
    
      cb(facts);
    }
  });
}

// writes the fact store to disk.  async.
function writeStore(facts, cb) {
  fs.writeFile(storeFile, JSON.stringify(facts.toJson()), function(err) {
    if ( err ) {
      log.error(err, 'couldn\'t save fact store');
      cb();
    }
    else {
      log.info('fact store saved to ' + storeFile);
      cb();
    }
  });
}

////////////////////////////////////////////////////////
// main html                                          //
////////////////////////////////////////////////////////

function mainHtml(facts) {
  return '' +
    '<html>\n' +
    '<head>\n' +
    '<meta name="viewport" content="width=device-width" />' +
    '<style>\n' +
    'body { max-width: 50rem; margin: auto; background-color: #FFFFF0; font-size: 1.2em }' +
    '.delete-form { display: inline; }' +
    '.delete-button { border: none; }' +
    '#add-form { overflow: hidden; }' +
    '.add-line { float: left; border: none; font-size: 1.3rem }' +
    '#subject { width: 33%; background-color: #E0FFFF; }' +
    '#verb { width: 33%; background-color: #FFE0FF; }' +
    '#add { width: 34%;}' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<p>Hallo!</p>\n' +
    addFactoidHtml() +
    '<p>Here\'s your life story up \'till now:</p>\n' +
    facts.toHtml() +
    '</body>\n' +
    '</html>\n';
}

function addFactoidHtml() {
  return '' +
    '<form id="add-form" action="/" method="POST">\n' +
    '<input class="add-line" id="subject" type="text" name="subject" placeholder="our hero" required autocapitalize="none"/>\n' +
    '<input class="add-line" id="verb" type="text" name="verb" placeholder="awoke" required autocapitalize="none" />\n' +
    '<input class="add-line" id="add" type="submit" value="Add" />\n' +
    '</form>\n'
}

////////////////////////////////////////////////////////
// main                                               //
////////////////////////////////////////////////////////

function main() {
  loadStore(function(facts) {
    log.info('loaded facts', facts.toString());

    app.get('/', function(req, res) {
      log.info(mainHtml(facts));
      res.send(mainHtml(facts));
    });
    
    app.post('/', function(req, res) {
      log.info(req.body);
      if ( 'uuid' in req.body ) {
        facts.remove(req.body.uuid);
      }
      else if ( 'subject' in req.body && 'verb' in req.body ) {
        facts.push(req.body.subject, req.body.verb);
      }
      else {
        log.error('bad post request', req.body);
      }
    
      // there's obviously a race condition here, if
      // another request comes in while we're writing
      // to the file.  we should queue up requests that
      // come in while we're writing.  better yet, we
      // should use an actual database or something.

      writeStore(facts, function() {
        res.send(mainHtml(facts));
      });
    });
    
    app.listen(3000, function() {
      log.info('beep... beep...');
    });
  });
};

main();
