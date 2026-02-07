export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}


export interface LoginPayload {
  email: string;
  password: string;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string
}