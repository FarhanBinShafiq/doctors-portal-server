"use strict";

var express = require('express');

require('dotenv').config();

var cors = require('cors');

var jwt = require('jsonwebtoken');

var _require = require('mongodb'),
    MongoClient = _require.MongoClient,
    ServerApiVersion = _require.ServerApiVersion,
    ObjectId = _require.ObjectId;

var app = express();
var port = process.env.PORT || 5000; //middle ware

app.use(cors());
app.use(express.json());
var uri = "mongodb+srv://admin:zZPBWTlbZAOjEsz9@cluster0.ua4yklp.mongodb.net/?retryWrites=true&w=majority";
var client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
}); //jwt token middleware

function verifyJWT(req, res, next) {
  console.log('token inside VerifyJWT', req.headers.authorization);
  var authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('unauthorized access !');
  }

  var token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({
        message: "forbidden access"
      });
    }

    req.decode = decoded;
    next();
  });
}

function run() {
  var servicesCollection, bookingCollection, usersCollection;
  return regeneratorRuntime.async(function run$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return regeneratorRuntime.awrap(client.connect());

        case 3:
          servicesCollection = client.db('doctors_portal').collection('services');
          bookingCollection = client.db('doctors_portal').collection('bookings');
          usersCollection = client.db('doctors_portal').collection('users'); //get method

          app.get('/service', function _callee(req, res) {
            var date, query, options, bookedQuery, alreadyBooked;
            return regeneratorRuntime.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    date = req.query.date;
                    query = {};
                    _context.next = 4;
                    return regeneratorRuntime.awrap(servicesCollection.find(query).toArray());

                  case 4:
                    options = _context.sent;
                    bookedQuery = {
                      appointmentDate: date
                    };
                    _context.next = 8;
                    return regeneratorRuntime.awrap(bookingCollection.find(bookedQuery).toArray());

                  case 8:
                    alreadyBooked = _context.sent;
                    //console.log(alreadyBooked)
                    options.forEach(function (option) {
                      var optionBooked = alreadyBooked.filter(function (book) {
                        return book.treatment === option.name;
                      });
                      var bookedSlots = optionBooked.map(function (book) {
                        return book.slot;
                      }); //console.log(date,option.name,bookedSlots);

                      var remainingSlots = option.slots.filter(function (slot) {
                        return !bookedSlots.includes(slot);
                      });
                      option.slots = remainingSlots; //console.log(date, option.name, remainingSlots.length)
                    });
                    res.send(options);

                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            });
          }); //-----------> BOOKING Method <--------------
          //jwt TOKEN

          app.get('/jwt', function _callee2(req, res) {
            var email, query, user, token;
            return regeneratorRuntime.async(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    email = req.query.email;
                    query = {
                      email: email
                    };
                    _context2.next = 4;
                    return regeneratorRuntime.awrap(usersCollection.findOne(query));

                  case 4:
                    user = _context2.sent;

                    if (!user) {
                      _context2.next = 8;
                      break;
                    }

                    token = jwt.sign({
                      email: email
                    }, process.env.ACCESS_TOKEN, {
                      expiresIn: '1h'
                    });
                    return _context2.abrupt("return", res.send({
                      accessToken: token
                    }));

                  case 8:
                    console.log(user);
                    res.status(403).send({
                      accessToken: ''
                    });

                  case 10:
                  case "end":
                    return _context2.stop();
                }
              }
            });
          }); //Booking Get

          app.get('/bookings', verifyJWT, function _callee3(req, res) {
            var email, query, bookings;
            return regeneratorRuntime.async(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    email = req.query.email;
                    query = {
                      email: email
                    };
                    _context3.next = 4;
                    return regeneratorRuntime.awrap(bookingCollection.find(query).toArray());

                  case 4:
                    bookings = _context3.sent;
                    res.send(bookings);

                  case 6:
                  case "end":
                    return _context3.stop();
                }
              }
            });
          }); //Booking Post

          app.post('/booking', function _callee4(req, res) {
            var booking, query, alreadyBooked, message, result;
            return regeneratorRuntime.async(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    booking = req.body;
                    query = {
                      appointmentDate: booking.appointmentDate,
                      email: booking.email
                    };
                    _context4.next = 4;
                    return regeneratorRuntime.awrap(bookingCollection.find(query).toArray());

                  case 4:
                    alreadyBooked = _context4.sent;

                    if (!alreadyBooked.length) {
                      _context4.next = 8;
                      break;
                    }

                    message = "You already have a booking on ".concat(booking.appointmentDate);
                    return _context4.abrupt("return", res.send({
                      acknowledged: false,
                      message: message
                    }));

                  case 8:
                    _context4.next = 10;
                    return regeneratorRuntime.awrap(bookingCollection.insertOne(booking));

                  case 10:
                    result = _context4.sent;
                    res.send(result);

                  case 12:
                  case "end":
                    return _context4.stop();
                }
              }
            });
          }); //User Colletion

          app.post('/users', function _callee5(req, res) {
            var user, result;
            return regeneratorRuntime.async(function _callee5$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    user = req.body;
                    _context5.next = 3;
                    return regeneratorRuntime.awrap(usersCollection.insertOne(user));

                  case 3:
                    result = _context5.sent;
                    res.send(result);

                  case 5:
                  case "end":
                    return _context5.stop();
                }
              }
            });
          }); //app.get---all user collection

          app.get('/users', function _callee6(req, res) {
            var query, users;
            return regeneratorRuntime.async(function _callee6$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    query = {};
                    _context6.next = 3;
                    return regeneratorRuntime.awrap(usersCollection.find(query).toArray());

                  case 3:
                    users = _context6.sent;
                    res.send(users);

                  case 5:
                  case "end":
                    return _context6.stop();
                }
              }
            });
          }); //////MAKE ADMIN ROLE

          app.put('/users/admin/:id', verifyJWT, function _callee7(req, res) {
            var id, filter, options, updatedDoc, result;
            return regeneratorRuntime.async(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    id = req.params.id;
                    filter = {
                      _id: ObjectId(id)
                    };
                    options = {
                      upsert: true
                    };
                    updatedDoc = {
                      $set: {
                        role: 'admin'
                      }
                    };
                    _context7.next = 6;
                    return regeneratorRuntime.awrap(usersCollection.updateOne(filter, updatedDoc, options));

                  case 6:
                    result = _context7.sent;
                    res.send(result);

                  case 8:
                  case "end":
                    return _context7.stop();
                }
              }
            });
          });

        case 13:
          _context8.prev = 13;
          return _context8.finish(13);

        case 15:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0,, 13, 15]]);
}

run()["catch"](console.dir);
app.get('/', function (req, res) {
  res.send('Hello from Doctors World!');
});
app.listen(port, function () {
  console.log("Doctors app listening on port ".concat(port));
});