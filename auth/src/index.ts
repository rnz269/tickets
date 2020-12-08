import mongoose from 'mongoose'; // mongoose is a class instance (singleton)
import { app } from './app';

/*****  Starts up Express Application *****/
const start = async () => {
  console.log('Starting up...');

  if (!process.env.JWT_KEY) {
    throw new Error('Requested environment variable does not exist');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Connected to MongoDb');
  } catch (err) {
    console.error(err);
  }
  app.listen(3000, () => {
    console.log('Listening on port 3000!');
  });
};

start();
