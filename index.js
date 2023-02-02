const express = require('express')
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express()
const port = process.env.PORT || 5000

//middle ware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://admin:zZPBWTlbZAOjEsz9@cluster0.ua4yklp.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//jwt token middleware
function verifyJWT(req, res, next) {
  //console.log('token inside VerifyJWT', req.headers.authorization);
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).send('unauthorized access !')
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" })
    }
    req.decoded = decoded
    next();
  })
}


async function run() {
  try {
    await client.connect();
    const servicesCollection = client.db('doctors_portal').collection('services')
    const bookingCollection = client.db('doctors_portal').collection('bookings')
    const usersCollection = client.db('doctors_portal').collection('users')
    const doctorsCollection = client.db('doctors_portal').collection('doctors')

    // NOTE: make sure you use verifyAdmin after verifyJWT
      const verifyAdmin = async (req, res, next) => {
        console.log('inside verifyadmin',req.decoded.email)
    const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== 'admin') {
          return res.status(403).send({ message: 'forbidden access' })
      }
      next();
  }


    //get method
    app.get('/service', async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await servicesCollection.find(query).toArray();
      const bookedQuery = { appointmentDate: date }
      const alreadyBooked = await bookingCollection.find(bookedQuery).toArray();


      options.forEach(option => {
        const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
        const bookedSlots = optionBooked.map(book => book.slot)

        const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
        option.slots = remainingSlots

      })
      res.send(options);
    })


    //Service specialty --collection onlu servic name

    app.get('/appointmentSpecialty', async (req, res) => {
      const query = {};
      const result = await servicesCollection.find(query).project({ name: 1 }).toArray();
      res.send(result);
    })


    //-----------> BOOKING Method <--------------

    //jwt TOKEN

    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
        return res.send({ accessToken: token });
      }
      //console.log(user);
      res.status(403).send({ accessToken: '' })
    })

    ////Booking

    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      // const decodedEmail = req.decoded.email;
      // if (email !== decodedEmail) {
      //   return res.status(403).send({ message: 'forbidden access' });
      // }

      const query = { email: email };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    app.get('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingCollection.findOne(query);
      res.send(booking);
    })

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment
      }

      const alreadyBooked = await bookingCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`
        return res.send({ acknowledged: false, message })
      }

      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });




    //app.get---all user collection
    app.get('/users', async (req, res) => {
      const query = {}
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    })


    //User Colletion

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    //any specific account whethere it's admin or not check

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" })
    })


    //////MAKE ADMIN ROLE option update

    app.put('/users/admin/:id', verifyJWT,verifyAdmin, async (req, res) => {

      // const decodedEmail = req.decoded.email;
      // const query = { email: decodedEmail };
      // const user = await usersCollection.findOne(query);

      // if (user?.role !== 'admin') {
      //   return res.status(403).send({ message: 'forbidden access' })
      // }


      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }

      const result = await usersCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })

    // //price update
    // app.get('/addprice',   async (req, res) => {
    //   const filter = {}
    //   const options = { upsert: true };
    //   const updatedDoc = {
    //     $set: {
    //       price:99
    //     }
    //   }

    //   const result = await servicesCollection.updateMany(filter, updatedDoc, options)
    //   res.send(result)
    // })


    //doctors collection

    app.get('/doctors',async (req, res) => {
      const query = {}
      const result = await doctorsCollection.find(query).toArray();
      res.send(result);
    })


    app.post('/doctors',verifyJWT,verifyAdmin, async (req, res) => {
      const doctor = req.body;
      const result = await doctorsCollection.insertOne(doctor);
      res.send(result);
    })


    app.delete('/doctors/:id',verifyJWT,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const result = await doctorsCollection.deleteOne(filter)
      res.send(result)

    })





  } finally {

  }
}
run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('Hello from Doctors World!')
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})