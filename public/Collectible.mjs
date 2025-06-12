/*
class Collectible {
  constructor({x, y, value, id}) {

  }

}


  Note: Attempt to export this for use
  in server.js

try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;

*/
export default class Collectible {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(ctx) {
    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}
