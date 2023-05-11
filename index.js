import { Server } from 'http';
import x from 'express';

import fs from 'fs';
import bodyParser from 'body-parser';
import request from 'request';
import url from 'url';
import passport from 'passport';
import passportLocal from 'passport-local';
import m from 'mongoose';
import jwt from 'jsonwebtoken';


import UserModel from './User.js';


import * as jwts from 'passport-jwt';
const { Strategy: JWTstrategy, ExtractJwt: ExtractJWT } = jwts;

passport.use(new JWTstrategy(
    { secretOrKey: 'TOP_SECRET',
      jwtFromRequest: ExtractJWT.fromUrlQueryParameter('secret_token') },
    async (token, done) => {
      try {
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    }
  )
);



//import styles from './styles.js';
const css = `<link rel="stylesheet" href="//kodaktor.ru/css/_unsafe/af7c5" />`;

const User = UserModel(m);


passport.use('signup', new passportLocal.Strategy(
    {
      usernameField: 'login',
      passwordField: 'password'
    },
    async (login, password, done) => {
      try {

        const newUser = new User({ login, password });
        await newUser.save();
        return done(null, newUser);

      } catch (error) {
        done(error); // пойдёт в 4-обработчик
      }
    }
  )
);

passport.use('login', new passportLocal.Strategy({
  usernameField: 'login',
  passwordField: 'password',
},
async (login, password, done) => {
  let user;
  try {
    user = await User.findOne({ login });
  } catch (e) {
    return done('!! ' + e);
  }

  

  if (!user) {
    return done(null, false, { message: 'Пользователя нет' });  
  }

  const validate = await user.isValidPassword(password);

  if (!validate) {
    return done(null, false, { message: 'Неверный пароль' });
  }

  return done(null, user, { message: 'Успешный логин' });
}
));


const loginFunc = async (req, res, next) => {
  passport.authenticate(
    'login',
    async (err, user, info) => {
      try {
        if (err || !user) {
          const error = new Error('An error occurred.');

          // return next(error); для варианта в стиле API
          return res.redirect('/login');
        }

        req.login(
          user,
          { session: false },
          async (error) => {
            if (error) return next(error);

            const body = { _id: user._id, login: user.login };
            const token = jwt.sign({ user: body }, 'TOP_SECRET');

            return res.json({ token });
          }
        );
      } catch (error) {
        return next(error);
      }
    }
  )(req, res, next);
};



const Router = x.Router();
const PORT =  12345;
const { log } = console;
const hu = { 'Content-Type': 'text/html; charset=utf-8' };
const app = x();


app
  .use(passport.initialize())
  .use(bodyParser.urlencoded({ extended: true }))
 
  
  .use(x.static('.'))
  .use(x.static('./public'))  
  .get('/', (r, res) => {
    res.send(`${css}<h2>Пример</h2><hr><a href="/login">Нажмите для логина</a>
    <hr><hr>Или <a href="/signup">создайте учётную запись</a>`);
  }) 

  .get('/login', r => request(url.format({ protocol: 'https', host: 'kodaktor.ru', pathname: '/g/localsession' })).pipe(r.res))
  .post('/locallogin/check', loginFunc)


  .get('/signup', r => request(url.format({ protocol: 'https', host: 'kodaktor.ru', pathname: '/g/localsignup' })).pipe(r.res))
  .post('/signup',passport.authenticate('signup', { session: false }),
    async (req, res, next) => {
      // res.json({ message: 'Signup successful', user: req.user });
      res.send(`${css}<h2>Успешно, ${req.user.login}!</h2><hr><a href="/login">Нажмите для логина</a>`);
    }
  )


  /* здесь нет редиректа на форму логина, т.к. API */
  .get('/profile', passport.authenticate('jwt', { session: false }), async r => {
    
    r.res.send(`${css}
    <h2>Личный кабинет</h2>
  <div class="right">Привет, ${r.user.login}</a></div>
  <br>

  `);
  })
 


    


  .get('/pid', (r, res) => {
    res.send(`${css}PID: ${process.pid}`);
  })
  .get('/port', (r, res) => {
    res.send(`${css}PORT: ${sss.address().port}`);
  })
  .delete('/bye', (r, res) => {
    sss.close();
    res.send(`${css}BYE`);
  })






  .use(({ res: r }) => r.status(404).set(hu).send(`${css}<meta http-equiv="refresh" content="5;URL=/"><div>Кажется, такой страницы нет...</div>`))
  .use((e, r, rs, n) => rs.status(500).set(hu).send(`Ошибка: ${e}`))
  .set('x-powered-by', false);

  const sss = Server(app);

  export default sss
  .listen(process.env.PORT || PORT, async () => {
      const URL = 'mongodb://reader:123321@kodaktor.ru/readusers';

      m.set('useCreateIndex', true);
      await m.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });
      log(process.pid);
    });



