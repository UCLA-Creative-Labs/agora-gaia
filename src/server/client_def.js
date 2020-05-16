
class Client {
    constructor (last_send=false, can_undo=false) {
      this.last_send = last_send;
      this.can_undo = can_undo;
    }
  
    // doesItDrown () {
    //  if(this.canItSwim)
    //   console.log(`${this.name} can swim`);
    //  else
    //   console.log(`${this.name} has drowned`);
    // }
  }

module.exports = {
    Client,
}
  
  