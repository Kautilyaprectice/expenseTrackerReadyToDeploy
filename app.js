const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const sequelize = require('./util/database');
const User = require('./modles/user');
const Expense = require('./modles/expense');
const Order = require('./modles/order');
const ForgetPassword = require('./modles/forgetPassword');
const FileUrl = require('./modles/fileUrl');

const userRoutes = require('./routes/user');
const expenseRoutes = require('./routes/expense');
const purchaseRoutes = require('./routes/purchase');
const premiumRoutes = require('./routes/premium');
const forgetPasswordRoutes = require('./routes/forgetPassword');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    {flags: 'a'} 
);

app.use(morgan('combined', {stream: accessLogStream}));

app.use('/', userRoutes);
app.use('/', expenseRoutes);
app.use('/', purchaseRoutes);
app.use('/', premiumRoutes);
app.use('/', forgetPasswordRoutes);



app.use((req, res, next) => {
    console.log('url', req.url)
    res.sendFile(path.join(__dirname, `public/${req.url}`));
})

User.hasMany(Expense)
Expense.belongsTo(User)

User.hasMany(Order);
Order.belongsTo(User); 

User.hasMany(ForgetPassword);
ForgetPassword.belongsTo(User);

User.hasMany(FileUrl);
FileUrl.belongsTo(User);

sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error(`Database sync error`, err));
