if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(cors());
app.use(express.static('public'));



app.use((req, res) => {
    res.status(404).json({error : 'Route not found'});
});


app.listen(PORT, () => {
    console.log(   `Server running on http://localhost:${PORT}`)
});
