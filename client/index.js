import Axios from 'axios';

console.log('here');

Axios.get('/api/freeagents')
.then((res) => console.log(res))
.catch((err) => console.log(err));
