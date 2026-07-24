import dotenv from "dotenv";

if(!process.env.MY_SQL_URI) {
	throw new Error("MY_SQL_URI is not defined in environment variables");
	
}

const config = {
	MY_SQL_URI: process.env.DATABASE_URL
};

dotenv.config();

export default config;
