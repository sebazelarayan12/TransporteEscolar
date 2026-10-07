export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiraEn: string;
}

export type Session = LoginResponse;
