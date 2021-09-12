import db from "./database";

const connectDB = async () => {
  try {
    db.connect((err) => {
      if (err) console.log(err);
      console.log("connect successfully");
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
