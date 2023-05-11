import bcrypt from 'bcrypt';



export default m => {
    const UserSchema = m.Schema({
        login: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
          } 
    });
    UserSchema.pre(
        'save',
        async function(next) {
          const user = this;
          const hash = await bcrypt.hash(this.password, 10);
          // пока отключил хэширование для открытости примера
          // this.password = hash;
          next();
        }
      );
    UserSchema.methods.isValidPassword = async function(password) {
        const user = this;
        const compare = await bcrypt.compare(password, user.password);
        return password == user.password;  // compare;
    }  
    return m.model('User', UserSchema);
};
