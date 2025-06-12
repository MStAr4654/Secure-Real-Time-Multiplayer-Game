/*
class Player {
  constructor({x, y, score, id}) {

  }

  movePlayer(dir, speed) {

  }

  collision(item) {

  }

  calculateRank(arr) {

  }
}

export default Player;
*/
export default class Player {
  constructor(x, y, score = 0) {
    this.x = x;
    this.y = y;
    this.score = score;
  }

  draw(ctx, isMe) {
    ctx.fillStyle = isMe ? 'lime' : 'red';
    ctx.fillRect(this.x - 10, this.y - 10, 20, 20);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Score: ${this.score}`, this.x - 15, this.y - 15);
  }
}
