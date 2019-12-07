const app = require('./app');
const PORT = process.env.PORT || 8080;

app.listen(PORT, function () {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});
