require("dotenv").config();
const express = require("express");
const {PrismaClient} = require("@prisma/client");
const cookieParser = require("cookie-parser");
const prisma = new PrismaClient();
const app = express();
const port = 8080;
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const customerRouter = require("./routes/customer");
const salonRouter = require("./routes/salon");
const publicSalonRouter = require("./routes/salon.public");
const uploadRouter = require("./routes/upload");
const mapRouter = require("./routes/map");
const errorFunc = require("./middlewares/error-filter");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const allowedOrigins = [
  "https://bookmybeauty.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://13.53.169.31",
  "http://ec2-13-53-169-31.eu-north-1.compute.amazonaws.com"
];

const corsOption = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

const main = async () => {
    await prisma.$connect();
}

main().then(() => {
    app.listen(port, () => {
        console.log("Listening...");
    })
}).catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// app.get("/api-docs.json", (req, res) => {
//     res.setHeader("Content-Type", "application/json");
//     res.send(swaggerSpec);
// });

app.use("/api", authRouter);
app.use("/api/user", userRouter);
app.use("/api/customer", customerRouter);
app.use("/api/salon", salonRouter);
app.use("/api/salons", publicSalonRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/map", mapRouter);

app.use(errorFunc);