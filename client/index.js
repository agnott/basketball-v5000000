import Axios from 'axios';

console.log('here');

Axios.get('/api/players/new')
.then((res) => {
  console.log(res.data.image.beard.bottom);

  const parser = new DOMParser();
  const el = parser.parseFromString(res.data.svg, 'image/svg+xml');
  document.body.appendChild(el.documentElement);
})
.catch((err) => console.log(err));
