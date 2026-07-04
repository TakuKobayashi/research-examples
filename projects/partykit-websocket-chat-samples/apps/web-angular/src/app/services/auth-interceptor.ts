import { HttpInterceptorFn } from '@angular/common/http';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('chat_token');
  if (token) return next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }));
  return next(req);
};
