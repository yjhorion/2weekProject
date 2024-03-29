import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
  try {
    let authorization = ""
    if (req.headers.authorization) {
      authorization  = req.headers.authorization
    } else if ( req.cookies.authorization) {
      authorization  = req.cookies.authorization;
    }

    console.log("auth jwt token :", authorization)

    if (!authorization) throw new Error('토큰이 존재하지않습니다.');

    const [tokenType, token] = authorization.split(' ');
    if (tokenType !== 'Bearer')
      throw new Error('토큰 타입이 일치하지 않습니다.');

    const decodedToken = jwt.verify(token, 'secretKey');
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { userId: Number(userId) },
    });
    if (!user) {
      res.clearCookie('authorization');
      throw new Error('토큰 사용자가 존재하지않습니다.');
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error)
    res.clearCookie('authorization');
    switch (error.name) {
      case 'JsonWebTokenError':
        return res.status(400).json({ message: '토큰이 조작되었습니다.' });
      case 'TokenExpiredError':
        return res.status(400).json({ message: '토큰이 만료되었습니다.' });
      default:
        return res.status(400).json({ message: error.message });
    }
  }
}
