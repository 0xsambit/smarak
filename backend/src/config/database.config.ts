import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'MONGODB_URI=mongodb+srv://Sambit:Sambit@smarak.rk5orsw.mongodb.net/?appName=Smarak',
  options: {
    retryWrites: true,
    w: 'majority',
  },
}));
