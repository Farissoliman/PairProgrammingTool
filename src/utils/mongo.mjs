import { MongoClient } from "mongodb";

const DB_NAME = "gendertool";

const client = new MongoClient("mongodb://localhost:27017");
const conn = client.connect();
export const getDatabase = async () => (await conn).db(DB_NAME);
